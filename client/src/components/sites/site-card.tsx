import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Site } from "@shared/schema";
import { ExternalLink, RefreshCw, Trash2, ShoppingCart, Smartphone, Flower, Lock, Edit2, History, Copy, RotateCcw, MoreVertical, Settings } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface SiteCardProps {
  site: Site;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onEdit: (site: Site) => void;
  onViewLogs?: (siteId: number) => void;
}

export default function SiteCard({ site, onDelete, onStatusChange, onEdit, onViewLogs }: SiteCardProps) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/sites/${site.id}/test-connection`);
    },
    onSuccess: async (data) => {
      const result = await data.json();
      
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
        onStatusChange("connected");
      } else {
        toast({
          title: "Échec de connexion",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur de connexion",
        description: `Une erreur s'est produite: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      return await apiRequest("GET", `/api/sites/${site.id}/sync`);
    },
    onSuccess: async (data) => {
      const result = await data.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "Synchronisation réussie",
        description: result.message || "Les produits ont été synchronisés avec succès",
      });
      
      setIsSyncing(false);
      onStatusChange("connected");
    },
    onError: (error) => {
      toast({
        title: "Erreur de synchronisation",
        description: `Une erreur s'est produite: ${(error as Error).message}`,
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });
  
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      setIsResetting(true);
      return await apiRequest("POST", `/api/sites/${site.id}/reset`);
    },
    onSuccess: async (data) => {
      const result = await data.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "Réinitialisation réussie",
        description: result.message || "Les données de la boutique ont été réinitialisées avec succès",
      });
      
      setIsResetting(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur de réinitialisation",
        description: `Une erreur s'est produite: ${(error as Error).message}`,
        variant: "destructive",
      });
      setIsResetting(false);
    },
  });
  
  const getIconForSite = (siteName: string) => {
    if (siteName.toLowerCase().includes("mode") || siteName.toLowerCase().includes("boutique")) {
      return <ShoppingCart className="h-10 w-10 text-primary" />;
    } else if (siteName.toLowerCase().includes("tech") || siteName.toLowerCase().includes("phone")) {
      return <Smartphone className="h-10 w-10 text-primary" />;
    } else if (siteName.toLowerCase().includes("fleur") || siteName.toLowerCase().includes("flor")) {
      return <Flower className="h-10 w-10 text-primary" />;
    } else {
      return <ShoppingCart className="h-10 w-10 text-primary" />;
    }
  };
  
  const handleSync = () => {
    syncMutation.mutate();
  };
  
  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };
  
  const handleReset = () => {
    // La réinitialisation sera lancée depuis la boîte de dialogue
    resetDataMutation.mutate();
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return format(new Date(date), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  return (
    <Card className="h-full flex flex-col w-full md:col-span-6 xl:col-span-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="bg-primary-light/10 p-3 rounded-lg">
              {getIconForSite(site.name)}
            </div>
            <CardTitle className="mt-2">{site.name}</CardTitle>
          </div>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {onViewLogs && (
                  <DropdownMenuItem onClick={() => onViewLogs(site.id)}>
                    <History className="h-4 w-4 mr-2" />
                    Voir les journaux
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => onEdit(site)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {site.status === "connected" ? (
                  <DropdownMenuItem 
                    onClick={handleSync} 
                    disabled={testConnectionMutation.isPending || isResetting || isSyncing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isSyncing ? "Synchronisation..." : "Synchroniser"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={handleTestConnection} 
                    disabled={testConnectionMutation.isPending || isResetting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {testConnectionMutation.isPending ? "Test en cours..." : "Tester la connexion"}
                  </DropdownMenuItem>
                )}
                
                <ConfirmationDialog
                  title="Réinitialiser les données"
                  description={`Êtes-vous sûr de vouloir réinitialiser toutes les données de la boutique "${site.name}" ? Cette action est irréversible et supprimera tous les produits, attributs, historiques de prix et alertes de stock.`}
                  cancelText="Annuler"
                  confirmText="Réinitialiser"
                  onConfirm={handleReset}
                  variant="warning"
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isResetting ? "Réinitialisation..." : "Réinitialiser données"}
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">URL</p>
            <p className="text-sm text-neutral-400 flex items-center mt-1">
              {site.url}
              <ExternalLink className="h-3 w-3 ml-1 inline" />
              {site.http_auth_enabled && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex ml-2">
                        <Lock className="h-3 w-3 text-amber-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Authentification HTTP Basic activée</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-neutral-500">Clé API</p>
            <div className="flex items-center mt-1">
              <p className="text-sm text-neutral-400 truncate max-w-[140px]">{site.api_key}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1 text-neutral-400 hover:text-neutral-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(site.api_key);
                        toast({
                          title: "Clé API copiée",
                          description: "La clé API a été copiée dans le presse-papiers",
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copier la clé API</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-neutral-500">Version PrestaShop</p>
            <p className="text-sm text-neutral-400 mt-1">{site.version || "Non spécifiée"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-neutral-500">Dernière synchronisation</p>
            <p className="text-sm text-neutral-400 mt-1">{formatDate(site.last_sync)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full">
          <Separator className="mb-4" />
          <div className="flex justify-center">
            <Badge
              className={
                site.status === "connected"
                  ? "bg-green-100 text-green-800 hover:bg-green-200 px-4 py-1 text-sm"
                  : "bg-red-100 text-red-800 hover:bg-red-200 px-4 py-1 text-sm"
              }
            >
              {site.status === "connected" ? "Connecté" : "Déconnecté"}
            </Badge>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
