import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type HealthStatus = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
};

async function fetchHealth(): Promise<HealthStatus | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HealthStatus;
  } catch {
    return null;
  }
}

export async function ApiHealthBadge() {
  const health = await fetchHealth();
  const isUp = health?.status === 'ok';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        isUp
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
          : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100',
      )}
    >
      {isUp ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      <div className="flex flex-col">
        <span className="font-medium">{isUp ? 'API joignable' : 'API injoignable'}</span>
        {health && (
          <span className="font-mono text-xs opacity-75">
            {health.service} · v{health.version}
          </span>
        )}
      </div>
    </div>
  );
}
