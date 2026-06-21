import { Icon, type IconName } from '@/components/shell/icons';

export interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  tone: 'brand' | 'gold' | 'success' | 'danger';
}

const TONE: Record<KpiCardProps['tone'], string> = {
  brand: 'bg-brand/15 text-brand',
  gold: 'bg-gold/15 text-gold',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
};

export function KpiCard({ label, value, hint, icon, tone }: KpiCardProps) {
  return (
    <div className="nx-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE[tone]}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
