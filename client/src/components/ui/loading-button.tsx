import { ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { PulseLoader, Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

export interface LoadingButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
  loaderType?: "spinner" | "pulse";
  loaderColor?: "primary" | "white";
}

/**
 * Bouton avec indicateur de chargement élégant
 */
const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    isLoading = false, 
    loadingText, 
    loaderType = "spinner", 
    loaderColor = "white",
    variant = "default",
    size = "default",
    className,
    disabled,
    children,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            {loaderType === "spinner" ? (
              <Loader 
                size="sm" 
                color={loaderColor} 
                className="mr-2" 
              />
            ) : (
              <PulseLoader 
                className={cn(
                  "mr-2", 
                  loaderColor === "white" ? "bg-white/80" : "bg-primary/80"
                )} 
              />
            )}
            {loadingText || children}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };