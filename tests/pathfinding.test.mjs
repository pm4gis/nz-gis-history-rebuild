import test from "node:test";
import assert from "node:assert/strict";
import { shortestPath } from "../src/lib/pathfinding.mjs";

const nodes = ["a", "b", "c", "d", "isolated"];
const edges = [
  { id: "ab", a: "a", b: "b" },
  { id: "bc", a: "b", b: "c" },
  { id: "cd", a: "c", b: "d" },
  { id: "ad", a: "a", b: "d" },
];

test("returns the shortest route with its relationship IDs", () => {
  assert.deepEqual(shortestPath(nodes, edges, "a", "d"), { nodes: ["a", "d"], edges: ["ad"] });
});

test("filtered links alter reachability and missing records have no route", () => {
  assert.deepEqual(shortestPath(nodes, edges.filter((edge) => edge.id !== "ad"), "a", "d"), {
    nodes: ["a", "b", "c", "d"], edges: ["ab", "bc", "cd"],
  });
  assert.equal(shortestPath(nodes, edges, "a", "isolated"), null);
  assert.equal(shortestPath(nodes, edges, "a", "missing"), null);
});
