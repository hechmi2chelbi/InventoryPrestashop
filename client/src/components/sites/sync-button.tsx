import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SyncButtonProps {
  siteId: number | null;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onSuccess?: () => void;
}

/**
 * Bouton de synchronisation réutilisable pour synchroniser les données d'un site
 */
export default function SyncButton({ 
  siteId, 
  className = "", 
  variant = "default", 
  size = "default",
  onSuccess 
}: SyncButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error("ID du site manquant");
      const response = await apiRequest("POST", `/api/sites/${siteId}/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation réussie",
        description: data.message || "Les données ont été synchronisées avec succès.",
      });
      
      // Invalider les requêtes pertinentes pour forcer un rechargement des données
      queryClient.invalidateQueries({ queryKey: ["/api/sites/:siteId/products", siteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", siteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/:siteId", siteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      
      // Exécuter le callback onSuccess si fourni
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de la synchronisation.";
        
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  return (
    <Button
      onClick={() => syncMutation.mutate()}
      disabled={!siteId || syncMutation.isPending}
      className={className}
      variant={variant}
      size={size}
    >
      <RefreshCw 
        className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} 
      />
      {syncMutation.isPending ? "Synchronisation..." : "Synchroniser"}
    </Button>
  );
}