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
        <Card className="group h-full cursor-pointer p-4 transition-all hover:shadow-lg xl:p-6">
          <div className="flex h-full flex-col gap-4 xl:gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500 p-2.5 xl:p-3">
                <ClipboardList className="h-5 w-5 text-white xl:h-6 xl:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 xl:text-lg">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 xl:mt-2">
                    {list.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-3 xl:gap-2.5">
              <div className="flex flex-wrap items-center gap-3 text-sm xl:gap-4">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{pendingCount} {t("lists.pending", { defaultValue: "pendentes" })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {completedCount} {list.type === "shopping"
                      ? t("lists.purchased", { defaultValue: "comprados" }).toLowerCase()
                      : t("lists.completed", { defaultValue: "concluídos" }).toLowerCase()
                    }
                  </span>
                </div>
              </div>

              {itemsCount > 0 && (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 xl:h-1.5">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 xl:mt-2">
                    {progress}% {t("lists.complete", { defaultValue: "completo" })}
                  </p>
                </div>
              )}
            </div>

          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
