import { Card } from "@/components/ui/card";
import { SiteStats as SiteStatsType } from "@shared/schema";
import { Users, ShoppingBag, DollarSign, Package, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface SiteStatsProps {
  stats?: SiteStatsType | null;
  siteName?: string;
  siteId?: number;
}

export default function SiteStats({ stats, siteName, siteId }: SiteStatsProps) {
  const queryClient = useQueryClient();
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error("ID du site non défini");
      const res = await apiRequest("POST", `/api/sites/${siteId}/sync-stats`);
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

  if (!stats) {
    return null; // Ne rien afficher si aucune statistique n'est disponible
  }

  // Formater le montant du revenu total (enlever les zéros après la virgule si nécessaire)
  const formatRevenue = (revenue: string | null) => {
    if (!revenue) return '0 €';
    const amount = parseFloat(revenue);
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Carte clients plus grande */}
        <Card className="flex flex-col items-center justify-center p-6 bg-white shadow rounded-lg">
          <div className="bg-blue-100 rounded-full p-3 mb-4">
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <span className="text-4xl font-bold mb-1">{stats.total_customers}</span>
          <span className="text-base text-neutral-500">Clients</span>
        </Card>
        
        {/* Carte commandes plus grande */}
        <Card className="flex flex-col items-center justify-center p-6 bg-white shadow rounded-lg">
          <div className="bg-purple-100 rounded-full p-3 mb-4">
            <ShoppingBag className="h-10 w-10 text-purple-500" />
          </div>
          <span className="text-4xl font-bold mb-1">{stats.total_orders}</span>
          <span className="text-base text-neutral-500">Commandes</span>
        </Card>
        
        {/* Chiffre d'affaires */}
        <Card className="flex flex-col items-center justify-center p-6 bg-white shadow rounded-lg">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
          <span className="text-4xl font-bold mb-1">{formatRevenue(stats.total_revenue)}</span>
          <span className="text-base text-neutral-500">Chiffre d'affaires</span>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Produits */}
        <Card className="flex flex-col items-center justify-center p-5 bg-white shadow rounded-lg">
          <div className="bg-amber-100 rounded-full p-3 mb-3">
            <Package className="h-8 w-8 text-amber-500" />
          </div>
          <span className="text-3xl font-bold mb-1">{stats.total_products}</span>
          <span className="text-base text-neutral-500">Produits</span>
        </Card>
        
        {/* Catégories */}
        <Card className="flex flex-col items-center justify-center p-5 bg-white shadow rounded-lg">
          <div className="bg-red-100 rounded-full p-3 mb-3">
            <Layers className="h-8 w-8 text-red-500" />
          </div>
          <span className="text-3xl font-bold mb-1">{stats.total_categories}</span>
          <span className="text-base text-neutral-500">Catégories</span>
        </Card>
      </div>
    </div>
  );
}