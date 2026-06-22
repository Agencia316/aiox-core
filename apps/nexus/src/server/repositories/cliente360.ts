/**
 * Cliente 360 — score de risco de PF/PJ.
 *
 * Em produção a consulta integra fontes externas (Serasa, Receita Federal,
 * BNMP, etc.). Aqui retornamos um conjunto fixo de "clientes consultados"
 * espelhando os processos do escritório demo. Quando NEXUS_USE_MOCKS=false,
 * o conector real ainda precisa ser implementado.
 */
import { OFFICE_ALMEIDA } from '@/db/ids';
import { isMockMode } from '@/lib/env';
import type { ClienteRisco } from '@/server/dto';

function nivelDeScore(score: number): ClienteRisco['nivel'] {
  if (score >= 80) return 'baixo';
  if (score >= 50) return 'medio';
  return 'alto';
}

const ALMEIDA: ClienteRisco[] = [
  {
    nome: 'Indústria Madeira Verde Ltda.',
    documento: '12.345.678/0001-99',
    tipoDocumento: 'CNPJ',
    score: 42,
    nivel: nivelDeScore(42),
    apontamentos: ['2 reclamações trabalhistas ativas', 'Protesto em 2024 (R$ 18.500)'],
    fontes: ['Receita Federal', 'Trabalhista PJe', 'Cartório de Protestos'],
    consultadoEm: '2026-06-20T11:14:00.000Z',
  },
  {
    nome: 'João Batista dos Santos',
    documento: '987.654.321-00',
    tipoDocumento: 'CPF',
    score: 88,
    nivel: nivelDeScore(88),
    apontamentos: [],
    fontes: ['Serasa', 'Receita Federal'],
    consultadoEm: '2026-06-19T09:30:00.000Z',
  },
  {
    nome: 'Cooperativa Agro Caçador',
    documento: '34.567.890/0001-22',
    tipoDocumento: 'CNPJ',
    score: 76,
    nivel: nivelDeScore(76),
    apontamentos: ['Atraso pontual em ICMS (regularizado)'],
    fontes: ['Receita Estadual', 'Receita Federal'],
    consultadoEm: '2026-06-18T16:00:00.000Z',
  },
  {
    nome: 'Maria Aparecida Lima',
    documento: '123.456.789-10',
    tipoDocumento: 'CPF',
    score: 91,
    nivel: nivelDeScore(91),
    apontamentos: [],
    fontes: ['Serasa'],
    consultadoEm: '2026-06-15T13:42:00.000Z',
  },
  {
    nome: 'Transportes Planalto S/A',
    documento: '56.789.012/0001-33',
    tipoDocumento: 'CNPJ',
    score: 28,
    nivel: nivelDeScore(28),
    apontamentos: [
      'Execução fiscal ativa (R$ 410k)',
      '3 ações trabalhistas',
      'Negativação Serasa',
    ],
    fontes: ['Serasa', 'Receita Federal', 'PJe', 'Cartório de Protestos'],
    consultadoEm: '2026-06-10T08:20:00.000Z',
  },
];

const FIXTURES_POR_OFFICE: Record<string, ClienteRisco[]> = {
  [OFFICE_ALMEIDA]: ALMEIDA,
};

export async function listClientesConsultados(officeId: string): Promise<ClienteRisco[]> {
  if (isMockMode()) {
    return [...(FIXTURES_POR_OFFICE[officeId] ?? [])].sort(
      (a, b) => b.consultadoEm.localeCompare(a.consultadoEm),
    );
  }
  // Conector real (Serasa, BNMP, Receita) ainda não implementado — devolve vazio
  // para que a UI sinalize "sem consultas" em vez de mostrar dados falsos.
  return [];
}
