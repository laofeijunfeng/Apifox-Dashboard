import { DatabaseZap, RefreshCcw, ServerOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <Card className="flex min-h-[360px] flex-col items-center justify-center border-rose-100 px-6 text-center shadow-none">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <ServerOff className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">看板数据加载失败</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{message}</p>
      <div className="mt-5 flex items-center gap-2">
        <Button onClick={onRetry} variant="primary">
          <RefreshCcw className="h-4 w-4" />
          重新加载
        </Button>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <DatabaseZap className="h-3.5 w-3.5" />
          请检查 Node 服务与只读数据库连接
        </span>
      </div>
    </Card>
  );
}
