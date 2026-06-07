import { motion } from "framer-motion";
import { ClipboardList, ShoppingCart, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
  const isShopping = list.type === "shopping";
  const Icon = isShopping ? ShoppingCart : ClipboardList;
  const isDone = itemsCount > 0 && progress === 100;

  return (
    <Link to={`/lists/${list.id}`} className="block h-full">
      <motion.div
        className="group relative h-full overflow-hidden rounded-2xl border border-soft bg-surface p-5 shadow-soft/20 xl:p-6"
        whileHover={{
          y: -5,
          boxShadow: "0 16px 40px -8px rgba(0,0,0,0.13), 0 4px 12px -4px rgba(0,0,0,0.07)",
        }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
      >
        {/* Gradient accent line that slides in on hover */}
        <div
          className={`absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 rounded-t-2xl transition-transform duration-300 group-hover:scale-x-100 ${
            isShopping
              ? "bg-linear-to-r from-purple-500 to-pink-400"
              : "bg-linear-to-r from-brand to-blue-400"
          }`}
        />

        <div className="flex h-full flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 rounded-xl p-2.5 xl:p-3 ${
                isShopping
                  ? "bg-purple-500/12 text-purple-500 dark:bg-purple-500/20"
                  : "bg-blue-500/12 text-blue-500 dark:bg-blue-500/20"
              }`}
            >
              <Icon className="h-5 w-5 xl:h-6 xl:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-semibold text-primary transition-colors group-hover:text-brand xl:text-lg">
                {list.name}
              </h3>
              {list.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {list.description}
                </p>
              )}
            </div>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted/40 transition-all group-hover:translate-x-1 group-hover:text-brand" />
          </div>

          {/* Progress bar */}
          {itemsCount > 0 && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <motion.div
                  className={`h-full rounded-full ${
                    isDone
                      ? "bg-green-500"
                      : "bg-linear-to-r from-brand to-blue-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                />
              </div>
              <p className="text-xs text-muted">
                {progress}% {t("lists.complete", { defaultValue: "completo" })}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5 text-muted">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {pendingCount} {t("lists.pending", { defaultValue: "pendentes" })}
              </span>
            </div>
            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {completedCount}{" "}
                  {isShopping
                    ? t("lists.purchased", { defaultValue: "comprados" })
                    : t("lists.completed", { defaultValue: "concluídos" })}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
