import React, { useEffect, useState } from 'react';

const HalloweenDecoration = () => {
  const [spiderY, setSpiderY] = useState(-50);

  useEffect(() => {
    // Animate spider down
    const animate = () => {
      setSpiderY(prev => {
        if (prev > window.innerHeight + 50) {
          return -50;
        }
        return prev + 2;
      });
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Spider webs in corners */}
      <div className="fixed top-0 left-0 w-48 h-48 opacity-30 pointer-events-none z-50">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M 10 10 Q 50 30, 100 10 T 190 10"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 10 Q 30 50, 10 100 T 10 190"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 10 L 100 100"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 30 Q 40 40, 80 30"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 10 50 Q 50 55, 90 50"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 30 10 Q 35 40, 30 80"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 50 10 Q 55 50, 50 90"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      <div className="fixed top-0 right-0 w-48 h-48 opacity-30 pointer-events-none z-50" style={{ transform: 'scaleX(-1)' }}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M 10 10 Q 50 30, 100 10 T 190 10"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 10 Q 30 50, 10 100 T 10 190"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 10 L 100 100"
            stroke="#9aa0a6"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 10 30 Q 40 40, 80 30"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 10 50 Q 50 55, 90 50"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 30 10 Q 35 40, 30 80"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 50 10 Q 55 50, 50 90"
            stroke="#9aa0a6"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Animated spider */}
      <div 
        className="fixed left-1/2 pointer-events-none z-50"
        style={{ 
          top: `${spiderY}px`,
          transform: 'translateX(-50%)',
          transition: 'top 0.05s linear'
        }}
      >
        {/* Spider web thread */}
        <div 
          className="absolute left-1/2 bg-[#9aa0a6] opacity-30"
          style={{
            width: '1px',
            height: `${spiderY + 50}px`,
            bottom: '20px',
            transform: 'translateX(-50%)'
          }}
        />
        
        {/* Spider */}
        <svg width="40" height="40" viewBox="0 0 40 40">
          {/* Body */}
          <ellipse cx="20" cy="20" rx="8" ry="10" fill="#1a1a1a" />
          <ellipse cx="20" cy="14" rx="6" ry="7" fill="#2a2a2a" />
          
          {/* Legs */}
          <path d="M 12 18 Q 5 15, 2 12" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 12 20 Q 4 20, 1 20" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 12 22 Q 5 25, 2 28" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 12 24 Q 6 28, 3 32" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          
          <path d="M 28 18 Q 35 15, 38 12" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 28 20 Q 36 20, 39 20" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 28 22 Q 35 25, 38 28" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          <path d="M 28 24 Q 34 28, 37 32" stroke="#1a1a1a" strokeWidth="2" fill="none" />
          
          {/* Eyes */}
          <circle cx="17" cy="13" r="1.5" fill="#ff0000" />
          <circle cx="23" cy="13" r="1.5" fill="#ff0000" />
        </svg>
      </div>
    </>
  );
};

export default HalloweenDecoration;