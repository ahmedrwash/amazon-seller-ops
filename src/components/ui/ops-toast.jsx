import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const ToastContext = createContext();

export function OpsToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-[hsl(var(--cinder))] text-white px-4 py-3 rounded-md shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-[hsl(var(--green-light))]" /> : <XCircle className="w-5 h-5 text-[hsl(var(--red-light))]" />}
            <span className="font-body text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useOpsToast = () => useContext(ToastContext);