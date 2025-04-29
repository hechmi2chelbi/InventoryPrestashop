import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { SelectedSiteProvider } from "./hooks/use-selected-site";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Sites from "@/pages/sites";
import Inventory from "@/pages/inventory";
import PriceHistory from "@/pages/price-history";
import Settings from "@/pages/settings";
import Help from "@/pages/help";
import { ProtectedRoute } from "./lib/protected-route";
import AppLoader from "@/components/app-loader";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/sites" component={Sites} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/price-history" component={PriceHistory} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un temps de chargement pour montrer l'animation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SelectedSiteProvider>
          <TooltipProvider>
            <Toaster />
            {loading ? (
              <AppLoader />
            ) : (
              <Router />
            )}
          </TooltipProvider>
        </SelectedSiteProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
