import { User, Bot, Wrench } from "lucide-react";

interface MessageBubbleProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
    attachments?: any[];
    toolCalls?: any[];
    _creationTime: number;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-xs rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                      <span>📎</span>
                      <span>{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.toolCalls.map((toolCall, index) => (
                <div key={index} className="flex items-start gap-2 text-sm opacity-75">
                  <Wrench size={14} className="mt-0.5" />
                  <div>
                    <div className="font-medium">Used {toolCall.name}</div>
                    {toolCall.result && (
                      <div className="text-xs mt-1 opacity-75">
                        {JSON.stringify(toolCall.result).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message._creationTime).toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
}
