
import React, { useState, useEffect } from 'react';
import { Asterisk, Clock, Globe } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Simple client-side clock for the welcome screen
    const tick = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full pt-20 pb-40 px-6 text-center animate-fade-in">
      {/* Logo */}
      <div className="mb-6 relative group cursor-default">
        <div className="absolute inset-0 bg-[#008080]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <Asterisk className="w-16 h-16 text-[#008080] relative z-10" strokeWidth={2} />
      </div>

      {/* Heading */}
      <h1 className="font-serif-custom text-4xl text-gray-800 mb-4 leading-tight">
        How can I help you?
      </h1>
    </div>
  );
};
