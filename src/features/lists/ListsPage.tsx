import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, ClipboardList, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { useFamilyLists } from "../../hooks/useLists";
import { usePermissions } from "../../hooks/usePermissions";
import { ListCardWithData } from "./components/ListCardWithData";

export function ListsPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const shouldReduce = useReducedMotion();

  const familyId = domainUser?.managedFamilyId ?? null;
  const { lists, loading } = useFamilyLists(familyId);
  const { canCreateList } = usePermissions();

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateList = () => {
    const check = canCreateList();
    if (!check.allowed) {
      alert(check.reason || t("lists.limitReached", { defaultValue: "Limite de listas atingido" }));
      return;
    }
    navigate("/lists/new");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduce ? 0 : 0.07,
        delayChildren: shouldReduce ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: shouldReduce ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:max-w-3xl sm:p-6 lg:max-w-6xl">

      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
        initial={{ opacity: 0, y: shouldReduce ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-3xl font-bold text-primary">
              {t("lists.title", { defaultValue: "Minhas Listas" })}
            </h1>
            <AnimatePresence>
              {!loading && lists.length > 0 && (
                <motion.span
                  key="count-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28, delay: 0.15 }}
                  className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-sm font-bold text-white"
                >
                  {lists.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm text-muted">
            {t("lists.subtitle", { defaultValue: "Gerencie suas listas e itens" })}
          </p>
        </div>

        {(domainUser?.isTitular || domainUser?.isMaster) && (
          <motion.div
            className="self-center sm:self-auto"
            whileHover={shouldReduce ? {} : { scale: 1.03, y: -1 }}
            whileTap={shouldReduce ? {} : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button onClick={handleCreateList} icon={<Plus className="h-5 w-5" />}>
              {t("actions.createList", { defaultValue: "Criar lista" })}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: shouldReduce ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: shouldReduce ? 0 : 0.08 }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder={t("lists.search", { defaultValue: "Buscar listas..." })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-soft bg-surface py-3.5 pl-12 pr-4 text-sm text-primary shadow-soft/20 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-soft bg-surface p-6"
              style={{ opacity: 1 - i * 0.15 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-surface-alt" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg bg-surface-alt" />
                    <div className="h-3 w-1/2 rounded-lg bg-surface-alt" />
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-alt" />
                <div className="flex gap-4">
                  <div className="h-3 w-20 rounded-lg bg-surface-alt" />
                  <div className="h-3 w-20 rounded-lg bg-surface-alt" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-2xl border border-soft bg-surface py-20 text-center shadow-soft/10"
        >
          <motion.div
            animate={shouldReduce ? {} : { y: [0, -7, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          >
            <ClipboardList className="h-16 w-16 text-muted opacity-50" />
          </motion.div>
          <h3 className="mt-5 text-lg font-semibold text-primary">
            {searchTerm
              ? t("lists.noResults", { defaultValue: "Nenhuma lista encontrada" })
              : t("lists.empty", { defaultValue: "Nenhuma lista criada ainda" })}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {searchTerm
              ? t("lists.tryDifferentSearch", { defaultValue: "Tente uma busca diferente" })
              : t("lists.emptyHint", { defaultValue: "Crie sua primeira lista para começar" })}
          </p>
          {!searchTerm && (domainUser?.isTitular || domainUser?.isMaster) && (
            <motion.div
              className="mt-6"
              whileHover={shouldReduce ? {} : { scale: 1.04 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
            >
              <Button onClick={handleCreateList} icon={<Plus className="h-5 w-5" />}>
                {t("actions.createList", { defaultValue: "Criar nova lista" })}
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 xl:gap-6"
        >
          {filteredLists.map((list) => (
            <motion.div key={list.id} variants={cardVariants}>
              <ListCardWithData list={list} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
