import type { FAQItem } from '../types';

export const faqData: FAQItem[] = [
  {
    question: 'What does YOLO mode do?',
    answer:
      "You write one sentence and we pick the tools, files and prompt for you. You can change any of it later in the agent's settings.",
  },
  {
    question: 'Can my agent send email on its own?',
    answer:
      'Only after you approve it. Sends, posts and deletes show you the tool, the reason and the exact details, and wait for Approve or Deny.',
  },
  {
    question: 'What can I connect?',
    answer:
      'Gmail, WhatsApp, Telegram and the other services listed under Integrations. You sign in once and can disconnect at any time.',
  },
  {
    question: 'Can I put an agent on my website?',
    answer: 'Yes. Every agent has a public chat link, a QR code and an embed snippet you paste into your page.',
  },
  {
    question: 'Is Agent Studio open source?',
    answer: 'Yes. The code is on GitHub.',
  },
];
