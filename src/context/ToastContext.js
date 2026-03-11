import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children, navigate }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 2000, fotoPerfil = null, onClick = null) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, fotoPerfil, onClick }]);
        
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
        
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((message, duration = 2000, fotoPerfil, onClick) => addToast(message, "success", duration, fotoPerfil, onClick), [addToast]);
    const error = useCallback((message, duration = 2000, fotoPerfil, onClick) => addToast(message, "error", duration, fotoPerfil, onClick), [addToast]);
    const info = useCallback((message, duration = 2000, fotoPerfil, onClick) => addToast(message, "info", duration, fotoPerfil, onClick), [addToast]);
    const warning = useCallback((message, duration = 2000, fotoPerfil, onClick) => addToast(message, "warning", duration, fotoPerfil, onClick), [addToast]);

    const handleToastClick = useCallback((toast) => {
        if (toast.onClick && navigate) {
            const { navigateTo, state } = toast.onClick;
            if (navigateTo) {
                navigate(navigateTo, { state });
            }
        }
        removeToast(toast.id);
    }, [navigate, removeToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, warning, removeToast, addToast }}>
            {children}
            {createPortal(
                <ToastContainer toasts={toasts} onRemove={removeToast} onToastClick={handleToastClick} />,
                document.body
            )}
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, onRemove, onToastClick }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-2 right-2 left-2 sm:left-auto sm:right-4 z-[9999] flex flex-col items-center sm:items-end gap-1 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem 
                    key={toast.id} 
                    toast={toast} 
                    onRemove={onRemove} 
                    onClick={() => onToastClick(toast)}
                />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onRemove, onClick }) => {
    const theme = {
        success: { 
            bg: "bg-red-500", 
            text: "text-white",
            progress: "bg-white/40"
        },
        error: { 
            bg: "bg-red-600", 
            text: "text-white",
            progress: "bg-white/40"
        },
        info: { 
            bg: "bg-white", 
            text: "text-gray-900 border border-gray-100",
            progress: "bg-red-500/20"
        },
        warning: { 
            bg: "bg-yellow-400", 
            text: "text-black",
            progress: "bg-black/10"
        }
    };

    const hasClickAction = toast.onClick && (toast.onClick.navigateTo || toast.onClick.action);
    const activeTheme = theme[toast.type] || theme.info;

    return (
        <div 
            className={`
                pointer-events-auto relative overflow-hidden flex items-center gap-2 p-1 pl-1 pr-3 rounded-full shadow-lg backdrop-blur-md
                ${activeTheme.bg} ${activeTheme.text}
                ${hasClickAction ? 'cursor-pointer hover:scale-[1.05] active:scale-95 transition-all' : ''}
                animate-in slide-in-from-top-2 sm:slide-in-from-right-2 duration-300
                max-w-[200px]
            `}
            role="alert"
            onClick={hasClickAction ? onClick : undefined}
        >
            {/* User Avatar / Icon */}
            <div className="shrink-0 w-6 h-6 rounded-full overflow-hidden border border-white/20 shadow-sm bg-white/10 flex items-center justify-center">
                <img 
                    src={toast.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    onError={(e) => { e.target.src = "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png" }}
                />
            </div>

            {/* Content Pill */}
            <div className="flex-1 min-w-0 pr-1">
                <p className="text-[8px] font-black uppercase tracking-tighter truncate leading-none">
                    {toast.message}
                </p>
            </div>

            {/* Micro Progress Bar (2s) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px]">
                <div 
                    className={`h-full ${activeTheme.progress}`}
                    style={{ 
                        animation: 'progress 2s linear forwards',
                        width: '0%'
                    }}
                />
            </div>
        </div>
    );
};

export default ToastProvider;
