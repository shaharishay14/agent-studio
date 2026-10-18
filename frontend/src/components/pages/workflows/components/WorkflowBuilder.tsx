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
import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { useGetWorkflows } from '../hooks';

const nodeTypes = {
  startNode: StartNode,
  agentNode: AgentNode,
  addAgentNode: AddAgentNode,
};

interface WorkflowBuilderProps {
  workflowId: number;
}

function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const { isDarkMode } = useDarkModeStore();
  const { openAddAgentToWorkflowModal, openRemoveAgentFromWorkflowModal } = useModalsStore();
  const { workflows } = useGetWorkflows();
  
  // שמור את תוצאות הביצוע לכל agent
  const [executionResults, setExecutionResults] = useState<Record<string, string>>({});

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
  }, [currentWorkflow, handleAddAgent, handleDeleteAgent, handleOpenAgentInNewTab, handleExecutionResult, executionResults]);

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
        style: { stroke: '#a855f7', strokeWidth: 2 },
      });
      
      // חבר בין ה-agents
      for (let i = 1; i < agents.length; i++) {
        edges.push({
          id: `e-agent-${i}-agent-${i + 1}`,
          source: `agent-${i}`,
          target: `agent-${i + 1}`,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 },
        });
      }
      
      // חבר Agent האחרון -> Add Button
      edges.push({
        id: `e-agent-${agents.length}-add`,
        source: `agent-${agents.length}`,
        target: 'add-agent',
        animated: true,
        style: { stroke: '#ec4899', strokeWidth: 2 },
      });
    } else {
      // חבר Start -> Add Button ישירות
      edges.push({
        id: 'e1-add',
        source: '1',
        target: 'add-agent',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
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
        style: { stroke: '#a855f7', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  return (
    <div className="flex-1 relative">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none ${
        isDarkMode
          ? 'bg-gradient-to-b from-gray-900/80 to-transparent'
          : 'bg-gradient-to-b from-white/90 to-transparent'
      }`}>
        <div className="flex items-center justify-between pointer-events-auto">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${
              isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
            }`}>{currentWorkflow?.name || 'Workflow'}</h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {currentWorkflow?.description || 'No description'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              isDarkMode
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-purple-100 text-purple-700 border border-purple-300'
            }`}>
              🟣 {currentWorkflow?.nodes || 0} nodes
            </span>
          </div>
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
        className="bg-transparent"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDarkMode ? "#a855f740" : "#a855f730"}
        />
        <Controls 
          className={
            isDarkMode
              ? "!bg-white/[0.05] !border-white/[0.1] [&_button]:!bg-white/[0.05] [&_button]:!border-white/[0.1] [&_button]:!text-white hover:[&_button]:!bg-white/[0.1]"
              : "!bg-white/90 !border-purple-300 [&_button]:!bg-white [&_button]:!border-purple-300 [&_button]:!text-purple-700 hover:[&_button]:!bg-purple-100"
          }
        />
      </ReactFlow>
    </div>
  );
}

export default WorkflowBuilder;

