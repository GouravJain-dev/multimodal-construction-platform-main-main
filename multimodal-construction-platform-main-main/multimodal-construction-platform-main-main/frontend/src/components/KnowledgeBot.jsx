import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, CornerDownRight } from 'lucide-react';
import { sendChatMessage } from '../api/client';

const QUICK_QUESTIONS = [
  'What is the minimum curing period for OPC concrete according to ACI 308?',
  'What are OSHA 1926 guardrail height and force criteria?',
  'How to diagnose a 45-degree diagonal crack in a reinforced beam?',
  'What are the standard slump and water-cement ratios for M25 concrete?'
];

export default function KnowledgeBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Construction Intelligence Assistant. I am specialized in structural concrete (ACI 318), occupational site safety (OSHA 1926), building codes (IBC), and CPM scheduling. How can I assist you with field engineering or technical specifications today?',
      citations: ['ACI 318-19 Building Code', 'OSHA 29 CFR 1926 Standards', 'International Building Code 2024'],
      suggested_followups: [
        'What is the minimum curing period for OPC concrete according to ACI 308?',
        'What are OSHA 1926 guardrail height and force criteria?',
        'How to diagnose a 45-degree diagonal crack in a reinforced beam?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(query, historyPayload);
      setMessages([...updatedHistory, {
        role: 'assistant',
        content: res.response,
        citations: res.citations || [],
        suggested_followups: res.suggested_followups || []
      }]);
    } catch (err) {
      setMessages([...updatedHistory, {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to retrieve response from assistant.'}`,
        citations: [],
        suggested_followups: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-zinc-200">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-[#0ea5e9]" />
          <span>Quick Inquiries:</span>
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#0d1424] hover:bg-[#141f38] border border-[#1c263c] text-zinc-300 transition cursor-pointer truncate max-w-xs"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="tactical-card flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#131d31] text-[#0ea5e9] flex items-center justify-center shrink-0 border border-[#223354] mt-0.5">
                  <Bot className="w-4 h-4 text-[#0ea5e9]" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-lg p-3.5 space-y-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black font-medium self-end'
                  : 'bg-[#0b101d] border border-[#1e2a42] text-zinc-200'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-[#1a253a] space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Code References:</span>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((cite, cIdx) => (
                        <span key={cIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162138] text-zinc-300 border border-[#233558]">
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                  <div className="pt-2 border-t border-[#1a253a] space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Suggested Next Questions:</span>
                    <div className="space-y-1">
                      {msg.suggested_followups.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSend(f)}
                          className="text-left text-[11px] text-zinc-300 hover:text-white flex items-center space-x-1.5 transition cursor-pointer group"
                        >
                          <CornerDownRight className="w-3 h-3 text-zinc-500 group-hover:text-white shrink-0" />
                          <span className="underline decoration-white/20 underline-offset-2">{f}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  <User className="w-4 h-4 text-black" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-zinc-400 pl-10">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
              <span>Consulting civil engineering knowledge base...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-[#1c263c] bg-[#090e1a]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about building codes, concrete hydration, rebar lap lengths, OSHA rules..."
              className="flex-1 px-3.5 py-2 rounded-md bg-[#0b101d] border border-[#1e2a42] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#3b5380]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center space-x-1"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
