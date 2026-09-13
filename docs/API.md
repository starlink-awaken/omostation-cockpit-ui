# Cockpit UI API / Usage Reference

> Quick reference for using **Cockpit UI** programmatically and from the command line.

## Command Line

- `bun install` — install deps
- `bun run build` — production build
- `bun run lint` — lint

## Programmatic API

See `package.json` scripts and component docs.

## Configuration

- Stack: typescript
- Dependencies: see [`../pyproject.toml`](../pyproject.toml) (Python) or [`../package.json`](../package.json) (TypeScript).
- Environment variables and ports: see workspace `protocols/port-registry.yaml` and root `.env.example`.

## Decision Graph API (T5-05)

Decision causal graph endpoints for visualizing decision chains, actors, and actions.

### `GET /api/v1/decision-graph/summary`

Returns aggregated statistics: node/edge counts, by-kind breakdown, actors, and actions.

**Response:**
```json
{
  "nodes": 8,
  "edges": 8,
  "by_kind": {"patrol": 3, "healing": 2, "decision": 3},
  "actors": {"agent-1": 3, "agent-2": 1, "arbiter": 3, "agent-3": 1},
  "actions": {"detect_anomaly": 2, "restart_service": 1, "resolve_conflict": 1, ...}
}
```

### `GET /api/v1/decision-graph/nodes`

Returns the full node and edge list from `graph.jsonl`.

**Response:**
```json
{
  "nodes": [{"node_id": "n1", "kind": "patrol", "actor": "agent-1", "action": "detect_anomaly", "ts": "..."}],
  "edges": [{"from_node": "n1", "to_node": "n2", "relation": "caused"}]
}
```

### `GET /api/v1/decision-graph/node/{node_id}`

Returns subgraph (ancestors + downstream) for a specific node via BFS.

**Response:**
```json
{
  "node": {...},
  "ancestors": [...],
  "downstream": [...]
}
```

### Frontend Hook

```tsx
import { useDecisionGraphData } from '@/api/hooks/decisionGraph';

function DecisionGraphView() {
  const { data, isLoading, isError, error, refetch } = useDecisionGraphData();
  // ...
}
```

### Data Source

Decision graph data is stored as JSONL at `.omo/state/decision-graph/graph.jsonl`.
Lines with `"relation"` key are edges; all other lines are nodes.

## Decision Graph API (T5-05)

Decision causal graph endpoints for visualizing decision chains, actors, and actions.

### `GET /api/v1/decision-graph/summary`

Returns aggregated statistics: node/edge counts, by-kind breakdown, actors, and actions.

**Response:**
```json
{
  "nodes": 8,
  "edges": 8,
  "by_kind": {"patrol": 3, "healing": 2, "decision": 3},
  "actors": {"agent-1": 3, "agent-2": 1, "arbiter": 3, "agent-3": 1},
  "actions": {"detect_anomaly": 2, "restart_service": 1, "resolve_conflict": 1, ...}
}
```

### `GET /api/v1/decision-graph/nodes`

Returns the full node and edge list from `graph.jsonl`.

**Response:**
```json
{
  "nodes": [{"node_id": "n1", "kind": "patrol", "actor": "agent-1", "action": "detect_anomaly", "ts": "..."}],
  "edges": [{"from_node": "n1", "to_node": "n2", "relation": "caused"}]
}
```

### `GET /api/v1/decision-graph/node/{node_id}`

Returns subgraph (ancestors + downstream) for a specific node via BFS.

**Response:**
```json
{
  "node": {...},
  "ancestors": [...],
  "downstream": [...]
}
```

### Frontend Hook

```tsx
import { useDecisionGraphData } from '@/api/hooks/decisionGraph';

function DecisionGraphView() {
  const { data, isLoading, isError, error, refetch } = useDecisionGraphData();
  // ...
}
```

### Data Source

Decision graph data is stored as JSONL at `.omo/state/decision-graph/graph.jsonl`.
Lines with `"relation"` key are edges; all other lines are nodes.

## Tests

See [`../README.md`](../README.md) for the test command.
