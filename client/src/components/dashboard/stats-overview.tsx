import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Package, AlertTriangle, RefreshCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface StatsProps {
  stats?: {
    connectedSites: number;
    totalSites: number;
    trackedProducts: number;
    stockAlerts: number;
    lastSync: string | null;
  };
}

export default function StatsOverview({ stats }: StatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Jamais";
    
    try {
      return `Il y a ${formatDistanceToNow(new Date(lastSync), { locale: fr })}`;
    } catch (error) {
      return "Date invalide";
    }
  };

  const statItems = [
    {
      title: "Sites connectés",
      value: `${stats.connectedSites}/${stats.totalSites}`,
      icon: Store,
      color: "bg-primary-light",
    },
    {
      title: "Produits suivis",
      value: stats.trackedProducts.toLocaleString(),
      icon: Package,
      color: "bg-secondary",
    },
    {
      title: "Alertes stock",
      value: stats.stockAlerts.toString(),
      icon: AlertTriangle,
      color: "bg-amber-500",
    },
    {
      title: "Dernière synchro",
      value: formatLastSync(stats.lastSync),
      icon: RefreshCcw,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {statItems.map((stat, index) => (
        <Card key={index} className="bg-white overflow-hidden shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-md p-2`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-400 truncate">{stat.title}</dt>
                  <dd className="text-lg font-semibold text-neutral-500">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
