import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ToolStatusWrapper = ({ toolId, children }) => {
  const [status, setStatus] = useState({ loading: true, enabled: true });
  const navigate = useNavigate();

  useEffect(() => {
    const checkToolStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/tools/${toolId}/status`
        );
        
        if (!response.ok) {
          setStatus({ loading: false, enabled: false, error: true });
          return;
        }
        
        const data = await response.json();
        setStatus({ loading: false, enabled: data.enabled, name: data.name });
      } catch (error) {
        console.error('Error checking tool status:', error);
        // If there's an error fetching status, allow the tool to load
        setStatus({ loading: false, enabled: true });
      }
    };

    checkToolStatus();
  }, [toolId]);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#202124] to-[#292a2d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9aa0a6] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!status.enabled) {
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
