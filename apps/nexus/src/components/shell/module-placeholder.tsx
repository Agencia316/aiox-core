import { Icon } from '@/components/shell/icons';
import { moduleBySlug } from '@/lib/modules';

export interface ModulePlaceholderProps {
  slug: string;
}

// Tela padrão para os módulos ainda não implementados (Fase 3 entrega o
// Dashboard funcional; os demais ganham UI nas próximas iterações).
export function ModulePlaceholder({ slug }: ModulePlaceholderProps) {
  const mod = moduleBySlug(slug);
  const label = mod?.label ?? 'Módulo';

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="nx-card max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon name={mod?.icon ?? 'spark'} size={24} />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">{label}</h2>
        <p className="mt-2 text-sm text-muted">
          Módulo em construção. O backend e o schema multi-tenant já estão prontos —
          a interface chega nas próximas iterações.
        </p>
        {mod?.phase2 ? (
          <span className="nx-chip mt-4 bg-gold/15 text-gold">Planejado para a Fase 2</span>
        ) : null}
      </div>
    </div>
  );
}
