import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ClipboardList, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
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

  const primaryFamilyId = domainUser?.props.primaryFamilyId ?? null;
  const { lists, loading } = useFamilyLists(primaryFamilyId);
  const { canCreateList } = usePermissions();

  const filteredLists = lists.filter((list) =>
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

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6 p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {t("lists.title", { defaultValue: "Minhas Listas" })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("lists.subtitle", { defaultValue: "Gerencie suas listas e itens" })}
          </p>
        </div>
        {(domainUser?.isTitular || domainUser?.isMaster) && (
          <Button
            onClick={handleCreateList}
            icon={<Plus className="h-5 w-5" />}
          >
            {t("actions.createList", { defaultValue: "Criar lista" })}
          </Button>
        )}
      </div>

      <Card padding="lg" elevated>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder={t("lists.search", { defaultValue: "Buscar listas..." })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-soft bg-surface-alt py-3 pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <Button variant="ghost" className="gap-2">
            <Filter className="h-4 w-4" />
            {t("actions.filter", { defaultValue: "Filtrar" })}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg" elevated>
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-3/4 rounded bg-surface-alt" />
                <div className="h-4 w-full rounded bg-surface-alt" />
                <div className="h-4 w-2/3 rounded bg-surface-alt" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <Card padding="lg" elevated>
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-16 w-16 text-muted" />
            <h3 className="mt-4 text-lg font-semibold text-primary">
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
              <Button onClick={handleCreateList} className="mt-6 gap-2">
                <Plus className="h-5 w-5" />
                {t("actions.createList", { defaultValue: "Criar lista" })}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <ListCardWithData key={list.id} list={list} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
