/**
 * Middleware de autenticação.
 *
 * Protege as rotas do app shell. Em NEXUS_USE_MOCKS deixa passar (demo sem
 * login). Em produção, redireciona requests sem cookie de sessão para /login.
 *
 * Observação: a verificação aqui é leve (presença de cookie de sessão). A
 * validação forte da sessão acontece nos route handlers / server components via
 * getOfficeContext(). RLS no banco é a última linha de defesa.
 */
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest): NextResponse {
  const isMockMode = (process.env.NEXUS_USE_MOCKS ?? 'true').toLowerCase() !== 'false';
  if (isMockMode) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has('better-auth.session_token') ||
    request.cookies.has('__Secure-better-auth.session_token');

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a tudo, exceto assets estáticos e imagens.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
