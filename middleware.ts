import { NextRequest, NextResponse } from "next/server";

// Scrapers e bots maliciosos conhecidos
const BLOCKED_UA_PATTERNS = [
  /scraperforce/i,
  /python-requests/i,
  /python-httpx/i,
  /curl\//i,
  /wget\//i,
  /java\/\d/i,
  /go-http-client/i,
  /axios\/\d/i,
  /node-fetch/i,
  /node\.js/i,
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
];

// Bots de SEO legítimos — deixa passar
const ALLOWED_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,      // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
];

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";

  // Permite bots de SEO legítimos
  if (ALLOWED_BOTS.some((p) => p.test(ua))) {
    return NextResponse.next();
  }

  // Bloqueia user-agents maliciosos
  if (BLOCKED_UA_PATTERNS.some((p) => p.test(ua))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Bloqueia requisições sem user-agent nas rotas de API
  if (!ua && req.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica em todas as rotas exceto arquivos estáticos e internos do Next.js
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
