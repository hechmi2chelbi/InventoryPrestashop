import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 shadow-sm">
      <div className="flex items-center justify-center h-16 border-b border-neutral-200">
        <h1 className="text-2xl font-semibold text-primary">PrestaSynch</h1>
      </div>
      
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location === item.href ? "bg-primary text-white hover:bg-primary/90" : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                <span className="material-icons mr-3 text-sm">{item.icon}</span>
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      
      <UserMenu />
    </div>
  );
}
