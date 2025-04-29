import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertSite } from "@shared/schema";
import { Loader2, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddSiteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

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

const siteSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  url: z.string().url("L'URL doit être valide").min(5, "L'URL doit comporter au moins 5 caractères"),
  api_key: z.string().min(5, "La clé API doit comporter au moins 5 caractères"),
  version: z.string().min(1, "Veuillez sélectionner une version"),
  http_auth_enabled: z.boolean().default(false),
  http_auth_username: z.string().default(""),
  http_auth_password: z.string().default(""),
}).refine((data) => {
  // Si l'authentification HTTP est activée, vérifions que les deux champs sont remplis
  if (data.http_auth_enabled) {
    return !!data.http_auth_username && !!data.http_auth_password;
  }
  return true;
}, {
  message: "Le nom d'utilisateur et le mot de passe HTTP sont requis lorsque l'authentification HTTP est activée",
  path: ["http_auth_username"], // Le message d'erreur s'affichera pour ce champ
});

type SiteFormValues = z.infer<typeof siteSchema>;

export default function AddSiteDialog({ open, setOpen }: AddSiteDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [httpAuthEnabled, setHttpAuthEnabled] = useState<boolean>(false);
  
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      url: "",
      api_key: "",
      version: "",
      http_auth_enabled: false,
      http_auth_username: "",
      http_auth_password: "",
    },
  });
  
  const addSiteMutation = useMutation({
    mutationFn: async (data: SiteFormValues) => {
      try {
        // Version simplifiée - envoi directement les données du formulaire
        // La transformation sera faite côté serveur
        console.log("Données du formulaire:", JSON.stringify(data));
        
        // Utiliser fetch directement au lieu de apiRequest pour plus de contrôle
        const res = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            url: data.url,
            api_key: data.api_key,
            version: data.version,
            status: "connected",
            http_auth_enabled: data.http_auth_enabled === true,
            http_auth_username: data.http_auth_username || "",
            http_auth_password: data.http_auth_password || "",
          }),
          credentials: "include"
        });
        
        console.log("Réponse status:", res.status);
        
        const responseText = await res.text();
        console.log("Réponse contenu:", responseText);
        
        if (!res.ok) {
          let errorMessage = `Erreur (${res.status})`;
          try {
            if (responseText) {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            }
          } catch (e) {
            errorMessage = `${errorMessage}: ${responseText.substring(0, 100)}`;
          }
          throw new Error(errorMessage);
        }
        
        if (!responseText) {
          return {}; // Réponse vide mais réussie
        }
        
        try {
          return JSON.parse(responseText);
        } catch (e) {
          console.error("Erreur parsing JSON:", e);
          return {}; // Retourner objet vide si parsing échoue
        }
      } catch (error) {
        console.error("Erreur complète:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Site ajouté",
        description: "Le site a été ajouté avec succès et est maintenant connecté.",
      });
      form.reset();
      setStep(1);
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout du site: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SiteFormValues) => {
    if (step === 1) {
      setStep(2);
    } else {
      addSiteMutation.mutate(data);
    }
  };
  
  const handleClose = () => {
    form.reset();
    setStep(1);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Ajouter un site PrestaShop" : "Configuration de la connexion"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 
                ? "Entrez les informations de base de votre boutique PrestaShop" 
                : "Configurer la connexion avec votre boutique PrestaShop"}
            </DialogDescription>
          </DialogHeader>
          
          {step === 1 ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de la boutique</Label>
                <Input
                  id="name"
                  placeholder="Ma Boutique PrestaShop"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL de la boutique</Label>
                <Input
                  id="url"
                  placeholder="https://ma-boutique.com"
                  {...form.register("url")}
                />
                {form.formState.errors.url && (
                  <p className="text-sm text-red-500">{form.formState.errors.url.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version PrestaShop</Label>
                <select
                  id="version"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("version")}
                >
                  <option value="">Sélectionnez une version</option>
                  {PRESTASHOP_VERSIONS.map((version) => (
                    <option key={version.value} value={version.value}>
                      {version.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.version && (
                  <p className="text-sm text-red-500">{form.formState.errors.version.message}</p>
                )}
              </div>
              
              <div className="border rounded-md p-4 bg-gray-50">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="http_auth_enabled"
                    checked={httpAuthEnabled}
                    onCheckedChange={(checked) => {
                      setHttpAuthEnabled(checked);
                      form.setValue("http_auth_enabled", checked);
                    }}
                  />
                  <Label htmlFor="http_auth_enabled" className="flex items-center cursor-pointer">
                    <Lock className="h-4 w-4 mr-2 text-gray-600" />
                    Authentification HTTP Basic
                  </Label>
                </div>
                
                {httpAuthEnabled && (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="http_auth_username">Nom d'utilisateur</Label>
                      <Input
                        id="http_auth_username"
                        placeholder="Nom d'utilisateur HTTP"
                        {...form.register("http_auth_username")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="http_auth_password">Mot de passe</Label>
                      <Input
                        id="http_auth_password"
                        type="password"
                        placeholder="Mot de passe HTTP"
                        {...form.register("http_auth_password")}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="api_key">Clé API</Label>
                <Input
                  id="api_key"
                  placeholder="Entrez la clé API générée par le module"
                  {...form.register("api_key")}
                />
                {form.formState.errors.api_key && (
                  <p className="text-sm text-red-500">{form.formState.errors.api_key.message}</p>
                )}
              </div>
              <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800 border border-amber-200">
                <p>Assurez-vous d'avoir installé le module PrestaSynch sur votre boutique et d'avoir généré une clé API.</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            {step === 2 && (
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={addSiteMutation.isPending}
            >
              {addSiteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : step === 1 ? (
                "Continuer"
              ) : (
                "Ajouter la boutique"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
