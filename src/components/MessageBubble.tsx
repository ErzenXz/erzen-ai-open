import { User, Bot, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentProps } from 'react';

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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Bot size={18} className="text-white" />
        </div>
      )}
      
      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto shadow-blue-500/25'
              : 'bg-white border border-slate-200 text-slate-900 shadow-slate-900/5'
          }`}
        >
          {/* Enhanced attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-4 space-y-3">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  {attachment.type === "image" ? (
                    <div className="rounded-lg overflow-hidden shadow-md">
                      <img
                        src={attachment.url || "/placeholder.svg"}
                        alt={attachment.name}
                        className="max-w-xs rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${
                      isUser ? 'bg-white/20' : 'bg-slate-50'
                    }`}>
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs">📎</span>
                      </div>
                      <span className="font-medium">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Render Markdown content */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-slate max-w-none dark:prose-invert"
            components={{
              a: (props: ComponentProps<'a'>) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Enhanced tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.toolCalls.map((toolCall, index) => (
                <div key={index} className={`flex items-start gap-3 text-sm p-3 rounded-lg ${
                  isUser ? 'bg-white/20' : 'bg-slate-50'
                }`}>
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Wrench size={12} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-emerald-700">Used {toolCall.name}</div>
                    {toolCall.result && (
                      <div className="text-xs mt-1 opacity-75 font-mono bg-slate-100 rounded px-2 py-1 mt-2">
                        {JSON.stringify(toolCall.result).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-slate-500 mt-2 px-1 ${isUser ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {new Date(message._creationTime).toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  );
}
