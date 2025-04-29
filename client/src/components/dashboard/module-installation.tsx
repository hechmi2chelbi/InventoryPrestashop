import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import ModuleDownloadButton from "../sites/module-download-button";

export default function ModuleInstallation() {
  return (
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
                <Link href="/sites" className="text-sm text-primary hover:text-primary-dark">
                  Ajouter votre site PrestaShop →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
