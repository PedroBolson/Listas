import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function ShareListPage() {
    const { listId } = useParams<{ listId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.origin}/lists/${listId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            className="mx-auto max-w-2xl space-y-6 p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-primary">
                        {t("lists.share", { defaultValue: "Compartilhar Lista" })}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {t("lists.shareHint", { defaultValue: "Compartilhe esta lista com outras pessoas" })}
                    </p>
                </div>
            </div>

            <Card padding="lg" elevated>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-brand-soft p-3">
                            <Users className="h-6 w-6 text-brand" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-primary">
                                {t("lists.shareTitle", { defaultValue: "Link de Compartilhamento" })}
                            </h2>
                            <p className="text-sm text-muted">
                                {t("lists.shareDescription", { defaultValue: "Qualquer pessoa com este link pode visualizar a lista" })}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none"
                            />
                            <Button onClick={handleCopyLink} icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}>
                                {copied ? t("actions.copied", { defaultValue: "Copiado!" }) : t("actions.copy", { defaultValue: "Copiar" })}
                            </Button>
                        </div>

                        <p className="text-xs text-muted">
                            {t("lists.shareNote", { defaultValue: "⚠️ Esta funcionalidade está em desenvolvimento. Em breve você poderá controlar as permissões de acesso." })}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => navigate(-1)}>
                            {t("actions.close", { defaultValue: "Fechar" })}
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
