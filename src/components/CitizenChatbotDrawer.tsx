import React, { useState } from 'react';
import { api } from '../services/api.js';
import { X, Send, Bot, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  language?: string;
  retrievedProjects?: any[];
  timestamp: string;
}

export const CitizenChatbotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Namaste! I am the Official MPLADS Public Transparency AI Assistant. You can ask me in English, Hindi (हिंदी), or Telugu (తెలుగు) about any developmental work, sanction order, or budget allocation.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    { label: 'Hindi', query: 'हैदराबाद में कौन से कार्य स्वीकृत हैं?' },
    { label: 'Telugu', query: 'అంబర్‌పేటలో కమ్యూనిటీ హాల్ బడ్జెట్ ఎంత?' },
    { label: 'English', query: 'Which projects are flagged as delayed or high risk?' }
  ];

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);
    try {
      const res = await api.queryChatbot(q);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        language: res.detectedLanguage,
        retrievedProjects: res.retrievedProjects,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Unable to retrieve records right now. Please verify network connectivity.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1B3022] text-white shadow-xl hover:bg-[#284431] border border-[#C8D5B9] transition-transform hover:scale-105 cursor-pointer font-sans"
        >
          <Bot className="w-5 h-5 text-[#A3B18A]" />
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">Ask MPLADS AI</div>
            <div className="text-[10px] text-[#C8D5B9] leading-tight">सार्वजनिक मित्र</div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-[#DDE5D4] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#1B3022] text-white p-3.5 flex items-center justify-between border-b-2 border-[#C8D5B9]">
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-[#A3B18A]" />
              <div className="text-xs font-bold tracking-tight">MPLADS Citizen Inquiry AI (RAG)</div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-[#C8D5B9] hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#F8F9F7] px-3 py-2 border-b border-[#DDE5D4] flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
            {quickPrompts.map((qp, idx) => (
              <button key={idx} onClick={() => handleSendQuery(qp.query)} className="px-2 py-0.5 rounded-full bg-white border border-[#C8D5B9] text-[#2D4A32] hover:bg-[#EAF0E6] cursor-pointer">
                {qp.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-[#FAFBF9]">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2.5 ${m.sender === 'bot' ? 'items-start' : 'items-end justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-2xs leading-relaxed ${m.sender === 'bot' ? 'bg-white text-[#1B3022] border border-[#DDE5D4]' : 'bg-[#395C40] text-white'}`}>
                  <div className="whitespace-pre-line">{m.text}</div>
                  <div className="text-[9px] text-gray-400 text-right mt-1">{m.timestamp}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#588157] bg-white p-2.5 rounded-xl border border-[#DDE5D4] w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching official MPLADS records...</span>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-white border-t border-[#DDE5D4]">
            <form onSubmit={e => { e.preventDefault(); handleSendQuery(); }} className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="Ask about projects, funds, delays..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#C8D5B9] bg-[#F8F9F7]"
              />
              <button type="submit" disabled={!inputQuery.trim() || loading} className="p-2 rounded-lg bg-[#1B3022] text-white cursor-pointer">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
