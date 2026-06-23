/**
 * Helpers de resposta para route handlers do App Router.
 */
import { NextResponse } from 'next/server';

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 200 });
}

export function unauthorized(message = 'Não autenticado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function serverError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Envolve um handler resolvendo o contexto de tenant. Garante que toda rota
 * só executa com um officeId válido — caso contrário responde 401.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido';
}
