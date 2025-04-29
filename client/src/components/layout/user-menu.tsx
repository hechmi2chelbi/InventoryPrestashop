import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function UserMenu() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logoutMutation.mutate();
    }
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 border-t border-neutral-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Avatar className="h-9 w-9 bg-primary-light text-white">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 truncate">{user.name}</p>
          <p className="text-xs text-neutral-400 truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-neutral-400 hover:text-neutral-500"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
