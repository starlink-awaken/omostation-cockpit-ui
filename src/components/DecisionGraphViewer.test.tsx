/**
 * DecisionGraphViewer.test.tsx — T5-05 UI 单测
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

describe("DecisionGraphViewer", () => {
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
      // "参与者" appears as stat card label and entity list title, use getAllByText
      expect(screen.getAllByText("参与者").length).toBeGreaterThanOrEqual(1);
      // Action names appear in entity list and recent nodes table, use getAllByText
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
