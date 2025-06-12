import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { MessageInput } from "./MessageInput";
import { SettingsModal } from "./SettingsModal";
import { Menu, Settings } from "lucide-react";
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

      await generateResponse({
        conversationId,
        messages: messageHistory,
        provider: provider as any,
        model,
        temperature: preferences?.temperature,
        maxTokens: preferences?.maxTokens,
        enabledTools: toolsToUse,
      });
    } catch (error) {
      console.error("Failed to generate response:", error);
      // The error message will already be saved as an assistant message by the AI action
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">AI Chatbot</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
            <SignOutButton />
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatArea 
            messages={messages} 
            isGenerating={isGenerating}
            conversationId={currentConversationId}
          />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
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
