"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { CompanionFigure } from "@/components/app/custom-svg";

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
  companion = true,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action?: React.ReactNode;
  companion?: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        {companion ? (
          <CompanionFigure size={64} className="animate-float" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <div>
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
