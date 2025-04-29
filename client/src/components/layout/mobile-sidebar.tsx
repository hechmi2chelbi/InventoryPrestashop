import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import UserMenu from "./user-menu";

const sidebarItems = [
  { href: "/", label: "Tableau de bord", icon: "dashboard" },
  { href: "/sites", label: "Mes sites", icon: "store" },
  { href: "/inventory", label: "Inventaire", icon: "inventory_2" },
  { href: "/price-history", label: "Historique des prix", icon: "trending_up" },
  { href: "/settings", label: "Paramètres", icon: "settings" },
  { href: "/help", label: "Aide", icon: "help_outline" },
];

interface MobileSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function MobileSidebar({ open, setOpen }: MobileSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader className="h-16 flex items-center justify-center border-b border-neutral-200 px-4">
          <SheetTitle className="text-2xl font-semibold text-primary">PrestaSynch</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-2 py-4 h-[calc(100%-8rem)]">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    location === item.href ? "bg-primary text-white hover:bg-primary/90" : "text-neutral-500 hover:bg-neutral-100"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <span className="material-icons mr-3 text-sm">{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="border-t border-neutral-200">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
