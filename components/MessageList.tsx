
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Asterisk, ChevronDown, Brain, Play, Pause, Download, Copy, ThumbsUp, ThumbsDown, Check, FileCheck, Loader2, MoreHorizontal, Share2, RefreshCw, Edit2, CircleDashed, CheckCircle2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ThinkingBubbleProps {
  content: string;
}

const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isPending = content === 'Initializing deep thought process...';
  const layers = content.split('\n').filter(line => line.trim().startsWith('Layer'));
  const activeLayerIndex = layers.length - 1;

  return (
    <div className="mb-4 w-full max-w-full">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          group relative overflow-hidden rounded-2xl border cursor-pointer
          ${isExpanded 
            ? 'bg-white border-teal-100 shadow-lg shadow-teal-500/20 ring-1 ring-teal-50' 
            : 'bg-white border-gray-200 hover:border-teal-200 hover:bg-teal-50/10'
          }
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50/50 to-transparent">
            <div className="flex items-center gap-3">
                <div className={`
                    w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shadow-teal-500/20 transition-all
                    ${isPending ? 'animate-pulse bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-[#008080] to-teal-600 text-white'}
                `}>
                    <Brain className={`w-4 h-4 ${isPending ? '' : 'animate-pulse'}`} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-gray-800 flex items-center gap-2">
                        Deep Reasoning
                        {!isPending && <span className="text-[10px] bg-teal-100 text-[#008080] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Processing</span>}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">
                         {isPending ? 'Initializing...' : `${layers.length} Layers Analyzed`}
                    </span>
                </div>
            </div>
            <button className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-teal-100 text-[#008080]' : 'text-gray-400'}`}>
                <ChevronDown className="w-4 h-4" />
            </button>
        </div>

        {isExpanded && (
            <div className="px-5 pb-5 pt-2 animate-fade-in">
                {isPending ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-mono py-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Initializing cognitive layers...
                    </div>
                ) : (
                    <div className="space-y-3 mt-2">
                        {layers.length > 0 ? layers.map((layer, idx) => {
                            const parts = layer.split(':');
                            const title = parts[0];
                            const desc = parts.slice(1).join(':');
                            const isActive = idx === activeLayerIndex;
                            const isDone = idx < activeLayerIndex;

                            return (
                                <div key={idx} className={`flex gap-3 text-sm transition-all duration-500 ${isActive ? 'translate-x-0 opacity-100' : 'opacity-80'}`}>
                                    <div className="pt-0.5 shrink-0">
                                        {isDone ? <CheckCircle2 className="w-4 h-4 text-teal-500" /> : isActive ? <CircleDashed className="w-4 h-4 text-[#008080] animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-xs uppercase tracking-wider ${isActive ? 'text-[#008080]' : 'text-gray-500'}`}>
                                            {title.replace('Layer', 'Step')}
                                        </span>
                                        <span className="text-gray-600 leading-relaxed text-xs">
                                            {desc || 'Processing...'}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="font-mono text-xs text-gray-500 whitespace-pre-wrap">
                                {content}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };
  return (
    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-3 max-w-sm mt-3 animate-fade-in shadow-sm shadow-teal-500/20">
      <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
      <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-[#008080] text-white flex items-center justify-center hover:bg-[#006666] transition-colors shadow-md shadow-teal-500/20 active:scale-95">
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
         <span className="text-xs font-bold text-gray-700">Audio Response</span>
         <div className="flex items-center gap-0.5 h-4 opacity-50">
           {[...Array(20)].map((_, i) => (
             <div key={i} className={`w-1 rounded-full bg-[#008080] transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 80 + 20}%` }} />
           ))}
         </div>
      </div>
    </div>
  );
};

interface MessageItemProps {
  msg: Message;
  isLast: boolean;
  isLoading: boolean;
  loadingStatus?: string;
  onRegenerate: () => void;
  onEdit?: (text: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ msg, isLast, isLoading, loadingStatus, onRegenerate, onEdit }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserActionsOpen, setIsUserActionsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userActionsRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setIsUserActionsOpen(false);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'AI Response', text: msg.content });
      } catch (err: any) {}
    } else handleCopy(msg.content);
    setIsMenuOpen(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) selection.removeAllRanges();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (userActionsRef.current && !userActionsRef.current.contains(event.target as Node)) setIsUserActionsOpen(false);
    };
    if (isMenuOpen || isUserActionsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isUserActionsOpen]);

  if (msg.role === 'user') {
    return (
      <div className="w-full flex flex-col items-end relative gap-1">
        {msg.attachment && (
           <div className="flex flex-col items-end mb-1">
              {msg.attachment.type === 'image' ? (
                <div className="bg-gray-50 border border-gray-200 rounded-none p-1 mb-1 overflow-hidden">
                    <img src={msg.attachment.content} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-none object-cover" />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-none p-3 border border-gray-200 flex items-center justify-between gap-3 shadow-none max-w-xs transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck className="w-4 h-4 text-[#008080] shrink-0" />
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{msg.attachment.name}</span>
                    </div>
                </div>
              )}
           </div>
        )}
        {msg.content && (
            <div className="relative group w-full flex justify-end" ref={userActionsRef}>
                <div 
                  onClick={() => setIsUserActionsOpen(!isUserActionsOpen)} 
                  onDoubleClick={handleDoubleClick} 
                  lang={/[\u0900-\u097F]/.test(msg.content) ? 'hi' : 'en'}
                  className="selectable-text cursor-pointer bg-[#008080] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] text-[15px] font-semibold leading-relaxed border-none shadow-sm shadow-teal-500/20"
                >
                  {msg.content}
                </div>
                {isUserActionsOpen && (
                    <div className="absolute top-full right-0 mt-2 flex gap-2 animate-slide-up z-20">
                        <button onClick={(e) => handleCopy(msg.content, e)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-none shadow-none text-[#008080] hover:bg-teal-50 transition-all active:scale-90">
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(msg.content); setIsUserActionsOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-none shadow-none text-[#008080] hover:bg-teal-50 transition-all active:scale-90">
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    );
  }

  const showLoader = isLast && isLoading && !msg.content && (!msg.thinking || msg.thinking === 'Initializing deep thought process...');

  return (
    <div className="flex flex-col gap-4 w-full">
      {showLoader && (
          <div className="flex items-center gap-3 animate-fade-in">
              <Asterisk className="w-5 h-5 text-[#008080] animate-spin" strokeWidth={3} />
          </div>
      )}
      {msg.thinking && <ThinkingBubble content={msg.thinking} />}
      {msg.isGeneratingImage && (
         <div className="w-full max-w-sm aspect-square bg-[#008080]/5 border border-[#008080] rounded-2xl flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md shadow-teal-500/20"><Asterisk className="w-8 h-8 text-[#008080] animate-spin" strokeWidth={3} /></div>
            <p className="text-[10px] font-black text-[#008080] tracking-[0.25em] uppercase">Generating Visuals</p>
         </div>
      )}
      {msg.imageUrl && (
        <div className="group relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20 border border-gray-100 bg-gray-50 animate-fade-in">
           <img src={msg.imageUrl} alt="Generated Art" className="w-full h-auto object-cover" />
           <div className="absolute bottom-4 right-4">
              <a href={msg.imageUrl} download={`lumico-art-${Date.now()}.png`} className="flex items-center gap-2 bg-white/90 backdrop-blur-md hover:bg-[#008080] hover:text-white text-gray-800 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm shadow-teal-500/20 transition-all active:scale-95"><Download className="w-4 h-4" /></a>
           </div>
        </div>
      )}
      {msg.audioUrl && <AudioPlayer url={msg.audioUrl} />}
      {msg.content && (
        <div className="relative group" lang={/[\u0900-\u097F]/.test(msg.content) ? 'hi' : 'en'}>
            <div onDoubleClick={handleDoubleClick} className="selectable-text">
                <MarkdownRenderer content={msg.content} />
            </div>
            {isLast && !isLoading && (
              <div className="mt-4 flex justify-start items-center gap-1 animate-fade-in relative pl-1">
                <button onClick={(e) => handleCopy(msg.content, e)} className="p-2 rounded-full text-gray-400 hover:text-[#008080] transition-colors active:scale-90" title="Copy">
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')} className={`p-2 rounded-full transition-colors active:scale-90 ${feedback === 'liked' ? 'text-[#008080]' : 'text-gray-400 hover:text-[#008080]'}`} title="Helpful">
                  <ThumbsUp className={`w-4 h-4 ${feedback === 'liked' ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')} className={`p-2 rounded-full transition-colors active:scale-90 ${feedback === 'disliked' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} title="Not Helpful">
                  <ThumbsDown className={`w-4 h-4 ${feedback === 'disliked' ? 'fill-current' : ''}`} />
                </button>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-full transition-colors active:scale-90 ${isMenuOpen ? 'text-[#008080]' : 'text-gray-400 hover:text-[#008080]'}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl shadow-teal-500/20 rounded-2xl p-2 min-w-[140px] animate-slide-up flex flex-col gap-1 z-50">
                            <button onClick={handleShare} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600 hover:text-[#008080]"><Share2 className="w-4 h-4" /><span className="text-xs font-bold">Share TXT</span></button>
                            <button onClick={() => { setIsMenuOpen(false); onRegenerate(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600 hover:text-[#008080]"><RefreshCw className="w-4 h-4" /><span className="text-xs font-bold">Regenerate</span></button>
                        </div>
                    )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.msg.content === nextProps.msg.content && 
         prevProps.msg.id === nextProps.msg.id &&
         prevProps.isLoading === nextProps.isLoading &&
         prevProps.loadingStatus === nextProps.loadingStatus && 
         prevProps.msg.modelName === nextProps.msg.modelName &&
         prevProps.msg.thinking === nextProps.msg.thinking && 
         prevProps.msg.imageUrl === nextProps.msg.imageUrl;
});

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  loadingStatus?: string;
  onRegenerate: (index: number) => void;
  onEditMessage: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, loadingStatus, onRegenerate, onEditMessage }) => {
  return (
    <div className="flex flex-col gap-12 w-full max-w-3xl mx-auto px-4 pb-12 pt-24">
      {messages.map((msg, index) => (
        <MessageItem key={msg.id} msg={msg} isLast={index === messages.length - 1} isLoading={isLoading} loadingStatus={loadingStatus} onRegenerate={() => onRegenerate(index)} onEdit={onEditMessage} />
      ))}
      <div className="chat-bottom-spacer" />
    </div>
  );
};
