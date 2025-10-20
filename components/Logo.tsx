
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center shadow-lg">
                 <svg width="80%" height="80%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <rect x="10" y="15" width="80" height="60" rx="8" ry="8" fill="none" stroke="currentColor" strokeWidth="5"/>
                    <path d="M 30 55 L 30 35 Q 30 25 40 25 L 45 25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M 42 45 A 15 15 0 1 1 42 25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    
                    <circle cx="55" cy="40" r="4" fill="currentColor"/>
                    <circle cx="75" cy="30" r="4" fill="currentColor"/>
                    <circle cx="75" cy="50" r="4" fill="currentColor"/>
                    <circle cx="90" cy="40" r="4" fill="currentColor"/>
                    
                    <path d="M 59 40 L 71 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 59 40 L 71 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 79 30 L 86 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 79 50 L 86 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                 </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
                Present.<span className="text-gray-400">AI</span>
            </span>
        </div>
    );
};

export default Logo;
