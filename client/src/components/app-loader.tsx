import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LoaderWithText } from "@/components/ui/loader";

/**
 * Écran de chargement initial de l'application avec animation élégante
 */
export default function AppLoader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        // Progression non linéaire pour un effet plus naturel
        if (prevProgress < 70) {
          return prevProgress + 5;
        } else if (prevProgress < 90) {
          return prevProgress + 1;
        } else if (prevProgress < 100) {
          return prevProgress + 0.5;
        }
        return 100;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (progress >= 100) {
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500",
        progress >= 100 ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="w-full max-w-md px-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          {/* Logo ou Icône animé */}
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/30 flex items-center justify-center animate-ping absolute">
                <div className="h-8 w-8 rounded-full bg-primary/50"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center z-10">
                <span className="text-white font-bold text-lg">PS</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-800 mb-1">PrestaSynch</h1>
          <p className="text-neutral-500 text-sm">Votre assistant de gestion PrestaShop</p>
        </div>
        
        {/* Indicateur de progression */}
        <div className="w-full h-1 bg-neutral-100 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <LoaderWithText text="Chargement de l'application..." />
      </div>
    </div>
  );
}