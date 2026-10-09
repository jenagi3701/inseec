import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

type Toast = { id: number; text: string };
const Ctx = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="scope-day flex items-center gap-2 rounded-full border border-edge bg-cream px-4 py-2.5 text-sm font-bold text-ink shadow-[0_14px_30px_-12px_rgb(8_6_18/0.8)]">
            <Icon name="check" className="size-4 text-matcha" />
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
