import { PriceHistory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";

interface PriceAnalyticsProps {
  priceHistory: PriceHistory[];
}

export default function PriceAnalytics({ priceHistory }: PriceAnalyticsProps) {
  if (!priceHistory || priceHistory.length < 2) {
    return null;
  }

  const sortedHistory = [...priceHistory].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date();
    const dateB = b.date ? new Date(b.date) : new Date();
    return dateA.getTime() - dateB.getTime();
  });
  
  // Calculer les statistiques clés
  const prices = sortedHistory.map(item => parseFloat(item.price));
  const currentPrice = prices[prices.length - 1];
  const initialPrice = prices[0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Calcul de la volatilité (écart-type)
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);
  
  // Déterminer la tendance des 30 derniers jours
  const recentHistory = sortedHistory.slice(-30);
  const olderRecentPrice = recentHistory.length > 1 ? parseFloat(recentHistory[0].price) : currentPrice;
  const recentTrend = ((currentPrice - olderRecentPrice) / olderRecentPrice) * 100;
  
  // Calcul du total de changements
  let increases = 0;
  let decreases = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) increases++;
    else if (prices[i] < prices[i - 1]) decreases++;
  }
  
  const totalChanges = increases + decreases;
  const increasePercent = totalChanges > 0 ? (increases / totalChanges) * 100 : 0;
  const decreasePercent = totalChanges > 0 ? (decreases / totalChanges) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse de prix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-neutral-500 mb-1">Prix actuel</div>
            <div className="text-2xl font-semibold">{currentPrice.toFixed(2)} €</div>
            <div className={`text-sm mt-1 flex items-center ${currentPrice > initialPrice ? 'text-green-600' : 'text-red-600'}`}>
              {currentPrice > initialPrice ? (
                <>
                  <ArrowUp className="w-4 h-4 mr-1" />
                  +{((currentPrice - initialPrice) / initialPrice * 100).toFixed(1)}% 
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 mr-1" />
                  {((currentPrice - initialPrice) / initialPrice * 100).toFixed(1)}%
                </>
              )}
              <span className="text-neutral-400 ml-1">depuis le début</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-neutral-500 mb-1">Tendance récente</div>
            <div className={`text-2xl font-semibold ${recentTrend > 0 ? 'text-green-600' : recentTrend < 0 ? 'text-red-600' : 'text-neutral-600'}`}>
              {recentTrend > 0 ? '+' : ''}{recentTrend.toFixed(1)}%
            </div>
            <div className="text-sm mt-1 flex items-center text-neutral-500">
              {recentTrend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
              )}
              <span className="text-neutral-400">30 derniers jours</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-neutral-500 mb-1">Min / Max</div>
            <div className="text-2xl font-semibold">{minPrice.toFixed(2)} - {maxPrice.toFixed(2)} €</div>
            <div className="text-sm mt-1 text-neutral-400 flex items-center">
              <span>Écart: {((maxPrice - minPrice) / minPrice * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-neutral-500 mb-1">Volatilité</div>
            <div className="text-2xl font-semibold">{volatility.toFixed(2)}</div>
            <div className="text-sm mt-1 text-neutral-400">
              {volatility < 1 ? 'Faible' : volatility < 3 ? 'Moyenne' : 'Élevée'}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-2">Résumé des changements</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Hausses de prix</span>
                <span className="text-sm font-medium text-green-600">{increases} fois</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${increasePercent}%` }}></div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">{increasePercent.toFixed(1)}% des changements</div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Baisses de prix</span>
                <span className="text-sm font-medium text-red-600">{decreases} fois</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${decreasePercent}%` }}></div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">{decreasePercent.toFixed(1)}% des changements</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}