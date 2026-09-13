/**
 * DecisionGraphViewer.test.tsx — T5-05 UI 单测 (i18n + a11y)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DecisionGraphViewer, DecisionGraphData } from "./DecisionGraphViewer";

const sampleData: DecisionGraphData = {
  summary: { nodes: 5, edges: 4, by_kind: { patrol: 2, healing: 1, decision: 2 } },
  nodes: [
    { node_id: "n1", kind: "patrol", actor: "agent-1", action: "detect_anomaly", ts: "2026-09-13T10:00:00Z" },
    { node_id: "n2", kind: "healing", actor: "agent-2", action: "restart_service", ts: "2026-09-13T10:01:00Z", decision: "restarted" },
    { node_id: "n3", kind: "decision", actor: "arbiter", action: "resolve_conflict", ts: "2026-09-13T10:02:00Z", decision: "escalated" },
    { node_id: "n4", kind: "decision", actor: "arbiter", action: "approve_fix", ts: "2026-09-13T10:03:00Z", decision: "approved" },
    { node_id: "n5", kind: "patrol", actor: "agent-1", action: "verify_resolution", ts: "2026-09-13T10:04:00Z" },
  ],
  edges: [
    { from_node: "n1", to_node: "n2", relation: "caused" },
    { from_node: "n1", to_node: "n3", relation: "influenced" },
    { from_node: "n2", to_node: "n3", relation: "influenced" },
    { from_node: "n3", to_node: "n4", relation: "caused" },
  ],
  actors: { "agent-1": 2, "agent-2": 1, arbiter: 2 },
  actions: { detect_anomaly: 1, restart_service: 1, resolve_conflict: 1, approve_fix: 1, verify_resolution: 1 },
};

const emptyData: DecisionGraphData = {
  summary: { nodes: 0, edges: 0, by_kind: {} },
  nodes: [], edges: [], actors: {}, actions: {},
};

// ── zh-CN (default) ──

describe("DecisionGraphViewer (zh-CN)", () => {
  describe("Overview tab", () => {
    it("renders stat card labels", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getByText("决策节点")).toBeTruthy();
      expect(screen.getByText("因果边")).toBeTruthy();
      expect(screen.getByText("动作类型")).toBeTruthy();
    });

    it("renders distribution bars", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getByText("按类型分布")).toBeTruthy();
    });

    it("renders entity lists", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getAllByText("参与者").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("detect_anomaly").length).toBeGreaterThanOrEqual(1);
    });

    it("renders recent nodes table", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getByText("最近节点")).toBeTruthy();
    });
  });

  describe("Nodes List tab", () => {
    it("renders all nodes when switching to tab", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("节点列表"));
      expect(screen.getByText("restart_service")).toBeTruthy();
      expect(screen.getByText("approve_fix")).toBeTruthy();
    });

    it("filters nodes by search query", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("节点列表"));
      const searchInput = screen.getByPlaceholderText(/搜索节点/);
      fireEvent.change(searchInput, { target: { value: "resolve" } });
      expect(screen.getByText("resolve_conflict")).toBeTruthy();
      expect(screen.queryByText("restart_service")).toBeNull();
    });

    it("shows empty state when no matches", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("节点列表"));
      const searchInput = screen.getByPlaceholderText(/搜索节点/);
      fireEvent.change(searchInput, { target: { value: "zzz_no_match" } });
      expect(screen.getByText("无匹配节点")).toBeTruthy();
    });

    it("shows node count", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("节点列表"));
      expect(screen.getByText(/共 5 个节点/)).toBeTruthy();
    });
  });

  describe("Topology tab", () => {
    it("renders SVG topology visualization", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("因果拓扑"));
      expect(document.querySelector("svg")).toBeTruthy();
    });

    it("renders node and edge count summary", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      fireEvent.click(screen.getByText("因果拓扑"));
      expect(screen.getByText(/5 个节点.*4 条因果边/)).toBeTruthy();
    });

    it("renders overview for empty data", () => {
      render(<DecisionGraphViewer data={emptyData} />);
      expect(screen.getByText("决策节点")).toBeTruthy();
    });
  });

  describe("Tab switching", () => {
    it("starts on overview tab", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getByText("最近节点")).toBeTruthy();
    });

    it("switches between all tabs", () => {
      render(<DecisionGraphViewer data={sampleData} />);
      expect(screen.getByText("最近节点")).toBeTruthy();
      fireEvent.click(screen.getByText("节点列表"));
      expect(screen.getByPlaceholderText(/搜索节点/)).toBeTruthy();
      fireEvent.click(screen.getByText("因果拓扑"));
      expect(document.querySelector("svg")).toBeTruthy();
      fireEvent.click(screen.getByText("概览"));
      expect(screen.getByText("最近节点")).toBeTruthy();
    });
  });
});

// ── i18n: English ──

describe("DecisionGraphViewer (en-US)", () => {
  it("renders English labels in overview", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    expect(screen.getByText("Decision Nodes")).toBeTruthy();
    expect(screen.getByText("Causal Edges")).toBeTruthy();
    expect(screen.getByText("Action Types")).toBeTruthy();
  });

  it("renders English tab labels", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("Nodes")).toBeTruthy();
    expect(screen.getByText("Topology")).toBeTruthy();
  });

  it("renders English node count", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Nodes"));
    expect(screen.getByText(/5 nodes total/)).toBeTruthy();
  });

  it("renders English search placeholder", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Nodes"));
    expect(screen.getByPlaceholderText(/Search nodes/)).toBeTruthy();
  });

  it("renders English empty state", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Nodes"));
    const searchInput = screen.getByPlaceholderText(/Search nodes/);
    fireEvent.change(searchInput, { target: { value: "zzz_no_match" } });
    expect(screen.getByText("No matching nodes")).toBeTruthy();
  });

  it("renders English topology summary", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Topology"));
    expect(screen.getByText(/5 nodes.*4 causal edges/)).toBeTruthy();
  });

  it("renders English table headers", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Nodes"));
    expect(screen.getByText("Time")).toBeTruthy();
    expect(screen.getByText("Kind")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();
  });

  it("renders English kind labels", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    fireEvent.click(screen.getByText("Topology"));
    expect(screen.getAllByText("Patrol").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Healing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Decision").length).toBeGreaterThanOrEqual(1);
  });
});

// ── a11y: ARIA roles and keyboard navigation ──

describe("DecisionGraphViewer (a11y)", () => {
  it("has proper tablist role", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeTruthy();
    expect(tablist.getAttribute("aria-label")).toBe("决策因果图可视化");
  });

  it("has tab roles with aria-selected", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[2].getAttribute("aria-selected")).toBe("false");
  });

  it("has tabpanel roles with aria-labelledby", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const panels = screen.getAllByRole("tabpanel");
    expect(panels.length).toBe(1);
    expect(panels[0].getAttribute("aria-labelledby")).toBe("tab-overview");
  });

  it("supports ArrowRight to navigate tabs", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    const updatedTabs = screen.getAllByRole("tab");
    expect(updatedTabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("supports ArrowLeft to navigate tabs", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]);
    const updatedTabs = screen.getAllByRole("tab");
    fireEvent.keyDown(updatedTabs[2], { key: "ArrowLeft" });
    const finalTabs = screen.getAllByRole("tab");
    expect(finalTabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("supports Home to jump to first tab", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]);
    const updatedTabs = screen.getAllByRole("tab");
    fireEvent.keyDown(updatedTabs[2], { key: "Home" });
    const finalTabs = screen.getAllByRole("tab");
    expect(finalTabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("supports End to jump to last tab", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.keyDown(tabs[0], { key: "End" });
    const updatedTabs = screen.getAllByRole("tab");
    expect(updatedTabs[2].getAttribute("aria-selected")).toBe("true");
  });

  it("has progressbar roles with aria attributes", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.length).toBeGreaterThanOrEqual(1);
    bars.forEach((bar) => {
      expect(bar.getAttribute("aria-valuenow")).toBeTruthy();
      expect(bar.getAttribute("aria-valuemin")).toBe("0");
      expect(bar.getAttribute("aria-valuemax")).toBeTruthy();
    });
  });

  it("has aria-live regions for dynamic content", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const all = document.querySelectorAll("[aria-live]");
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it("has region roles with aria-labels", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    const regions = screen.getAllByRole("region");
    expect(regions.length).toBeGreaterThanOrEqual(1);
  });

  it("has table headers with scope attribute", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    fireEvent.click(screen.getByText("节点列表"));
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(6);
    headers.forEach((h) => {
      expect(h.getAttribute("scope")).toBe("col");
    });
  });

  it("has SVG with aria-label for screen readers", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    fireEvent.click(screen.getByText("因果拓扑"));
    const svg = document.querySelector("svg[aria-label]");
    expect(svg).toBeTruthy();
  });

  it("has focusable SVG nodes with aria-label", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    fireEvent.click(screen.getByText("因果拓扑"));
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("English locale has proper ARIA labels", () => {
    render(<DecisionGraphViewer data={sampleData} locale="en-US" />);
    const tablist = screen.getByRole("tablist");
    expect(tablist.getAttribute("aria-label")).toBe("Decision Causal Graph");
  });
});
