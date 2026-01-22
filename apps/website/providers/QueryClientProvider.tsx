"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClientProvider = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error.cause === 400) {
          return false;
        }

        if (error.cause === 429) {
          return false;
        }

        return failureCount < 3;
      },
      retryDelay: 5000,
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
