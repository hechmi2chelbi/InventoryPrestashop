import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Lock, Copy, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Site } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Liste des versions PrestaShop disponibles
const PRESTASHOP_VERSIONS = [
  { value: "1.7.8.9", label: "PrestaShop 1.7.8.9" },
  { value: "1.7.8.8", label: "PrestaShop 1.7.8.8" },
  { value: "1.7.8.7", label: "PrestaShop 1.7.8.7" },
  { value: "1.7.8.6", label: "PrestaShop 1.7.8.6" },
  { value: "1.7.8.5", label: "PrestaShop 1.7.8.5" },
  { value: "1.7.8.0", label: "PrestaShop 1.7.8.0" },
  { value: "1.7.7.0", label: "PrestaShop 1.7.7.0" },
  { value: "1.6.1.24", label: "PrestaShop 1.6.1.24" },
  { value: "8.0.4", label: "PrestaShop 8.0.4" },
  { value: "8.0.3", label: "PrestaShop 8.0.3" },
  { value: "8.0.2", label: "PrestaShop 8.0.2" },
  { value: "8.0.1", label: "PrestaShop 8.0.1" },
  { value: "8.0.0", label: "PrestaShop 8.0.0" },
];

interface SimpleAddSiteFormProps {
  editingSite?: Site;
  onSuccess?: () => void;
}

