import { Card } from '@/components/ui/card';

type Tone = 'default' | 'leaf' | 'zinc' | 'amber' | 'rose';

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-zinc-900 dark:text-zinc-50',
  leaf: 'text-leaf-700 dark:text-leaf-400',
  zinc: 'text-zinc-400 dark:text-zinc-500',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
};

/** Carte-statistique compacte (grand nombre + libellé) — gabarit des listes. */
export function StatCard({
  value,
  label,
  tone = 'default',
}: {
  value: number | string;
  label: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-5">
      <p className={`text-3xl font-bold tracking-tight ${TONE_CLASS[tone]}`}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </Card>
  );
}
