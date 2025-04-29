import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useSelectedSite } from "@/hooks/use-selected-site";
import { Site, Product, PriceHistory as PriceHistoryType } from "@shared/schema";

// Interface pour l'historique des prix complet depuis PrestaShop
interface PrestaShopPriceHistory {
  product: {
    id: number;
    name: string;
    reference: string;
    current_price: number;
    date_add: string;
    date_upd: string;
    id_local: number;
    site_id: number;
    site_name: string;
  };
  history: {
    current: {
      price: number;
      date: string;
    };
    specific_prices: Array<{
      price: number;
      original_price: number;
      reduction: number;
      reduction_type: string;
      from_quantity: number;
      from: string | null;
      to: string | null;
      date_added: string;
    }>;
    order_prices: Array<{
      price: number;
      date: string;
    }>;
    price_changes: Array<{
      old_price: number;
      new_price: number;
      change: number;
      percent_change: number;
      date: string;
      type: string;
    }>;
  };
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageLoader } from "@/components/ui/page-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PriceAnalytics from "@/components/price-history/price-analytics";
import PredictiveChart from "@/components/price-history/predictive-chart";
import CompetitorComparison from "@/components/price-history/competitor-comparison";

export default function PriceHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedSiteId, selectedSite } = useSelectedSite();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [searchReference, setSearchReference] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<Product[] | undefined>(undefined);
  const queryClient = useQueryClient();
  
  // Fetch products for the selected site
  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[], total: number }>({
    queryKey: ["/api/sites/:siteId/products", selectedSiteId],
    enabled: !!selectedSiteId,
  });
  
  // Extraire la liste des produits
  const products = productsData?.products;
  
  // Fetch price history for the selected product
  const { data: priceHistory, isLoading: historyLoading } = useQuery<PriceHistoryType[]>({
    queryKey: ["/api/products/:id/price-history", selectedProductId],
    enabled: !!selectedProductId,
  });
  
  // Fetch complete price history from PrestaShop
  const { data: prestaShopPriceHistory, isLoading: prestaShopHistoryLoading } = useQuery<PrestaShopPriceHistory>({
    queryKey: ["/api/products/:id/prestashop-price-history", selectedProductId],
    enabled: !!selectedProductId,
  });
  
  // Mutation pour rafraîchir l'historique des prix d'un produit
  const refreshSingleProductPriceHistory = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/products/${productId}/refresh-price-history`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate price history queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/products/:id/price-history", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/:id/prestashop-price-history", selectedProductId] });
    }
  });
  
  // Mutation pour synchroniser l'historique des prix de tous les produits d'un site
  const syncAllPriceHistory = useMutation({
    mutationFn: async ({ siteId }: { siteId: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sites/${siteId}/sync-all-price-history`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate price history queries
      if (selectedProductId) {
        queryClient.invalidateQueries({ queryKey: ["/api/products/:id/price-history", selectedProductId] });
        queryClient.invalidateQueries({ queryKey: ["/api/products/:id/prestashop-price-history", selectedProductId] });
      }
    }
  });
  
  // Effet pour filtrer les produits basés sur la référence recherchée
  useEffect(() => {
    if (!products) return;
    
    if (searchReference.trim() === '') {
      setFilteredProducts(undefined); // Afficher tous les produits quand la recherche est vide
      return;
    }
    
    const normalizedSearch = searchReference.trim().toLowerCase();
    const filtered = products.filter(product => 
      product.reference?.toLowerCase().includes(normalizedSearch) ||
      product.name.toLowerCase().includes(normalizedSearch)
    );
    
    setFilteredProducts(filtered);
  }, [products, searchReference]);
  
  // Produits à afficher - soit tous les produits, soit les produits filtrés
  const displayProducts = filteredProducts || products;
  
  // Find the selected product from the products list
  const selectedProduct = selectedProductId && products
    ? products.find(p => p.id.toString() === selectedProductId)
    : undefined;
  
  // Format data for the chart, handling null dates safely
  const chartData = useMemo(() => {
    if (!priceHistory) return [];
    
    return priceHistory
      .map(item => {
        const dateObj = item.date ? new Date(item.date) : new Date();
        return {
          date: format(dateObj, 'dd/MM/yyyy'),
          prix: parseFloat(item.price)
        };
      })
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
      });
  }, [priceHistory]);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-neutral-500">Historique des prix</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Analyse des prix</CardTitle>
                    <CardDescription>
                      Suivez l'évolution des prix de vos produits dans le temps.
                    </CardDescription>
                  </div>
                  {selectedSiteId && (
                    <button
                      onClick={() => syncAllPriceHistory.mutate({ siteId: selectedSiteId })}
                      disabled={syncAllPriceHistory.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncAllPriceHistory.isPending ? 'Synchronisation...' : 'Synchroniser tous les prix'}
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSiteId && !productsLoading && products && products.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-500 mb-1">
                          Rechercher par référence ou nom
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <Search className="h-4 w-4 text-neutral-400" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Entrez une référence ou un nom de produit"
                            value={searchReference}
                            onChange={(e) => setSearchReference(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {filteredProducts && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {filteredProducts.length} résultat(s) trouvé(s)
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-500 mb-1">
                        Sélectionnez un produit
                      </label>
                      <div className="flex gap-2">
                        {selectedSiteId && productsLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <>
                            <div className="flex-1">
                              <Select 
                                value={selectedProductId} 
                                onValueChange={setSelectedProductId}
                                disabled={!selectedSiteId || !displayProducts || displayProducts.length === 0}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Choisir un produit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {displayProducts?.map(product => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                      {product.name} {product.reference ? `(${product.reference})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedProductId && (
                              <button
                                onClick={() => refreshSingleProductPriceHistory.mutate({ productId: selectedProductId })}
                                disabled={refreshSingleProductPriceHistory.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {refreshSingleProductPriceHistory.isPending ? 'Rafraîchissement...' : 'Rafraîchir'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {!selectedSiteId && (
                        <p className="text-sm text-amber-600 mt-2">
                          Veuillez d'abord sélectionner une boutique dans l'en-tête.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {selectedProductId ? (
                historyLoading ? (
                  <Skeleton className="h-96 w-full" />
                ) : priceHistory ? (
                  <div className="space-y-6">
                    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">Basique</TabsTrigger>
                        <TabsTrigger value="prestashop">PrestaShop</TabsTrigger>
                        <TabsTrigger value="analytics">Analyse</TabsTrigger>
                        <TabsTrigger value="prediction">Prédiction</TabsTrigger>
                        <TabsTrigger value="competitors">Concurrents</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="mt-4 space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Évolution des prix</CardTitle>
                            <CardDescription>
                              Graphique d'évolution des prix au fil du temps
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {priceHistory.length > 0 ? (
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fontSize: 12 }}
                                      padding={{ left: 20, right: 20 }}
                                    />
                                    <YAxis
                                      width={80}
                                      tickFormatter={(value) => `${value} €`}
                                    />
                                    <Tooltip
                                      formatter={(value) => [`${value} €`, 'Prix']}
                                      labelFormatter={(date) => `Date: ${date}`}
                                    />
                                    <Legend />
                                    <Line
                                      type="monotone"
                                      dataKey="prix"
                                      stroke="#0078D4"
                                      strokeWidth={2}
                                      dot={{ r: 4 }}
                                      activeDot={{ r: 6 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="bg-amber-50 rounded-full p-4 mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique de prix</h3>
                                <p className="text-gray-500 mb-6 max-w-md">
                                  Aucun historique de prix n'a été trouvé pour ce produit. 
                                  Cliquez sur le bouton "Rafraîchir" pour récupérer les dernières données de prix depuis PrestaShop.
                                </p>
                                <button
                                  onClick={() => refreshSingleProductPriceHistory.mutate({ productId: selectedProductId })}
                                  disabled={refreshSingleProductPriceHistory.isPending}
                                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {refreshSingleProductPriceHistory.isPending ? 'Rafraîchissement...' : 'Synchroniser l\'historique des prix'}
                                </button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {priceHistory.length > 0 ? (
                          <Card>
                            <CardHeader>
                              <CardTitle>Historique détaillé</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Prix</TableHead>
                                    <TableHead>Variation</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {priceHistory.map((item, index) => {
                                    const prevPrice = index < priceHistory.length - 1 
                                      ? parseFloat(priceHistory[index + 1].price) 
                                      : null;
                                    const currentPrice = parseFloat(item.price);
                                    const change = prevPrice !== null 
                                      ? ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2) 
                                      : null;
                                    
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell>
                                          {item.date ? format(new Date(item.date), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">{currentPrice.toFixed(2)} €</TableCell>
                                        <TableCell>
                                          {change !== null ? (
                                            <span className={`${Number(change) > 0 
                                              ? 'text-green-600' 
                                              : Number(change) < 0 
                                                ? 'text-red-600' 
                                                : 'text-neutral-500'}`}>
                                              {Number(change) > 0 ? '+' : ''}{change}%
                                            </span>
                                          ) : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ) : null}
                      </TabsContent>
                      
                      <TabsContent value="prestashop" className="mt-4 space-y-6">
                        {prestaShopHistoryLoading ? (
                          <Skeleton className="h-96 w-full" />
                        ) : prestaShopPriceHistory && Object.keys(prestaShopPriceHistory).length > 0 ? (
                          <>
                            <Card>
                              <CardHeader>
                                <CardTitle>Historique complet des prix depuis PrestaShop</CardTitle>
                                <CardDescription>
                                  Informations détaillées sur l'évolution des prix récupérées directement depuis PrestaShop
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h3 className="text-sm font-medium text-neutral-500">Informations produit</h3>
                                    <div className="mt-2 text-sm">
                                      <p><span className="font-medium">Nom:</span> {prestaShopPriceHistory.product.name}</p>
                                      <p><span className="font-medium">Référence:</span> {prestaShopPriceHistory.product.reference}</p>
                                      <p><span className="font-medium">Prix actuel:</span> {prestaShopPriceHistory.product.current_price?.toFixed(2) || 'N/A'} €</p>
                                      {prestaShopPriceHistory.product.date_add && (
                                        <p><span className="font-medium">Date d'ajout:</span> {format(new Date(prestaShopPriceHistory.product.date_add), 'dd MMMM yyyy', { locale: fr })}</p>
                                      )}
                                      {prestaShopPriceHistory.product.date_upd && (
                                        <p><span className="font-medium">Dernière mise à jour:</span> {format(new Date(prestaShopPriceHistory.product.date_upd), 'dd MMMM yyyy', { locale: fr })}</p>
                                      )}
                                    </div>
                                  </div>
                                  {prestaShopPriceHistory.history?.current && (
                                    <div>
                                      <h3 className="text-sm font-medium text-neutral-500">Prix actuel</h3>
                                      <div className="mt-2 text-sm">
                                        <p><span className="font-medium">Prix:</span> {prestaShopPriceHistory.history.current.price?.toFixed(2) || 'N/A'} €</p>
                                        {prestaShopPriceHistory.history.current.date && (
                                          <p><span className="font-medium">Date:</span> {format(new Date(prestaShopPriceHistory.history.current.date), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Graphique d'évolution des prix */}
                                {prestaShopPriceHistory.history.price_changes && prestaShopPriceHistory.history.price_changes.length > 0 && (
                                  <div className="mt-6">
                                    <h3 className="text-sm font-medium text-neutral-500 mb-4">Graphique d'évolution des prix</h3>
                                    <div className="h-80">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                          data={prestaShopPriceHistory.history.price_changes
                                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                            .map(change => ({
                                              date: format(new Date(change.date), 'dd/MM/yyyy'),
                                              prix: change.new_price,
                                              type: change.type
                                            }))}
                                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                        >
                                          <CartesianGrid strokeDasharray="3 3" />
                                          <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 12 }}
                                            padding={{ left: 20, right: 20 }}
                                          />
                                          <YAxis
                                            width={80}
                                            tickFormatter={(value) => `${value} €`}
                                          />
                                          <Tooltip
                                            formatter={(value) => [`${value} €`, 'Prix']}
                                            labelFormatter={(date) => `Date: ${date}`}
                                          />
                                          <Legend />
                                          <Line
                                            type="monotone"
                                            dataKey="prix"
                                            stroke="#0078D4"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                          />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            
                            {prestaShopPriceHistory.history.price_changes && prestaShopPriceHistory.history.price_changes.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Historique des variations de prix</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Ancien prix</TableHead>
                                        <TableHead>Nouveau prix</TableHead>
                                        <TableHead>Variation</TableHead>
                                        <TableHead>Type</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prestaShopPriceHistory.history.price_changes.map((change, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
                                            {format(new Date(change.date), 'dd MMMM yyyy', { locale: fr })}
                                          </TableCell>
                                          <TableCell>{change.old_price.toFixed(2)} €</TableCell>
                                          <TableCell>{change.new_price.toFixed(2)} €</TableCell>
                                          <TableCell>
                                            <span className={`${change.percent_change > 0 
                                              ? 'text-green-600' 
                                              : change.percent_change < 0 
                                                ? 'text-red-600' 
                                                : 'text-neutral-500'}`}>
                                              {change.percent_change > 0 ? '+' : ''}{change.percent_change.toFixed(2)}%
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            {change.type === 'order' ? 'Commande' : 
                                             change.type === 'specific' ? 'Prix spécifique' : 
                                             change.type === 'current' ? 'Prix actuel' : change.type}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            )}
                            
                            {prestaShopPriceHistory.history.specific_prices && prestaShopPriceHistory.history.specific_prices.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Prix spécifiques</CardTitle>
                                  <CardDescription>
                                    Promotions et prix spécifiques configurés dans PrestaShop
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date d'ajout</TableHead>
                                        <TableHead>Prix original</TableHead>
                                        <TableHead>Prix final</TableHead>
                                        <TableHead>Réduction</TableHead>
                                        <TableHead>Quantité min.</TableHead>
                                        <TableHead>Période</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prestaShopPriceHistory.history.specific_prices.map((price, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
                                            {format(new Date(price.date_added), 'dd MMMM yyyy', { locale: fr })}
                                          </TableCell>
                                          <TableCell>{price.original_price.toFixed(2)} €</TableCell>
                                          <TableCell>{price.price.toFixed(2)} €</TableCell>
                                          <TableCell>
                                            {price.reduction_type === 'percentage' 
                                              ? `${(price.reduction * 100).toFixed(2)}%` 
                                              : `${price.reduction.toFixed(2)} €`}
                                          </TableCell>
                                          <TableCell>{price.from_quantity}</TableCell>
                                          <TableCell>
                                            {price.from && price.to 
                                              ? `${format(new Date(price.from), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(price.to), 'dd/MM/yyyy', { locale: fr })}` 
                                              : 'Illimitée'}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            )}
                            
                            {prestaShopPriceHistory.history.order_prices && prestaShopPriceHistory.history.order_prices.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Historique des prix de commandes</CardTitle>
                                  <CardDescription>
                                    Prix auxquels ce produit a été vendu
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Prix de vente</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prestaShopPriceHistory.history.order_prices.map((order, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
                                            {format(new Date(order.date), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                          </TableCell>
                                          <TableCell>{order.price.toFixed(2)} €</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="bg-amber-50 rounded-full p-4 mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique de prix disponible</h3>
                            <p className="text-gray-500 mb-6 max-w-md">
                              Aucun historique de prix n'a été trouvé pour ce produit dans PrestaShop. 
                              Cliquez sur le bouton "Synchroniser" pour récupérer les dernières données de prix directement depuis PrestaShop.
                            </p>
                            <Button 
                              onClick={() => refreshSingleProductPriceHistory.mutate({ productId: selectedProductId })}
                              disabled={refreshSingleProductPriceHistory.isPending}
                              className="px-4 py-2 text-sm font-medium"
                            >
                              {refreshSingleProductPriceHistory.isPending ? 'Synchronisation...' : 'Synchroniser depuis PrestaShop'}
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="analytics" className="mt-4">
                        {priceHistory && <PriceAnalytics priceHistory={priceHistory} />}
                      </TabsContent>
                      
                      <TabsContent value="prediction" className="mt-4">
                        {priceHistory && <PredictiveChart priceHistory={priceHistory} />}
                      </TabsContent>
                      
                      <TabsContent value="competitors" className="mt-4">
                        {priceHistory && selectedProduct && (
                          <CompetitorComparison 
                            product={selectedProduct} 
                            currentPrice={parseFloat(priceHistory[0].price)} 
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="bg-amber-50 rounded-full p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique de prix</h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      Aucun historique de prix n'a été trouvé dans notre base de données. 
                      Cliquez sur le bouton "Synchroniser" pour récupérer les dernières données depuis PrestaShop.
                    </p>
                    <Button 
                      onClick={() => refreshSingleProductPriceHistory.mutate({ productId: selectedProductId })}
                      disabled={refreshSingleProductPriceHistory.isPending}
                      className="px-4 py-2 text-sm font-medium"
                    >
                      {refreshSingleProductPriceHistory.isPending ? 'Synchronisation...' : 'Synchroniser l\'historique des prix'}
                    </Button>
                  </div>
                )
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Sélectionnez un produit</CardTitle>
                    <CardDescription>
                      Veuillez sélectionner une boutique et un produit pour voir l'historique des prix.
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
