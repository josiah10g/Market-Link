import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, success: (msg) => addToast(msg, 'success'), error: (msg) => addToast(msg, 'error'), info: (msg) => addToast(msg, 'info') }}>
      {children}

      {/* Floating Toast Portal */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--surface-2)',
                border: `1px solid ${isSuccess ? 'var(--lime)' : isError ? 'var(--status-cancelled)' : 'var(--line)'}`,
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
                color: 'var(--ink)',
                fontSize: '0.85rem',
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isSuccess && <CheckCircle2 size={18} color="var(--lime)" style={{ flexShrink: 0 }} />}
              {isError && <AlertCircle size={18} color="var(--status-cancelled)" style={{ flexShrink: 0 }} />}
              {!isSuccess && !isError && <Info size={18} color="var(--muted)" style={{ flexShrink: 0 }} />}

              <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      success: (msg) => alert(msg),
      error: (msg) => alert(msg),
      info: (msg) => console.log(msg)
    };
  }
  return context;
};
