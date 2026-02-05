"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClientProvider = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error.cause === 400 ||
          error.cause === 401 ||
          error.cause === 403 ||
          error.cause === 404 ||
          error.cause === 429
        ) {
          return false;
        }

        return failureCount < 3;
      },
      retryDelay: 3000,
      refetchOnWindowFocus: false,
    },
  },
});

function ReactQueryProvider({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClientProvider}>
      {children}
    </QueryClientProvider>
  );
}

export default ReactQueryProvider;
