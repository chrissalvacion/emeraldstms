import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type InfoFieldProps = {
  icon: LucideIcon;
  label: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
  iconClassName?: string;
};

export function InfoField({
  icon: Icon,
  label,
  value,
  className,
  iconClassName,
}: InfoFieldProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div
        className={cn(
          "mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-md text-muted-foreground",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <Icon className="size-3" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm text-foreground break-words">{value ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
