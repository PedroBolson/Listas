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

  const familyId = domainUser?.managedFamilyId ?? null;
  const { lists, loading } = useFamilyLists(familyId);
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
      className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:max-w-3xl sm:p-6 lg:max-w-6xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-primary">
            {t("lists.title", { defaultValue: "Minhas Listas" })}
          </h1>
          <p className="text-sm text-muted">
            {t("lists.subtitle", { defaultValue: "Gerencie suas listas e itens" })}
          </p>
        </div>
        {(domainUser?.isTitular || domainUser?.isMaster) && (
          <Button
            onClick={handleCreateList}
            icon={<Plus className="h-5 w-5" />}
            className="self-center sm:self-auto"
          >
            {t("actions.createList", { defaultValue: "Criar lista" })}
          </Button>
        )}
      </div>

      <Card padding="lg" elevated className="mx-auto w-full max-w-md sm:max-w-full">
        <div className="flex items-center gap-3">
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
          <Button variant="ghost" icon={<Filter className="h-4 w-4" />}>
            {t("actions.filter", { defaultValue: "Filtrar" })}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 place-items-center sm:grid-cols-2 sm:place-items-stretch xl:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg" elevated className="w-full max-w-md sm:max-w-none">
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-3/4 rounded bg-surface-alt" />
                <div className="h-4 w-full rounded bg-surface-alt" />
                <div className="h-4 w-2/3 rounded bg-surface-alt" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <Card padding="lg" elevated className="mx-auto w-full max-w-md sm:max-w-full">
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
              <Button onClick={handleCreateList} icon={<Plus className="h-5 w-5" />} className="mt-6 whitespace-nowrap">
                {t("actions.createList", { defaultValue: "Criar nova lista" })}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 place-items-center sm:grid-cols-2 sm:place-items-stretch xl:grid-cols-2 xl:gap-6">
          {filteredLists.map((list) => (
            <div key={list.id} className="w-full max-w-md sm:max-w-none">
              <ListCardWithData list={list} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
