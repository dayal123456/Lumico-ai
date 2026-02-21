
import React, { useState } from 'react';
import { X, LogOut, User, Calendar, Cpu, Trash2, AlertTriangle, Edit2, Check, Key, Server } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { AIModel } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userModels?: AIModel[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, userModels = [] }) => {
  const [confirmDeleteModelId, setConfirmDeleteModelId] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const executeDeleteAccount = async () => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No user logged in");
        
        // Remove from DB first
        await remove(ref(db, `users/${user.uid}`));
        // Then delete from Auth
        await deleteUser(currentUser);
        onClose();
    } catch (err: any) {
        console.error("Deletion error:", err);
        alert("Please re-login to delete your account for security reasons.");
    }
  };

  const executeDeleteModel = async () => {
    if (confirmDeleteModelId) {
        await remove(ref(db, `users/${user.uid}/models/${confirmDeleteModelId}`));
        setConfirmDeleteModelId(null);
    }
  };

  const handleSaveModelEdit = async () => {
      if (!editingModel) return;
      await update(ref(db, `users/${user.uid}/models/${editingModel.id}`), {
          name: editingModel.name,
          apiKey: editingModel.apiKey,
          modelId: editingModel.modelId
      });
      setEditingModel(null);
  };

  const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' }) : 'N/A';

  return (
    <div className="fixed inset-0 bg-white z-[120] flex flex-col animate-slide-up">
      
      {/* HEADER */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-center px-6 z-[140] pointer-events-none">
        <div className="relative w-full max-w-4xl flex items-center justify-center">
            <div className="absolute left-1/2 -translate-x-1/2 bg-gray-50 border border-gray-300 text-gray-500 px-8 h-12 flex items-center justify-center rounded-full shadow-xl shadow-teal-500/20 font-black text-[10px] tracking-[0.2em] uppercase active:scale-95 transition-all pointer-events-auto">
              Profile
            </div>
            <button 
              onClick={onClose} 
              className="ml-auto w-12 h-12 bg-gray-50 border border-gray-300 rounded-full shadow-xl shadow-teal-500/20 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all active:scale-90 pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar h-full relative">
          <div className="max-w-xl mx-auto w-full px-6 pt-32 pb-20">
            <div className="flex flex-col items-center mb-10">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 p-1 shadow-xl mb-6">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#008080] overflow-hidden">
                    {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User className="w-12 h-12" />}
                 </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">{user.displayName || 'AI Enthusiast'}</h2>
              <p className="text-gray-400 font-bold text-sm tracking-wide">{user.email}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-teal-500/20 flex items-center gap-5 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#008080]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Member Since</p>
                    <p className="text-gray-800 font-black text-lg">{joinDate}</p>
                  </div>
               </div>
               
               <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-teal-500/20 flex items-center gap-5 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Server className="w-6 h-6 text-[#008080]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Account Status</p>
                    <p className="text-teal-600 font-black text-lg">Premium Active</p>
                  </div>
               </div>
            </div>

            <div className="pt-12 space-y-4">
                <button onClick={handleLogout} className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-all border border-gray-200 flex items-center justify-center gap-2">
                    <LogOut className="w-5 h-5" /> Sign Out
                </button>
                <button onClick={() => setConfirmDeleteAccount(true)} className="w-full py-4 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all border border-red-200 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Delete Account
                </button>
            </div>
          </div>

          {/* SIMPLIFIED CENTER BUBBLE OVERLAYS */}
          {(confirmDeleteModelId || confirmDeleteAccount) && (
              <div className="absolute inset-0 z-[160] flex items-center justify-center pointer-events-none">
                  <div className="bg-white border border-gray-200 shadow-xl shadow-teal-500/20 rounded-2xl p-5 w-[240px] pointer-events-auto flex flex-col gap-3 animate-fade-in text-center">
                      <p className="font-bold text-gray-800 text-sm">
                         {confirmDeleteAccount ? 'Delete Account permanently?' : 'Delete this model?'}
                      </p>
                      <div className="flex gap-2">
                          <button 
                            onClick={confirmDeleteAccount ? executeDeleteAccount : executeDeleteModel}
                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-sm shadow-teal-500/20"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => { setConfirmDeleteAccount(false); setConfirmDeleteModelId(null); }}
                            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200"
                          >
                            No
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};