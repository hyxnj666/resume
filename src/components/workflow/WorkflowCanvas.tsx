'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkflowNode, type WorkflowNodeData, type WorkflowNodeType } from './WorkflowNode';
import { nodeMeta } from './WorkflowNode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  workflow: WorkflowNode as React.ComponentType<Parameters<typeof WorkflowNode>[0]>,
};

const initialNodes: Node<WorkflowNodeData>[] = [
  { id: '1', type: 'workflow', position: { x: 200, y: 0 }, data: { type: 'prompt' } },
  { id: '2', type: 'workflow', position: { x: 200, y: 100 }, data: { type: 'knowledge' } },
  { id: '3', type: 'workflow', position: { x: 200, y: 200 }, data: { type: 'llm' } },
  { id: '4', type: 'workflow', position: { x: 200, y: 300 }, data: { type: 'output' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

let nodeId = 5;

function generateId() {
  return String(nodeId++);
}

type RunResult = { output: string; steps: { nodeId: string; type: string; result: string }[] } | null;

export function WorkflowCanvas({
  addNodeLabel = '添加节点',
  runInputLabel = '输入',
  runButtonLabel = '运行',
  runResultTitle = '执行结果',
  runStepsTitle = '步骤',
  runEmptyHint = '输入内容后点击运行，将按流程顺序执行（Prompt → LLM → Knowledge → Output）',
  runErrorPrefix = '执行失败：',
  runRunningLabel = '执行中…',
  locale = 'zh',
  nodeConfigTitle = '节点配置',
  nodeContentLabel = '内容',
  nodeContentPromptPlaceholder = '提示词，不填则使用上游输入',
  nodeContentLLMPlaceholder = '默认用户消息（可选）',
  nodeSystemPromptLabel = '系统提示词',
  nodeSystemPromptPlaceholder = '不填则使用默认助手设定',
  nodeContentKnowledgePlaceholder = '自定义知识片段，不填则使用简历知识库',
  nodeContentToolPlaceholder = '工具说明，不填则显示「工具已执行」',
}: {
  addNodeLabel?: string;
  runInputLabel?: string;
  runButtonLabel?: string;
  runResultTitle?: string;
  runStepsTitle?: string;
  runEmptyHint?: string;
  runErrorPrefix?: string;
  runRunningLabel?: string;
  locale?: 'zh' | 'en';
  nodeConfigTitle?: string;
  nodeContentLabel?: string;
  nodeContentPromptPlaceholder?: string;
  nodeContentLLMPlaceholder?: string;
  nodeSystemPromptLabel?: string;
  nodeSystemPromptPlaceholder?: string;
  nodeContentKnowledgePlaceholder?: string;
  nodeContentToolPlaceholder?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [runInput, setRunInput] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | { error: string } | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodesEdgesRef = useRef<{ nodes: Node<WorkflowNodeData>[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const runInputRef = useRef('');
  nodesEdgesRef.current = { nodes: nodes as Node<WorkflowNodeData>[], edges };
  runInputRef.current = runInput;

  const selectedNode = selectedNodeId ? (nodes as Node<WorkflowNodeData>[]).find((n) => n.id === selectedNodeId) : null;

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    if (selectedNodes.length === 1) setSelectedNodeId(selectedNodes[0].id);
    else setSelectedNodeId(null);
  }, []);

  const updateSelectedNodeData = useCallback(
    (patch: Partial<Pick<WorkflowNodeData, 'content' | 'systemPrompt'>>) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...(n.data as WorkflowNodeData), ...patch } } : n
        )
      );
      nodesEdgesRef.current = {
        ...nodesEdgesRef.current,
        nodes: nodesEdgesRef.current.nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...(n.data as WorkflowNodeData), ...patch } } : n
        ),
      };
    },
    [selectedNodeId, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onAddNode = useCallback(
    (type: WorkflowNodeType) => {
      const id = generateId();
      const newNode = {
        id,
        type: 'workflow',
        position: { x: 250 + (nodes.length % 3) * 180, y: 80 + Math.floor(nodes.length / 3) * 120 },
        data: { type },
      } as Node<WorkflowNodeData>;
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const onRun = useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } = nodesEdgesRef.current;
    const payloadNodes = currentNodes.map((n) => {
      const d = n.data as WorkflowNodeData;
      return {
        id: n.id,
        data: {
          type: (d?.type ?? 'prompt') as WorkflowNodeType,
          content: typeof d?.content === 'string' ? d.content : undefined,
          systemPrompt: typeof d?.systemPrompt === 'string' ? d.systemPrompt : undefined,
        },
      };
    });
    const payloadEdges = currentEdges.map((e) => ({ source: e.source, target: e.target }));

    setRunLoading(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: payloadNodes,
          edges: payloadEdges,
          input: (runInputRef.current || '').trim() || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunResult({ error: data.error ?? res.statusText });
        return;
      }
      setRunResult({ output: data.output ?? '', steps: data.steps ?? [] });
      setShowSteps(true);
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setRunLoading(false);
    }
  }, [runInput, locale]);

  return (
    <div className="space-y-4">
    <div ref={reactFlowWrapper} className="h-[520px] w-full overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.95)] [&_.react-flow]:h-full [&_.react-flow]:w-full">
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-slate-600/60 bg-slate-800/92 p-2 shadow-lg backdrop-blur-md">
        <span className="px-2 py-1 text-xs font-medium text-slate-400">{addNodeLabel}</span>
        {(Object.keys(nodeMeta) as WorkflowNodeType[]).map((type) => {
          const meta = nodeMeta[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAddNode(type)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                'text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {meta.label}
            </button>
          );
        })}
      </div>
      <ReactFlow
        nodes={nodes as Node<WorkflowNodeData>[]}
        edges={edges}
        onNodesChange={onNodesChange as (changes: unknown) => void}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="workflow-theme"
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'rgba(34, 211, 238, 0.5)' },
          animated: true,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(34, 211, 238, 0.15)" />
        <Controls
          className="!bg-slate-800/90 !border-slate-600 !rounded-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-slate-200 [&>button:hover]:!bg-cyan-500/20 [&>button:hover]:!text-cyan-300"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-slate-800/90 !border-slate-600"
          nodeColor={(n) => {
            const d = (n as Node<WorkflowNodeData>).data;
            return d?.type === 'output' ? 'rgba(100, 116, 139, 0.8)' : 'rgba(34, 211, 238, 0.35)';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
        />
      </ReactFlow>
    </div>

      {selectedNode && (
        <div className="ai-section-panel space-y-3 p-4">
          <p className="text-sm font-medium text-cyan-400">{nodeConfigTitle} · {(selectedNode.data as WorkflowNodeData).type}</p>
          {selectedNode.data && (['prompt', 'llm', 'knowledge', 'tool'].includes((selectedNode.data as WorkflowNodeData).type)) && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">{nodeContentLabel}</label>
              <textarea
                placeholder={
                  (selectedNode.data as WorkflowNodeData).type === 'prompt'
                    ? nodeContentPromptPlaceholder
                    : (selectedNode.data as WorkflowNodeData).type === 'llm'
                      ? nodeContentLLMPlaceholder
                      : (selectedNode.data as WorkflowNodeData).type === 'knowledge'
                        ? nodeContentKnowledgePlaceholder
                        : nodeContentToolPlaceholder
                }
                value={((selectedNode.data as WorkflowNodeData).content as string) ?? ''}
                onChange={(e) => updateSelectedNodeData({ content: e.target.value })}
                rows={3}
                className="chat-list-scrollbar w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
              />
            </div>
          )}
          {selectedNode.data && (selectedNode.data as WorkflowNodeData).type === 'llm' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">{nodeSystemPromptLabel}</label>
              <textarea
                placeholder={nodeSystemPromptPlaceholder}
                value={((selectedNode.data as WorkflowNodeData).systemPrompt as string) ?? ''}
                onChange={(e) => updateSelectedNodeData({ systemPrompt: e.target.value })}
                rows={2}
                className="chat-list-scrollbar w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
              />
            </div>
          )}
        </div>
      )}

      <div className="ai-section-panel space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-400">{runInputLabel}</label>
            <textarea
              placeholder={runEmptyHint}
              value={runInput}
              onChange={(e) => {
                const v = e.target.value;
                setRunInput(v);
                runInputRef.current = v;
              }}
              disabled={runLoading}
              rows={2}
              className="chat-list-scrollbar w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y min-h-[60px]"
            />
          </div>
          <Button onClick={onRun} disabled={runLoading} className="shrink-0 gap-2">
            {runLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {runLoading ? runRunningLabel : runButtonLabel}
          </Button>
        </div>

        {runResult && (
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/75 p-4 space-y-3">
            {'error' in runResult ? (
              <p className="text-sm text-red-400">{runErrorPrefix}{runResult.error}</p>
            ) : (
              <>
                <p className="text-xs font-medium text-slate-400">{runResultTitle}</p>
                <div className="rounded bg-slate-800/80 p-3 text-sm text-slate-200 whitespace-pre-wrap">
                  {runResult.output || '(无输出)'}
                </div>
                {runResult.steps && runResult.steps.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSteps((s) => !s)}
                      className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {runStepsTitle} ({runResult.steps.length})
                    </button>
                    {showSteps && (
                      <ul className="mt-2 space-y-2">
                        {runResult.steps.map((s, i) => (
                          <li key={s.nodeId} className="rounded border border-slate-600/60 bg-slate-800/60 px-3 py-2">
                            <span className="text-xs text-cyan-400 font-mono">{s.type}</span>
                            <p className="mt-1 text-xs text-slate-400 whitespace-pre-wrap line-clamp-3">{s.result}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
