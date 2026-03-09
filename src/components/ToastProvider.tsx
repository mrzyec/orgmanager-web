"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Toast, { type ToastType } from "@/components/Toast";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
  leaving: boolean;
};

type ShowToastInput = {
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (input: ShowToastInput) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeToastId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerMapRef = useRef<Map<string, number>>(new Map());

  const hideToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast
      )
    );

    const existingTimer = timerMapRef.current.get(id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      timerMapRef.current.delete(id);
    }

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", durationMs = 5000 }: ShowToastInput) => {
      const id = makeToastId();

      setToasts((prev) => {
        const next: ToastItem[] = [
          { id, message, type, durationMs, leaving: false },
          ...prev,
        ];
        return next.slice(0, 5);
      });

      const timer = window.setTimeout(() => {
        hideToast(id);
      }, durationMs);

      timerMapRef.current.set(id, timer);
    },
    [hideToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-0 z-[100]">
        <div className="absolute right-4 top-4 flex flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto transition-all duration-200 ${
                toast.leaving
                  ? "translate-x-6 scale-[0.98] opacity-0"
                  : "translate-x-0 scale-100 opacity-100"
              }`}
            >
              <Toast
                message={toast.message}
                type={toast.type}
                durationMs={toast.durationMs}
                onClose={() => hideToast(toast.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}