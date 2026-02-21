
import React, { useRef, useEffect, useState } from 'react';
import { Plus, ArrowRight, Square, FileText, X, FileUp, Brain, Image as ImageIcon, Loader2, Mic, MicOff } from 'lucide-react';
import { processFile } from '../services/fileService';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (attachment?: { name: string; content: string; type: 'image' | 'file' } | null) => void;
  onStop: () => void;
  isLoading: boolean;
  isThinkingMode?: boolean;
  onToggleThinkingMode?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  value: externalValue, 
  onChange: onExternalChange, 
  onSubmit, 
  onStop, 
  isLoading,
  isThinkingMode = false,
  onToggleThinkingMode
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [attachedItem, setAttachedItem] = useState<{ name: string; content: string; type: 'image' | 'file' } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [localValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onExternalChange(val);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLocalValue(transcript);
        onExternalChange(transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onExternalChange]);
  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleFinalSubmit();
    }
  };

  const handleUniversalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const processed = await processFile(file);
      setAttachedItem({
        name: processed.name,
        content: processed.content,
        type: processed.type
      });
    } catch (error) {
      console.error("Failed to process file");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFinalSubmit = () => {
    if (!localValue.trim() && !attachedItem) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onSubmit(attachedItem);
    setAttachedItem(null);
    setLocalValue('');
  };

  const isInputEmpty = !localValue.trim() && !attachedItem;

  return (
    <div className="fixed bottom-8 w-full px-4 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-3xl pointer-events-auto">
        <div className="bg-white rounded-3xl p-3 border border-gray-300 flex flex-col gap-2 shadow-xl shadow-teal-500/20">
          {(attachedItem || isProcessingFile) && (
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 mb-1 mx-2">
              <div className="flex items-center gap-3 overflow-hidden">
                {isProcessingFile ? (
                   <>
                     <Loader2 className="w-4 h-4 text-[#008080] animate-spin shrink-0" />
                     <span className="text-xs font-bold text-gray-500">Processing...</span>
                   </>
                ) : (
                  <>
                    {attachedItem?.type === 'image' ? (
                       <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                          <img src={attachedItem.content} alt="preview" className="w-full h-full object-cover" />
                       </div>
                    ) : (
                       <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
                         <FileText className="w-4 h-4 text-[#008080]" />
                       </div>
                    )}
                    <span className="text-xs font-bold text-gray-600 truncate">{attachedItem?.name}</span>
                  </>
                )}
              </div>
              {!isProcessingFile && (
                <button onClick={() => setAttachedItem(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isThinkingMode ? "Reasoning mode..." : "Message AI..."}
            className="w-full bg-transparent border-none outline-none text-[16px] font-medium text-gray-800 placeholder-gray-400 resize-none px-4 py-1.5 custom-scrollbar leading-relaxed"
            rows={1}
            style={{ minHeight: '44px' }}
            disabled={isLoading || isProcessingFile}
          />

          <div className="flex items-center justify-between mt-0.5 px-2">
            <div className="flex gap-1 items-center h-9">
              <input type="file" ref={fileInputRef} onChange={handleUniversalFileChange} className="hidden" accept=".txt,.js,.ts,.tsx,.py,.html,.css,.md,.json,.csv,.pdf,.zip" />
              <input type="file" ref={imageInputRef} onChange={handleUniversalFileChange} className="hidden" accept="image/*" />
              
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-[#008080] hover:bg-gray-200 transition-all shadow-sm shadow-teal-500/20"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex gap-2">
              {isLoading || isProcessingFile ? (
                <button onClick={onStop} className="w-[38px] h-[38px] rounded-full bg-[#008080] flex items-center justify-center text-white transition-all active:scale-90 shadow-md shadow-teal-500/20">
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : isInputEmpty ? (
                <button 
                  onClick={toggleListening}
                  className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all active:scale-90 border-none shadow-sm shadow-teal-500/20 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-[#008080]'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              ) : (
                <button onClick={handleFinalSubmit} className="w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#008080] text-white shadow-md shadow-teal-500/20">
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
