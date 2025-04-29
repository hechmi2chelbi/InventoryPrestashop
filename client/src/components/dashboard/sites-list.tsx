import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Site } from "@shared/schema";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Smartphone, Flower } from "lucide-react";

interface SitesListProps {
  sites?: Site[];
}

export default function SitesList({ sites }: SitesListProps) {
  if (!sites) {
    return <Skeleton className="h-96 w-full" />;
  }

  const getIconForSite = (siteName: string) => {
    if (siteName.toLowerCase().includes("mode") || siteName.toLowerCase().includes("boutique")) {
      return <ShoppingCart className="h-6 w-6 text-neutral-400" />;
    } else if (siteName.toLowerCase().includes("tech") || siteName.toLowerCase().includes("phone")) {
      return <Smartphone className="h-6 w-6 text-neutral-400" />;
    } else if (siteName.toLowerCase().includes("fleur") || siteName.toLowerCase().includes("flor")) {
      return <Flower className="h-6 w-6 text-neutral-400" />;
    } else {
      return <ShoppingCart className="h-6 w-6 text-neutral-400" />;
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg mb-6">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle>Mes sites PrestaShop</CardTitle>
        <CardDescription>Gérez vos connexions aux boutiques PrestaShop</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {sites.length > 0 ? (
            <Table>
              <TableHeader className="bg-neutral-100">
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-neutral-200">
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center">
                          {getIconForSite(site.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-500">{site.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{site.url}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{site.version || "N/A"}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      {site.status === "connected" ? (
                        <Badge className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Connecté
                        </Badge>
                      ) : (
                        <Badge className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Déconnecté
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <Link href={`/sites`} className="text-primary hover:text-primary-dark mr-3">
                        Gérer
                      </Link>
                      {site.status === "connected" ? (
                        <Link href={`/sites`} className="text-neutral-400 hover:text-neutral-500">
                          Déconnecter
                        </Link>
                      ) : (
                        <Link href={`/sites`} className="text-neutral-400 hover:text-neutral-500">
                          Reconnecter
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-neutral-500">Aucun site PrestaShop n'a été ajouté.</p>
              <Link href="/sites" className="text-primary hover:underline mt-2 inline-block">
                Ajouter votre premier site
              </Link>
            </div>
          )}
        </div>
      </CardContent>
      {sites.length > 0 && (
        <CardFooter className="px-6 py-4 border-t border-neutral-200">
          <Link href="/sites" className="text-sm font-medium text-primary hover:text-primary-dark">
            Voir tous les sites →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
