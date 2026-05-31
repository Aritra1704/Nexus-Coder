import { getPool } from '../db/client.js';

export async function addNode(id, type, metadata = {}) {
  await getPool().query(
    `
      INSERT INTO graph_nodes (id, type, metadata)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET type = EXCLUDED.type,
          metadata = EXCLUDED.metadata
    `,
    [id, type, JSON.stringify(metadata)]
  );
}

export async function addEdge(from, to, relation) {
  await getPool().query(
    `
      INSERT INTO graph_edges (from_node, to_node, relation)
      VALUES ($1, $2, $3)
      ON CONFLICT (from_node, to_node, relation) DO NOTHING
    `,
    [from, to, relation]
  );
}

export async function getDependencies(nodeId) {
  const result = await getPool().query(
    `
      SELECT from_node
      FROM graph_edges
      WHERE to_node = $1
      ORDER BY id ASC
    `,
    [nodeId]
  );

  return result.rows.map((row) => row.from_node);
}
