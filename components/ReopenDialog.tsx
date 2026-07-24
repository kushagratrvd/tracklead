"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReopenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  targetStatus: string;
  isSubmitting?: boolean;
}

export function ReopenDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  isSubmitting = false,
}: ReopenDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">
            Reopen Lead Status?
          </DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            This lead is currently marked as <strong className="capitalize">{currentStatus}</strong>. As an Admin, you are about to reopen this lead to <strong className="capitalize">{targetStatus}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? "Reopening..." : "Confirm Reopen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
