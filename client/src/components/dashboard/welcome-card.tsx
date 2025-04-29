import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import AddSiteDialog from "@/components/sites/add-site-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { useSelectedSite } from "@/hooks/use-selected-site";

export default function WelcomeCard() {
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const { selectedSiteId } = useSelectedSite();
  const queryClient = useQueryClient();
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSiteId) throw new Error("Aucun site sélectionné");
      const res = await apiRequest("GET", `/api/sites/${selectedSiteId}/sync-stats`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation réussie",
        description: "Les statistiques ont été mises à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card className="mb-6 mt-4 p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium text-neutral-500">Bienvenue sur PrestaSynch</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Gérez l'inventaire et suivez l'historique des prix de vos boutiques PrestaShop en temps réel.
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-6 flex items-center gap-2">
            {selectedSiteId && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-full" 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                title="Synchroniser les statistiques"
              >
                <RefreshCw className={`h-5 w-5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span className="sr-only">Actualiser</span>
              </Button>
            )}
            <Button onClick={() => setAddSiteOpen(true)}>
              Ajouter un site PrestaShop
            </Button>
          </div>
        </div>
      </Card>
      
      <AddSiteDialog open={addSiteOpen} setOpen={setAddSiteOpen} />
    </>
  );
}
