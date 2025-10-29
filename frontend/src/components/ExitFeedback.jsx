import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Star, Send } from 'lucide-react';

const ExitFeedback = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get browser info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      browserName = 'Opera';
      browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }
    
    return { browserName, browserVersion };
  };

  // Get OS info
  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') !== -1) return 'Windows';
    if (ua.indexOf('Mac') !== -1) return 'macOS';
    if (ua.indexOf('Linux') !== -1) return 'Linux';
    if (ua.indexOf('Android') !== -1) return 'Android';
    if (ua.indexOf('iOS') !== -1) return 'iOS';
    return 'Unknown';
  };

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
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          };
        }
      }
    } catch (e) {
      console.error('Unable to get GPU info:', e);
    }
    return { vendor: 'Unknown', renderer: 'Unknown' };
  };

  // Get CPU info
  const getCPUInfo = () => {
    const cores = navigator.hardwareConcurrency || 'Unknown';
    const platform = navigator.platform || 'Unknown';
    return {
      cores: cores,
      info: `${cores} cores (${platform})`
    };
  };

  useEffect(() => {
    // Don't show on admin routes
    if (location.pathname.startsWith('/localhost')) {
      return;
    }

    // Check if user has already seen the modal this session
    if (sessionStorage.getItem('feedback_shown')) {
      setHasShown(true);
      return;
    }

    // Mouse leave detection (exit intent)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasShown && !showModal) {
        setShowModal(true);
        setHasShown(true);
        sessionStorage.setItem('feedback_shown', 'true');
      }
    };

    // Tab visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !hasShown && !showModal) {
        setShowModal(true);
        setHasShown(true);
        sessionStorage.setItem('feedback_shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasShown, showModal, location.pathname]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Geef alsjeblieft een beoordeling');
      return;
    }

    if (!feedback.trim()) {
      alert('Geef alsjeblieft feedback');
      return;
    }

    setIsSubmitting(true);

    const { browserName, browserVersion } = getBrowserInfo();
    const os = getOS();
    const gpu = getGPUInfo();
    const cpu = getCPUInfo();

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback_text: feedback,
          suggestions: suggestions || null,
          browser_name: browserName,
          browser_version: browserVersion,
          operating_system: os,
          gpu_vendor: gpu.vendor,
          gpu_renderer: gpu.renderer,
          cpu_cores: cpu.cores,
          cpu_info: cpu.info,
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Er ging iets mis. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] px-4 animate-fade-in">
      <div className="bg-[#303134] rounded-lg p-6 max-w-md w-full border border-[#5f6368] shadow-2xl">
        {submitted ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#e8eaed] mb-2">Bedankt!</h3>
            <p className="text-[#9aa0a6]">Je feedback is verzonden.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#e8eaed]">Voor je weggaat...</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#5f6368] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#9aa0a6]" />
              </button>
            </div>

            <p className="text-[#9aa0a6] mb-6">
              Help ons beter te worden! Geef je mening over je ervaring.
            </p>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#e8eaed] mb-3">
                Geef een beoordeling (1-10)
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    onMouseEnter={() => setHoverRating(num)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                      (hoverRating >= num || (hoverRating === 0 && rating >= num))
                        ? num <= 4
                          ? 'bg-red-500 text-white'
                          : num <= 7
                          ? 'bg-orange-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-[#202124] text-[#9aa0a6] border border-[#5f6368]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                Wat kan er beter?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Vertel ons wat je ervaring was..."
                rows="3"
                className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none resize-none"
              />
            </div>

            {/* Suggestions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                Suggesties (optioneel)
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Heb je ideeën voor verbetering?"
                rows="2"
                className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg font-medium transition-colors"
              >
                Overslaan
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  'Verzenden...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Verzenden
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExitFeedback;
