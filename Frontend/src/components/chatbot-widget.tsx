'use client';

import { useEffect, useRef, useState } from 'react';

type ChatMessage = { role: 'user' | 'bot'; text: string };

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false
  });

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      if (!dragRef.current.active) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 12;
      const maxY = window.innerHeight - rect.height - 12;
      const nextX = Math.min(Math.max(event.clientX - dragRef.current.offsetX, 12), Math.max(12, maxX));
      const nextY = Math.min(Math.max(event.clientY - dragRef.current.offsetY, 12), Math.max(12, maxY));

      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(deltaX, deltaY) > 4) {
        dragRef.current.moved = true;
      }

      setPosition({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      dragRef.current.active = false;
      setDragging(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging]);

  const startDrag = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragRef.current.active = true;
    dragRef.current.offsetX = event.clientX - rect.left;
    dragRef.current.offsetY = event.clientY - rect.top;
    dragRef.current.startX = event.clientX;
    dragRef.current.startY = event.clientY;
    dragRef.current.moved = false;
    setPosition({ x: rect.left, y: rect.top });
    setDragging(true);
    event.preventDefault();
  };

  const toggleOpen = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen((prev) => !prev);
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/backend/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data = (await res.json()) as { answer?: string };
      const reply = data.answer?.trim() || 'No response from chatbot.';
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, the chatbot is unavailable right now.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed z-40 flex flex-col items-end gap-3 ${position ? '' : 'bottom-6 right-6'}`}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <button
        type="button"
        className={`focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-soft transition hover:scale-105 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={startDrag}
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label="Toggle chatbot"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v3" strokeLinecap="round" />
          <rect x="4" y="7" width="16" height="12" rx="3" />
          <circle cx="9" cy="13" r="1.5" />
          <circle cx="15" cy="13" r="1.5" />
          <path d="M8.5 17h7" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={`absolute right-0 bottom-full mb-3 w-[320px] overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-[transform,opacity] duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div
            className={`text-sm font-semibold uppercase tracking-[0.2em] text-muted ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={startDrag}
          >
            Chatbot
          </div>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          {messages.length === 0 ? (
            <div className="text-muted">
              Ask about movies, years, or ratings. Example: &quot;Top movies 2024&quot;.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`w-fit max-w-[85%] rounded-xl px-3 py-2 ${
                  message.role === 'user'
                    ? 'ml-auto bg-accent text-black'
                    : 'bg-bg/70 text-text'
                }`}
              >
                {message.text}
              </div>
            ))
          )}
          {loading ? <div className="text-muted">Thinking...</div> : null}
        </div>
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about a movie..."
              className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-text outline-none transition focus:border-accent"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-black transition hover:brightness-105"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
