import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { LoaderWithText } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface Column {
  header: string;
  accessorKey?: string;
  className?: string;
}

interface LoadingTableProps {
  isLoading: boolean;
  columns: Column[];
  data?: any[];
  rowCount?: number;
  emptyState?: ReactNode;
  className?: string;
  renderRow?: (item: any) => ReactNode;
}

/**
 * Tableau avec état de chargement élégant
 */
export function LoadingTable({
  isLoading,
  columns,
  data = [],
  rowCount = 5,
  emptyState,
  className,
  renderRow
}: LoadingTableProps) {
  // Si les données sont chargées mais vides, afficher l'état vide
  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <div className="relative">
        {/* Overlay de chargement */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <LoaderWithText text="Chargement des données..." />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? // État de chargement avec squelette
                  Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-${rowIndex}`} className="animate-pulse">
                      {columns.map((_, colIndex) => (
                        <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                          <div className="h-4 bg-neutral-100 rounded w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : // Rendu des données réelles
                  data.map((item, rowIndex) => {
                    if (renderRow) {
                      return renderRow(item);
                    }
                    return (
                      <TableRow key={rowIndex}>
                        {columns.map((column, colIndex) => (
                          <TableCell key={`${rowIndex}-${colIndex}`}>
                            {column.accessorKey ? item[column.accessorKey] : null}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
              }
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}