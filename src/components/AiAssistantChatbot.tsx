import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  ShieldCheck,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { User } from '../types/index.ts';
import { queryAiAssistant } from '../services/api.ts';

interface AiAssistantChatbotProps {
  user: User | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectProject?: (workId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourcesCount?: number;
  followups?: string[];
}

const PRESET_QUERIES = [
  'Delayed projects',
  'High-risk projects',
  'Financial anomalies',
  'My constituency summary',
  'Unresolved citizen grievances'
];

export const AiAssistantChatbot: React.FC<AiAssistantChatbotProps> = ({
  user,
  isOpen,
  onToggle,
  onSelectProject
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### Result\nMPLADS AI Monitoring Assistant online. Ready for telemetry queries restricted to your authorized role: **${(
        user?.role || 'Citizen'
      ).toUpperCase()}**.\n\nSelect a common query or ask any question about project status, expenditures, or inspections:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followups: PRESET_QUERIES.slice(0, 4)
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, minimized]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await queryAiAssistant(textToSend.trim());
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourcesCount: response.sourceCount,
        followups: response.suggestedFollowups || PRESET_QUERIES.slice(0, 3)
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `### Notice\nUnable to retrieve assistant response: ${err.message || 'Server connection error'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. Ready for your questions on MPLADS project progress, financial disbursements, photo integrity, or grievances.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followups: PRESET_QUERIES.slice(0, 4)
      }
    ]);
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 mb-0.5 uppercase tracking-wider">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');
      const content = isBullet ? trimmed.replace(/^[-•]\s*/, '') : trimmed;

      const parts = content.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="pl-2 text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 my-0.5">
            <span className="text-blue-900 font-bold">•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1">
          {renderedParts}
        </p>
      );
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-2.5 rounded-full shadow-lg border border-slate-300 flex items-center gap-2 transition-transform hover:scale-105"
        title="Open AI Monitoring Assistant"
      >
        <Bot className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-bold tracking-wide">AI Assistant</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-200 shadow-xl border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col ${
        minimized
          ? 'bottom-4 right-4 w-72 h-12'
          : 'bottom-3 right-3 sm:bottom-4 sm:right-4 w-[calc(100vw-24px)] sm:w-[400px] h-[520px] max-h-[85vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700 select-none">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">AI Monitoring Assistant</div>
            <div className="text-[10px] text-slate-400">
              Role Scope: {(user?.role || 'Citizen').toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-300">
          <button
            type="button"
            onClick={handleClear}
            title="Clear Chat"
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            title={minimized ? 'Expand' : 'Minimize'}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggle}
            title="Close Assistant"
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded text-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-900 text-white'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <div>{renderFormattedText(m.text)}</div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {/* Followup suggested chips */}
                {m.sender === 'assistant' && m.followups && m.followups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSend(f)}
                        disabled={loading}
                        className="text-[10px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2.5 rounded border border-slate-200 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                <span>Analyzing database records...</span>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about project status, delays, expenditures..."
              className="flex-1 text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-slate-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
