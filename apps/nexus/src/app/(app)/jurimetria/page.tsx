import { Icon } from '@/components/shell/icons';

export const dynamic = 'force-dynamic';

// Jurimetria é da Fase 2 do produto (JUIT API — api.juit.dev). Esta tela é uma
// PRÉVIA com números ilustrativos; a fonte real (RAG em peças) entra com o
// plano Elite. Não usa dados do tenant para não sugerir métricas reais.
interface TaxaArea {
  area: string;
  exito: number;
  casos: number;
}

const POR_AREA: TaxaArea[] = [
  { area: 'Trabalhista', exito: 74, casos: 38 },
  { area: 'Cível', exito: 63, casos: 51 },
  { area: 'Previdenciário', exito: 81, casos: 22 },
  { area: 'Consumidor', exito: 69, casos: 30 },
  { area: 'Família', exito: 58, casos: 17 },
  { area: 'Tributário', exito: 47, casos: 12 },
];

interface TaxaVara {
  vara: string;
  tribunal: string;
  exito: number;
}

const POR_VARA: TaxaVara[] = [
  { vara: '1ª Vara do Trabalho de Caçador', tribunal: 'TJSC', exito: 78 },
  { vara: '2ª Vara Cível de Caçador', tribunal: 'TJSC', exito: 61 },
  { vara: 'Vara da Fazenda Pública', tribunal: 'TJSC', exito: 44 },
  { vara: 'JEF — Previdenciário', tribunal: 'TRF4', exito: 83 },
];

function tone(exito: number): string {
  if (exito >= 70) return 'bg-success';
  if (exito >= 55) return 'bg-gold';
  return 'bg-danger';
}

export default function JurimetriaPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Jurimetria</h2>
          <p className="text-sm text-muted">Taxa de êxito por área, vara e tribunal</p>
        </div>
        <span className="nx-chip bg-gold/15 text-gold">Fase 2 · JUIT Rimor</span>
      </div>

      {/* Aviso de prévia */}
      <div className="nx-card flex items-start gap-3 border-gold/30 p-4">
        <span className="text-gold">
          <Icon name="spark" size={18} />
        </span>
        <p className="text-sm text-muted">
          Prévia ilustrativa. A jurimetria com dados reais (RAG em peças via JUIT API) é liberada no
          plano <span className="text-ink">Elite</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Por área */}
        <section className="nx-card p-5">
          <h3 className="font-display text-base font-semibold text-ink">Êxito por área</h3>
          <div className="mt-4 space-y-3">
            {POR_AREA.map((a) => (
              <div key={a.area} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-muted">{a.area}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={`h-full rounded-full ${tone(a.exito)}`}
                    style={{ width: `${a.exito}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-sm text-ink">
                  {a.exito}%
                </span>
                <span className="w-14 shrink-0 text-right text-xs text-muted">{a.casos} casos</span>
              </div>
            ))}
          </div>
        </section>

        {/* Por vara */}
        <section className="nx-card p-5">
          <h3 className="font-display text-base font-semibold text-ink">Êxito por vara/tribunal</h3>
          <ul className="mt-4 divide-y divide-border">
            {POR_VARA.map((v) => (
              <li key={v.vara} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{v.vara}</p>
                  <p className="text-xs text-muted">{v.tribunal}</p>
                </div>
                <span
                  className={`nx-chip ${
                    v.exito >= 70
                      ? 'bg-success/15 text-success'
                      : v.exito >= 55
                        ? 'bg-gold/15 text-gold'
                        : 'bg-danger/15 text-danger'
                  } font-mono`}
                >
                  {v.exito}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
