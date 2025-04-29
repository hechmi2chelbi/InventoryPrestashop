import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Site } from "@shared/schema";

export default function ApiKeyManager() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Récupérer la clé API du site sélectionné (par défaut, le premier site)
  const { data: sitesData } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });
  
  const sites = sitesData || [];
  const firstSite = sites.length > 0 ? sites[0] : null;
  const apiKey = firstSite?.api_key || "Aucun site n'a été ajouté";
  
  // Fonction pour copier la clé API
  const copyApiKey = () => {
    if (!firstSite) {
      toast({
        title: "Aucun site disponible",
        description: "Veuillez d'abord ajouter un site pour obtenir une clé API",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Clé API copiée",
      description: "La clé API a été copiée dans le presse-papiers",
    });
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Clé API</CardTitle>
        <CardDescription>
          {firstSite 
            ? `Utilisez cette clé pour configurer le module sur ${firstSite.name}`
            : "Ajoutez un site pour obtenir une clé API"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex">
          <Input
            value={apiKey}
            readOnly
            className="rounded-r-none"
            disabled={!firstSite}
          />
          <Button
            variant="outline"
            className="rounded-l-none"
            onClick={copyApiKey}
            disabled={!firstSite}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </Button>
        </div>
        {firstSite && (
          <p className="text-xs text-muted-foreground mt-2">
            Cette clé est nécessaire pour configurer le module PrestaSynch sur votre boutique.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          {sites.length > 1 && (
            <p>
              Vous avez plusieurs sites. Pour voir les clés API de chaque site, consultez la section "Mes sites".
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}