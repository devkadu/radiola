import { isAdminUser } from "@/server/auth/admin-guard";
import { getCatalogCanonicalPath } from "@/features/catalog/server/queries/get-catalog-canonical-path";
import { isBlockedBot } from "@/server/security/bot-policy";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /python-httpx/i,
  /curl\//i,
  /wget\//i,
  /java\/\d/i,
  /go-http-client/i,
  /axios\/\d/i,
  /node-fetch/i,
  /scrapy/i,
  /mechanize/i,
  /htmlunit/i,
  /phantomjs/i,
  /headlesschrome/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /okhttp/i,
  /libwww-perl/i,
  /masscan/i,
  /zgrab/i,
  /nmap/i,
  /scraperapi/i,
  /scrapingbee/i,
  /apify/i,
];

export const proxy = async (request: NextRequest) => {
  const ua = request.headers.get("user-agent") ?? "";
  const { pathname } = request.nextUrl;

  // Defense in depth for direct/local requests. The Vercel edge rule also
  // covers images and static assets excluded from this proxy's matcher.
  if (pathname !== "/robots.txt" && isBlockedBot(ua))
    return new NextResponse(null, { status: 403 });

  if (BLOCKED_UA_PATTERNS.some((p) => p.test(ua))) {
    return new NextResponse(null, { status: 403 });
  }

  if (!ua && pathname.startsWith("/api/")) {
    return new NextResponse(null, { status: 403 });
  }

  if (request.method === "GET" || request.method === "HEAD") {
    const canonical = await getCatalogCanonicalPath(pathname);
    if (canonical && canonical !== pathname) {
      const target = request.nextUrl.clone();
      target.pathname = canonical;
      return NextResponse.redirect(target, 308);
    }
  }

  const needsAuth =
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/criar-conta";

  if (!needsAuth) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname.startsWith("/perfil")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/criar-conta")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!isAdminUser(user?.id, process.env.ADMIN_USER_ID)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
