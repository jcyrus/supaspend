"use client";

import { Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletManagement } from "./WalletManagement";
import type { UserWithBalance } from "@/types/database";

interface WalletManagementModalProps {
  user: UserWithBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WalletManagementModal({
  user,
  open,
  onOpenChange,
  onSuccess,
}: WalletManagementModalProps) {
  const handleClose = () => {
    onOpenChange(false);
    onSuccess(); // Refresh user data when closing
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Manage Wallets - {user.username}
              </DialogTitle>
              <DialogDescription>
                Create and manage currency wallets for this user
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <WalletManagement userId={user.user_id} userEmail={user.email} />
      </DialogContent>
    </Dialog>
  );
}
