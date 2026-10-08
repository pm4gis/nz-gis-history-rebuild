export function shortestPath(nodes, edges, start, end) {
  if (!start || !end) return null;
  if (start === end) return { nodes: [start], edges: [] };
  const nodeIds = new Set(nodes.map((node) => typeof node === "string" ? node : node.id));
  if (!nodeIds.has(start) || !nodeIds.has(end)) return null;
  const adjacency = new Map([...nodeIds].map((id) => [id, []]));
  for (const edge of edges) {
    if (!nodeIds.has(edge.a) || !nodeIds.has(edge.b)) continue;
    adjacency.get(edge.a).push({ id: edge.b, edgeId: edge.id });
    adjacency.get(edge.b).push({ id: edge.a, edgeId: edge.id });
  }
  const queue = [start];
  const previous = new Map([[start, null]]);
  while (queue.length && !previous.has(end)) {
    const current = queue.shift();
    for (const next of adjacency.get(current) || []) {
      if (previous.has(next.id)) continue;
      previous.set(next.id, { id: current, edgeId: next.edgeId });
      queue.push(next.id);
    }
  }
  if (!previous.has(end)) return null;
  const pathNodes = [end];
  const pathEdges = [];
  let current = end;
  while (current !== start) {
    const step = previous.get(current);
    pathEdges.push(step.edgeId);
    current = step.id;
    pathNodes.push(current);
  }
  return { nodes: pathNodes.reverse(), edges: pathEdges.reverse() };
}
