import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Bot, MessageCircle, Sparkles, Zap, Brain } from 'lucide-react';

interface ChatAreaProps {
  messages: any[];
  isGenerating: boolean;
  conversationId: Id<"conversations"> | null;
}

export function ChatArea({ messages, isGenerating, conversationId }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Enhanced welcome section */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
              <Bot size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Welcome to ErzenAI
            </h2>
            <p className="text-slate-600 text-lg mb-8 font-light">
              Start a conversation and experience the power of AI
            </p>
          </div>

          {/* Enhanced features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Brain size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Multi-Provider AI</h3>
              <p className="text-sm text-slate-600">Access OpenAI, Anthropic, Google, and more</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Smart Tools</h3>
              <p className="text-sm text-slate-600">Web search, calculator, weather, and more</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Sparkles size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Multimodal</h3>
              <p className="text-sm text-slate-600">Images, files, and rich conversations</p>
            </div>
          </div>

          <div className="text-slate-500 text-sm">
            Click "New Chat" or start typing to begin your conversation
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <MessageCircle size={32} className="text-white" />
            </div>
            <p className="text-slate-600 text-lg font-light">Start your conversation...</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        )}
        
        {isGenerating && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
