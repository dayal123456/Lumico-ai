
import React from 'react';

interface ModelSelectorProps {}

export const ModelSelector: React.FC<ModelSelectorProps> = () => {
  return (
    <div className="fixed top-4 right-4 z-[60]">
      <div className="bg-white border border-gray-200 rounded-full px-6 h-[47px] shadow-xl shadow-teal-500/20 flex items-center justify-center cursor-default transition-all">
        <span className="text-[15px] font-black text-[#008080] tracking-tighter">Lumico AI</span>
      </div>
    </div>
  );
};
