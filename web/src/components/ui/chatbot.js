'use client';

import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Loader2, Copy, Check, Waves, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendChatMessage } from '@/lib/api';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

const parseMarkdown = (text) => {
  try {
    return marked.parse(text);
  } catch {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

const SUGGESTIONS = [
  'What is a healthy pH range for aquaculture?',
  'How does dissolved oxygen affect fish?',
  'Explain nitrate toxicity thresholds.',
  'What causes ammonia spikes in ponds?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
      <Waves className="h-4 w-4 text-white" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 dark:bg-slate-500 shadow-sm">
      <span className="text-xs font-bold text-white">U</span>
    </div>
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function FileChip({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 py-1.5 text-xs">
      {isImage ? (
        <img src={previewUrl} alt={file.name} className="h-6 w-6 rounded object-cover shrink-0" />
      ) : (
        <FileText className="h-4 w-4 text-teal-500 shrink-0" />
      )}
      <span className="max-w-[120px] truncate text-[hsl(var(--foreground))]">{file.name}</span>
      <button
        onClick={() => onRemove(file.name)}
        className="ml-0.5 rounded-full p-0.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-red-500 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function MessageAttachments({ attachments }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {attachments.map((att) =>
        att.isImage ? (
          <img
            key={att.name}
            src={att.previewUrl}
            alt={att.name}
            className="max-h-48 max-w-xs rounded-xl object-cover border border-white/20 shadow-sm"
          />
        ) : (
          <div key={att.name} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="max-w-[160px] truncate">{att.name}</span>
          </div>
        )
      )}
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your water quality assistant. I can help you with questions about pH, dissolved oxygen, nitrates, ammonia, and general aquaculture guidance. You can also upload images or files and I'll analyse them. How can I help?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File type not supported: ${file.name}. Allowed: images, PDF, TXT, CSV.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Max size is 10 MB.`);
        continue;
      }
      valid.push(file);
    }
    setAttachedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
    e.target.value = '';
  };

  const removeFile = (name) => setAttachedFiles((prev) => prev.filter((f) => f.name !== name));

  const handleSend = async (text) => {
    const msg = (text ?? input).trim();
    if ((!msg && attachedFiles.length === 0) || isLoading) return;

    // Build attachment previews for the message bubble
    const attachments = attachedFiles.map((f) => ({
      name: f.name,
      isImage: f.type.startsWith('image/'),
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));

    const filesToSend = [...attachedFiles];
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: msg, sender: 'user', timestamp: new Date(), attachments },
    ]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(msg || '(See attached file)', filesToSend);
      const botText = response?.response || response?.message || 'Response received.';
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, sender: 'bot', timestamp: new Date() }]);
    } catch (err) {
      if (err.message?.includes('Session expired')) {
        setError('Session expired. Redirecting to login…');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      }
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: err.message || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="flex flex-col h-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-5 py-4 bg-[hsl(var(--card))]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-500/20">
          <Waves className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Water Quality Assistant</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            AI-powered · Always available
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-teal-500" />
          <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">AI</span>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        {/* Suggestion chips — only when just the welcome message */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {msg.sender === 'bot' ? <BotAvatar /> : <UserAvatar />}

            <div className={cn('flex flex-col gap-1 max-w-[80%]', msg.sender === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-sm shadow-sm'
                    : msg.isError
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-tl-sm'
                    : 'bg-[hsl(var(--muted))]/60 dark:bg-[hsl(var(--muted))]/40 text-[hsl(var(--foreground))] rounded-tl-sm'
                )}
              >
                {msg.sender === 'user' && <MessageAttachments attachments={msg.attachments} />}
                {msg.sender === 'bot' ? (
                  <div
                    className={cn(
                      'prose-sm max-w-none',
                      '[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-2 [&_h1]:mb-1',
                      '[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1',
                      '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1 [&_h3]:mb-1',
                      '[&_p]:my-1 [&_p]:leading-relaxed',
                      '[&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc',
                      '[&_ol]:my-1 [&_ol]:ml-4 [&_ol]:list-decimal',
                      '[&_li]:my-0.5',
                      '[&_strong]:font-semibold',
                      '[&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
                      '[&_pre]:bg-black/10 dark:[&_pre]:bg-white/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2',
                      '[&_blockquote]:border-l-4 [&_blockquote]:border-current/20 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:opacity-80',
                      '[&_a]:text-teal-600 dark:[&_a]:text-teal-400 [&_a]:underline',
                      '[&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_table]:text-xs',
                      '[&_th]:border [&_th]:border-[hsl(var(--border))] [&_th]:p-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-[hsl(var(--muted))]/50',
                      '[&_td]:border [&_td]:border-[hsl(var(--border))] [&_td]:p-1.5',
                    )}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                  />
                ) : (
                  msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                )}
              </div>

              {/* Timestamp + copy */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(msg.timestamp)}</span>
                {msg.sender === 'bot' && !msg.isError && (
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    {copiedId === msg.id
                      ? <><Check className="h-3 w-3" /> Copied</>
                      : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <BotAvatar />
            <div className="rounded-2xl rounded-tl-sm bg-[hsl(var(--muted))]/60 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Error banner ────────────────────────────── */}
      {error && (
        <div className="border-t border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-2">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Input area ──────────────────────────────── */}
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-4">

        {/* File previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file) => (
              <FileChip key={file.name} file={file} onRemove={removeFile} />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach image or file"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Ask about water quality, or attach an image/file…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20 disabled:opacity-50 transition-all overflow-hidden leading-relaxed"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm shadow-teal-600/20 transition-all duration-150 hover:-translate-y-0.5"
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <SendHorizontal className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
          Press <kbd className="rounded border border-[hsl(var(--border))] px-1 py-0.5 text-[9px] font-mono">Enter</kbd> to send · <kbd className="rounded border border-[hsl(var(--border))] px-1 py-0.5 text-[9px] font-mono">Shift+Enter</kbd> for new line · <Paperclip className="inline h-2.5 w-2.5" /> to attach images or files
        </p>
      </div>
    </div>
  );
}
