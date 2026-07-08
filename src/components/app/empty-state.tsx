"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed bg-card/75">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="empty-state-orbit flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
