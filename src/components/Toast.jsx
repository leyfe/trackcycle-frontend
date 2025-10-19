import React, { createContext, useContext, useState } from "react";
import { Button } from "@nextui-org/react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, actionLabel, onAction, duration = 3000, type = "default") => {
    const id = Date.now();
    const newToast = { id, message, actionLabel, onAction, duration, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-24 shadow-slate-950 shadow-4xl left-1/2 transform -translate-x-1/2 space-y-2 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-slate-600/80 text-xs backdrop-blur text-gray-100 px-4 py-3 rounded-lg flex items-center gap-4 min-w-[300px] justify-between
              ${
                t.type === "success"
                  ? "bg-indigo-800/60 border-indigo-600 text-indigo-100"
                  : t.type === "error"
                  ? "bg-rose-800/60 border-rose-500 text-rose-100"
                  : t.type === "warning"
                  ? "bg-slate-800/60 border-slate-600 text-slate-100"
                  : "bg-slate-800/70 border-slate-600 text-slate-200"
              }`}
          >
            <span>{t.message}</span>
            {t.actionLabel && (
              <Button
                size="sm"
                variant="light"
                className="text-xs text-slate-200 hover:text-indigo-100 px-2 py-1 min-w-0"
                onPress={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
              >
                {t.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);