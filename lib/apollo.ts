import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const apollo = new ApolloClient({
    link: new HttpLink({
        uri: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL,
    }),
    cache: new InMemoryCache(),
}); 