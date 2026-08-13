"use client";
import { useToasts, toastStore } from "./toast-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-md border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-2",
            t.variant === "destructive" && "border-destructive/50 bg-destructive/10"
          )}
        >
          <div>
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
          </div>
          <button onClick={() => toastStore.remove(t.id)} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
