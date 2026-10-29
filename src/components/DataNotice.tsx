import { AlertTriangle, DatabaseZap, Info, RefreshCcw } from 'lucide-react';
import type { DashboardWarning } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface DataNoticeProps {
  warnings: DashboardWarning[];
  onRefresh: () => void;
}

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: DatabaseZap
};

export function DataNotice({ warnings, onRefresh }: DataNoticeProps) {
  if (!warnings.length) return null;

  return (
    <div className="space-y-2.5" aria-live="polite">
      {warnings.map((warning) => {
        const Icon = ICONS[warning.level as keyof typeof ICONS] ?? Info;
        const isWarning = warning.level === 'warning' || warning.level === 'error';
        return (
          <div
            key={warning.code}
            className={cn(
              'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
              isWarning
                ? 'border-amber-200 bg-amber-50/80 text-amber-900'
                : 'border-blue-200 bg-blue-50/80 text-blue-900'
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', isWarning ? 'text-amber-600' : 'text-blue-600')} />
              <div>
                <p className="text-xs font-semibold">
                  {warning.code === 'empty-business-data' ? '真实空库状态' : '数据口径提示'}
                </p>
                <p className="mt-0.5 text-xs leading-5 opacity-80">{warning.message}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className={cn(
                'shrink-0',
                isWarning ? 'border-amber-200 text-amber-800 hover:bg-amber-100' : 'border-blue-200 text-blue-800 hover:bg-blue-100'
              )}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              重新检查
            </Button>
          </div>
        );
      })}
    </div>
  );
}
