import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import WelcomeCard from "@/components/dashboard/welcome-card";
import StockAlerts from "@/components/dashboard/stock-alerts";
import PriceChanges from "@/components/dashboard/price-changes";
import SiteStats from "@/components/dashboard/site-stats";
import { useSelectedSite } from "@/hooks/use-selected-site";
import { PageLoader } from "@/components/ui/page-loader";
import { useState } from "react";
import { SiteStats as SiteStatsType } from "@shared/schema";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedSiteId, selectedSite } = useSelectedSite();
  
  interface DashboardData {
    stats: {
      connectedSites: number;
      totalSites: number;
      trackedProducts: number;
      stockAlerts: number;
      lastSync: string | null;
    };
    sites: any[];
    stockAlerts: any[];
    priceChanges: any[];
    siteStats?: SiteStatsType;
  }
  
  // Récupérer les données du tableau de bord avec gestion spécifique des erreurs
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", selectedSiteId],
    enabled: !!selectedSiteId,
    retry: 1, // Ne réessayer qu'une seule fois en cas d'erreur
    retryOnMount: true
  });

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-neutral-500">Tableau de bord</h1>
                {selectedSite && data?.siteStats && (
                  <span className="text-xs text-neutral-500">
                    Dernière mise à jour : {new Intl.DateTimeFormat('fr-FR', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    }).format(new Date(data.siteStats.last_update as Date | string))}
                  </span>
                )}
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <PageLoader isLoading={isLoading} text="Chargement du tableau de bord...">
                {error ? (
                  <div className="mt-4 bg-white p-6 rounded-lg shadow">
                    <p className="text-red-500">Erreur de chargement des données: {(error as Error).message}</p>
                  </div>
                ) : (
                  <>
                    <WelcomeCard />
                    {selectedSite && data?.siteStats && (
                      <SiteStats 
                        stats={data.siteStats} 
                        siteName={selectedSite.name} 
                        siteId={selectedSite.id} 
                      />
                    )}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                      <StockAlerts alerts={data?.stockAlerts} />
                      <PriceChanges changes={data?.priceChanges} />
                    </div>
                  </>
                )}
              </PageLoader>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}