import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.5.0';

const ScreenTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [displayInfo, setDisplayInfo] = useState({});
  const [showChangelog, setShowChangelog] = useState(false);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // Log page visit
  useEffect(() => {
    logPageVisit('sscreen', 'Screen Refresh Tester');
  }, []);

  // Get display info
  useEffect(() => {
    // Get GPU info
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

    const gpu = getGPUInfo();
    const info = {
      resolution: `${window.screen.width} x ${window.screen.height}`,
      availableResolution: `${window.screen.availWidth} x ${window.screen.availHeight}`,
      colorDepth: `${window.screen.colorDepth}-bit`,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type || 'Unknown',
      gpuVendor: gpu.vendor,
      gpuRenderer: gpu.renderer,
    };
    setDisplayInfo(info);
  }, []);

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

  const handleSpeedChange = (value) => {
    setAnimationSpeed(value[0]);
    logAction('sscreen', 'Screen Refresh Tester', 'speed_changed', {
      new_speed: value[0],
      display_info: displayInfo
    });
  };

  const handleClick = () => {
    if (showInstructions) {
      logButtonClick('sscreen', 'Screen Refresh Tester', 'start_test');
      logAction('sscreen', 'Screen Refresh Tester', 'display_info_captured', {
        display_info: displayInfo,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        color_depth: window.screen.colorDepth
      });
      setShowInstructions(false);
      setIsRunning(true);
    }
  };

  // FPS counter removed - animation continues
  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-8">
        <AutumnDecoration />
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
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Screen Refresh Tester</h2>
            </div>
            <Progress value={loadingProgress} className="h-3 bg-[#303134]" />
            <p className="text-center text-sm text-[#9aa0a6]">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div 
        onClick={handleClick}
        className="min-h-screen bg-[#202124] flex items-center justify-center px-6"
        style={{ cursor: 'pointer' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
              />
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Screen Refresh Tester</h2>
              <p className="text-[#9aa0a6]">Klik om te starten</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangelog(true);
                }}
                className="text-xs text-[#8ab4f8] hover:text-[#aac8f9] mt-2 cursor-pointer underline"
              >
                Build {BUILD_VERSION}
              </button>
            </div>
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 text-left">
              <h3 className="font-semibold text-[#8ab4f8] mb-2">Instructies:</h3>
              <ul className="text-sm text-[#9aa0a6] space-y-1">
                <li>• Klik om de test te starten</li>
                <li>• Beweeg de slider om snelheid aan te passen</li>
                <li>• Bekijk de animerende blokjes</li>
                <li>• Controleer op vloeiendheid en ghosting</li>
                <li>• FPS teller toont de refresh rate</li>
              </ul>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col">
      {/* Control Panel */}
      <div className="bg-[#303134] border-b border-[#5f6368] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-[#8ab4f8]" />
              <div>
                <h1 className="text-2xl font-bold text-[#e8eaed]">Screen Refresh Tester</h1>
                <p className="text-sm text-[#9aa0a6]">Test de verversingssnelheid van uw scherm</p>
                <button 
                  onClick={() => setShowChangelog(true)}
                  className="text-xs text-[#8ab4f8] hover:text-[#aac8f9] cursor-pointer underline"
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
          </div>

          {/* Display Info */}
          <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#8ab4f8] mb-3">Display Informatie</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <p className="text-[#9aa0a6]">Resolutie</p>
                <p className="text-[#e8eaed] font-medium">{displayInfo.resolution}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6]">Beschikbaar</p>
                <p className="text-[#e8eaed] font-medium">{displayInfo.availableResolution}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6]">Kleurdiepte</p>
                <p className="text-[#e8eaed] font-medium">{displayInfo.colorDepth}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6]">Pixel Ratio</p>
                <p className="text-[#e8eaed] font-medium">{displayInfo.pixelRatio}x</p>
              </div>
              <div>
                <p className="text-[#9aa0a6]">Oriëntatie</p>
                <p className="text-[#e8eaed] font-medium">{displayInfo.orientation}</p>
              </div>
            </div>
            <div className="border-t border-[#5f6368] pt-3">
              <p className="text-[#9aa0a6] text-xs mb-1">GPU Informatie</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#e8eaed] text-sm font-medium">{displayInfo.gpuVendor}</p>
                  <p className="text-[#9aa0a6] text-xs mt-1">{displayInfo.gpuRenderer}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#8ab4f8] text-sm font-medium">GPU Type</p>
                  <p className="text-[#9aa0a6] text-xs mt-1">
                    {displayInfo.gpuRenderer?.includes('NVIDIA') ? 'NVIDIA' : 
                     displayInfo.gpuRenderer?.includes('AMD') ? 'AMD' :
                     displayInfo.gpuRenderer?.includes('Intel') ? 'Intel' :
                     displayInfo.gpuRenderer?.includes('Apple') ? 'Apple' :
                     displayInfo.gpuRenderer?.includes('SwiftShader') ? 'Software (SwiftShader)' :
                     'Geïntegreerd'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <Label className="text-[#e8eaed] mb-2 block">Animatiesnelheid: {speed}%</Label>
              <Slider
                value={[speed]}
                onValueChange={(value) => setSpeed(value[0])}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            <Link to="/">
              <Button 
                variant="outline"
                className="border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Animation Area */}
      <div className="flex-1 relative overflow-hidden">
        {[...Array(8)].map((_, index) => (
          <AnimatedBox key={index} speed={speed} index={index} />
        ))}
      </div>
    </div>
  );
};

const AnimatedBox = ({ speed, index }) => {
  const [position, setPosition] = useState(0);
  const direction = useRef(1);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const moveSpeed = (speed / 10) * 300 * delta;
      
      setPosition((prev) => {
        let newPos = prev + (moveSpeed * direction.current);
        
        if (newPos >= window.innerHeight - 100) {
          newPos = window.innerHeight - 100;
          direction.current = -1;
        } else if (newPos <= 0) {
          newPos = 0;
          direction.current = 1;
        }
        
        return newPos;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed]);

  const colors = [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF8800', // Orange
    '#8800FF', // Purple
  ];

  const leftPosition = (index * 12) + 5;

  return (
    <>
    <div
      style={{
        position: 'absolute',
        left: `${leftPosition}%`,
        top: `${position}px`,
        width: '80px',
        height: '80px',
        backgroundColor: colors[index],
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
      }}
    />
    
    <FloatingFeedbackButton />
    <ChangelogModal 
      isOpen={showChangelog} 
      onClose={() => setShowChangelog(false)}
      currentVersion={BUILD_VERSION}
    />
    </>
  );
};

export default ScreenTest;