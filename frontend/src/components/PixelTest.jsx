import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Monitor } from 'lucide-react';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolStatusWrapper from './ToolStatusWrapper';
import { logPageVisit, logAction, logButtonClick, logError } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.8.3';

const PixelTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState('red');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gpuInfo, setGpuInfo] = useState({ vendor: 'Unknown', renderer: 'Unknown' });
  const [showChangelog, setShowChangelog] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');

  // Solid dark (toolbox) background — no external image fetch.

  // Log page visit on mount
  useEffect(() => {
    logPageVisit('dpd', 'Dead Pixel Detector');
  }, []);

  const colors = [
    { name: 'Red', value: 'red', hex: '#FF0000' },
    { name: 'Green', value: 'green', hex: '#00FF00' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Light Gray', value: 'lightgray', hex: '#D3D3D3' },
  ];

  // Loading animation (1 second)
  useEffect(() => {
    const duration = 300;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setLoadingProgress((step / steps) * 100);

      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 50);
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
      console.warn('Fullscreen not available:', error.message);
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
    if (!isLoading && !isFullscreen) {
      // Log GPU info and start test directly
      logButtonClick('dpd', 'Dead Pixel Detector', 'start_test');
      logAction('dpd', 'Dead Pixel Detector', 'gpu_info_displayed', {
        gpu_vendor: gpuInfo.vendor,
        gpu_renderer: gpuInfo.renderer
      });
      logAction('dpd', 'Dead Pixel Detector', 'fullscreen_entered', {
        trigger: 'click_to_start'
      });
      enterFullscreen();
    }
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Pexels Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)',
                width: '105%',
                height: '105%',
                marginLeft: '-2.5%',
                marginTop: '-2.5%'
              }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: '#0b0f19',
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        {/* 127 Logo Top Left */}
        <div className="absolute top-8 left-8 z-30">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="h-12 w-auto brightness-110 cursor-pointer hover:brightness-125 transition-all"
              draggable="false"
            />
          </Link>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md p-12 rounded-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Dead Pixel Detector</h2>
              </div>
              <Progress value={loadingProgress} className="h-3" />
              <p className="text-center text-lg text-white text-opacity-80">{Math.round(loadingProgress)}%</p>
              <div className="text-center">
                <button
                  onClick={() => setShowChangelog(true)}
                  className="text-xs cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: '#8fa8ff',
                    opacity: 0.8
                  }}
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
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
        className="relative min-h-screen no-transition"
        style={{ 
          backgroundColor: isFullscreen ? currentColorObj.hex : '#0b0f19',
          cursor: isFullscreen ? 'none' : 'default'
        }}
      >
        {/* Instructions when not in fullscreen */}
        {!isFullscreen && (
        <>
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="h-8 sm:h-12 w-auto brightness-110 cursor-pointer hover:brightness-125 transition-all"
              draggable="false"
            />
          </Link>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div 
            className="rounded-3xl shadow-2xl p-8 max-w-md"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="mb-6 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-2">Dead Pixel Detector</h2>
              <p className="text-white text-opacity-70">{'Test your screen for dead or stuck pixels'}</p>
            </div>
            <div 
              className="rounded-2xl p-4 text-left"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="font-semibold text-white text-lg mb-2">{'Instructions:'}</h3>
              <ul className="text-sm text-white text-opacity-80 space-y-1">
                <li>• {'Click "Start Test" to go fullscreen'}</li>
                <li>• {'Use arrow keys (← →) to switch colors'}</li>
                <li>• {'Mouse disappears automatically in fullscreen'}</li>
                <li>• {'Press ESC to exit fullscreen'}</li>
                <li>• {'Look for pixels that don\'t change'}</li>
              </ul>
            </div>
            <div 
              className="rounded-2xl p-4 text-left mt-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="font-semibold text-white text-lg mb-2">{'GPU Information:'}</h3>
              <div className="text-sm text-white text-opacity-80 space-y-2">
                <div>
                  <span className="text-white text-opacity-60">{'Vendor:'}</span>
                  <span className="ml-2 text-white font-medium break-words">{gpuInfo.vendor}</span>
                </div>
                <div>
                  <span className="text-white text-opacity-60">{'Renderer:'}</span>
                  <span className="ml-2 text-white font-medium break-words">{gpuInfo.renderer}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-white text-opacity-70">
                {'Current color:'} <span className="font-bold text-white">{currentColorObj.name}</span>
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <button
                onClick={handleClick}
                data-testid="dpd-start-test"
                className="w-full px-6 py-4 rounded-full font-medium text-sm transition-all"
                style={{
                  background: 'rgba(150, 180, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(150, 180, 255, 0.15)',
                  color: '#cfe1ff',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(150, 180, 255, 0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(150, 180, 255, 0.25)'}
              >
                {'Start Test'}
              </button>
              <Link to="/">
                <button 
                  className="w-full px-6 py-4 rounded-full font-medium text-sm text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {'Check out other tools'}
                </button>
              </Link>
            </div>
          </div>
        </div>
        </>
      )}
      </div>
      
      {/* Floating Feedback Button - Hide in fullscreen */}
      <FloatingFeedbackButton hideOnFullscreen={true} />
      {/* language toggle removed */}
      
      {/* Changelog Modal */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
    </>
  );
};

export default function WrappedPixelTest() {
  return (
    <ToolStatusWrapper toolId="dpd">
      <PixelTest />
    </ToolStatusWrapper>
  );
}