
import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, User, Cpu, Edit2, Check, ChevronLeft } from 'lucide-react';
import { db } from '../services/firebase';
import { ref, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onOpenProfile: () => void;
  user: any;
  currentChatId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onSelectChat, 
  onOpenProfile, 
  user, 
  currentChatId 
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const historyRef = ref(db, `users/${user.uid}/chats`);
    return onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatList = Object.entries(data).map(([id, chat]: any) => ({
          id,
          title: chat.title || 'Untitled Chat',
          timestamp: chat.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);
        setHistory(chatList);
      } else {
        setHistory([]);
      }
    });
  }, [user]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !deleteConfirmId) return;
    await remove(ref(db, `users/${user.uid}/chats/${deleteConfirmId}`));
    setDeleteConfirmId(null);
    if (currentChatId === deleteConfirmId) {
        onNewChat();
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const startEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user || !editingChatId) return;
      await update(ref(db, `users/${user.uid}/chats/${editingChatId}`), { title: editTitle });
      setEditingChatId(null);
  };

  return (
    <>
      {/* Overlay - simple fade */}
      <div 
        className={`fixed inset-0 bg-white/10 backdrop-blur-sm z-[60] transition-opacity duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />

      {/* Main Sidebar - Full Screen with Smooth Transform */}
      <div 
        className={`fixed inset-0 bg-white z-[70] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full w-full relative">
          
          {/* TOP BUBBLE CONTAINER (Controls) */}
          <div className="px-4 pt-6 pb-2">
               <div className="flex items-center gap-3">
                   <button 
                     onClick={() => { onNewChat(); onClose(); }}
                     className="flex-[2] flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-br from-[#008080] to-teal-600 text-white rounded-[24px] font-black shadow-xl shadow-teal-500/20 active:scale-95 transition-all group"
                   >
                     <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                     <span className="tracking-tight text-sm">New Chat</span>
                   </button>
                   <button 
                     onClick={() => { onOpenProfile(); onClose(); }}
                     className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-[#008080] to-teal-600 text-white rounded-[24px] font-black shadow-xl shadow-teal-500/20 active:scale-95 transition-all group"
                   >
                     <User className="w-4 h-4" />
                     <span className="text-[10px] font-black tracking-tight uppercase">Profile</span>
                   </button>
                   <button 
                      onClick={onClose}
                      className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-xl shadow-teal-500/20 flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-90 transition-all shrink-0"
                   >
                      <ChevronLeft className="w-6 h-6" />
                   </button>
               </div>
          </div>

          <div className="px-6 py-4">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Recent Conversations</span>
          </div>

          {/* History List */}
          <div className="flex-grow overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
            {history.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-60 px-6 text-center">
                  <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center mb-4 shadow-sm shadow-teal-500/20 border border-teal-100">
                    <MessageSquare className="w-8 h-8 text-[#008080]" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">No Chats Yet</h3>
                  <p className="text-xs font-bold text-gray-400 leading-relaxed">
                    Start a new conversation to see your history here.
                  </p>
               </div>
            ) : (
              history.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => { if(editingChatId !== chat.id) { onSelectChat(chat.id); onClose(); } }}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    currentChatId === chat.id 
                      ? 'bg-teal-50 border-teal-100 text-teal-900 shadow-sm shadow-teal-500/20' 
                      : 'border-transparent hover:bg-gray-50 text-gray-700 hover:border-gray-100'
                  }`}
                >
                  {editingChatId === chat.id ? (
                      <div className="flex items-center gap-2 w-full animate-fade-in">
                          <input 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-sm font-semibold bg-white border border-[#008080] rounded-lg px-3 py-2 outline-none text-gray-900"
                              autoFocus
                          />
                          <button onClick={saveEdit} className="w-8 h-8 flex items-center justify-center bg-[#008080] text-white rounded-lg active:scale-90 transition-transform"><Check className="w-4 h-4" /></button>
                      </div>
                  ) : (
                      <>
                          <div className="flex items-center gap-4 overflow-hidden flex-1">
                              <MessageSquare className={`w-5 h-5 flex-shrink-0 ${currentChatId === chat.id ? 'text-[#008080]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                              <span className={`text-[15px] truncate w-full ${currentChatId === chat.id ? 'font-bold' : 'font-medium'}`}>
                                  {chat.title}
                              </span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button 
                                  onClick={(e) => startEdit(chat.id, chat.title, e)}
                                  className="p-2 text-gray-400 hover:text-[#008080] hover:bg-white rounded-lg transition-all"
                              >
                                  <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={(e) => handleDeleteClick(chat.id, e)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* SIMPLIFIED CENTER BUBBLE POPUP FOR DELETE */}
          {deleteConfirmId && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm">
                  <div className="bg-white border border-gray-100 shadow-2xl shadow-teal-500/20 rounded-3xl p-6 w-[260px] flex flex-col gap-4 animate-scale-up">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-gray-900">Delete chat?</p>
                        <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={cancelDelete} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                          <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-teal-500/20">Delete</button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </>
  );
};
