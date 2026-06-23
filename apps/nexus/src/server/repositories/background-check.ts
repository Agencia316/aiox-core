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

const NOMES = [
  'Anderson Luiz Moraes',
  'Bruno César Fontes',
  'Cristiano Dias Vasques',
  'Diego Ramos Antunes',
  'Emerson Pacheco Goulart',
  'Fábio Henrique Brandão',
  'Geraldo Munhoz Vieira',
  'Hélio Camargo Brito',
];

const TRIBUNAIS = [
  'TJSC — Comarca de Caçador',
  'TJPR — Vara Criminal de Curitiba',
  'TJSC — Comarca de Lages',
  'TJPR — Foro de Ponta Grossa',
];

const REGIMES = ['Aberto', 'Semiaberto', 'Fechado'];

function semente(digitos: string): number {
  let acc = 0;
  for (let i = 0; i < digitos.length; i += 1) {
    acc = (acc + Number(digitos[i]) * (i + 3)) % 991;
  }
  return acc;
}

function formatarCpf(d: string): string {
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/**
 * Background check simulado a partir de um CPF. Determinístico — ~70% "nada
 * consta". Apenas demonstração; a consulta real integra BNMP/SEEU (CNJ).
 * Retorna null se o CPF for inválido (≠ 11 dígitos).
 */
export function simularBackgroundCheck(cpfRaw: string): BgcResultado | null {
  const digitos = cpfRaw.replace(/\D/g, '');
  if (digitos.length !== 11) return null;

  const s = semente(digitos);
  const limpo = s % 10 < 7; // ~70% limpos
  const consultadoEm = new Date().toISOString();
  const nome = NOMES[s % NOMES.length];
  const cpf = formatarCpf(digitos);

  if (limpo) {
    return { nome, cpf, limpo: true, mandados: [], execucoesPenais: [], consultadoEm };
  }

  const anoMandado = 2023 + (s % 3);
  const mes = String(1 + (s % 12)).padStart(2, '0');
  const dia = String(1 + (s % 27)).padStart(2, '0');

  return {
    nome,
    cpf,
    limpo: false,
    mandados: [
      {
        tipo: s % 2 === 0 ? 'Mandado de prisão preventiva' : 'Mandado de prisão (sentença)',
        tribunal: TRIBUNAIS[s % TRIBUNAIS.length],
        data: `${anoMandado}-${mes}-${dia}`,
        situacao: 'ativo',
      },
    ],
    execucoesPenais:
      s % 3 === 0
        ? [
            {
              processo: `000${1000 + (s % 8999)}-00.${anoMandado}.8.24.0018`,
              regime: REGIMES[s % REGIMES.length],
              situacao: 'Em cumprimento',
            },
          ]
        : [],
    consultadoEm,
  };
}
