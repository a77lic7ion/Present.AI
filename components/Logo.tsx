import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img src="/logo.png" alt="Present.AI Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight text-white">
                Present.
                <span className="text-gray-400">.AI</span>
            </span>
        </div>
    );
};

export default Logo;