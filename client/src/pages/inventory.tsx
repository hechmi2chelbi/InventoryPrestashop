import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { useSelectedSite } from "@/hooks/use-selected-site";
import { Site, Product } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SyncButton from "@/components/sites/sync-button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { selectedSiteId, selectedSite } = useSelectedSite();
  const { toast } = useToast();

  // Paramètres de filtrage et pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("all");
  const [condition, setCondition] = useState("all");
  const [productType, setProductType] = useState("all");
  const [isAttribute, setIsAttribute] = useState<boolean | undefined>(undefined);
  
  // Effect pour le debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: inventoryData, isLoading: productsLoading } = useQuery<InventoryResponse>({
    queryKey: [
      "/api/sites/:siteId/products", 
      selectedSiteId, 
      page, 
      limit, 
      debouncedSearch, 
      status, 
      condition, 
      productType, 
      isAttribute
    ],
    queryFn: () => {
      if (!selectedSiteId) return Promise.resolve({ products: [], total: 0, page: 1, limit, pages: 0 });
      
      // Construire l'URL avec les paramètres de filtrage
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("reference", debouncedSearch);
      if (status && status !== "all") params.append("status", status);
      if (condition && condition !== "all") params.append("condition", condition);
      if (productType && productType !== "all") params.append("productType", productType);
      if (isAttribute !== undefined) params.append("isAttribute", String(isAttribute));
      params.append("page", String(page));
      params.append("limit", String(limit));
      
      return fetch(`/api/sites/${selectedSiteId}/products?${params.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des produits");
          return res.json();
        })
        .catch(error => {
          toast({
            title: "Erreur de chargement",
            description: "Impossible de charger les produits. Veuillez réessayer.",
            variant: "destructive",
          });
          throw error;
        });
    },
    enabled: !!selectedSiteId,
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
              <h1 className="text-2xl font-semibold text-neutral-500">Inventaire</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <Card className="mb-6">
                <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <CardTitle>Gestion de l'inventaire</CardTitle>
                    <CardDescription>
                      Consultez et gérez les stocks de tous vos produits.
                    </CardDescription>
                  </div>
                  {selectedSiteId && (
                    <SyncButton 
                      siteId={Number(selectedSiteId)}
                      className="mt-4 sm:mt-0"
                      variant="secondary"
                    />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSiteId && (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <Input
                            placeholder="Rechercher par référence..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Statut du stock</p>
                            <Select value={status} onValueChange={setStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les statuts" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="in_stock">En stock</SelectItem>
                                <SelectItem value="out_of_stock">Rupture</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">État du produit</p>
                            <Select value={condition} onValueChange={setCondition}>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les états" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les états</SelectItem>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="inactive">Non actif</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Type de produit</p>
                            <Select value={productType} onValueChange={setProductType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                <SelectItem value="simple">Produit simple</SelectItem>
                                <SelectItem value="attribute">Produit avec attributs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Afficher</p>
                            <Select 
                              value={isAttribute === undefined ? "all" : isAttribute ? "attributes" : "products"} 
                              onValueChange={(value) => {
                                if (value === "all") setIsAttribute(undefined);
                                else if (value === "attributes") setIsAttribute(true);
                                else setIsAttribute(false);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tous" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tous les éléments</SelectItem>
                                <SelectItem value="products">Produits principaux</SelectItem>
                                <SelectItem value="attributes">Attributs uniquement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Éléments par page</p>
                            <Select 
                              value={String(limit)}
                              onValueChange={(value) => setLimit(Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="20" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {selectedSiteId ? (
                productsLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : inventoryData && inventoryData.products.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom du produit</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Dernier inventaire</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryData.products.map(product => (
                            <TableRow 
                              key={product.id}
                              className={product.is_attribute ? "bg-blue-50/30" : ""} 
                            >
                              <TableCell className="font-medium">
                                {product.name}
                                {product.is_attribute && product.parent_id && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Attribut du produit #{product.parent_id}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{product.reference || "N/A"}</TableCell>
                              <TableCell>
                                {product.is_attribute ? (
                                  <Badge variant="outline" className="bg-blue-50 border-blue-500 text-blue-500">Attribut</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-50 border-slate-500 text-slate-500">
                                    {product.product_type || "Standard"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{product.current_quantity}</TableCell>
                              <TableCell>{product.last_update ? new Date(product.last_update).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                {(product.current_quantity || 0) <= 0 ? (
                                  <Badge variant="destructive">Rupture</Badge>
                                ) : (product.current_quantity || 0) <= (product.min_quantity || 0) ? (
                                  <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-50">Stock bas</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50">En stock</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        {inventoryData.total} produits trouvés
                      </div>
                      {inventoryData.pages > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => page > 1 && setPage(prev => Math.max(prev - 1, 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(inventoryData.pages, 5) }, (_, i) => {
                              // Logic to display pagination with ellipsis for many pages
                              let pageNum;
                              if (inventoryData.pages <= 5) {
                                // Show all pages if 5 or fewer
                                pageNum = i + 1;
                              } else {
                                // Show pages around current page
                                if (page <= 3) {
                                  // At start of pagination
                                  if (i < 4) {
                                    pageNum = i + 1;
                                  } else {
                                    return (
                                      <PaginationItem key="ellipsis-end">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                } else if (page >= inventoryData.pages - 2) {
                                  // At end of pagination
                                  if (i === 0) {
                                    return (
                                      <PaginationItem key="ellipsis-start">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  } else {
                                    pageNum = inventoryData.pages - 4 + i;
                                  }
                                } else {
                                  // Middle of pagination
                                  if (i === 0) {
                                    return (
                                      <PaginationItem key="ellipsis-start">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  } else if (i === 4) {
                                    return (
                                      <PaginationItem key="ellipsis-end">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  } else {
                                    pageNum = page - 1 + (i - 1);
                                  }
                                }
                              }
                              
                              if (typeof pageNum === 'number') {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink 
                                      isActive={page === pageNum}
                                      onClick={() => setPage(pageNum)}
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => page < inventoryData.pages && setPage(prev => Math.min(prev + 1, inventoryData.pages))}
                                className={page === inventoryData.pages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Aucun produit</CardTitle>
                      <CardDescription>
                        Aucun produit n'a été trouvé avec les critères sélectionnés.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Sélectionnez une boutique</CardTitle>
                    <CardDescription>
                      Veuillez sélectionner une boutique pour voir l'inventaire des produits.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
