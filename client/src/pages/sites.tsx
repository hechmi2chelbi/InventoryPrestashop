import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PlusCircle, X, Store, Package, AlertTriangle } from "lucide-react";
import { Site } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLoader } from "@/components/ui/loader";
import { PageLoader } from "@/components/ui/page-loader";
import SiteCard from "@/components/sites/site-card";
import RightSidebarForm from "@/components/sites/right-sidebar-form";
import ModuleLogs from "@/components/sites/module-logs";
import ModuleDownloadButton from "@/components/sites/module-download-button";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Sites() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSidebarForm, setShowSidebarForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | undefined>(undefined);
  const [selectedSiteForLogs, setSelectedSiteForLogs] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: sites, isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });
  
  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: number) => {
      await apiRequest("DELETE", `/api/sites/${siteId}`);
      return siteId;
    },
    onSuccess: (siteId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Site supprimé",
        description: "Le site a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du site: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateSiteStatusMutation = useMutation({
    mutationFn: async ({ siteId, status }: { siteId: number; status: string }) => {
      await apiRequest("PUT", `/api/sites/${siteId}`, { status });
      return { siteId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Statut mis à jour",
        description: `Le site est maintenant ${data.status === 'connected' ? 'connecté' : 'déconnecté'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour du statut: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteSite = (siteId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce site?")) {
      deleteSiteMutation.mutate(siteId);
    }
  };
  
  const handleUpdateStatus = (siteId: number, status: string) => {
    updateSiteStatusMutation.mutate({ siteId, status });
  };
  
  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setShowSidebarForm(true);
  };
  
  const handleAddSite = () => {
    setEditingSite(undefined);
    setShowSidebarForm(true);
  };
  
  const handleCloseSidebar = () => {
    setShowSidebarForm(false);
    setEditingSite(undefined);
  };
  
  const handleViewLogs = (siteId: number) => {
    setSelectedSiteForLogs(siteId);
  };
  
  const closeLogsDialog = () => {
    setSelectedSiteForLogs(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-500">Mes sites PrestaShop</h1>
                <div className="text-sm text-neutral-500 mt-1">
                  {!isLoading && sites && (
                    <div className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                      {sites.filter(s => s.status === 'connected').length} sites connectés sur {sites.length} sites
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleAddSite} className="mt-3 sm:mt-0">
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter un site
              </Button>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <PageLoader isLoading={isLoading} text="Chargement de vos sites PrestaShop...">
                {sites && sites.length > 0 ? (
                  <>
                    {/* Statistiques des sites */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                      <Card className="bg-white overflow-hidden shadow">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary-light rounded-md p-2">
                              <Store className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-neutral-400 truncate">Sites connectés</dt>
                                <dd className="text-lg font-semibold text-neutral-500">
                                  {sites.filter(s => s.status === 'connected').length}/{sites.length}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-white overflow-hidden shadow">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-neutral-400 truncate">Boutiques actives</dt>
                                <dd className="text-lg font-semibold text-neutral-500">
                                  {Math.round((sites.filter(s => s.status === 'connected').length / Math.max(sites.length, 1)) * 100)}%
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-white overflow-hidden shadow">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-amber-500 rounded-md p-2">
                              <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-neutral-400 truncate">Sites en erreur</dt>
                                <dd className="text-lg font-semibold text-neutral-500">
                                  {sites.filter(s => s.status !== 'connected').length}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    
                    {/* Liste des sites */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                      {sites.map((site) => (
                        <SiteCard 
                          key={site.id} 
                          site={site} 
                          onDelete={() => handleDeleteSite(site.id)}
                          onStatusChange={(status) => handleUpdateStatus(site.id, status)}
                          onEdit={handleEditSite}
                          onViewLogs={handleViewLogs}
                        />
                      ))}
                    </div>
                    
                    {/* Module d'installation */}
                    <div className="mt-8">
                      <Card className="bg-white shadow rounded-lg mb-6">
                        <CardHeader className="px-6 py-5 border-b border-neutral-200">
                          <CardTitle>Installation du module PrestaShop</CardTitle>
                          <CardDescription>Suivez ces étapes pour connecter votre boutique PrestaShop</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                  1
                                </div>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-medium text-neutral-500">Téléchargez le module</h4>
                                <p className="mt-1 text-sm text-neutral-400">
                                  Téléchargez notre module PrestaShop pour établir la connexion
                                </p>
                                <div className="mt-3">
                                  <ModuleDownloadButton className="inline-flex items-center" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                  2
                                </div>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-medium text-neutral-500">Installez le module</h4>
                                <p className="mt-1 text-sm text-neutral-400">
                                  Connectez-vous à votre back-office PrestaShop et installez le module
                                </p>
                                <div className="mt-3">
                                  <Link href="/help" className="text-sm text-primary hover:text-primary-dark">
                                    Voir les instructions d'installation →
                                  </Link>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                  3
                                </div>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-medium text-neutral-500">Configurez la connexion</h4>
                                <p className="mt-1 text-sm text-neutral-400">
                                  Entrez les informations d'API générées par le module
                                </p>
                                <div className="mt-3">
                                  <Button
                                    variant="outline"
                                    className="text-sm text-primary hover:text-primary-dark"
                                    onClick={handleAddSite}
                                  >
                                    Ajouter un site PrestaShop →
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Aucun site connecté</CardTitle>
                        <CardDescription>
                          Vous n'avez pas encore connecté de boutique PrestaShop à votre compte.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button onClick={handleAddSite} className="w-full">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Ajouter ma première boutique
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow rounded-lg mb-6">
                      <CardHeader className="px-6 py-5 border-b border-neutral-200">
                        <CardTitle>Installation du module PrestaShop</CardTitle>
                        <CardDescription>Suivez ces étapes pour connecter votre boutique PrestaShop</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                1
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-base font-medium text-neutral-500">Téléchargez le module</h4>
                              <p className="mt-1 text-sm text-neutral-400">
                                Téléchargez notre module PrestaShop pour établir la connexion
                              </p>
                              <div className="mt-3">
                                <ModuleDownloadButton className="inline-flex items-center" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                2
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-base font-medium text-neutral-500">Installez le module</h4>
                              <p className="mt-1 text-sm text-neutral-400">
                                Connectez-vous à votre back-office PrestaShop et installez le module
                              </p>
                              <div className="mt-3">
                                <Link href="/help" className="text-sm text-primary hover:text-primary-dark">
                                  Voir les instructions d'installation →
                                </Link>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                                3
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-base font-medium text-neutral-500">Configurez la connexion</h4>
                              <p className="mt-1 text-sm text-neutral-400">
                                Entrez les informations d'API générées par le module
                              </p>
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  className="text-sm text-primary hover:text-primary-dark"
                                  onClick={handleAddSite}
                                >
                                  Ajouter un site PrestaShop →
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </PageLoader>
            </div>
          </div>
        </main>
      </div>
      
      {/* Sidebar formulaire (ajout/modification) */}
      <RightSidebarForm 
        isOpen={showSidebarForm}
        onClose={handleCloseSidebar}
        editingSite={editingSite}
        setEditingSite={setEditingSite}
      />
      
      {/* Dialogue pour afficher les logs */}
      <Dialog open={selectedSiteForLogs !== null} onOpenChange={closeLogsDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeLogsDialog}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogHeader>
            <DialogTitle>
              Journaux d'activité du module
              {selectedSiteForLogs && sites && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {sites.find(s => s.id === selectedSiteForLogs)?.name || ''}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-grow overflow-hidden">
            {selectedSiteForLogs && <ModuleLogs siteId={selectedSiteForLogs} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}