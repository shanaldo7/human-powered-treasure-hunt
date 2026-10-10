import React, { useState } from 'react';
import { TreasureHunt, DiscoveryCategory } from '../types/hunt';
import { Compass, X, Send, RefreshCw, MapPin, Play } from 'lucide-react';

interface HuntGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeHunt?: TreasureHunt | null;
  onStartHunt?: (params: { locationName: string; durationMinutes: number; mode: DiscoveryCategory }) => void;
}

export const HuntGuideDrawer: React.FC<HuntGuideDrawerProps> = ({
  isOpen,
  onClose,
  activeHunt,
  onStartHunt
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: activeHunt
        ? `Ready to guide your quest! You are currently on Stop #${activeHunt.currentStopNumber} of "${activeHunt.title}". How can I help you in the field?`
        : 'Welcome! I am your Hunt Guide. Select a location (e.g. Kolkata) and duration (e.g. 15 minutes) and I will build your real-world treasure hunt!'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingHuntTrigger, setPendingHuntTrigger] = useState<{ locationName: string; durationMinutes: number; mode: DiscoveryCategory } | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userTurn = { role: 'user' as const, text: textToSend.trim() };
    setMessages(prev => [...prev, userTurn]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          activeHunt: activeHunt || undefined,
          history: [...messages, userTurn]
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);

        if (data.triggerHunt) {
          setPendingHuntTrigger(data.triggerHunt);
          if (onStartHunt) {
            onStartHunt(data.triggerHunt);
          }
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'I am here to guide your quest! Head toward the public landmark indicated on your clue.' }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Ready when you are! Check your clue or tap "Open in Google Maps" to reach your landmark.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col font-sans">
      {/* DRAWER HEADER */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <span>FIELD ASSISTANT</span>
            </div>
            <h3 className="text-base font-serif font-bold text-slate-100">
              HUNT GUIDE
            </h3>
          </div>
        </div>

        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* QUICK SUGGESTION TRIGGERS */}
      {activeHunt ? (
        <div className="bg-slate-900/50 p-3 border-b border-slate-800 space-y-1.5 text-xs font-mono">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Quick Assistance:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSendMessage("I'm confused about the clue. Can you give me a hint?")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px]"
            >
              💡 Need a hint
            </button>
            <button
              onClick={() => handleSendMessage("How do I navigate to the stop using Google Maps?")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px]"
            >
              🗺️ Maps help
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-3 border-b border-slate-800 space-y-1.5 text-xs font-mono">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Quick Prompts & Genres:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSendMessage("hi")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px]"
            >
              👋 "hi"
            </button>
            <button
              onClick={() => handleSendMessage("Horror & Haunted hunt in Kolkata for 30 minutes")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px]"
            >
              👻 Horror (30m)
            </button>
            <button
              onClick={() => handleSendMessage("Food & Street Eats hunt in Kolkata for 15 minutes")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px]"
            >
              🍜 Food (15m)
            </button>
            <button
              onClick={() => handleSendMessage("Architecture hunt in Kolkata for 60 minutes")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px]"
            >
              🏗️ Architecture (60m)
            </button>
          </div>
        </div>
      )}

      {/* CHAT MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {pendingHuntTrigger && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-mono">
              <Play className="w-3.5 h-3.5" />
              <span>Hunt Initialized: {pendingHuntTrigger.locationName} ({pendingHuntTrigger.durationMinutes} min)</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors text-center"
            >
              View Active Hunt
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 text-amber-300 border border-slate-800 p-3 rounded-2xl text-xs font-mono flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Hunt Guide researching route...</span>
            </div>
          </div>
        )}
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Hunt Guide anything..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
