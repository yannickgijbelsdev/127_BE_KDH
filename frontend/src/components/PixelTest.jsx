import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Monitor } from 'lucide-react';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolStatusWrapper from './ToolStatusWrapper';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { logPageVisit, logAction, logButtonClick, logError } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.8.2';

const PixelTest = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState('red');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gpuInfo, setGpuInfo] = useState({ vendor: 'Unknown', renderer: 'Unknown' });
  const [showChangelog, setShowChangelog] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');

  // Fetch random background image from Pexels
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        // Random page between 1-10 for variety - tech/working/networking theme
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=colorful+nature+peaceful+calm+landscape&orientation=landscape&per_page=15&page=${randomPage}`,
          {
            headers: {
              Authorization: 'SBv6ZOHirhcApz4iLkxYd7c2RDXBWJPKbc8AWDku666r3zU6Tdc2sOih'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
            setBackgroundImage(randomPhoto.src.large);
          }
        }
      } catch (error) {
        console.error('Error fetching Pexels image:', error);
        setBackgroundImage('');
      }
    };

    fetchBackgroundImage();
  }, []);

  // Log page visit on mount
  useEffect(() => {
    logPageVisit('dpd', 'Dead Pixel Detector');
  }, []);

  const colors = [
    { name: t('Rood', 'Red'), value: 'red', hex: '#FF0000' },
    { name: t('Groen', 'Green'), value: 'green', hex: '#00FF00' },
    { name: t('Blauw', 'Blue'), value: 'blue', hex: '#0000FF' },
    { name: t('Zwart', 'Black'), value: 'black', hex: '#000000' },
    { name: t('Wit', 'White'), value: 'white', hex: '#FFFFFF' },
    { name: t('Lichtgrijs', 'Light Gray'), value: 'lightgray', hex: '#D3D3D3' },
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        onClick={handleClick}
        className="relative min-h-screen no-transition"
        style={{ 
          backgroundColor: currentColorObj.hex,
          cursor: isFullscreen ? 'none' : 'pointer'
        }}
      >
        {/* Instructions when not in fullscreen */}
        {!isFullscreen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div 
            className="rounded-3xl shadow-2xl p-8 max-w-md"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
               draggable="false"/>
              <h2 className="text-2xl font-bold text-white mb-2">Dead Pixel Detector</h2>
              <p className="text-white text-opacity-70">{t('Klik om te starten', 'Click to start')}</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangelog(true);
                }}
                className="text-xs cursor-pointer hover:opacity-100 transition-opacity mt-2"
                style={{
                  color: '#8fa8ff',
                  opacity: 0.8
                }}
              >
                Build {BUILD_VERSION}
              </button>
            </div>
            <div 
              className="rounded-2xl p-4 text-left"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="font-semibold text-white text-lg mb-2">{t('Instructies:', 'Instructions:')}</h3>
              <ul className="text-sm text-white text-opacity-80 space-y-1">
                <li>• {t('Klik overal op het scherm om fullscreen te gaan', 'Click anywhere on screen to go fullscreen')}</li>
                <li>• {t('Gebruik pijltjestoetsen (← →) om van kleur te wisselen', 'Use arrow keys (← →) to switch colors')}</li>
                <li>• {t('De muis verdwijnt automatisch in fullscreen', 'Mouse disappears automatically in fullscreen')}</li>
                <li>• {t('Druk op ESC om fullscreen te verlaten', 'Press ESC to exit fullscreen')}</li>
                <li>• {t('Zoek naar pixels die niet mee veranderen', 'Look for pixels that don\'t change')}</li>
              </ul>
            </div>
            <div 
              className="rounded-2xl p-4 text-left mt-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="font-semibold text-white text-lg mb-2">GPU Informatie:</h3>
              <div className="text-sm text-white text-opacity-80 space-y-2">
                <div>
                  <span className="text-white text-opacity-60">Vendor:</span>
                  <span className="ml-2 text-white font-medium break-words">{gpuInfo.vendor}</span>
                </div>
                <div>
                  <span className="text-white text-opacity-60">Renderer:</span>
                  <span className="ml-2 text-white font-medium break-words">{gpuInfo.renderer}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-white text-opacity-70">
                Huidige kleur: <span className="font-bold text-white">{currentColorObj.name}</span>
              </p>
            </div>
            <div className="mt-6">
              <Link to="/" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="w-full px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(150, 180, 255, 0.3)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.4)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.3)'}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Bekijk ook andere tools
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Floating Feedback Button - Hide in fullscreen */}
      <FloatingFeedbackButton hideOnFullscreen={true} />
      
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