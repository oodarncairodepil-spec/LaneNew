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

export function StatusBadge({ status, size = 'sm', showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.className,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {showLabel && config.label}
    </span>
  );
}
