const query = `
  mutation CreateWorkflow($org_id: uuid!, $name: String!) {
    insert_workflows_one(object: { org_id: $org_id, name: $name }) {
      id
      name
    }
  }
`;

fetch('https://hrnmyjgzlqolghdbwkqh.hasura.ap-south-1.nhost.run/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': 'nhost-admin-secret'
  },
  body: JSON.stringify({
    query,
    variables: {
      org_id: '11111111-1111-1111-1111-111111111111',
      name: 'Test Workflow Script'
    }
  })
})
.then(r => r.json())
.then(data => console.log('Result:', JSON.stringify(data)))
.catch(console.error);
