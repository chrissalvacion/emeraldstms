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
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value ?? "—"}</div>
      </div>
    </div>
  );
}
