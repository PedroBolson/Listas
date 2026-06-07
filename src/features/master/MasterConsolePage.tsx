import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shield, Users, ClipboardList, Search, Edit, Package, DollarSign } from "lucide-react";
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

// Tailwind JIT needs explicit class strings — no dynamic template literals
const STAT_STYLES: Record<string, { icon: string; bg: string }> = {
    brand:   { icon: "text-brand",                              bg: "bg-brand/10"         },
    success: { icon: "text-green-600 dark:text-green-400",      bg: "bg-green-500/10"     },
    accent:  { icon: "text-purple-600 dark:text-purple-400",    bg: "bg-purple-500/10"    },
    warning: { icon: "text-amber-600 dark:text-amber-400",      bg: "bg-amber-500/10"     },
};

export function MasterConsolePage() {
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const { plans } = usePlans();
    const shouldReduce = useReducedMotion();

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

        if (domainUser?.isMaster) void loadData();
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

    const block = (delay: number) => ({
        initial: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, type: "spring" as const, stiffness: 380, damping: 30 },
    });

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
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">

            {/* ── Header ── */}
            <motion.div className="flex items-center gap-3" {...block(0.04)}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                        {t("master.console", { defaultValue: "Console Master" })}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted">
                        {t("master.subtitle", { defaultValue: "Controle total da plataforma" })}
                    </p>
                </div>
            </motion.div>

            {/* ── Stat cards ── */}
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
                    {statCards.map((stat, idx) => {
                        const Icon = stat.icon;
                        const style = STAT_STYLES[stat.color] ?? STAT_STYLES.brand;
                        return (
                            <motion.div
                                key={stat.label}
                                {...block(0.08 + idx * 0.07)}
                                whileHover={shouldReduce ? {} : { y: -4 }}
                            >
                                <Card padding="lg" elevated className="h-full">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.bg} ${style.icon}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 text-3xl font-bold text-primary">{stat.value}</p>
                                    <p className="mt-1 text-sm text-muted">{stat.label}</p>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Plans ── */}
            <motion.div {...block(0.36)}>
                <Card padding="lg" elevated>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-secondary" />
                        <h3 className="text-lg font-semibold text-primary">
                            {t("master.plans", { defaultValue: "Planos" })}
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                        {t("master.plansHint", { defaultValue: "Gerenciar planos e preços" })}
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-primary">{plan.name}</h4>
                                        <p className="mt-1 flex items-baseline gap-1 text-sm">
                                            <DollarSign className="h-3 w-3 text-muted" />
                                            <span className="font-bold text-primary">{plan.props.monthlyPrice}</span>
                                            <span className="text-muted">/mês</span>
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
                                <div className="mt-3 space-y-1 text-xs text-muted">
                                    <p>{plan.limits.familyMembers === Infinity ? "∞" : plan.limits.familyMembers} membros</p>
                                    <p>{plan.limits.listsPerFamily === Infinity ? "∞" : plan.limits.listsPerFamily} listas</p>
                                    <p>{plan.limits.itemsPerList === Infinity ? "∞" : plan.limits.itemsPerList} itens</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* ── Users ── */}
            <motion.div {...block(0.44)}>
                <Card padding="lg" elevated>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-secondary" />
                                <h3 className="text-lg font-semibold text-primary">
                                    {t("master.users", { defaultValue: "Usuários" })}
                                </h3>
                            </div>
                            <p className="mt-1 text-sm text-muted">
                                {t("master.usersHint", { defaultValue: "Ver e gerenciar todos os usuários" })}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            {t("actions.refresh", { defaultValue: "Atualizar" })}
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder={t("master.searchUsers", { defaultValue: "Buscar usuários..." })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-soft bg-surface-alt py-2 pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>

                    {/* User list */}
                    <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                        {filteredUsers.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.48 + idx * 0.035, type: "spring", stiffness: 420, damping: 34 }}
                                className="flex items-center justify-between rounded-xl border border-soft bg-surface-alt p-3 transition hover:border-brand/20 hover:bg-surface"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <span className="text-sm font-semibold">
                                            {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-primary">{user.displayName || user.email}</p>
                                        <p className="text-xs text-muted">{user.email}</p>
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
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* ── Modals ── */}
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
        </div>
    );
}
