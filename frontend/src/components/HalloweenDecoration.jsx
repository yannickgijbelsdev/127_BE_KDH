import React, { useEffect, useState } from 'react';

const HalloweenDecoration = () => {
  const [ghosts, setGhosts] = useState([
    { id: 1, x: 10, y: 20, speed: 0.15, direction: 1, hasRedEyes: false },
    { id: 2, x: 80, y: 50, speed: 0.2, direction: -1, hasRedEyes: true },
    { id: 3, x: 50, y: 80, speed: 0.18, direction: 1, hasRedEyes: false },
  ]);

  useEffect(() => {
    // Animate ghosts floating (slower)
    const animateGhosts = () => {
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x + (ghost.speed * ghost.direction);
        let newDirection = ghost.direction;
        let hasRedEyes = ghost.hasRedEyes;
        
        // Bounce off edges
        if (newX > 95 || newX < 5) {
          newDirection = -ghost.direction;
          newX = ghost.x + (ghost.speed * newDirection);
          // Randomly change eye color when bouncing (creepy!)
          hasRedEyes = Math.random() > 0.5;
        }
        
        return {
          ...ghost,
          x: newX,
          direction: newDirection,
          hasRedEyes: hasRedEyes,
        };
      }));
    };

    const interval = setInterval(animateGhosts, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
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

      {/* Floating Ghosts */}
      {ghosts.map((ghost, index) => (
        <div
          key={ghost.id}
          className="fixed pointer-events-none z-50 animate-float"
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            animation: `float ${4 + index * 0.7}s ease-in-out infinite, sway ${3 + index * 0.5}s ease-in-out infinite`,
            opacity: 0.7,
          }}
        >
          <svg width="60" height="80" viewBox="0 0 60 80">
            {/* Ghost body */}
            <path
              d="M 30 10 Q 10 10, 10 30 L 10 60 Q 10 70, 15 70 Q 20 65, 25 70 Q 30 75, 35 70 Q 40 65, 45 70 Q 50 70, 50 60 L 50 30 Q 50 10, 30 10 Z"
              fill="#ffffff"
              opacity="0.8"
              filter="url(#glow)"
            />
            
            {/* Eyes - sometimes red for creepy effect */}
            <ellipse 
              cx="22" 
              cy="30" 
              rx="4" 
              ry="6" 
              fill={ghost.hasRedEyes ? "#ff0000" : "#000000"}
            >
              {ghost.hasRedEyes && (
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
            <ellipse 
              cx="38" 
              cy="30" 
              rx="4" 
              ry="6" 
              fill={ghost.hasRedEyes ? "#ff0000" : "#000000"}
            >
              {ghost.hasRedEyes && (
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
            
            {/* Mouth */}
            <path
              d="M 25 45 Q 30 50, 35 45"
              stroke="#000000"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Glow effect */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      ))}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes sway {
          0%, 100% {
            transform: translateX(0px) rotate(-5deg);
          }
          50% {
            transform: translateX(15px) rotate(5deg);
          }
        }
      `}</style>
    </>
  );
};

export default HalloweenDecoration;