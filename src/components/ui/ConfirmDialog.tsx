import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    loading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: "border-red-500/20 bg-red-50 dark:bg-red-950/20",
        warning: "border-orange-500/20 bg-orange-50 dark:bg-orange-950/20",
        info: "border-blue-500/20 bg-blue-50 dark:bg-blue-950/20",
    };

    const iconColors = {
        danger: "text-red-600",
        warning: "text-orange-600",
        info: "text-blue-600",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl border bg-surface p-6 shadow-2xl"
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 rounded-lg p-1 text-muted transition hover:bg-surface-alt"
                                disabled={loading}
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Icon */}
                            <div className={`mb-4 inline-flex rounded-xl border p-3 ${variantStyles[variant]}`}>
                                <AlertTriangle className={`h-6 w-6 ${iconColors[variant]}`} />
                            </div>

                            {/* Title */}
                            <h2 className="mb-2 text-xl font-bold text-primary">{title}</h2>

                            {/* Message */}
                            <p className="mb-6 text-sm text-muted">{message}</p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    variant={variant === "danger" ? "primary" : "primary"}
                                    className={`flex-1 ${variant === "danger"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : variant === "warning"
                                                ? "bg-orange-600 hover:bg-orange-700"
                                                : ""
                                        }`}
                                    disabled={loading}
                                >
                                    {loading ? "Processando..." : confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