export default function SimpleAddSiteForm({ editingSite, onSuccess }: SimpleAddSiteFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [httpAuthEnabled, setHttpAuthEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const isEditing = !!editingSite;
  
  // Fonction pour générer une clé API aléatoire
  const generateApiKey = () => {
    const randomString = () => Math.random().toString(36).substring(2, 15);
    const uuid = `${randomString()}-${randomString()}-${randomString()}-${randomString()}`;
    return uuid;
  };
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    api_key: generateApiKey(), // Générer une clé API par défaut
    version: "8.0.4", // Valeur par défaut
    http_auth_enabled: false,
    http_auth_username: "",
    http_auth_password: ""
  });
  
  // Initialiser le formulaire avec les données du site en cours d'édition
  useEffect(() => {
    if (editingSite) {
      setFormData({
        name: editingSite.name || "",
        url: editingSite.url || "",
        api_key: editingSite.api_key || "",
        version: editingSite.version || "8.0.4",
        http_auth_enabled: editingSite.http_auth_enabled || false,
        http_auth_username: editingSite.http_auth_username || "",
        http_auth_password: editingSite.http_auth_password || ""
      });
      setHttpAuthEnabled(editingSite.http_auth_enabled || false);
    }
  }, [editingSite]);
  
  // Gestionnaire de changement de champ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification des champs requis
    if (!formData.name || !formData.url || !formData.api_key || !formData.version) {
      toast({
        title: "Champs requis",
        description: "Tous les champs marqués d'un astérisque sont obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    // Ajouter l'authentification HTTP si activée
    const dataToSend = {
      ...formData,
      http_auth_enabled: httpAuthEnabled,
      http_auth_username: httpAuthEnabled ? formData.http_auth_username : "",
      http_auth_password: httpAuthEnabled ? formData.http_auth_password : ""
    };
    
    setIsLoading(true);
    
    try {
      console.log("Envoi des données:", JSON.stringify(dataToSend));
      
      // Appel à l'API avec fetch pour plus de contrôle
      const url = isEditing 
        ? `/api/sites/${editingSite.id}` 
        : "/api/sites";
      
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend),
        credentials: "include"
      });
      
      const responseText = await response.text();
      console.log("Réponse:", response.status, responseText);
      
      if (!response.ok) {
        let errorMessage = isEditing 
          ? "Erreur lors de la modification du site" 
          : "Erreur lors de l'ajout du site";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Si ce n'est pas du JSON valide, utiliser le texte brut
          if (responseText) errorMessage = responseText;
        }
        throw new Error(errorMessage);
      }
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: isEditing ? "Site modifié" : "Site ajouté",
        description: isEditing 
          ? "Le site a été modifié avec succès" 
          : "Le site a été ajouté avec succès"
      });
      
      // Réinitialiser le formulaire si ce n'est pas une édition
      if (!isEditing) {
        setFormData({
          name: "",
          url: "",
          api_key: "",
          version: "8.0.4",
          http_auth_enabled: false,
          http_auth_username: "",
          http_auth_password: ""
        });
        setHttpAuthEnabled(false);
      }
      
      // Appeler le callback de succès s'il est fourni
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-none border-0">
      <CardHeader className="px-0 pt-0">
        <CardTitle>{isEditing ? "Modifier le site" : "Ajouter un site PrestaShop"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Modifiez les informations de votre boutique PrestaShop" 
            : "Ajoutez les informations de votre boutique PrestaShop pour commencer le suivi"}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la boutique *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ma Boutique PrestaShop"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL de la boutique *</Label>
              <Input
                id="url"
                name="url"
                placeholder="https://ma-boutique.com"
                value={formData.url}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version PrestaShop *</Label>
              <select
                id="version"
                name="version"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.version}
                onChange={handleChange}
                required
              >
                {PRESTASHOP_VERSIONS.map(version => (
                  <option key={version.value} value={version.value}>
                    {version.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_key">Clé API *</Label>
              <div className="flex">
                <Input
                  id="api_key"
                  name="api_key"
                  placeholder="Clé API automatiquement générée"
                  value={formData.api_key}
                  onChange={handleChange}
                  className="rounded-r-none"
                  required
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="rounded-l-none rounded-r-none border-l-0 border-r-0"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formData.api_key);
                          toast({
                            title: "Clé API copiée",
                            description: "La clé API a été copiée dans le presse-papiers"
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copier la clé API</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="rounded-l-none"
                        type="button"
                        onClick={() => {
                          const apiKey = generateApiKey();
                          setFormData(prev => ({ ...prev, api_key: apiKey }));
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Générer une nouvelle clé API</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">Cette clé permettra d'identifier votre boutique PrestaShop. Vous devrez l'entrer dans la configuration du module.</p>
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-gray-50 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="http_auth_enabled"
                checked={httpAuthEnabled}
                onCheckedChange={(checked) => {
                  setHttpAuthEnabled(checked);
                  setFormData(prev => ({ ...prev, http_auth_enabled: checked }));
                }}
              />
              <Label htmlFor="http_auth_enabled" className="flex items-center cursor-pointer">
                <Lock className="h-4 w-4 mr-2 text-gray-600" />
                Authentification HTTP Basic
              </Label>
            </div>
            
            {httpAuthEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="http_auth_username">Nom d'utilisateur</Label>
                  <Input
                    id="http_auth_username"
                    name="http_auth_username"
                    placeholder="Nom d'utilisateur HTTP"
                    value={formData.http_auth_username}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="http_auth_password">Mot de passe</Label>
                  <Input
                    id="http_auth_password"
                    name="http_auth_password"
                    type="password"
                    placeholder="Mot de passe HTTP"
                    value={formData.http_auth_password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 border border-amber-200 space-y-2">
              <p className="font-medium">Instructions pour connecter votre boutique :</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Téléchargez le module PrestaSynch depuis la page Sites</li>
                <li>Installez-le sur votre boutique PrestaShop</li>
                <li>Dans la configuration du module, copiez-collez la clé API générée ci-dessus</li>
                <li>Enregistrez la configuration et cliquez sur "Synchroniser maintenant"</li>
              </ol>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="flex items-center gap-1 text-amber-800 border-amber-300 hover:bg-amber-100"
                  onClick={() => {
                    navigator.clipboard.writeText(formData.api_key);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <>Clé copiée !</>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> 
                      Copier la clé API
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end px-0">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Modification en cours..." : "Ajout en cours..."}
              </>
            ) : (
              isEditing ? "Modifier le site" : "Ajouter le site"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}