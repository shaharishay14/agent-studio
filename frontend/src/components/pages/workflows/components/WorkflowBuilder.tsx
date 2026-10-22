import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode, AgentNode, AddAgentNode } from './nodes';
import type { StepStatus } from './nodes/AgentNode';
import { Badge } from '@/components/ui/badge';
import useModalsStore from '../../../../../store/modals.store';
import { useGetWorkflows } from '../hooks';

// Soft white edges; the one into "Add an agent" is dashed
const EDGE_STYLE = { stroke: 'rgba(255, 255, 255, 0.45)', strokeWidth: 1.5 };
const ADD_EDGE_STYLE = { stroke: 'rgba(255, 255, 255, 0.25)', strokeWidth: 1.5, strokeDasharray: '6 6' };

const nodeTypes = {
  startNode: StartNode,
  agentNode: AgentNode,
  addAgentNode: AddAgentNode,
};

interface WorkflowBuilderProps {
  workflowId: number;
}

function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const { openAddAgentToWorkflowModal, openRemoveAgentFromWorkflowModal } = useModalsStore();
  const { workflows } = useGetWorkflows();
  
  // שמור את תוצאות הביצוע לכל agent
  const [executionResults, setExecutionResults] = useState<Record<string, string>>({});
  // Run status per agent step (running / done / failed), shown on each node
  const [agentStatus, setAgentStatus] = useState<Record<string, StepStatus>>({});

  // מצא את ה-workflow הנוכחי
  const currentWorkflow = useMemo(() => 
    workflows.find(w => w.id === workflowId),
    [workflows, workflowId]
  );

  const handleAddAgent = useCallback(() => {
    openAddAgentToWorkflowModal(workflowId);
  }, [workflowId, openAddAgentToWorkflowModal]);

  const handleDeleteAgent = useCallback((agentId: string, agentName?: string) => {
    if (currentWorkflow?.id) {
      // פתח modal אישור למחיקה
      const name = agentName || 'Agent';
      openRemoveAgentFromWorkflowModal(currentWorkflow.id, agentId, name);
    }
  }, [currentWorkflow, openRemoveAgentFromWorkflowModal]);

  const handleOpenAgentInNewTab = useCallback((agentId: string) => {
    if (agentId) {
      window.open(`/chat/${agentId}`, '_blank');
    }
  }, []);

  const handleAgentStatus = useCallback((agentId: string, status: StepStatus) => {
    setAgentStatus(prev => ({ ...prev, [agentId]: status }));
  }, []);

  const handleExecutionResult = useCallback((agentId: string, message: string) => {
    setExecutionResults(prev => ({
      ...prev,
      [agentId]: message,
    }));
  }, []);

  // בנה את ה-nodes בהתאם לנתונים האמיתיים
  const buildNodes = useCallback(() => {
    const agents = currentWorkflow?.agents || [];
    const agentIds = agents.map(agent => agent.id);
    
    const nodes: Node[] = [
      {
        id: '1',
        type: 'startNode',
        position: { x: 100, y: 200 },
        data: {
          workflowId: workflowId,
          agentIds: agentIds,
          onExecutionResult: handleExecutionResult,
          onAgentStatus: handleAgentStatus,
        },
      },
    ];

    let nextPosition = 500;

    // אם יש agents ב-workflow, הוסף אותם
    if (agents.length > 0) {
      agents.forEach((agent, index) => {
        nodes.push({
          id: `agent-${index + 1}`,
          type: 'agentNode',
          position: { x: nextPosition, y: 200 },
          data: { 
            label: agent.name || `Agent ${index + 1}`, 
            avatar_base64: agent.avatar_base64,
            agentId: agent.id,
            step: index + 1,
            status: agentStatus[agent.id],
            executionResult: executionResults[agent.id],
            onDelete: () => handleDeleteAgent(agent.id, agent.name),
            onOpenInNewTab: () => handleOpenAgentInNewTab(agent.id),
          },
        });
        // המרווח הוא 500px כדי למנוע חפיפה (AgentNode יכול להיות עד 400px רחב)
        nextPosition += 500;
      });
    }

    // תמיד הוסף את כפתור Add Agent
    nodes.push({
      id: 'add-agent',
      type: 'addAgentNode',
      position: { x: nextPosition, y: 220 },
      data: { onAddAgent: handleAddAgent },
    });

    return nodes;
  }, [workflowId, currentWorkflow, handleAddAgent, handleDeleteAgent, handleOpenAgentInNewTab, handleExecutionResult, handleAgentStatus, executionResults, agentStatus]);

  // בנה את ה-edges בהתאם ל-nodes
  const buildEdges = useCallback(() => {
    const edges: Edge[] = [];
    const agents = currentWorkflow?.agents || [];

    if (agents.length > 0) {
      // חבר Start -> Agent הראשון
      edges.push({
        id: 'e1-agent-1',
        source: '1',
        target: 'agent-1',
        animated: true,
        style: EDGE_STYLE,
      });
      
      // חבר בין ה-agents
      for (let i = 1; i < agents.length; i++) {
        edges.push({
          id: `e-agent-${i}-agent-${i + 1}`,
          source: `agent-${i}`,
          target: `agent-${i + 1}`,
          animated: true,
          style: EDGE_STYLE,
        });
      }
      
      // חבר Agent האחרון -> Add Button
      edges.push({
        id: `e-agent-${agents.length}-add`,
        source: `agent-${agents.length}`,
        target: 'add-agent',
        animated: true,
        style: ADD_EDGE_STYLE,
      });
    } else {
      // חבר Start -> Add Button ישירות
      edges.push({
        id: 'e1-add',
        source: '1',
        target: 'add-agent',
        animated: true,
        style: EDGE_STYLE,
      });
    }

    return edges;
  }, [currentWorkflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // עדכן את ה-nodes וה-edges כשה-workflow משתנה
  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges());
  }, [buildNodes, buildEdges, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const edge = {
        ...connection,
        animated: true,
        style: EDGE_STYLE,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const stepCount = currentWorkflow?.agents?.length ?? 0;

  return (
    <div className="relative h-full min-h-0 flex-1">
      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 sm:p-6">
        <div className="pointer-events-auto flex max-w-[640px] items-start gap-3 rounded-3xl border border-white/15 bg-night/70 px-5 py-4 backdrop-blur-[16px]">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate font-display text-[22px] leading-7 font-medium tracking-[-0.02em]">{currentWorkflow?.name || 'Workflow'}</h1>
            <p className="m-0 line-clamp-2 text-sm text-white/66">{currentWorkflow?.description || 'No description'}</p>
          </div>
          <Badge className="shrink-0">
            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
          </Badge>
        </div>
      </div>

      {/* ReactFlow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        className="bg-transparent"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255, 255, 255, 0.14)" />
        <Controls
          showInteractive={false}
          position="top-right"
          className="!m-4 overflow-hidden !rounded-2xl !border !border-white/20 !shadow-none [&_button]:!border-white/10 [&_button]:!bg-night-2 [&_button]:!fill-white [&_button]:!text-white [&_button:hover]:!bg-white/12"
        />
      </ReactFlow>
    </div>
  );
}

export default WorkflowBuilder;
