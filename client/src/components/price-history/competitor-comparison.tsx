import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Product, PriceHistory } from "@shared/schema";
import { PlusCircle, Trash2 } from "lucide-react";

interface CompetitorComparisonProps {
  product?: Product;
  currentPrice: number;
}

interface CompetitorPrice {
  id: number;
  name: string;
  price: number;
  url: string;
}

export default function CompetitorComparison({ product, currentPrice }: CompetitorComparisonProps) {
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddCompetitor = () => {
    if (!name || !price) return;
    
    const newCompetitor: CompetitorPrice = {
      id: Date.now(),
      name,
      price: parseFloat(price),
      url
    };
    
    setCompetitors([...competitors, newCompetitor]);
    setName("");
    setPrice("");
    setUrl("");
    setIsAdding(false);
  };
  
  const handleRemoveCompetitor = (id: number) => {
    setCompetitors(competitors.filter(comp => comp.id !== id));
  };
  
  // Trier les concurrents par prix
  const sortedCompetitors = [...competitors].sort((a, b) => a.price - b.price);
  
  // Déterminer la position de votre produit parmi les concurrents
  let position = 1;
  for (const comp of sortedCompetitors) {
    if (currentPrice > comp.price) {
      position++;
    }
  }
  
  const competitorCount = competitors.length;
  const totalPosition = competitorCount + 1; // +1 pour inclure votre produit
  
  // Calculer les statistiques de comparaison
  const lowestPrice = competitorCount > 0 
    ? Math.min(...sortedCompetitors.map(c => c.price), currentPrice)
    : currentPrice;
    
  const highestPrice = competitorCount > 0 
    ? Math.max(...sortedCompetitors.map(c => c.price), currentPrice)
    : currentPrice;
    
  const averagePrice = competitorCount > 0
    ? ([...sortedCompetitors.map(c => c.price), currentPrice].reduce((sum, price) => sum + price, 0) / totalPosition)
    : currentPrice;
    
  const priceDifference = competitorCount > 0
    ? (currentPrice - averagePrice) / averagePrice * 100
    : 0;

  // Comparer votre prix avec la concurrence
  const getPricePosition = () => {
    if (competitorCount === 0) return { text: "Aucun concurrent ajouté", class: "text-neutral-500" };
    
    const percentile = (position / totalPosition) * 100;
    
    if (percentile <= 20) return { text: "Parmi les moins chers", class: "text-green-600" };
    if (percentile <= 40) return { text: "Prix compétitif", class: "text-green-500" };
    if (percentile <= 60) return { text: "Dans la moyenne", class: "text-neutral-500" };
    if (percentile <= 80) return { text: "Plus cher que la moyenne", class: "text-amber-500" };
    return { text: "Parmi les plus chers", class: "text-red-500" };
  };
  
  const positionInfo = getPricePosition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison concurrentielle</CardTitle>
        <CardDescription>
          Comparez votre prix avec celui des concurrents pour positionner votre offre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {competitorCount > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-sm text-neutral-500 mb-1">Votre position</div>
                  <div className="text-xl font-semibold">{position} sur {totalPosition}</div>
                  <div className={`text-sm mt-1 ${positionInfo.class}`}>{positionInfo.text}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-sm text-neutral-500 mb-1">Prix le plus bas</div>
                  <div className="text-xl font-semibold">{lowestPrice.toFixed(2)} €</div>
                  <div className="text-sm mt-1 text-neutral-400">
                    {lowestPrice === currentPrice ? "C'est vous !" : "Concurrent"}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-sm text-neutral-500 mb-1">Prix moyen</div>
                  <div className="text-xl font-semibold">{averagePrice.toFixed(2)} €</div>
                  <div className={`text-sm mt-1 ${priceDifference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(1)}% vs vous
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-sm text-neutral-500 mb-1">Prix le plus élevé</div>
                  <div className="text-xl font-semibold">{highestPrice.toFixed(2)} €</div>
                  <div className="text-sm mt-1 text-neutral-400">
                    {highestPrice === currentPrice ? "C'est vous !" : "Concurrent"}
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Différence</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-primary-light/10 font-medium">
                    <TableCell>Votre produit {product?.name && `(${product.name})`}</TableCell>
                    <TableCell>{currentPrice.toFixed(2)} €</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  
                  {sortedCompetitors.map(competitor => {
                    const diff = ((competitor.price - currentPrice) / currentPrice) * 100;
                    
                    return (
                      <TableRow key={competitor.id}>
                        <TableCell>
                          {competitor.url ? (
                            <a 
                              href={competitor.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {competitor.name}
                            </a>
                          ) : (
                            competitor.name
                          )}
                        </TableCell>
                        <TableCell>{competitor.price.toFixed(2)} €</TableCell>
                        <TableCell>
                          <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-neutral-500'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveCompetitor(competitor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
          
          {isAdding ? (
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Ajouter un concurrent</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">
                    Nom du concurrent*
                  </label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="ex: Boutique XYZ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">
                    Prix*
                  </label>
                  <Input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="ex: 59.99"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">
                    URL (optionnel)
                  </label>
                  <Input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="ex: https://www.boutique-xyz.com/produit"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setName("");
                    setPrice("");
                    setUrl("");
                  }}
                >
                  Annuler
                </Button>
                <LoadingButton
                  onClick={handleAddCompetitor}
                  disabled={!name || !price}
                >
                  Ajouter
                </LoadingButton>
              </div>
            </div>
          ) : (
            <Button 
              variant={competitorCount === 0 ? "default" : "outline"} 
              className="w-full" 
              onClick={() => setIsAdding(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {competitorCount === 0 
                ? "Ajouter votre premier concurrent" 
                : "Ajouter un autre concurrent"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}