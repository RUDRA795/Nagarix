import { Metadata } from 'next';
import { CopilotClient } from '@/components/ai/CopilotClient';

export const metadata: Metadata = {
  title: 'AI City Copilot',
  description: 'NagariX AI Copilot — ask natural-language questions about Nagpur civic data for municipal decision-making.',
};

export default function CopilotPage() {
  return <CopilotClient />;
}
