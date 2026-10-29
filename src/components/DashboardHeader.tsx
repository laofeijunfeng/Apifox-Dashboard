import { useEffect, useRef, useState } from 'react';
import {
  BookOpenText,
  Download,
  FileBarChart2,
  LockKeyhole,
  Menu,
  RefreshCcw,
  Sparkles,
  X
} from 'lucide-react';
import type { DashboardMeta } from '../types';
import { formatClock } from '../lib/format';
import { buttonVariants } from './ui/button';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface DashboardHeaderProps {
  meta?: DashboardMeta;
  loading: boolean;
  exportHref: string | null;
  onOpenDictionary: () => void;
  onRefresh: () => void;
}

const navItems = [
  { href: '#testing-metrics', label: '测试质量' },
  { href: '#operations-metrics', label: '运营健康' },
  { href: '#analytics', label: '趋势分析' },
  { href: '#details', label: '明细数据' }
];

export function DashboardHeader({
  meta,
  loading,
  exportHref,
  onOpenDictionary,
  onRefresh
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-[0_1px_10px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-lg shadow-slate-900/15">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400" />
            <FileBarChart2 className="h-5 w-5 text-white" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-950">
                Apifox Dashboard
              </h1>
              <Badge variant="blue" className="hidden sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                质量 × 运营
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              测试资产效能、自动化稳定性与席位运营的统一视图
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50/80 p-1 xl:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="mr-1 hidden items-center gap-1.5 text-[11px] text-slate-400 lg:flex">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" />
            <span>只读 · {meta?.timeZone ?? 'Asia/Shanghai'}</span>
            {meta && <span className="text-slate-300">|</span>}
            {meta && <span>更新于 {formatClock(meta.generatedAt)}</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            aria-label="刷新数据"
            title="刷新数据"
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <div ref={menuRef} className="relative sm:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? '关闭快捷菜单' : '打开快捷菜单'}
              aria-expanded={menuOpen}
              aria-controls="mobile-dashboard-menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            {menuOpen && (
              <div
                id="mobile-dashboard-menu"
                className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">快捷导航</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <LockKeyhole className="h-3 w-3 text-emerald-600" />
                    只读 · {meta?.timeZone ?? 'Asia/Shanghai'}
                  </p>
                </div>
                <nav className="grid grid-cols-2 gap-1 p-2" aria-label="移动端快捷导航">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="grid gap-2 border-t border-slate-100 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDictionary();
                    }}
                  >
                    <BookOpenText className="h-3.5 w-3.5" />
                    指标口径
                  </Button>
                  {exportHref ? (
                    <a
                      href={exportHref}
                      onClick={() => setMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'w-full justify-start')}
                    >
                      <Download className="h-3.5 w-3.5" />
                      导出 CSV
                    </a>
                  ) : (
                    <Button variant="default" size="sm" disabled className="w-full justify-start">
                      <Download className="h-3.5 w-3.5" />
                      导出 CSV
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onOpenDictionary} className="hidden sm:inline-flex">
            <BookOpenText className="h-3.5 w-3.5" />
            指标口径
          </Button>
          {exportHref ? (
            <a
              href={exportHref}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'hidden sm:inline-flex')}
            >
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </a>
          ) : (
            <Button variant="default" size="sm" disabled className="hidden sm:inline-flex">
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
