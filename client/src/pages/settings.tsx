import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const saveSettings = () => {
    setIsLoading(true);
    // Simulate saving settings
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-neutral-500">Paramètres</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <Tabs defaultValue="account">
                <TabsList className="mb-6">
                  <TabsTrigger value="account">Compte</TabsTrigger>
                  <TabsTrigger value="theme">Personnalisation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations du compte</CardTitle>
                      <CardDescription>
                        Mettez à jour vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom complet</Label>
                          <Input id="name" defaultValue={user?.name} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Adresse email</Label>
                          <Input id="email" type="email" defaultValue={user?.email} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Nom d'utilisateur</Label>
                        <Input id="username" defaultValue={user?.username} disabled />
                        <p className="text-sm text-neutral-400">Le nom d'utilisateur ne peut pas être modifié</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={saveSettings} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer les modifications'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Changer le mot de passe</CardTitle>
                      <CardDescription>
                        Mettez à jour votre mot de passe
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Mot de passe actuel</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nouveau mot de passe</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" onClick={saveSettings} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mise à jour...
                          </>
                        ) : (
                          'Mettre à jour le mot de passe'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="theme">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personnalisation de l'interface</CardTitle>
                      <CardDescription>
                        Configurez l'apparence et les comportements de l'application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Mode sombre</p>
                          <p className="text-sm text-neutral-400">Activer le thème sombre pour l'interface</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notifications sonores</p>
                          <p className="text-sm text-neutral-400">Jouer un son lors des nouvelles alertes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Animations d'interface</p>
                          <p className="text-sm text-neutral-400">Activer les animations dans l'application</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Mode compact</p>
                          <p className="text-sm text-neutral-400">Réduire l'espacement pour afficher plus d'informations</p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={saveSettings} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer les préférences'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                

              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
