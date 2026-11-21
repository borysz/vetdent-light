"use client";

import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";

export type ConfirmAction = {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "dark";
  onClick: () => void;
};

/** A question with a few answers. `onDismiss` runs on Escape, the close button and outside clicks. */
export function ConfirmDialog({
  open,
  title,
  body,
  actions,
  onDismiss,
}: {
  open: boolean;
  title: string;
  body: string;
  actions: ConfirmAction[];
  onDismiss: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent title={title} size="sm">
        <p className="mb-4 text-base">{body}</p>
        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant ?? "secondary"} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
