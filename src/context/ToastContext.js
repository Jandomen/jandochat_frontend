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

    const addToast = useCallback((message, type = "info", duration = 4000, onClick = null) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, onClick }]);
        
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

    const success = useCallback((message, duration, onClick) => addToast(message, "success", duration, onClick), [addToast]);
    const error = useCallback((message, duration, onClick) => addToast(message, "error", duration, onClick), [addToast]);
    const info = useCallback((message, duration, onClick) => addToast(message, "info", duration, onClick), [addToast]);
    const warning = useCallback((message, duration, onClick) => addToast(message, "warning", duration, onClick), [addToast]);

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
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "!"
    };
    
    const colors = {
        success: "bg-green-500 border-green-600",
        error: "bg-red-500 border-red-600",
        info: "bg-blue-500 border-blue-600",
        warning: "bg-yellow-500 border-yellow-600"
    };

    const iconsColors = {
        success: "text-green-100",
        error: "text-red-100",
        info: "text-blue-100",
        warning: "text-yellow-100"
    };

    const hasClickAction = toast.onClick && (toast.onClick.navigateTo || toast.onClick.action);

    return (
        <div 
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg 
                ${colors[toast.type]} 
                ${hasClickAction ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                animate-in slide-in-from-right duration-300
            `}
            role="alert"
            onClick={hasClickAction ? onClick : undefined}
        >
            <span className={`font-bold text-sm ${iconsColors[toast.type]}`}>{icons[toast.type]}</span>
            <p className="text-white text-sm font-medium flex-1">{toast.message}</p>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(toast.id);
                }}
                className="text-white/70 hover:text-white transition-colors"
            >
                ✕
            </button>
        </div>
    );
};

export default ToastProvider;
