import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, MessageSquare, Trash2, Edit2 } from "lucide-react";

interface SidebarProps {
  conversations: any[];
  currentConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onNewConversation: () => void;
}

export function Sidebar({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation 
}: SidebarProps) {
  const [editingId, setEditingId] = useState<Id<"conversations"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const deleteConversation = useMutation(api.conversations.remove);
  const updateTitle = useMutation(api.conversations.updateTitle);

  const handleDelete = async (id: Id<"conversations">) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation({ conversationId: id });
      if (currentConversationId === id) {
        onSelectConversation(conversations[0]?._id);
      }
    }
  };

  const handleEdit = (conversation: any) => {
    setEditingId(conversation._id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateTitle({ conversationId: editingId, title: editTitle.trim() });
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="h-full bg-white border-r flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`group relative mb-2 rounded-lg transition-colors ${
              currentConversationId === conversation._id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            {editingId === conversation._id ? (
              <div className="p-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  onBlur={handleSaveEdit}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => onSelectConversation(conversation._id)}
                className="w-full text-left p-3 flex items-start gap-3"
              >
                <MessageSquare size={16} className="mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(conversation.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            )}
            
            {/* Action buttons */}
            {editingId !== conversation._id && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(conversation);
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conversation._id);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
