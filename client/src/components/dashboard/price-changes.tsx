import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PriceHistory, Product, Site } from "@shared/schema";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PriceChangesProps {
  changes?: (PriceHistory & { product: Product; site: Site; oldPrice?: string })[];
}

export default function PriceChanges({ changes }: PriceChangesProps) {
  if (!changes) {
    return <Skeleton className="h-80 w-full" />;
  }

  const formatDate = (date: Date) => {
    try {
      const now = new Date();
      const priceDate = new Date(date);
      
      // If today
      if (
        now.getDate() === priceDate.getDate() &&
        now.getMonth() === priceDate.getMonth() &&
        now.getFullYear() === priceDate.getFullYear()
      ) {
        return "Aujourd'hui";
      }

      // If yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        yesterday.getDate() === priceDate.getDate() &&
        yesterday.getMonth() === priceDate.getMonth() &&
        yesterday.getFullYear() === priceDate.getFullYear()
      ) {
        return "Hier";
      }

      // Otherwise: "Il y a X jours/heures/etc."
      return formatDistanceToNow(priceDate, { addSuffix: true, locale: fr });
    } catch (error) {
      return "Date inconnue";
    }
  };

  const isPriceIncrease = (newPrice: string, oldPrice?: string) => {
    if (!oldPrice) return false;
    return parseFloat(newPrice) > parseFloat(oldPrice);
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle>Changements de prix récents</CardTitle>
        <CardDescription>Dernières modifications de prix</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {changes.length > 0 ? (
          <ul className="divide-y divide-neutral-200">
            {changes.map((change) => (
              <li key={change.id} className="py-4 flex">
                {isPriceIncrease(change.price, change.oldPrice) ? (
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-sm font-medium text-neutral-500">{change.product.name}</div>
                  <div className="text-sm text-neutral-400">{change.site.name}</div>
                  <div className="mt-1 text-sm">
                    <span 
                      className={isPriceIncrease(change.price, change.oldPrice) 
                        ? "text-green-500" 
                        : "text-red-500"}
                    >
                      {parseFloat(change.price).toFixed(2)} €
                    </span>
                    {change.oldPrice && (
                      <span className="text-neutral-400 line-through ml-1">
                        {parseFloat(change.oldPrice).toFixed(2)} €
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center">
                  <span className="text-xs text-neutral-400">
                    {formatDate(new Date(change.date))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Aucun changement de prix récent.</p>
          </div>
        )}
      </CardContent>
      {changes.length > 0 && (
        <CardFooter className="px-6 py-4 border-t border-neutral-200">
          <Link href="/price-history" className="text-sm font-medium text-primary hover:text-primary-dark">
            Voir tout l'historique →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
