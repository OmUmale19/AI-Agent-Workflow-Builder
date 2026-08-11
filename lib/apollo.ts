import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

export function getApolloClient(getAccessToken?: () => string | null) {
  const httpUrl =
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL ||
    "https://hrnmyjgzlqolghdbwkqh.hasura.ap-south-1.nhost.run/v1/graphql";
  const wsUrl = httpUrl.replace(/^http/, "ws");

  const adminSecret =
    process.env.NEXT_PUBLIC_NHOST_ADMIN_SECRET ||
    process.env.NHOST_ADMIN_SECRET ||
    "";

  const httpLink = new HttpLink({
    uri: httpUrl,
    headers: {
      ...(adminSecret ? { "x-hasura-admin-secret": adminSecret } : {}),
      ...(getAccessToken?.() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
  });

  const wsLink =
    typeof window !== "undefined" && wsUrl
      ? new GraphQLWsLink(
          createClient({
            url: wsUrl,
            connectionParams: () => {
              const token = getAccessToken?.();
              const authHeaders: Record<string, string> = {
                ...(adminSecret ? { "x-hasura-admin-secret": adminSecret } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              };
              return {
                headers: authHeaders,
                ...authHeaders,
              };
            },
          })
        )
      : null;

  const splitLink =
    typeof window !== "undefined" && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          wsLink,
          httpLink
        )
      : httpLink;

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });
}