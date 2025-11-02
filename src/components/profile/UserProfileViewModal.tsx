import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import type { DomainUserProps } from "../../domain/models";

interface UserProfileViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: DomainUserProps | null;
}

export function UserProfileViewModal({ isOpen, onClose, user }: UserProfileViewModalProps) {
    if (!isOpen || !user) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md"
                >
                    <Card padding="lg" elevated>
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-primary">Perfil</h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-primary"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col items-center gap-6">
                            {/* Avatar */}
                            <Avatar
                                src={user.photoURL}
                                fallback={user.displayName?.[0] || user.email?.[0]}
                                size="xl"
                            />

                            {/* User Info */}
                            <div className="w-full space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted">Nome</label>
                                    <p className="mt-1 text-sm font-semibold text-primary">
                                        {user.displayName || "Usuário"}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-muted">E-mail</label>
                                    <p className="mt-1 text-sm text-secondary">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 border-t border-soft pt-6">
                            <Button variant="secondary" onClick={onClose} className="w-full">
                                Fechar
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
