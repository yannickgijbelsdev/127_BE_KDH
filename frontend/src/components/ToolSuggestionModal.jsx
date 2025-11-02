import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ToolSuggestionModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTimeout(() => {
        setToolName('');
        setDescription('');
        setUseCase('');
        setSubmitted(false);
      }, 300);
    }
  }, [isOpen]);

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return { browserName, browserVersion };
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1) return 'iOS';
    return 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!toolName.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { browserName, browserVersion } = getBrowserInfo();
      const os = getOS();

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tool-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_name: toolName,
          description: description,
          use_case: useCase || null,
          browser_name: browserName,
          browser_version: browserVersion,
          operating_system: os,
          user_agent: navigator.userAgent
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting tool suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in backdrop-blur-sm">
      <div 
        className="rounded-3xl shadow-2xl max-w-md w-full relative"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-opacity-70 hover:text-opacity-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {submitted ? (
          <div className="p-8 text-center">
            <Lightbulb className="w-16 h-16 text-white text-opacity-90 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('Bedankt!', 'Thank you!')}</h2>
            <p className="text-white text-opacity-70">
              {t('Je tool suggestie is ontvangen. We bekijken deze en nemen contact op indien nodig.', 'Your tool suggestion has been received. We will review it and contact you if needed.')}
            </p>
          </div>
        ) : (
          <>
            <div className="p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-white text-opacity-90" />
                <div>
                  <h2 className="text-xl font-bold text-white">{t('Stel een tool voor', 'Suggest a tool')}</h2>
                  <p className="text-sm text-white text-opacity-70">{t('Mis je een tool? Laat het ons weten!', 'Missing a tool? Let us know!')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white text-opacity-70 mb-2">
                  {t('Tool Naam *', 'Tool Name *')}
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder={t('Bijv. WiFi Speed Tester', 'E.g. WiFi Speed Tester')}
                  required
                  className="w-full px-4 py-2 text-white rounded-lg focus:outline-none placeholder-white placeholder-opacity-30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(150, 180, 255, 0.4)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white text-opacity-70 mb-2">
                  Beschrijving *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Wat moet deze tool doen?"
                  required
                  rows={3}
                  className="w-full px-4 py-2 text-white rounded-lg focus:outline-none resize-none placeholder-white placeholder-opacity-30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(150, 180, 255, 0.4)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white text-opacity-70 mb-2">
                  Use Case (optioneel)
                </label>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Wanneer zou je deze tool gebruiken?"
                  rows={2}
                  className="w-full px-4 py-2 text-white rounded-lg focus:outline-none resize-none placeholder-white placeholder-opacity-30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(150, 180, 255, 0.4)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !toolName.trim() || !description.trim()}
                className="w-full px-6 py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(150, 180, 255, 0.3)',
                  color: '#cfe1ff'
                }}
                onMouseEnter={(e) => !isSubmitting && (e.target.style.background = 'rgba(150, 180, 255, 0.4)')}
                onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.3)'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  'Verstuur Suggestie'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ToolSuggestionModal;
