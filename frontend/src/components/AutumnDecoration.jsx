import React, { useEffect, useState } from 'react';

const AutumnDecoration = () => {
  const [leaves, setLeaves] = useState([
    { id: 1, x: 10, y: -10, speed: 2, rotation: 0, color: '#D4A574', size: 20, sway: 15 },
    { id: 2, x: 30, y: -20, speed: 2.5, rotation: 45, color: '#E8B86D', size: 18, sway: 20 },
    { id: 3, x: 50, y: -15, speed: 1.8, rotation: 90, color: '#C89F65', size: 22, sway: 18 },
    { id: 4, x: 70, y: -25, speed: 2.2, rotation: 135, color: '#DDA15E', size: 16, sway: 22 },
    { id: 5, x: 90, y: -30, speed: 1.9, rotation: 180, color: '#BC8A5F', size: 19, sway: 17 },
    { id: 6, x: 20, y: -35, speed: 2.3, rotation: 225, color: '#E8C4A0', size: 21, sway: 19 },
    { id: 7, x: 60, y: -40, speed: 2.1, rotation: 270, color: '#F4D4A8', size: 17, sway: 21 },
    { id: 8, x: 40, y: -45, speed: 2.4, rotation: 315, color: '#D9B58C', size: 20, sway: 16 },
  ]);

  useEffect(() => {
    const animateLeaves = () => {
      setLeaves(prev => prev.map(leaf => {
        let newY = leaf.y + leaf.speed;
        let newX = leaf.x + Math.sin(newY / 20) * 0.5; // Zwevende beweging
        let newRotation = leaf.rotation + 3;
        
        // Reset als blad onderkant bereikt
        if (newY > 110) {
          return {
            ...leaf,
            y: -10,
            x: Math.random() * 100,
            rotation: Math.random() * 360,
          };
        }
        
        return {
          ...leaf,
          y: newY,
          x: newX,
          rotation: newRotation,
        };
      }));
    };

    const interval = setInterval(animateLeaves, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes leafSway {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          25% { transform: translateX(10px) rotate(5deg); }
          75% { transform: translateX(-10px) rotate(-5deg); }
        }
      `}</style>

      {/* Vallende bladeren */}
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${leaf.x}%`,
            top: `${leaf.y}%`,
            transform: `rotate(${leaf.rotation}deg)`,
            transition: 'all 0.05s linear',
            opacity: 0.8,
          }}
        >
          {/* Blad vorm (maple leaf) */}
          <svg
            width={leaf.size}
            height={leaf.size}
            viewBox="0 0 24 24"
            fill={leaf.color}
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          >
            <path d="M20,10.5c0-0.8-0.4-1.5-1-1.9v-0.1c0-1.1-0.9-2-2-2c-0.4,0-0.8,0.1-1.1,0.3c-0.3-1-1.2-1.8-2.4-1.8 c-0.8,0-1.5,0.4-1.9,1c-0.1,0-0.1,0-0.2,0H11h-0.4c-0.1,0-0.1,0-0.2,0c-0.4-0.6-1.1-1-1.9-1c-1.2,0-2.1,0.8-2.4,1.8 C5.8,6.9,5.4,6.8,5,6.8c-1.1,0-2,0.9-2,2v0.1c-0.6,0.4-1,1.1-1,1.9c0,1,0.7,1.8,1.6,2c-0.1,0.2-0.1,0.4-0.1,0.6 c0,1.3,1.1,2.4,2.5,2.4c0.6,0,1.1-0.2,1.5-0.5c0.3,1.2,1.4,2.1,2.7,2.1c0.6,0,1.2-0.2,1.6-0.6l0.2,4.7l0.2-4.7 c0.4,0.4,1,0.6,1.6,0.6c1.3,0,2.4-0.9,2.7-2.1c0.4,0.3,0.9,0.5,1.5,0.5c1.4,0,2.5-1.1,2.5-2.4c0-0.2,0-0.4-0.1-0.6 C19.3,12.3,20,11.5,20,10.5z" />
          </svg>
        </div>
      ))}
    </>
  );
};

export default AutumnDecoration;
