
import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-r-2 border-white h-5 w-5 ${className}`}></div>
  );
};

export default Spinner;
