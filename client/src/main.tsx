import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return;
    if (typeof window === "undefined") return;
    if (error.data?.code === "UNAUTHORIZED") {
          window.location.href = getLoginUrl();
    }
};

queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") {
          const error = event.query.state.error;
          redirectToLoginIfUnauthorized(error);
    }
});

queryClient.getMutationCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") {
          const error = event.mutation.state.error;
          redirectToLoginIfUnauthorized(error);
    }
});

const getAuthToken = () => localStorage.getItem("auth_token");

const trpcClient = trpc.createClient({
    links: [
          httpBatchLink({
                  url: "/api/trpc",
                  transformer: superjson,
                  headers() {
                            const token = getAuthToken();
                            return token ? { Authorization: `Bearer ${token}` } : {};
                  },
          }),
        ],
});

createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
                  <App />
          </QueryClientProvider>QueryClientProvider>
    </trpc.Provider>trpc.Provider>
  );
