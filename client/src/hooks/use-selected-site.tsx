import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Site } from "@shared/schema";
import { useAuth } from "./use-auth";

type SelectedSiteContextType = {
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  selectedSite: Site | null;
};

const SelectedSiteContext = createContext<SelectedSiteContextType | null>(null);

export function SelectedSiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  
  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    enabled: !!user,
  });
  
  // Récupérer le site sélectionné
  const selectedSite = sites?.find(site => site.id.toString() === selectedSiteId) || null;
  
  // Charge le site sélectionné depuis localStorage lors du chargement
  useEffect(() => {
    const savedSiteId = localStorage.getItem('selectedSiteId');
    if (savedSiteId && sites?.some(site => site.id.toString() === savedSiteId)) {
      setSelectedSiteId(savedSiteId);
    } else if (sites && sites.length > 0) {
      // Par défaut, sélectionner le premier site
      setSelectedSiteId(sites[0].id.toString());
    }
  }, [sites]);
  
  // Sauvegarde le site sélectionné dans localStorage lorsqu'il change
  useEffect(() => {
    if (selectedSiteId) {
      localStorage.setItem('selectedSiteId', selectedSiteId);
    }
  }, [selectedSiteId]);
  
  return (
    <SelectedSiteContext.Provider
      value={{
        selectedSiteId,
        setSelectedSiteId,
        selectedSite
      }}
    >
      {children}
    </SelectedSiteContext.Provider>
  );
}

export function useSelectedSite() {
  const context = useContext(SelectedSiteContext);
  if (!context) {
    throw new Error("useSelectedSite must be used within a SelectedSiteProvider");
  }
  return context;
}