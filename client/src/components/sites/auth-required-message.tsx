import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AuthRequiredMessageProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigate: (to: string) => void;
}

export default function AuthRequiredMessage({
  open,
  setOpen,
  navigate
}: AuthRequiredMessageProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connexion requise</DialogTitle>
          <DialogDescription>
            Vous devez être connecté pour télécharger le module PrestaShop.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-3 mt-4">
          <Button onClick={() => {
            setOpen(false);
            navigate("/auth");
          }}>
            Se connecter
          </Button>
          <Button variant="outline" onClick={() => {
            setOpen(false);
          }}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}