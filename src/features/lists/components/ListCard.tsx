import { motion } from "framer-motion";
import { ClipboardList, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import type { ListRecord } from "../../../domain/models";

interface ListCardProps {
  list: ListRecord;
  itemsCount?: number;
  completedCount?: number;
}

export function ListCard({ list, itemsCount = 0, completedCount = 0 }: ListCardProps) {
  const { t } = useTranslation();

  const progress = itemsCount > 0 ? Math.round((completedCount / itemsCount) * 100) : 0;
  const pendingCount = itemsCount - completedCount;

  return (
    <Link to={`/lists/${list.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className="group cursor-pointer p-5 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500 p-2">
                <ClipboardList className="size-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {list.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="size-4" />
                    <span>{pendingCount} {t("lists.pending", { defaultValue: "pendentes" })}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    <span>{completedCount} {t("lists.completed", { defaultValue: "concluídos" })}</span>
                  </div>
                </div>

                {itemsCount > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {progress}% {t("lists.complete", { defaultValue: "completo" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="size-5 text-gray-400 transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
