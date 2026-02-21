
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ModelSelector } from './components/ModelSelector';
import { streamChatCompletion, generateChatTitle } from './services/aiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, push, set as firebaseSet, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { Message } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('processing');
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // History State
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedContentRef = useRef<string>('');
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setMessages([]);
        setCurrentChatId(null);
      }
    });
    return unsubscribe;
  }, []);

  const smartScrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 300) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const saveChatToFirebase = async (msgs: Message[], chatId: string | null) => {
    if (!user) return chatId;
    let id = chatId;
    if (!id) {
      const historyRef = ref(db, `users/${user.uid}/chats`);
      const newChatRef = push(historyRef);
      await firebaseSet(newChatRef, { title: "New Chat", timestamp: Date.now() });
      id = newChatRef.key;
      setCurrentChatId(id);
    }
    if (id) {
      const cleanMessages = msgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content || "",
          thinking: m.thinking || null,
          modelName: m.modelName || null,
          attachment: m.attachment || null,
          imageUrl: m.imageUrl || null
      }));
      await firebaseSet(ref(db, `users/${user.uid}/chats/${id}/messages`), cleanMessages);
    }
    return id;
  };

  const updateChatTitle = async (chatId: string, currentMsgs: Message[]) => {
      if (!user || !chatId) return;
      const userMsgCount = currentMsgs.filter(m => m.role === 'user').length;
      if (userMsgCount === 1 || userMsgCount % 2 === 0) {
          try {
             const newTitle = await generateChatTitle(currentMsgs);
             if (newTitle) {
                 await update(ref(db, `users/${user.uid}/chats/${chatId}`), { title: newTitle });
             }
          } catch(e) { 
              console.error("Title generation failed", e); 
          }
      }
  };

  const handleSelectChat = async (chatId: string) => {
    if (!user) return;
    const snapshot = await get(ref(db, `users/${user.uid}/chats/${chatId}/messages`));
    if (snapshot.exists()) {
      setMessages(snapshot.val());
      setCurrentChatId(chatId);
      setTimeout(() => smartScrollToBottom(), 50);
    }
  };

  const handleSendMessage = useCallback(async (attachment?: { name: string; content: string; type: 'image' | 'file' } | null, customMessages?: Message[]) => {
    const finalContent = input.trim();
    if ((!finalContent && !attachment && !customMessages) || isLoading) return;
    
    const currentMessages = customMessages || messages;

    let initialAiMessage: Message;
    if (!customMessages) {
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: finalContent, attachment: attachment || undefined };
        initialAiMessage = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: '', 
            modelName: 'AI Assistant'
        };
        setMessages(prev => [...prev, userMessage, initialAiMessage]);
        setInput('');
    } else {
        initialAiMessage = { 
            id: Date.now().toString(), 
            role: 'assistant', 
            content: '', 
            modelName: 'AI Assistant'
        };
        setMessages([...currentMessages, initialAiMessage]);
    }

    setIsLoading(true);
    setLoadingStatus('processing');
    accumulatedContentRef.current = '';

    abortControllerRef.current = new AbortController();

    const conversation = customMessages ? customMessages : [...messages, { id: Date.now().toString(), role: 'user', content: finalContent, attachment: attachment || undefined } as Message];

    await streamChatCompletion(
      conversation, 
      user?.displayName || null,
      isThinkingMode,
      null, 
      (status) => setLoadingStatus(status),
      (chunk) => {
        accumulatedContentRef.current += chunk;

        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { 
              ...updated[lastIndex], 
              content: accumulatedContentRef.current
            };
          }
          return updated;
        });
      },
      async () => {
        setIsLoading(false);
        setLoadingStatus('processing');
        abortControllerRef.current = null;
        
        const finalMessages = messagesRef.current;
        const finalId = await saveChatToFirebase(finalMessages, currentChatId);
        if (finalId) updateChatTitle(finalId, finalMessages);
      },
      abortControllerRef.current.signal
    );
  }, [input, isLoading, messages, user, currentChatId, isThinkingMode, smartScrollToBottom]);

  const handleRegenerate = (index: number) => {
    if (isLoading) return;
    const historyUpToUser = messages.slice(0, index);
    const lastUserIdx = historyUpToUser.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
        const conversation = historyUpToUser.slice(0, lastUserIdx + 1);
        handleSendMessage(null, conversation);
    }
  };

  const handleEditMessage = (text: string) => {
    setInput(text);
    const textarea = document.querySelector('textarea');
    if (textarea) (textarea as HTMLElement).focus();
  };

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLoadingStatus('processing');
  }, []);

  if (authLoading) return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 text-[#008080] animate-spin" /></div>;
  if (!user) return <AuthModal isOpen={true} />;

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans text-gray-900 overflow-hidden fixed inset-0">
      
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <ModelSelector />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={() => { 
          handleStop(); 
          setMessages([]); 
          setCurrentChatId(null); 
        }} 
        onSelectChat={handleSelectChat} 
        onOpenProfile={() => setIsProfileModalOpen(true)} 
        user={user} 
        currentChatId={currentChatId} 
      />
      
      <main 
        ref={scrollContainerRef}
        className={`flex-grow relative w-full overflow-y-auto custom-scrollbar ${isLoading ? 'typing-active' : ''}`}
      >
        {messages.length === 0 ? <WelcomeScreen /> : <MessageList messages={messages} isLoading={isLoading} loadingStatus={loadingStatus} onRegenerate={handleRegenerate} onEditMessage={handleEditMessage} />}
      </main>
      
      <ChatInput value={input} onChange={setInput} onSubmit={handleSendMessage} onStop={handleStop} isLoading={isLoading} isThinkingMode={isThinkingMode} onToggleThinkingMode={() => setIsThinkingMode(!isThinkingMode)} />

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} userModels={[]} />
    </div>
  );
}

export default App;
