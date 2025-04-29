import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
  triggerButtonProps?: ButtonProps;
  variant?: "default" | "destructive" | "warning";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmationDialog({
  title,
  description,
  cancelText = "Annuler",
  confirmText = "Confirmer",
  onConfirm,
  trigger,
  triggerButtonProps,
  variant = "default",
  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  // Fonction pour déterminer les styles des boutons en fonction de la variante
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-amber-500 text-white hover:bg-amber-600";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  const confirmButtonStyles = getVariantStyles();

  const dialogContent = (
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription className="pt-2">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelText}</AlertDialogCancel>
        <AlertDialogAction 
          onClick={() => onConfirm()}
          className={cn(confirmButtonStyles)}
        >
          {confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  // Si open et onOpenChange sont fournis, c'est un dialogue contrôlé
  if (open !== undefined && onOpenChange) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
        {dialogContent}
      </AlertDialog>
    );
  }

  // Sinon, c'est un dialogue non contrôlé
  return (
    <AlertDialog>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger asChild>
          <Button {...triggerButtonProps}>{triggerButtonProps?.children || confirmText}</Button>
        </AlertDialogTrigger>
      )}
      {dialogContent}
    </AlertDialog>
  );
}