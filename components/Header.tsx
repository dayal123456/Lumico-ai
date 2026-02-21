
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <div className="fixed top-4 left-4 z-[60]">
      <button 
        onClick={onMenuClick}
        className="w-12 h-12 bg-white rounded-full shadow-xl shadow-teal-500/20 border border-gray-200 flex flex-col justify-center items-center gap-[6px] hover:bg-gray-50 transition-all active:scale-90 group"
      >
        {/* Top Line - Shorter and Thicker */}
        <div className="w-5 h-[3.5px] bg-[#008080] rounded-full group-hover:bg-[#006666] transition-colors"></div>
        {/* Bottom Line - Even Shorter and Thicker */}
        <div className="w-3 h-[3.5px] bg-[#008080] rounded-full group-hover:bg-[#006666] transition-colors"></div>
      </button>
    </div>
  );
};
