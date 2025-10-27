import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';

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

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Pixel Test Laden...</h2>
              <p className="text-gray-600">Even geduld alstublieft</p>
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
      className="relative min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: currentColorObj.hex,
        cursor: isFullscreen ? 'none' : 'default'
      }}
    >
      {/* Control Panel - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dead Pixel Detector</h1>
                  <p className="text-sm text-gray-600">Test uw scherm op dode pixels</p>
                </div>
              </div>
              <Button 
                onClick={enterFullscreen}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Maximize className="w-4 h-4 mr-2" />
                Volledig scherm
              </Button>
            </div>

            {showInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Instructies:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Klik op een kleur of gebruik de pijltjestoetsen (← →) om te navigeren</li>
                  <li>• Druk op 'F' of klik op 'Volledig scherm' voor de beste ervaring</li>
                  <li>• In volledig scherm verdwijnt de muis automatisch</li>
                  <li>• Druk op ESC om volledig scherm te verlaten</li>
                  <li>• Zoek naar pixels die niet mee veranderen met de achtergrondkleur</li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                Huidige kleur: <span className="font-bold">{currentColorObj.name}</span> ({currentColorObj.hex})
              </p>
              <div className="grid grid-cols-4 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      currentColor === color.value 
                        ? 'border-blue-600 ring-2 ring-blue-300' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span 
                      className={`text-sm font-medium ${
                        ['black', 'blue', 'red'].includes(color.value) 
                          ? 'text-white' 
                          : 'text-gray-900'
                      }`}
                    >
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen mode indicator */}
      {isFullscreen && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/70 text-white px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm animate-fade-in">
            {currentColorObj.name} - Gebruik ← → om te wisselen | ESC om te sluiten
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelTest;