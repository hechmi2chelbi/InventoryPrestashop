import React, { useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Loader2, RefreshCw, AlertTriangle, InfoIcon, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { ModuleLog } from '@shared/schema';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type étendu pour les logs du module avec details typé
interface TypedModuleLog extends Omit<ModuleLog, 'details'> {
  details: Record<string, any> | string | null;
}

interface ModuleLogsProps {
  siteId: number;
}

export default function ModuleLogs({ siteId }: ModuleLogsProps) {
  const [logFilter, setLogFilter] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  // Récupération des logs
  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery<TypedModuleLog[]>({
    queryKey: ['/api/sites', siteId, 'logs'],
    queryFn: ({ queryKey }) => fetch(`/api/sites/${siteId}/logs`).then(res => {
      if (!res.ok) throw new Error('Erreur lors de la récupération des logs');
      return res.json();
    }),
  });

  // Suppression des logs
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/sites/${siteId}/logs`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites', siteId, 'logs'] });
      toast({
        title: 'Logs effacés',
        description: 'Tous les logs ont été effacés avec succès',
        variant: 'default',
      });
      setConfirmClear(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Échec de la suppression des logs: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Filtrer les logs
  const filteredLogs = logs?.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'error') return log.status === 'error';
    if (logFilter === 'warning') return log.status === 'warning';
    if (logFilter === 'success') return log.status === 'success';
    if (logFilter === 'api') return log.type === 'api';
    if (logFilter === 'sync') return log.type === 'sync';
    return true;
  });

  // Fonction pour obtenir l'icône en fonction du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  // Fonction pour obtenir la couleur de badge en fonction du statut
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
      default:
        return 'outline' as const;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: fr });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Journaux d'activité du module</CardTitle>
          <CardDescription>Chargement des logs...</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Journaux d'activité du module</CardTitle>
          <CardDescription>Une erreur est survenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{(error as Error).message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Journaux d'activité du module</CardTitle>
          <CardDescription>
            Historique des interactions et synchronisations
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={logFilter} onValueChange={setLogFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les logs</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Avertissements</SelectItem>
              <SelectItem value="error">Erreurs</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="sync">Synchronisation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {(!logs || logs.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <InfoIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun log disponible pour ce site</p>
            <p className="text-sm mt-2">Les logs apparaîtront ici après synchronisation avec le module PrestaShop.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredLogs?.map((log) => (
              <div
                key={log.id}
                className="border rounded-md p-3 flex flex-col space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(log.status)}
                    <span className="ml-2 font-medium">{log.message}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(log.status)}>
                    {log.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{log.type}</Badge>
                    {log.details && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const detailsContent: ReactNode = (
                            <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                              <code className="text-xs text-white">
                                {typeof log.details === 'string' 
                                  ? log.details 
                                  : JSON.stringify(log.details, null, 2)}
                              </code>
                            </pre>
                          );
                          
                          toast({
                            title: 'Détails du log',
                            description: detailsContent,
                            variant: 'default',
                          });
                        }}
                      >
                        Voir détails
                      </Button>
                    )}
                  </div>
                  <time dateTime={log.created_at?.toString()}>
                    {log.created_at ? formatDate(log.created_at.toString()) : 'Date inconnue'}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        
        <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive border-destructive hover:bg-destructive/10"
              disabled={!logs || logs.length === 0 || clearLogsMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer les logs
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir effacer tous les logs de ce site ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmClear(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isPending}
              >
                {clearLogsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}