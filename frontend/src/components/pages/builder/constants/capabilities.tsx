import { User, Workflow, Clock, Database } from 'lucide-react';

export interface Capability {
  id: number;
  icon: React.ReactNode;
  title: string;
  titleHighlight: string;
  description: string;
  color: string;
}

export const capabilities: Capability[] = [
  {
    id: 1,
    icon: <User className="w-full h-full" />,
    title: 'Build Smart',
    titleHighlight: 'Agents',
    description: 'AI teammates that handle the work so you focus on impact',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 2,
    icon: <Workflow className="w-full h-full" />,
    title: 'Combine Them To Powerful',
    titleHighlight: 'Workflows',
    description: 'Link agents seamlessly to create processes that get real work done',
    color: 'from-blue-500 to-purple-500'
  },
  {
    id: 3,
    icon: <Clock className="w-full h-full" />,
    title: 'Control Their Execution With',
    titleHighlight: 'Triggers',
    description: 'Make them run autonomously when events or schedules call for it',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 4,
    icon: <Database className="w-full h-full" />,
    title: 'Integrate',
    titleHighlight: 'With Your Real Data',
    description: 'Connect to all your tools and data sources seamlessly',
    color: 'from-purple-500 to-pink-500'
  }
];

