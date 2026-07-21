import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ToolStatusWrapper = ({ toolId, children }) => {
  // Optimistic: render the tool immediately and only flip to the offline
  // screen if the backend explicitly reports the tool as disabled.
  const [enabled, setEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const checkToolStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/tools/${toolId}/status`
        );
        if (!response.ok) return; // fail-open
        const data = await response.json();
        if (!cancelled && data.enabled === false) {
          setEnabled(false);
        }
      } catch (error) {
        // Network error -> keep the tool available (fail-open)
      }
    };

    checkToolStatus();
    return () => { cancelled = true; };
  }, [toolId]);

  if (!enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#202124] to-[#292a2d] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg 
              className="w-24 h-24 mx-auto text-[#5f6368]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#e8eaed] mb-4">
            Sorry, deze tool is offline
          </h1>
          <p className="text-[#9aa0a6] text-lg mb-8">
            Deze tool is momenteel niet beschikbaar. Probeer het later opnieuw.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
          >
            Terug naar Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ToolStatusWrapper;
