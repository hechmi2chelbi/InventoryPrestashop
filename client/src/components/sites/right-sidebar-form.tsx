import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SimpleAddSiteForm from "./simple-add-site-form";
import { Site } from "@shared/schema";

interface RightSidebarFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingSite?: Site;
  setEditingSite?: (site: Site | undefined) => void;
}

export default function RightSidebarForm({ 
  isOpen, 
  onClose, 
  editingSite, 
  setEditingSite 
}: RightSidebarFormProps) {
  // Fermer la sidebar avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);
  
  // Bloquer le scroll quand la sidebar est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/25">
      {/* Overlay pour fermer en cliquant à l'extérieur */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col overflow-y-auto pb-12">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-medium">
              {editingSite ? "Modifier un site" : "Ajouter un site"}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
          
          <div className="px-6 py-4">
            <SimpleAddSiteForm 
              editingSite={editingSite} 
              onSuccess={() => {
                onClose();
                if (setEditingSite) setEditingSite(undefined);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}