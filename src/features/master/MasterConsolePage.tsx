import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, ClipboardList, Settings, Search, Edit, Package, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/feedback/StatusPill";
import { useAuth } from "../auth/useAuth";
import { usePlans } from "../../providers/usePlans";
import { COLLECTIONS } from "../../domain/models";
import { EditPlanModal } from "./components/EditPlanModal";
import { EditUserModal } from "./components/EditUserModal";
import type { SubscriptionPlanProps } from "../../domain/models";

interface Stats {
    totalUsers: number;
    totalFamilies: number;
    totalLists: number;
    activeTitulars: number;
}

interface UserDataLocal {
    id: string;
    email: string;
    displayName: string;
    role: string;
    status?: string;
    billing?: {
        planId: string;
        status: string;
    };
}

export function MasterConsolePage() {
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const { plans } = usePlans();
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalFamilies: 0,
        totalLists: 0,
        activeTitulars: 0,
    });
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserDataLocal[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlanProps | null>(null);
    const [editingUser, setEditingUser] = useState<UserDataLocal | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [usersSnap, familiesSnap] = await Promise.all([
                    getDocs(collection(db, COLLECTIONS.USERS)),
                    getDocs(collection(db, COLLECTIONS.FAMILIES)),
                ]);

                let listsCount = 0;
                for (const familyDoc of familiesSnap.docs) {
                    const listsSnap = await getDocs(
                        collection(db, COLLECTIONS.FAMILIES, familyDoc.id, "lists")
                    );
                    listsCount += listsSnap.size;
                }

                const activeTitulars = usersSnap.docs.filter(
                    (doc) => doc.data().role === "titular" && doc.data().status === "active"
                ).length;

                setStats({
                    totalUsers: usersSnap.size,
                    totalFamilies: familiesSnap.size,
                    totalLists: listsCount,
                    activeTitulars,
                });

                // Load users
                const usersData: UserDataLocal[] = usersSnap.docs.map((doc) => ({
                    id: doc.id,
                    email: doc.data().email || "",
                    displayName: doc.data().displayName || "",
                    role: doc.data().role || "member",
                    status: doc.data().status,
                    billing: doc.data().billing,
                }));
                setUsers(usersData);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        }

        if (domainUser?.isMaster) {
            loadData();
        }
    }, [domainUser?.isMaster]);

    const filteredUsers = users.filter(
        (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = () => {
        setLoading(true);
        window.location.reload();
    };

    if (!domainUser?.isMaster) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card padding="lg" elevated className="text-center">
                    <Shield className="mx-auto h-16 w-16 text-danger" />
                    <h2 className="mt-4 text-xl font-semibold text-primary">
                        {t("master.accessDenied", { defaultValue: "Acesso Negado" })}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                        {t("master.masterOnly", { defaultValue: "Apenas usuários Master podem acessar esta página" })}
                    </p>
                </Card>
            </div>
        );
    }

    const statCards = [
        {
            icon: Users,
            label: t("master.totalUsers", { defaultValue: "Total de Usuários" }),
            value: stats.totalUsers,
            color: "brand",
        },
        {
            icon: Shield,
            label: t("master.activeTitulars", { defaultValue: "Titulares Ativos" }),
            value: stats.activeTitulars,
            color: "success",
        },
        {
            icon: Users,
            label: t("master.totalFamilies", { defaultValue: "Total de Famílias" }),
            value: stats.totalFamilies,
            color: "accent",
        },
        {
            icon: ClipboardList,
            label: t("master.totalLists", { defaultValue: "Total de Listas" }),
            value: stats.totalLists,
            color: "warning",
        },
    ];

    return (
        <motion.div
            className="mx-auto max-w-6xl space-y-6 p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary">
                        {t("master.console", { defaultValue: "Console Master" })}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {t("master.subtitle", { defaultValue: "Controle total da plataforma" })}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} padding="lg" elevated>
                            <div className="animate-pulse space-y-3">
                                <div className="h-12 w-12 rounded-2xl bg-surface-alt" />
                                <div className="h-8 w-20 rounded bg-surface-alt" />
                                <div className="h-4 w-24 rounded bg-surface-alt" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} padding="lg" elevated>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${stat.color}/10 text-${stat.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <p className="mt-4 text-3xl font-bold text-primary">{stat.value}</p>
                                <p className="mt-1 text-sm text-muted">{stat.label}</p>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <Card padding="lg" elevated>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-primary">
                                {t("master.manageUsers", { defaultValue: "Gerenciar Usuários" })}
                            </h3>
                            <p className="text-xs text-muted">
                                {t("master.manageUsersHint", { defaultValue: "Ver, editar e controlar usuários" })}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder={t("master.searchUsers", { defaultValue: "Buscar usuários..." })}
                                className="w-full rounded-xl border border-soft bg-surface-alt py-2 pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                            />
                        </div>
                    </div>
                </Card>

                <Card padding="lg" elevated>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-primary">
                                {t("master.systemSettings", { defaultValue: "Configurações do Sistema" })}
                            </h3>
                            <p className="text-xs text-muted">
                                {t("master.systemSettingsHint", { defaultValue: "Ajustes globais da plataforma" })}
                            </p>
                        </div>
                    </div>
                    <Button className="mt-4 w-full gap-2" size="sm">
                        <Settings className="h-4 w-4" />
                        {t("master.openSettings", { defaultValue: "Abrir configurações" })}
                    </Button>
                </Card>
            </div>

            {/* Plans Management */}
            <Card padding="lg" elevated>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {t("master.plans", { defaultValue: "Planos" })}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            {t("master.plansHint", { defaultValue: "Gerenciar planos e preços" })}
                        </p>
                    </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-semibold">{plan.name}</h4>
                                    <p className="mt-1 flex items-baseline gap-1 text-sm">
                                        <DollarSign className="h-3 w-3" />
                                        <span className="font-bold">{plan.props.monthlyPrice}</span>
                                        <span className="text-gray-500">/mês</span>
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingPlan(plan.props)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <p>{plan.limits.familyMembers === Infinity ? "∞" : plan.limits.familyMembers} membros</p>
                                <p>{plan.limits.listsPerFamily === Infinity ? "∞" : plan.limits.listsPerFamily} listas</p>
                                <p>{plan.limits.itemsPerList === Infinity ? "∞" : plan.limits.itemsPerList} itens</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>

            {/* Users Management */}
            <Card padding="lg" elevated>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {t("master.users", { defaultValue: "Usuários" })}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            {t("master.usersHint", { defaultValue: "Ver e gerenciar todos os usuários" })}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        {t("actions.refresh", { defaultValue: "Atualizar" })}
                    </Button>
                </div>
                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder={t("master.searchUsers", { defaultValue: "Buscar usuários..." })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-soft bg-surface-alt py-2 pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                        />
                    </div>
                </div>
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                    <span className="text-sm font-semibold">
                                        {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{user.displayName || user.email}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusPill
                                    tone={user.role === "master" ? "danger" : user.role === "titular" ? "success" : "info"}
                                >
                                    {user.role}
                                </StatusPill>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingUser(user as any)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Modals */}
            <AnimatePresence>
                {editingPlan && (
                    <EditPlanModal
                        plan={editingPlan}
                        onClose={() => setEditingPlan(null)}
                        onSave={handleRefresh}
                    />
                )}
                {editingUser && (
                    <EditUserModal
                        user={editingUser as any}
                        onClose={() => setEditingUser(null)}
                        onSave={handleRefresh}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
