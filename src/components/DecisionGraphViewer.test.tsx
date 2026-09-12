/**
 * DecisionGraphViewer.test.tsx — T5-05 UI 单测
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { DecisionGraphViewer, DecisionGraphData } from "./DecisionGraphViewer";

describe("DecisionGraphViewer", () => {
  const sampleData: DecisionGraphData = {
    node: {
      node_id: "decision-abc123",
      kind: "decision",
      actor: "resident",
      action: "resolve_conflict",
      ts: "2026-09-12T10:00:00Z",
    },
    ancestors: [
      {
        node_id: "patrol-aaa",
        kind: "patrol",
        actor: "resident",
        action: "detect_conflict",
        ts: "2026-09-12T09:58:00Z",
      },
      {
        node_id: "healing-bbb",
        kind: "healing",
        actor: "resident",
        action: "attempt_auto_heal",
        ts: "2026-09-12T09:59:00Z",
      },
    ],
    downstream: [
      {
        node_id: "patrol-ccc",
        kind: "patrol",
        actor: "resident",
        action: "verify_resolution",
        ts: "2026-09-12T10:01:00Z",
      },
    ],
  };

  it("renders node action", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    expect(screen.getByText(/resolve_conflict/)).toBeTruthy();
  });

  it("renders ancestor chain with count", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    expect(screen.getByText(/祖先链 \(2\)/)).toBeTruthy();
    expect(screen.getByText("detect_conflict")).toBeTruthy();
    expect(screen.getByText("attempt_auto_heal")).toBeTruthy();
  });

  it("renders downstream impact with count", () => {
    render(<DecisionGraphViewer data={sampleData} />);
    expect(screen.getByText(/下游影响面 \(1\)/)).toBeTruthy();
    expect(screen.getByText("verify_resolution")).toBeTruthy();
  });
});
