import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <img src="/assets/logo.png" alt="Present.AI Logo" className={`h-10 w-auto ${className || ''}`} />
    );
};

export default Logo;
