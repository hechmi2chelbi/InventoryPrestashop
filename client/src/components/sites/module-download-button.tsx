import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface ModuleDownloadButtonProps {
  className?: string;
}

/**
 * Bouton pour télécharger le module PrestaShop
 */
export default function ModuleDownloadButton({ className }: ModuleDownloadButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleDownload = async () => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour télécharger le module.",
        variant: "destructive",
      });
      
      // Rediriger vers la page d'authentification après un court délai
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
      
      return;
    }
    
    try {
      // URL de l'API pour télécharger le module
      const downloadUrl = "/api/module/download";
      
      // Ouvrir dans une nouvelle fenêtre pour déclencher le téléchargement
      window.open(downloadUrl, "_blank");
      
      toast({
        title: "Téléchargement démarré",
        description: "Le module PrestaShop est en cours de téléchargement.",
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le module PrestaShop.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className={className}
      variant="secondary"
    >
      <Download className="mr-2 h-4 w-4" />
      Télécharger le module PrestaShop
    </Button>
  );
}