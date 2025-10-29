import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Monitor } from 'lucide-react';
import HalloweenDecoration from './HalloweenDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import { logPageVisit, logAction, logButtonClick, logError } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.5.0';

const PixelTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState('black');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGPUModal, setShowGPUModal] = useState(false);
  const [gpuInfo, setGpuInfo] = useState({ vendor: 'Unknown', renderer: 'Unknown' });

  // Log page visit on mount
  useEffect(() => {
    logPageVisit('dpd', 'Dead Pixel Detector');
  }, []);

  const colors = [
    { name: 'Zwart', value: 'black', hex: '#000000' },
    { name: 'Wit', value: 'white', hex: '#FFFFFF' },
    { name: 'Rood', value: 'red', hex: '#FF0000' },
    { name: 'Groen', value: 'green', hex: '#00FF00' },
    { name: 'Blauw', value: 'blue', hex: '#0000FF' },
    { name: 'Cyaan', value: 'cyan', hex: '#00FFFF' },
    { name: 'Magenta', value: 'magenta', hex: '#FF00FF' },
    { name: 'Geel', value: 'yellow', hex: '#FFFF00' },
    { name: 'Grijs', value: 'gray', hex: '#808080' },
  ];

  // Loading animation (1 second)
  useEffect(() => {
    const duration = 1000;
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

  // Get GPU info on mount
  useEffect(() => {
    const getGPUInfo = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            return {
              vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
              renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
            };
          }
        }
      } catch (e) {
        console.error('Unable to get GPU info:', e);
      }
      return { vendor: 'Unknown', renderer: 'Unknown' };
    };

    setGpuInfo(getGPUInfo());
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isLoading) return;

      const currentIndex = colors.findIndex(c => c.value === currentColor);
      
      switch(e.key) {
        case 'ArrowRight':
        case ' ':
          const nextColor = colors[(currentIndex + 1) % colors.length];
          setCurrentColor(nextColor.value);
          logAction('dpd', 'Dead Pixel Detector', 'keyboard_navigation', {
            key: e.key === ' ' ? 'space' : 'arrow_right',
            previous_color: currentColor,
            new_color: nextColor.value,
            color_index: (currentIndex + 1) % colors.length
          });
          break;
        case 'ArrowLeft':
          const prevColor = colors[(currentIndex - 1 + colors.length) % colors.length];
          setCurrentColor(prevColor.value);
          logAction('dpd', 'Dead Pixel Detector', 'keyboard_navigation', {
            key: 'arrow_left',
            previous_color: currentColor,
            new_color: prevColor.value,
            color_index: (currentIndex - 1 + colors.length) % colors.length
          });
          break;
        case 'Escape':
          if (isFullscreen) {
            logButtonClick('dpd', 'Dead Pixel Detector', 'exit_fullscreen_keyboard');
            exitFullscreen();
          }
          break;
        case 'f':
        case 'F':
          if (!isFullscreen) {
            logButtonClick('dpd', 'Dead Pixel Detector', 'enter_fullscreen_keyboard');
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
      logError('dpd', 'Dead Pixel Detector', 'fullscreen_failed', {
        error_message: error.message,
        error_name: error.name
      });
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
    if (!isLoading && !isFullscreen && !showGPUModal) {
      // Show GPU modal first
      logButtonClick('dpd', 'Dead Pixel Detector', 'start_test');
      setShowGPUModal(true);
    }
  };

  const handleGPUModalOk = () => {
    logAction('dpd', 'Dead Pixel Detector', 'gpu_info_viewed', {
      gpu_vendor: gpuInfo.vendor,
      gpu_renderer: gpuInfo.renderer
    });
    setShowGPUModal(false);
    logAction('dpd', 'Dead Pixel Detector', 'fullscreen_entered', {
      trigger: 'gpu_modal_ok_button'
    });
    enterFullscreen();
  };

  const handleColorChange = (colorValue) => {
    setCurrentColor(colorValue);
    logAction('dpd', 'Dead Pixel Detector', 'color_changed', {
      color: colorValue,
      from_fullscreen: isFullscreen
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-8">
        <HalloweenDecoration />
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
              alt="127 Logo" 
              className="w-48 h-auto brightness-110"
            />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Dead Pixel Detector</h2>
            </div>
            <Progress value={loadingProgress} className="h-3 bg-[#303134]" />
            <p className="text-center text-sm text-[#9aa0a6]">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  const currentColorObj = colors.find(c => c.value === currentColor);

  return (
    <>
      <style>{`
        .no-transition,
        .no-transition * {
          transition: none !important;
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
        }
      `}</style>
      <div 
        onClick={handleClick}
        className="relative min-h-screen no-transition"
        style={{ 
          backgroundColor: currentColorObj.hex,
          cursor: isFullscreen ? 'none' : 'pointer'
        }}
      >
        {/* GPU Info Modal */}
        {showGPUModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-[#303134] rounded-lg shadow-2xl p-8 max-w-lg border border-[#5f6368] mx-4">
              <div className="mb-6 flex flex-col items-center">
                <Monitor className="w-16 h-16 text-[#8ab4f8] mb-4" />
                <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">GPU Informatie</h2>
                <p className="text-[#9aa0a6] text-center">Dit toestel gebruikt de volgende GPU</p>
              </div>
              
              <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-6 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#9aa0a6]">GPU Vendor:</p>
                    <p className="text-base font-medium text-[#e8eaed] break-words">{gpuInfo.vendor}</p>
                  </div>
                  <div className="border-t border-[#5f6368] pt-3">
                    <p className="text-sm text-[#9aa0a6]">GPU Renderer:</p>
                    <p className="text-base font-medium text-[#e8eaed] break-words">{gpuInfo.renderer}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleGPUModalOk();
                }}
                className="w-full px-6 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
              >
                Ok, Start Test
              </button>
            </div>
          </div>
        )}

        {/* Instructions when not in fullscreen */}
        {!isFullscreen && !showGPUModal && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
              />
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Dead Pixel Detector</h2>
              <p className="text-[#9aa0a6]">Klik om te starten</p>
              <p className="text-xs text-[#9aa0a6] mt-2">Build {BUILD_VERSION}</p>
            </div>
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 text-left">
              <h3 className="font-semibold text-[#8ab4f8] mb-2">Instructies:</h3>
              <ul className="text-sm text-[#9aa0a6] space-y-1">
                <li>• Klik overal op het scherm om fullscreen te gaan</li>
                <li>• Gebruik pijltjestoetsen (← →) om van kleur te wisselen</li>
                <li>• De muis verdwijnt automatisch in fullscreen</li>
                <li>• Druk op ESC om fullscreen te verlaten</li>
                <li>• Zoek naar pixels die niet mee veranderen</li>
              </ul>
            </div>
            <div className="mt-6">
              <p className="text-sm text-[#9aa0a6]">
                Huidige kleur: <span className="font-bold text-[#e8eaed]">{currentColorObj.name}</span>
              </p>
            </div>
            <div className="mt-6">
              <Link to="/" onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Bekijk ook andere tools
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default PixelTest;