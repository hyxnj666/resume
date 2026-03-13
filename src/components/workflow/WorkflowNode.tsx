'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookOpen, Bot, FileText, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeMeta: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; borderColor: string; bgColor: string }
> = {
  prompt: {
    label: 'Prompt',
    icon: FileText,
    borderColor: 'border-cyan-500/50',
    bgColor: 'bg-cyan-500/10',
  },
  llm: {
    label: 'LLM',
    icon: Bot,
    borderColor: 'border-cyan-400/60',
    bgColor: 'bg-cyan-500/15',
  },
  knowledge: {
    label: 'Knowledge',
    icon: BookOpen,
    borderColor: 'border-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
  },
  tool: {
    label: 'Tool',
    icon: Loader2,
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-500/10',
  },
  output: {
    label: 'Output',
    icon: Send,
    borderColor: 'border-slate-400/50',
    bgColor: 'bg-slate-500/15',
  },
};

export type WorkflowNodeType = keyof typeof nodeMeta;

export interface WorkflowNodeData extends Record<string, unknown> {
  type: WorkflowNodeType;
  label?: string;
  /** 节点自定义内容：Prompt=提示词，LLM=默认说明，Knowledge=自定义知识片段，Tool=工具说明 */
  content?: string;
  /** 仅 LLM 节点：系统提示词，不填则用默认 */
  systemPrompt?: string;
}

function WorkflowNodeComponent(props: NodeProps) {
  const { data, selected } = props;
  const type = ((data as WorkflowNodeData)?.type ?? 'prompt') as WorkflowNodeType;
  const meta = nodeMeta[type] ?? nodeMeta.prompt;
  const Icon = meta.icon;
  const label = (data as WorkflowNodeData)?.label ?? meta.label;
  const content = (data as WorkflowNodeData)?.content;
  const hasContent = typeof content === 'string' && content.trim().length > 0;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2 !border-cyan-400 !bg-slate-800" />
      <div
        className={cn(
          'rounded-lg border-2 px-3 py-2 min-w-[120px] shadow-lg transition-all',
          meta.borderColor,
          meta.bgColor,
          selected ? 'ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-slate-900' : ''
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="rounded bg-slate-800/80 p-1">
              <Icon className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-slate-200">{label}</span>
          </div>
          {hasContent && (
            <p className="text-xs text-slate-500 truncate max-w-[140px]" title={content}>
              {content.trim().length > 24 ? `${content.trim().slice(0, 24)}…` : content.trim()}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2 !border-cyan-400 !bg-slate-800" />
    </>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);

export { nodeMeta };
