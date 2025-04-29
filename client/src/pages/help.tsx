import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, HelpCircle, Mail, MessageSquare } from "lucide-react";

export default function Help() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-neutral-500">Aide et Support</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <Tabs defaultValue="faq">
                <TabsList className="mb-6">
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                  <TabsTrigger value="documentation">Documentation</TabsTrigger>
                  <TabsTrigger value="contact">Nous contacter</TabsTrigger>
                </TabsList>
                
                <TabsContent value="faq">
                  <Card>
                    <CardHeader>
                      <CardTitle>Questions fréquemment posées</CardTitle>
                      <CardDescription>
                        Trouvez des réponses aux questions les plus courantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>Comment installer le module PrestaShop?</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-neutral-600">
                              Pour installer le module PrestaShop, suivez ces étapes:
                            </p>
                            <ol className="list-decimal list-inside mt-2 space-y-1 text-neutral-600">
                              <li>Téléchargez le module depuis votre tableau de bord PrestaSynch</li>
                              <li>Connectez-vous à votre back-office PrestaShop</li>
                              <li>Accédez à l'onglet "Modules" puis "Modules et services"</li>
                              <li>Cliquez sur "Ajouter un nouveau module" en haut à droite</li>
                              <li>Sélectionnez le fichier .zip du module téléchargé</li>
                              <li>Cliquez sur "Installer" puis "Configurer"</li>
                              <li>Entrez les informations de connexion générées par PrestaSynch</li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-2">
                          <AccordionTrigger>Comment synchroniser mes produits?</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-neutral-600">
                              La synchronisation des produits se fait automatiquement dès que le module est correctement installé et configuré. Par défaut, une synchronisation est effectuée toutes les 24 heures.
                            </p>
                            <p className="mt-2 text-neutral-600">
                              Vous pouvez également forcer une synchronisation à tout moment en cliquant sur le bouton "Synchroniser maintenant" depuis la page de gestion de votre site dans PrestaSynch.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-3">
                          <AccordionTrigger>Comment configurer les alertes de stock?</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-neutral-600">
                              Pour configurer les alertes de stock:
                            </p>
                            <ol className="list-decimal list-inside mt-2 space-y-1 text-neutral-600">
                              <li>Accédez à la section "Inventaire" dans le menu principal</li>
                              <li>Sélectionnez la boutique concernée</li>
                              <li>Pour chaque produit, vous pouvez définir un seuil minimum en cliquant sur "Modifier"</li>
                              <li>Lorsque le stock d'un produit atteint ou passe sous ce seuil, une alerte est générée</li>
                              <li>Vous pouvez personnaliser les notifications dans la section "Paramètres" {`>`} "Notifications"</li>
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-4">
                          <AccordionTrigger>Que faire en cas de problème de connexion?</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-neutral-600">
                              Si vous rencontrez des problèmes de connexion avec votre boutique PrestaShop:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-600">
                              <li>Vérifiez que votre API key est correctement configurée dans le module PrestaShop</li>
                              <li>Assurez-vous que les webservices sont activés dans votre configuration PrestaShop</li>
                              <li>Vérifiez que l'URL de votre boutique est correctement renseignée dans PrestaSynch</li>
                              <li>Si le problème persiste, essayez de réinstaller le module</li>
                              <li>N'hésitez pas à contacter notre support technique si vous ne parvenez pas à résoudre le problème</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-5">
                          <AccordionTrigger>Est-il possible de connecter plusieurs boutiques PrestaShop?</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-neutral-600">
                              Oui, PrestaSynch vous permet de connecter un nombre illimité de boutiques PrestaShop à votre compte. Chaque boutique dispose de son propre tableau de bord et de ses propres statistiques.
                            </p>
                            <p className="mt-2 text-neutral-600">
                              Pour ajouter une nouvelle boutique, il vous suffit de cliquer sur le bouton "Ajouter un site PrestaShop" depuis votre tableau de bord et de suivre les instructions d'installation du module.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="documentation">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documentation</CardTitle>
                      <CardDescription>
                        Guides et ressources pour vous aider à utiliser PrestaSynch
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">Guide d'installation</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-neutral-500 mb-4">
                              Guide complet pour installer et configurer le module PrestaShop.
                            </p>
                            <Button variant="outline" className="w-full">
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger le PDF
                            </Button>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">Manuel utilisateur</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-neutral-500 mb-4">
                              Documentation complète sur l'utilisation de la plateforme PrestaSynch.
                            </p>
                            <Button variant="outline" className="w-full">
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger le PDF
                            </Button>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">API Documentation</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-neutral-500 mb-4">
                              Guide technique pour les développeurs souhaitant intégrer nos API.
                            </p>
                            <Button variant="outline" className="w-full">
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger le PDF
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Tutoriels vidéo</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg">Installation du module</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="aspect-video bg-neutral-200 flex items-center justify-center rounded-md mb-2">
                                <HelpCircle className="h-12 w-12 text-neutral-400" />
                              </div>
                              <p className="text-sm text-neutral-500">
                                Ce tutoriel explique comment installer et configurer le module PrestaShop étape par étape.
                              </p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg">Configuration des alertes</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="aspect-video bg-neutral-200 flex items-center justify-center rounded-md mb-2">
                                <HelpCircle className="h-12 w-12 text-neutral-400" />
                              </div>
                              <p className="text-sm text-neutral-500">
                                Apprenez à configurer les alertes de stock et les notifications pour surveiller efficacement votre inventaire.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="contact">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contactez notre équipe</CardTitle>
                      <CardDescription>
                        Nous sommes là pour vous aider avec toute question ou problème
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">Email</h3>
                              <p className="text-neutral-500 mt-1">
                                Envoyez-nous un email à <a href="mailto:support@prestasynch.com" className="text-primary hover:underline">support@prestasynch.com</a>
                              </p>
                              <p className="text-neutral-500 mt-1">
                                Temps de réponse moyen: 24h
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium">Chat en direct</h3>
                              <p className="text-neutral-500 mt-1">
                                Discutez avec notre équipe de support en temps réel
                              </p>
                              <p className="text-neutral-500 mt-1">
                                Disponible du lundi au vendredi, de 9h à 18h
                              </p>
                              <Button className="mt-2" variant="outline">
                                Démarrer un chat
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Formulaire de contact</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="name">Nom</Label>
                                <Input id="name" placeholder="Votre nom" />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="Votre email" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="subject">Sujet</Label>
                              <Input id="subject" placeholder="Sujet de votre message" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="message">Message</Label>
                              <Textarea id="message" placeholder="Décrivez votre problème ou question" rows={5} />
                            </div>
                            <Button className="w-full">Envoyer le message</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
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
