import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";
import { LoaderWithText } from "@/components/ui/loader";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <LoaderWithText size="lg" text="Chargement de votre espace..." />
        </div>
      ) : user ? (
        <Component />
      ) : null}
    </Route>
  );
}
