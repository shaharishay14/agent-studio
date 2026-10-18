import { Search, BarChart3, Code2, Mail, FileText, Briefcase, GraduationCap, Sparkles, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Template {
  name: string;
  prompt: string;
}

export interface Category {
  icon: LucideIcon;
  label: string;
  templates: Template[];
}

export const categories: Category[] = [
  {
    icon: Search,
    label: 'Research & Information',
    templates: [
      {
        name: 'Research Assistant',
        prompt: 'Build an agent that helps with comprehensive research, gathering information from multiple sources, and providing detailed summaries on any topic'
      },
      {
        name: 'News Analyzer',
        prompt: 'Build an agent that monitors and analyzes news from various sources, identifies trending topics, and provides concise summaries of important events'
      },
      {
        name: 'Academic Helper',
        prompt: 'Build an agent that assists with academic research, helps find scholarly articles, explains complex concepts, and helps with citations and references'
      }
    ]
  },
  {
    icon: BarChart3,
    label: 'Project Management',
    templates: [
      {
        name: 'Task Manager',
        prompt: 'Build an agent that helps organize and prioritize tasks, tracks project progress, sends reminders, and generates status reports'
      },
      {
        name: 'Sprint Planner',
        prompt: 'Build an agent that assists with agile sprint planning, manages user stories, tracks velocity, and coordinates team activities'
      },
      {
        name: 'Meeting Coordinator',
        prompt: 'Build an agent that schedules meetings, sends invitations, prepares agendas, takes notes, and tracks action items'
      }
    ]
  },
  {
    icon: Code2,
    label: 'Developer & Code',
    templates: [
      {
        name: 'Code Reviewer',
        prompt: 'Build an agent that reviews code for best practices, identifies potential bugs, suggests improvements, and ensures code quality standards'
      },
      {
        name: 'Documentation Writer',
        prompt: 'Build an agent that generates clear and comprehensive technical documentation, API references, and code comments automatically'
      },
      {
        name: 'Debug Assistant',
        prompt: 'Build an agent that helps troubleshoot code issues, analyzes error messages, suggests solutions, and provides debugging strategies'
      }
    ]
  },
  {
    icon: Mail,
    label: 'Communication & Marketing',
    templates: [
      {
        name: 'Email Composer',
        prompt: 'Build an agent that helps write professional emails, crafts compelling subject lines, and adapts tone for different audiences'
      },
      {
        name: 'Social Media Manager',
        prompt: 'Build an agent that creates engaging social media posts, suggests optimal posting times, and helps maintain consistent brand voice'
      },
      {
        name: 'Content Strategist',
        prompt: 'Build an agent that develops content strategies, identifies trending topics, and creates content calendars for marketing campaigns'
      }
    ]
  },
  {
    icon: FileText,
    label: 'Document & File Processing',
    templates: [
      {
        name: 'Document Summarizer',
        prompt: 'Build an agent that reads long documents and creates concise summaries, extracts key points, and highlights important information'
      },
      {
        name: 'File Organizer',
        prompt: 'Build an agent that helps organize files and documents, suggests folder structures, and maintains naming conventions'
      },
      {
        name: 'Contract Analyzer',
        prompt: 'Build an agent that reviews contracts and legal documents, identifies key terms, flags potential issues, and explains complex clauses'
      }
    ]
  },
  {
    icon: Briefcase,
    label: 'Business & Productivity',
    templates: [
      {
        name: 'Business Analyst',
        prompt: 'Build an agent that analyzes business data, generates insights, creates reports, and helps make data-driven decisions'
      },
      {
        name: 'Sales Assistant',
        prompt: 'Build an agent that helps manage sales pipelines, tracks leads, generates proposals, and provides sales analytics'
      },
      {
        name: 'Productivity Coach',
        prompt: 'Build an agent that helps improve productivity, suggests time management techniques, and tracks goals and habits'
      }
    ]
  },
  {
    icon: GraduationCap,
    label: 'Education & Learning',
    templates: [
      {
        name: 'Study Buddy',
        prompt: 'Build an agent that helps with studying, creates flashcards, explains difficult concepts, and generates practice questions'
      },
      {
        name: 'Language Tutor',
        prompt: 'Build an agent that helps learn new languages, provides translations, explains grammar rules, and practices conversations'
      },
      {
        name: 'Course Creator',
        prompt: 'Build an agent that designs educational courses, structures learning materials, creates lesson plans, and generates assessments'
      }
    ]
  },
  {
    icon: Sparkles,
    label: 'Creative & Writing',
    templates: [
      {
        name: 'Story Writer',
        prompt: 'Build an agent that helps write creative stories, develops characters, suggests plot twists, and maintains narrative consistency'
      },
      {
        name: 'Blog Post Creator',
        prompt: 'Build an agent that writes engaging blog posts, optimizes for SEO, suggests headlines, and maintains consistent style'
      },
      {
        name: 'Creative Brainstormer',
        prompt: 'Build an agent that generates creative ideas, helps overcome writer\'s block, and provides inspiration for creative projects'
      }
    ]
  },
  {
    icon: Heart,
    label: 'Personal Assistant',
    templates: [
      {
        name: 'Daily Planner',
        prompt: 'Build an agent that helps plan daily activities, sets priorities, manages calendar, and sends timely reminders'
      },
      {
        name: 'Travel Organizer',
        prompt: 'Build an agent that helps plan trips, suggests destinations, books accommodations, and creates detailed itineraries'
      },
      {
        name: 'Health & Wellness Coach',
        prompt: 'Build an agent that tracks health goals, suggests workout routines, provides nutrition advice, and monitors wellness progress'
      }
    ]
  }
];

