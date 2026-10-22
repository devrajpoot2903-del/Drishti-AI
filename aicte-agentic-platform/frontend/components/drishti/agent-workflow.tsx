"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

export interface AgentExecution {
  id: string;
  name: string;
  status: string;
}

export interface AgentWorkflowProps {
  executions: AgentExecution[];
}

const positions: Record<string, { x: number; y: number }> = {
  intake: { x: 300, y: 0 },
  document: { x: 300, y: 110 },
  orchestrator: { x: 300, y: 220 },
  forensics: { x: 90, y: 350 },
  verification: { x: 510, y: 350 },
  compliance: { x: 300, y: 490 },
};

const connections = [
  ["intake", "document"],
  ["document", "orchestrator"],
  ["orchestrator", "forensics"],
  ["orchestrator", "verification"],
  ["forensics", "compliance"],
  ["verification", "compliance"],
] as const;

export function AgentWorkflow({
  executions,
}: AgentWorkflowProps) {
  const nodes: Node[] = executions.map((agent) => ({
    id: agent.id,
    position: positions[agent.id] ?? { x: 300, y: 600 },
    data: {
      label: (
        <div className="text-center select-none">
          <div className="text-sm font-semibold tracking-tight text-white">{agent.name}</div>

          <div
            className={`mt-1 text-xs font-medium ${
              agent.status.toLowerCase() === "completed"
                ? "text-emerald-400"
                : agent.status.toLowerCase() === "running"
                ? "text-amber-400"
                : agent.status.toLowerCase() === "needs review"
                ? "text-orange-400"
                : "text-gray-400"
            }`}
          >
            {agent.status}
          </div>
        </div>
      ),
    },
    style: {
      background: "#17181f",
      color: "#f8fafc",
      border:
        agent.status.toLowerCase() === "completed"
          ? "1px solid #22c55e"
          : agent.status.toLowerCase() === "running"
          ? "1px solid #f59e0b"
          : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 12,
      padding: 12,
      width: 170,
      boxShadow:
        agent.status.toLowerCase() === "completed"
          ? "0 4px 16px rgba(34, 197, 94, 0.15)"
          : "0 4px 16px rgba(0, 0, 0, 0.25)",
    },
  }));

  const activeIds = new Set(executions.map((item) => item.id));

  const edges: Edge[] = connections
    .filter(
      ([source, target]) =>
        activeIds.has(source) && activeIds.has(target)
    )
    .map(([source, target]) => ({
      id: `${source}-${target}`,
      source,
      target,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#ef4444",
      },
      style: {
        stroke: "#ef4444",
        strokeWidth: 1.5,
      },
    }));

  return (
    <div className="drishti-glass h-[600px] w-full overflow-hidden border border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode="dark"
      >
        <Background
          color="rgba(255,255,255,0.06)"
          gap={24}
        />

        <Controls />
      </ReactFlow>
    </div>
  );
}
