export async function hasuraAdminQuery<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const graphqlUrl =
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL ||
    (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN && process.env.NEXT_PUBLIC_NHOST_REGION
      ? `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.graphql.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1/graphql`
      : "https://hrnmyjgzlqolghdbwkqh.hasura.ap-south-1.nhost.run/v1/graphql");

  const adminSecret =
    process.env.NEXT_PUBLIC_NHOST_ADMIN_SECRET ||
    process.env.NHOST_ADMIN_SECRET ||
    process.env.HASURA_GRAPHQL_ADMIN_SECRET ||
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (adminSecret) {
    headers["x-hasura-admin-secret"] = adminSecret;
  }

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(
      `GraphQL Admin Query Error: ${json.errors.map((e: any) => e.message).join(", ")}`
    );
  }

  return json.data as T;
}
