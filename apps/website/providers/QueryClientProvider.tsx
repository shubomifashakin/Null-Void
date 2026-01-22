"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClientProvider = new QueryClient({
  defaultOptions: { queries: { retry: 3 } },
});

function ReactQueryProvider({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClientProvider}>
      {children}
    </QueryClientProvider>
  );
}

export default ReactQueryProvider;
