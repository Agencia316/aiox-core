/**
 * Background Check (add-on criminal) — consulta BNMP (mandados de prisão) +
 * SEEU (execução penal). Briefing §3/§6.
 *
 * Em produção integra os sistemas do CNJ. Aqui retornamos consultas de exemplo
 * do escritório demo. Sem mocks, o conector real ainda não existe → lista vazia.
 */
import { OFFICE_ALMEIDA } from '@/db/ids';
import { isMockMode } from '@/lib/env';
import type { BgcResultado } from '@/server/dto';

const ALMEIDA: BgcResultado[] = [
  {
    nome: 'João Batista dos Santos',
    cpf: '987.654.321-00',
    limpo: true,
    mandados: [],
    execucoesPenais: [],
    consultadoEm: '2026-06-19T10:00:00.000Z',
  },
  {
    nome: 'Ricardo Alves Pereira',
    cpf: '111.222.333-44',
    limpo: false,
    mandados: [
      {
        tipo: 'Mandado de prisão preventiva',
        tribunal: 'TJSC — Comarca de Caçador',
        data: '2025-11-12',
        situacao: 'ativo',
      },
    ],
    execucoesPenais: [
      {
        processo: '0001234-00.2023.8.24.0018',
        regime: 'Semiaberto',
        situacao: 'Em cumprimento',
      },
    ],
    consultadoEm: '2026-06-17T15:30:00.000Z',
  },
];

const FIXTURES_POR_OFFICE: Record<string, BgcResultado[]> = {
  [OFFICE_ALMEIDA]: ALMEIDA,
};

export async function listBackgroundChecks(officeId: string): Promise<BgcResultado[]> {
  if (isMockMode()) {
    return [...(FIXTURES_POR_OFFICE[officeId] ?? [])].sort((a, b) =>
      b.consultadoEm.localeCompare(a.consultadoEm),
    );
  }
  return [];
}
