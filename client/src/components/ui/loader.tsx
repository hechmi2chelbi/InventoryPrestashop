import { cn } from "@/lib/utils";

export interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "primary" | "white";
}

/**
 * Composant d'animation de chargement élégant
 */
export function Loader({ size = "md", className, color = "primary" }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const colorClasses = {
    primary: "text-primary",
    white: "text-white"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-t-transparent", 
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ 
          borderColor: "currentColor transparent transparent currentColor"
        }}
      />
    </div>
  );
}

/**
 * Loader avec message
 */
export function LoaderWithText({ 
  size = "md", 
  className, 
  color = "primary", 
  text = "Chargement..."
}: LoaderProps & { text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <Loader size={size} color={color} />
      <p className={cn("text-sm font-medium", color === "white" ? "text-white" : "text-neutral-500")}>{text}</p>
    </div>
  );
}

/**
 * Écran de chargement plein écran
 */
export function FullScreenLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <LoaderWithText size="lg" text={text} />
    </div>
  );
}

/**
 * Placeholder de chargement pour les cartes
 */
export function CardLoader({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-white p-6 flex items-center justify-center", className)}>
      <LoaderWithText />
    </div>
  );
}

/**
 * Animation de chargement avec pulsation
 */
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-2 justify-center items-center", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
    </div>
  );
}