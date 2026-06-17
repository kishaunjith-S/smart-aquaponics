'use client';

import Chatbot from '@/components/ui/chatbot';
import { MessageSquare } from 'lucide-react';

export default function ChatbotPage() {
  return (
    <div className="flex flex-col mx-auto max-w-screen-2xl px-4 sm:px-6 py-8" style={{ height: 'calc(100vh - 4rem)' }}>
      

      {/* Chat window — fills remaining height */}
      <div className="flex-1 min-h-0">
        <Chatbot />
      </div>
    </div>
  );
}
