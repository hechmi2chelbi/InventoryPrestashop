import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockAlert, Product, Site } from "@shared/schema";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, XCircle } from "lucide-react";

interface StockAlertsProps {
  alerts?: (StockAlert & { product: Product; site: Site })[];
}

export default function StockAlerts({ alerts }: StockAlertsProps) {
  if (!alerts) {
    return <Skeleton className="h-80 w-full" />;
  }

  const getAlertIcon = (alertType: string) => {
    if (alertType === "out_of_stock") {
      return (
        <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
      );
    } else {
      return (
        <div className="flex-shrink-0 bg-amber-100 rounded-md p-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
      );
    }
  };

  const getAlertMessage = (alert: StockAlert & { product: Product }) => {
    if (alert.alert_type === "out_of_stock") {
      return <div className="mt-1 text-sm text-red-500">Rupture de stock</div>;
    } else {
      return (
        <div className="mt-1 text-sm text-amber-500">
          Stock bas: {alert.product.current_quantity} restants
        </div>
      );
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle>Alertes de stock</CardTitle>
        <CardDescription>Produits nécessitant votre attention</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {alerts.length > 0 ? (
          <ul className="divide-y divide-neutral-200">
            {alerts.map((alert) => (
              <li key={alert.id} className="py-4 flex">
                {getAlertIcon(alert.alert_type)}
                <div className="ml-3">
                  <div className="text-sm font-medium text-neutral-500">{alert.product.name}</div>
                  <div className="text-sm text-neutral-400">{alert.site.name}</div>
                  {getAlertMessage(alert)}
                </div>
                <div className="ml-auto flex items-center">
                  <Link href="/inventory">
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Aucune alerte de stock actuellement.</p>
          </div>
        )}
      </CardContent>
      {alerts.length > 0 && (
        <CardFooter className="px-6 py-4 border-t border-neutral-200">
          <Link href="/inventory" className="text-sm font-medium text-primary hover:text-primary-dark">
            Voir toutes les alertes →
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
