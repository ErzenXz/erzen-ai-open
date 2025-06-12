import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Bot, MessageCircle } from "lucide-react";

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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Welcome to AI Chatbot</h2>
          <p className="text-gray-500 mb-6">Start a new conversation to begin chatting</p>
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-sm">
            <h3 className="font-semibold mb-3">Features:</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• Multi-provider AI support (OpenAI, Anthropic)</li>
              <li>• Tool calling (web search, calculator)</li>
              <li>• Multimodal support (images, files)</li>
              <li>• Persistent chat history</li>
              <li>• Customizable AI settings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Start your conversation...</p>
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
