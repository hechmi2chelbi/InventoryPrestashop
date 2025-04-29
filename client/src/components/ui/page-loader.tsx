import { ReactNode } from "react";
import { LoaderWithText } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  text?: string;
  className?: string;
  bgClassName?: string;
}

/**
 * Composant de chargement pour les pages complètes avec animation de transition
 */
export function PageLoader({
  isLoading,
  children,
  text = "Chargement de la page...",
  className,
  bgClassName
}: PageLoaderProps) {
  return (
    <div className={cn("relative min-h-[300px]", className)}>
      {/* État de chargement */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 flex flex-col items-center justify-center z-10 bg-white bg-opacity-80",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
          bgClassName
        )}
      >
        <LoaderWithText size="lg" text={text} />
      </div>
      
      {/* Contenu */}
      <div
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Variante pour le chargement initial de section 
 */
export function SectionLoader({
  isLoading,
  children,
  text = "Chargement...",
  className
}: PageLoaderProps) {
  return (
    <div className={cn("relative rounded-lg", className)}>
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <LoaderWithText text={text} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}