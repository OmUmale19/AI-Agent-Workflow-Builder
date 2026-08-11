"use client";

import React, { useMemo } from "react";
import { ApolloProvider as BaseApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "@/lib/apollo";
import { nhost } from "@/lib/nhost";

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    return getApolloClient(() => {
      try {
        const session = nhost.getUserSession();
        return session?.accessToken || null;
      } catch {
        return null;
      }
    });
  }, []);

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
