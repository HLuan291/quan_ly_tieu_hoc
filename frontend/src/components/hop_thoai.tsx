import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

export default function HopThoai({ TieuDe, Dong, DangLuu = false, Rong = false, children }: {
  TieuDe: string; Dong: () => void; DangLuu?: boolean; Rong?: boolean; children: ReactNode;
}) {
  const Ref = useRef<HTMLDialogElement>(null);
  const Id = useId();
  useEffect(() => {
    const Dialog = Ref.current;
    const Cu = document.body.style.overflow;
    const FocusCu = document.activeElement;
    document.body.style.overflow = 'hidden';
    Dialog?.showModal();
    return () => {
      Dialog?.close();
      document.body.style.overflow = Cu;
      if (FocusCu instanceof HTMLElement && FocusCu.isConnected) FocusCu.focus();
    };
  }, []);
  return <dialog ref={Ref} aria-labelledby={Id} onCancel={E => { E.preventDefault(); E.stopPropagation(); if (!DangLuu) Dong(); }}
    className={'m-auto max-h-[92dvh] w-[calc(100%_-_1rem)] overflow-hidden rounded-lg border-0 p-0 shadow-2xl ' + (Rong ? 'max-w-6xl' : 'max-w-3xl')}>
    <div className="flex max-h-[92dvh] flex-col">
    <div className="flex shrink-0 items-center justify-between gap-3 bg-sky-700 px-4 py-3 text-white">
      <h2 id={Id} className="text-lg font-semibold">{TieuDe}</h2>
      <button type="button" disabled={DangLuu} aria-label={'Đóng hộp thoại ' + TieuDe} onClick={Dong} className="shrink-0 rounded border border-white/60 px-3 py-1 hover:bg-white/10 disabled:opacity-50">Đóng ×</button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
    </div>
  </dialog>;
}
