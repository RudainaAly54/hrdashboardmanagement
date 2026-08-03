import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext(null);

const toastStyles = {
    success: { bg: "bg-white", border: "border-green-200", icon: <FiCheckCircle className="text-green-600" size={20} /> },
    error: { bg: "bg-white", border: "border-red-200", icon: <FiXCircle className="text-red-600" size={20} /> },
    info: { bg: "bg-white", border: "border-blue-200", icon: <FiInfo className="text-blue-600" size={20} /> },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = "success", duration = 3500) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after `duration` ms
        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Fixed container, rendered once at the app root — every page shares this */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const style = toastStyles[toast.type] || toastStyles.info;
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`pointer-events-auto flex items-center gap-3 ${style.bg} ${style.border} border rounded-xl shadow-lg px-4 py-3 min-w-[280px] max-w-sm`}
                            >
                                {style.icon}
                                <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
                                <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                                    <FiX size={16} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);