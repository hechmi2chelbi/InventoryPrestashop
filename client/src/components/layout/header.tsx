import { Bell, ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSelectedSite } from "@/hooks/use-selected-site";
import { useQuery } from "@tanstack/react-query";
import { Site } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { selectedSiteId, setSelectedSiteId } = useSelectedSite();
  
  const { data: sites, isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    enabled: !!user,
  });
  
  // Gestion du changement de site sélectionné
  const handleSiteChange = (value: string) => {
    setSelectedSiteId(value);
  };

  if (!user) return null;

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden px-4 text-neutral-500 focus:outline-none"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="material-icons">menu</span>
      </Button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-lg md:text-xl font-semibold text-primary md:hidden">PrestaSynch</h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Sélecteur de boutique */}
          <div className="hidden md:flex items-center">
            <Store className="h-5 w-5 text-neutral-400 mr-2" />
            <div className="w-48">
              {isLoading ? (
                <div className="h-9 w-full rounded-md bg-neutral-100 animate-pulse"></div>
              ) : sites && sites.length > 0 ? (
                <Select value={selectedSiteId || ''} onValueChange={handleSiteChange}>
                  <SelectTrigger className="h-9 w-full border-neutral-200">
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2 text-neutral-400" />
                          <span>{site.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Button 
                  variant="outline" 
                  className="h-9 w-full text-sm"
                  onClick={() => setLocation('/sites')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 text-neutral-400" />
                  Ajouter un site
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
