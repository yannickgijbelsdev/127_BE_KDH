import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';

// Build version - Update this with each change
const BUILD_VERSION = '1.0.1';

const PixelTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState('black');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const colors = [
    { name: 'Zwart', value: 'black', hex: '#000000' },
    { name: 'Wit', value: 'white', hex: '#FFFFFF' },
    { name: 'Rood', value: 'red', hex: '#FF0000' },
    { name: 'Groen', value: 'green', hex: '#00FF00' },
    { name: 'Blauw', value: 'blue', hex: '#0000FF' },
    { name: 'Cyaan', value: 'cyan', hex: '#00FFFF' },
    { name: 'Magenta', value: 'magenta', hex: '#FF00FF' },
    { name: 'Geel', value: 'yellow', hex: '#FFFF00' },
  ];

  // Loading animation (3 seconds)
  useEffect(() => {
    const duration = 3000;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setLoadingProgress((step / steps) * 100);

      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isLoading) return;

      const currentIndex = colors.findIndex(c => c.value === currentColor);
      
      switch(e.key) {
        case 'ArrowRight':
        case ' ':
          setCurrentColor(colors[(currentIndex + 1) % colors.length].value);
          break;
        case 'ArrowLeft':
          setCurrentColor(colors[(currentIndex - 1 + colors.length) % colors.length].value);
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
        case 'f':
        case 'F':
          if (!isFullscreen) {
            enterFullscreen();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentColor, colors, isLoading, isFullscreen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen niet beschikbaar:', error.message);
      // Fallback: manually set fullscreen state for testing
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.warn('Exit fullscreen gefaald:', error.message);
      setIsFullscreen(false);
    }
  };

  const handleClick = () => {
    if (!isLoading && !isFullscreen) {
      enterFullscreen();
    }
  };

  const handleColorChange = (colorValue) => {
    setCurrentColor(colorValue);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
              alt="127 Logo" 
              className="w-48 h-auto"
            />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Dead Pixel Detector</h2>
              <p className="text-gray-600">127.be</p>
            </div>
            <Progress value={loadingProgress} className="h-3" />
            <p className="text-center text-sm text-gray-500">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  const currentColorObj = colors.find(c => c.value === currentColor);

  return (
    <div 
      onClick={handleClick}
      className="relative min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: currentColorObj.hex,
        cursor: isFullscreen ? 'none' : 'pointer'
      }}
    >
      {/* Instructions when not in fullscreen */}
      {!isFullscreen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dead Pixel Detector</h2>
              <p className="text-gray-600">Klik overal om te starten</p>
              <p className="text-xs text-gray-400 mt-2">Build {BUILD_VERSION}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Instructies:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Klik overal op het scherm om fullscreen te gaan</li>
                <li>• Gebruik pijltjestoetsen (← →) om van kleur te wisselen</li>
                <li>• De muis verdwijnt automatisch in fullscreen</li>
                <li>• Druk op ESC om fullscreen te verlaten</li>
                <li>• Zoek naar pixels die niet mee veranderen</li>
              </ul>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Huidige kleur: <span className="font-bold">{currentColorObj.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelTest;