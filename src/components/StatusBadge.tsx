import type { ProgressStatus } from '@/types/study';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: ProgressStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const statusConfig: Record<ProgressStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-warning/15 text-warning',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success',
  },
};

export function StatusBadge({ status, size = 'sm', showLabel = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        showLabel && 'gap-1.5 font-medium',
        config.className,
        size === 'sm' ? (showLabel ? 'px-2.5 py-0.5' : 'p-1.5') : showLabel ? 'px-3 py-1' : 'p-2'
      )}
      title={config.label}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {showLabel && <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{config.label}</span>}
    </span>
  );
}
