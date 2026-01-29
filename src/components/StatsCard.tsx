import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { useLanguage } from "@/hooks/use-language";

interface StatsCardProps {
  titleKey: string;
  value?: string | number;
  subtitle?: string;
  subtitleKey?: string;
  icon?: ReactNode;
  className?: string;
  delay?: number;
}

export function StatsCard({ titleKey, value, subtitle, subtitleKey, icon, className, delay = 0 }: StatsCardProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {t(titleKey)}
      </h3>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl md:text-4xl font-bold font-display text-foreground">
          {value || "-"}
        </span>
      </div>
      
      {(subtitle || subtitleKey) && (
        <p className="mt-2 text-sm text-muted-foreground">
          {subtitleKey ? t(subtitleKey) : subtitle}
        </p>
      )}
    </motion.div>
  );
}
