import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detecta cookie de sessão do Supabase (sb-*-auth-token)
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  // Protege /perfil
  if (!hasSession && pathname.startsWith("/perfil")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redireciona para home se já logado
  if (hasSession && (pathname === "/login" || pathname === "/criar-conta")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
