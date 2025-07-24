import * as React from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- ToastContainer Component ---

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-xs">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};


// --- Toast Component ---

interface ToastProps {
  message: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    const baseClasses = "flex items-center w-full max-w-xs p-4 text-slate-200 rounded-lg shadow-lg animate-fade-in-right";
    
    const typeClasses = {
        success: 'bg-emerald-800',
        error: 'bg-red-800',
        info: 'bg-blue-800',
    };

    const Icon = () => {
        switch (message.type) {
            case 'success':
                return (
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-emerald-300 bg-emerald-900 rounded-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                );
            case 'error':
                 return (
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-300 bg-red-900 rounded-lg">
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </div>
                );
            case 'info':
                 return (
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-300 bg-blue-900 rounded-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                    </div>
                );
            default: return null;
        }
    }

  return (
    <>
    <div className={`${baseClasses} ${typeClasses[message.type] || typeClasses.info}`} role="alert">
      <Icon />
      <div className="ml-3 text-sm font-normal">{message.message}</div>
      <button type="button" onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-slate-800/20 text-slate-400 hover:text-white rounded-lg focus:ring-2 focus:ring-slate-500 p-1.5 hover:bg-slate-700 inline-flex h-8 w-8" aria-label="Close">
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
    </div>
    <style>{`
        @keyframes fade-in-right {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .animate-fade-in-right {
            animation: fade-in-right 0.3s ease-out forwards;
        }
    `}</style>
    </>
  );
};