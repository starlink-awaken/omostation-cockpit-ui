/**
 * DecisionGraphPage.test.tsx — T5-05 决策因果图页面测试
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import DecisionGraphPage from "./DecisionGraphPage";
import { DecisionGraphData } from "./DecisionGraphViewer";

function mockFetchSuccess(data: DecisionGraphData) {
  const summaryData = {
    nodes: data.summary.nodes, edges: data.summary.edges,
    by_kind: data.summary.by_kind, actors: data.actors, actions: data.actions,
  };
  const nodesData = { nodes: data.nodes, edges: data.edges };
  return vi.fn().mockImplementation(async (url: string) => {
    if (url.includes("/summary")) return { ok: true, status: 200, json: async () => summaryData };
    if (url.includes("/nodes")) return { ok: true, status: 200, json: async () => nodesData };
    return { ok: true, status: 200, json: async () => ({}) };
  });
}

function mockFetchError(message: string) {
  return vi.fn().mockResolvedValue({
    ok: false, status: 500, statusText: "ISE",
    json: async () => ({ error: message }),
  });
}

const sampleData: DecisionGraphData = {
  summary: { nodes: 3, edges: 2, by_kind: { patrol: 1, healing: 1, decision: 1 } },
  nodes: [
    { node_id: "n1", kind: "patrol", actor: "bot-a", action: "scan", ts: "2026-09-13T00:00:00Z" },
    { node_id: "n2", kind: "healing", actor: "bot-b", action: "fix", ts: "2026-09-13T00:01:00Z", decision: "fixed" },
    { node_id: "n3", kind: "decision", actor: "human", action: "approve", ts: "2026-09-13T00:02:00Z", decision: "yes" },
  ],
  edges: [
    { from_node: "n1", to_node: "n2", relation: "caused" },
    { from_node: "n2", to_node: "n3", relation: "influenced" },
  ],
  actors: { "bot-a": 1, "bot-b": 1, human: 1 },
  actions: { scan: 1, fix: 1, approve: 1 },
};

function createTestClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0, refetchInterval: false, refetchOnWindowFocus: false } },
  });
}

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  const client = createTestClient();
  global.fetch = fetchMock;
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/decision-graph"]}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <DecisionGraphPage />
        </React.Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ──

describe("DecisionGraphPage", () => {
  it("shows loading state initially", () => {
    renderPage(vi.fn().mockImplementation(() => new Promise(() => {})));
    expect(screen.getByText(/加载决策因果图/)).toBeTruthy();
  });

  it("shows error state with retry button", async () => {
    renderPage(mockFetchError("backend unavailable"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    }, { timeout: 3000 });
    expect(screen.getByText(/HTTP 500/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /重新加载/ })).toBeTruthy();
  });

  it("shows empty state when no data", async () => {
    const emptyData: DecisionGraphData = {
      summary: { nodes: 0, edges: 0, by_kind: {} },
      nodes: [], edges: [], actors: {}, actions: {},
    };
    renderPage(mockFetchSuccess(emptyData));
    await waitFor(() => {
      expect(screen.getByText(/暂无决策因果数据/)).toBeTruthy();
    });
  });

  it("renders data on success with locale switcher", async () => {
    renderPage(mockFetchSuccess(sampleData));
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "决策因果图可视化" })).toBeTruthy();
    });
    expect(screen.getByRole("radiogroup")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /刷新/ })).toBeTruthy();
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("switches locale on click", async () => {
    renderPage(mockFetchSuccess(sampleData));
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "决策因果图可视化" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Decision Causal Graph" })).toBeTruthy();
    });
  });
});
