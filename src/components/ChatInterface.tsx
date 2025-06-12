import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { MessageInput } from "./MessageInput";
import { SettingsModal } from "./SettingsModal";
import { Menu, Settings, Sparkles } from 'lucide-react';
import { SignOutButton } from "../SignOutButton";

export function ChatInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const conversations = useQuery(api.conversations.list) || [];
  const messages = useQuery(
    api.messages.list,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  ) || [];
  
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.messages.add);
  const generateResponse = useAction(api.ai.generateResponse);
  const generateStreamingResponse = useAction(api.ai.generateStreamingResponse);
  const preferences = useQuery(api.preferences.get);

  // Auto-select first conversation or create one
  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0]._id);
    }
  }, [conversations, currentConversationId]);

  const handleNewConversation = async () => {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    const conversationId = await createConversation({ title });
    setCurrentConversationId(conversationId);
  };

  const handleSendMessage = async (
    content: string, 
    attachments?: any[], 
    selectedModel?: { provider: string; model: string },
    enabledTools?: string[]
  ) => {
    if (!content.trim() || isGenerating) return;

    let conversationId = currentConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      conversationId = await createConversation({ title });
      setCurrentConversationId(conversationId);
    }

    // Add user message
    await addMessage({
      conversationId,
      role: "user",
      content,
      attachments,
    });

    // Generate AI response
    setIsGenerating(true);
    try {
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      messageHistory.push({ role: "user" as const, content });

      // Use selected model or fall back to preferences
      const provider = selectedModel?.provider || preferences?.aiProvider;
      const model = selectedModel?.model || preferences?.model;
      const toolsToUse = enabledTools || preferences?.enabledTools || [];

      // Use streaming only when no tools are enabled, otherwise use regular generation
      if (toolsToUse.length === 0) {
        await generateStreamingResponse({
          conversationId,
          messages: messageHistory,
          provider: provider as any,
          model,
          temperature: preferences?.temperature,
          maxTokens: preferences?.maxTokens,
          enabledTools: toolsToUse,
        });
      } else {
        await generateResponse({
          conversationId,
          messages: messageHistory,
          provider: provider as any,
          model,
          temperature: preferences?.temperature,
          maxTokens: preferences?.maxTokens,
          enabledTools: toolsToUse,
        });
      }
    } catch (error) {
      console.error("Failed to generate response:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                ErzenAI
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <Settings size={20} className="text-slate-600 group-hover:rotate-90 transition-transform duration-200" />
            </button>
            <SignOutButton />
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0">
          <ChatArea
            messages={messages}
            isGenerating={isGenerating}
            conversationId={currentConversationId}
          />
        </div>

        {/* Enhanced Message Input */}
        <div className="border-t border-slate-200/50 bg-white/80 backdrop-blur-xl p-6">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          preferences={preferences}
        />
      )}
    </div>
  );
}
