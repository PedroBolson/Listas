import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { updateUser, getUserById } from "../../services/userService";
import { useAuth } from "../../features/auth/useAuth";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { domainUser, refreshProfile } = useAuth();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [familyOwnerName, setFamilyOwnerName] = useState<string | null>(null);

    // Buscar nome do titular da família atual
    useEffect(() => {
        const fetchFamilyOwner = async () => {
            if (!domainUser?.managedFamilyId) {
                setFamilyOwnerName(null);
                return;
            }

            try {
                const { getFamilyById } = await import("../../services/familyService");
                const family = await getFamilyById(domainUser.managedFamilyId);

                if (!family) {
                    setFamilyOwnerName(null);
                    return;
                }

                // Se é o próprio titular
                if (family.ownerId === domainUser.id) {
                    setFamilyOwnerName(domainUser.displayName || domainUser.email);
                } else {
                    // Buscar nome do titular
                    const owner = await getUserById(family.ownerId);
                    setFamilyOwnerName(owner?.displayName || owner?.email || "Titular");
                }
            } catch (error) {
                console.error("Erro ao buscar titular da família:", error);
                setFamilyOwnerName(null);
            }
        };

        fetchFamilyOwner();
    }, [domainUser?.managedFamilyId, domainUser?.id, domainUser?.displayName, domainUser?.email]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !domainUser) return;

        // Validar tipo e tamanho
        if (!file.type.startsWith("image/")) {
            alert("Por favor, selecione uma imagem válida.");
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 15MB.");
            return;
        } try {
            setUploading(true);

            // Preview local
            const localPreview = URL.createObjectURL(file);
            setPreviewUrl(localPreview);

            // Deletar foto antiga se existir
            if (domainUser.photoURL) {
                try {
                    // Extrair o path do Storage da URL
                    const oldPhotoPath = decodeURIComponent(
                        domainUser.photoURL.split("/o/")[1]?.split("?")[0] || ""
                    );
                    if (oldPhotoPath) {
                        const oldPhotoRef = ref(storage, oldPhotoPath);
                        await deleteObject(oldPhotoRef);
                    }
                } catch (error) {
                    // Ignorar erro se a foto antiga não existir
                }
            }

            // Upload da nova foto para Firebase Storage
            const storageRef = ref(storage, `avatars/${domainUser.id}/profile.jpg`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            // Atualizar Firestore
            await updateUser(domainUser.id, {
                photoURL: downloadUrl,
            });

            // Atualizar contexto
            await refreshProfile();

            // Limpar preview após um delay para garantir que o novo URL foi carregado
            setTimeout(() => {
                URL.revokeObjectURL(localPreview);
                setPreviewUrl(null);
            }, 500);

            // Mostrar feedback de sucesso
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
            console.error("Erro ao fazer upload da foto:", error);
            // Limpar preview em caso de erro
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        } finally {
            setUploading(false);
        }
    };

    if (!domainUser) return null;

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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <Card className="relative">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-soft p-6">
                                    <h2 className="text-xl font-bold text-primary">
                                        {t("profile.title", { defaultValue: "Meu Perfil" })}
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-muted transition-colors hover:bg-surface-alt hover:text-primary"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <Avatar
                                                src={previewUrl || (domainUser.photoURL ? `${domainUser.photoURL}?t=${Date.now()}` : null)}
                                                fallback={domainUser.displayName?.[0] || "U"}
                                                size="xl"
                                                className="ring-4 ring-brand/20"
                                            />
                                            {uploading && (
                                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                                </div>
                                            )}
                                            <AnimatePresence>
                                                {uploadSuccess && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-lg"
                                                    >
                                                        ✓ Foto atualizada!
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={<Camera className="h-4 w-4" />}
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                {t("profile.changePhoto", { defaultValue: "Alterar foto" })}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="mt-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-muted">
                                                {t("profile.name", { defaultValue: "Nome" })}
                                            </label>
                                            <p className="mt-1 text-sm font-semibold text-primary">
                                                {domainUser.displayName}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-muted">
                                                {t("profile.email", { defaultValue: "E-mail" })}
                                            </label>
                                            <p className="mt-1 text-sm text-secondary">{domainUser.email}</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-muted">
                                                {t("profile.currentFamily", { defaultValue: "Família atual" })}
                                            </label>
                                            <p className="mt-1 text-sm text-secondary">
                                                {familyOwnerName ? `Família de ${familyOwnerName}` : "Carregando..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-soft p-6">
                                    <Button variant="secondary" onClick={onClose} className="w-full">
                                        {t("actions.close", { defaultValue: "Fechar" })}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
