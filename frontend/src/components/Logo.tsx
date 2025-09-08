import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'medium',
  showText = false,
  textClassName = ''
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="inline-flex flex-col items-center">
      <svg 
        className={`${sizeClasses[size]} ${className}`} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Schoolbag outline with rounded corners */}
        <path 
          d="M25 35 C25 32 27 30 30 30 L70 30 C73 30 75 32 75 35 L75 75 C75 78 73 80 70 80 L30 80 C27 80 25 78 25 75 Z" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Top flap */}
        <path 
          d="M25 35 L25 40 C25 42 27 44 30 44 L70 44 C73 44 75 42 75 40 L75 35" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Handle/straps */}
        <path 
          d="M40 30 L40 22 C40 20 41 18 43 18 L57 18 C59 18 60 20 60 22 L60 30" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Heart on the flap/center */}
        <path 
          d="M50 52 C45 47 35 47 35 56 C35 62 42 68 50 74 C58 68 65 62 65 56 C65 47 55 47 50 52 Z" 
          fill="currentColor" 
          stroke="none"
        />
        
        {/* Optional: Small pocket detail */}
        {/* <rect 
          x="42" 
          y="65" 
          width="16" 
          height="10" 
          rx="2" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
          opacity="0.5"
        /> */}
      </svg>
      
      {showText && (
        <h1 className={`mt-2 text-2xl font-bold ${textClassName}`}>
          EducLove
        </h1>
      )}
    </div>
  );
};

export default Logo;
