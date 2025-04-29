import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = res.statusText;
    try {
      // Tenter de récupérer le texte de la réponse
      const text = await res.text();
      
      // Vérifier si la réponse est un HTML (cas d'erreur serveur)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        // C'est une page HTML d'erreur (probablement 500), ne pas afficher tout le HTML
        console.error("Réponse HTML reçue (erreur serveur)", { status: res.status, url: res.url });
        errorText = "Erreur serveur. Veuillez réessayer plus tard.";
      } else {
        // Tenter de parser en tant que JSON
        try {
          const json = JSON.parse(text);
          errorText = json.message || json.error || text;
        } catch (e) {
          // Si ce n'est pas du JSON valide, utiliser le texte brut
          errorText = text;
        }
      }
    } catch (e) {
      // En cas d'erreur lors de la lecture du texte, utiliser le statusText par défaut
      console.error("Impossible de lire la réponse d'erreur", e);
    }
    
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Construire l'URL avec les paramètres si nécessaire
    let url = queryKey[0] as string;
    // Si le queryKey a plus d'un élément, traiter les segments d'URL
    if (queryKey.length > 1) {
      // Si l'URL contient un placeholder :id, remplacer par la valeur
      if (url.includes('/:siteId/')) {
        url = url.replace('/:siteId/', `/${queryKey[1]}/`);
      } 
      // Sinon, essayer de construire le chemin avec les segments supplémentaires
      else if (queryKey.length === 3) {
        // Forme: ['/api/sites', siteId, 'products']
        url = `${url}/${queryKey[1]}/${queryKey[2]}`;
      }
      // Pour les cas simples avec juste un ID à la fin
      else if (queryKey[1]) {
        url = `${url}/${queryKey[1]}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    try {
      return await res.json();
    } catch (error) {
      console.error(`Erreur de parsing JSON pour la requête ${url}:`, error);
      console.debug("Contenu de la réponse:", await res.text());
      throw new Error(`Erreur lors de l'analyse de la réponse JSON: ${(error as Error).message}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentiel jusqu'à 30 secondes
    },
    mutations: {
      retry: false,
    },
  },
});
