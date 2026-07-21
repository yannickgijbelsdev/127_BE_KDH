import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw, Lock, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Progress } from './ui/progress';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolStatusWrapper from './ToolStatusWrapper';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

const BUILD_VERSION = '1.8.3';

const PasswordGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' });
  const [showChangelog, setShowChangelog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAutosoftPassword, setIsAutosoftPassword] = useState(false);
  const [showMemorableForm, setShowMemorableForm] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [memorableInputs, setMemorableInputs] = useState({
    interest: '',
    year: '',
    favorite: '',
  });

  // Solid dark (toolbox) background — no external image fetch.

  // Log page visit on mount
  useEffect(() => {
    logPageVisit('password', 'Password Generator');
  }, []);

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

  // Generate initial password
  useEffect(() => {
    if (!isLoading) {
      generatePassword();
    }
  }, [isLoading]);

  // Calculate password strength
  useEffect(() => {
    if (customPassword) {
      // Check for Autosoft01 password and variations
      const autosoftPattern = /^Autosoft01!*$/i; // Matches Autosoft01, Autosoft01!, Autosoft01!!, etc.
      if (autosoftPattern.test(customPassword)) {
        setIsAutosoftPassword(true);
        setStrength({ score: 0, label: 'Test Password', color: '#FF0000' });
        setShowConfetti(false);
        
        // Log Autosoft password detection
        logAction('password', 'Password Generator', 'autosoft_password_detected', {
          password_variant: customPassword
        });
        return;
      } else {
        setIsAutosoftPassword(false);
      }

      const result = calculateStrength(customPassword);
      setStrength(result);
      
      // Log strength check
      logAction('password', 'Password Generator', 'strength_checked', {
        password_length: customPassword.length,
        strength_score: result.score,
        strength_label: result.label,
        has_uppercase: /[A-Z]/.test(customPassword),
        has_lowercase: /[a-z]/.test(customPassword),
        has_numbers: /[0-9]/.test(customPassword),
        has_symbols: /[^a-zA-Z0-9]/.test(customPassword)
      });
      
      if (result.score >= 80 && !showConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } else {
      setStrength({ score: 0, label: '', color: '' });
      setShowConfetti(false);
      setIsAutosoftPassword(false);
    }
  }, [customPassword]);

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (chars === '') chars = lowercase; // Default to lowercase if nothing selected

    let generatedPassword = '';
    for (let i = 0; i < length; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setPassword(generatedPassword);
    setCopied(false);
    
    logAction('password', 'Password Generator', 'password_generated', {
      length: length,
      includes_uppercase: includeUppercase,
      includes_lowercase: includeLowercase,
      includes_numbers: includeNumbers,
      includes_symbols: includeSymbols
    });
  };

  const calculateStrength = (pwd) => {
    let score = 0;

    // Length check
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (pwd.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;

    // Bonus for good mix
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);
    const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    if (variety === 4) score += 15;

    // Penalties
    if (/(.)\1{2,}/.test(pwd)) score -= 10; // Repeated characters
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(pwd.toLowerCase())) score -= 10; // Sequential

    score = Math.max(0, Math.min(100, score));

    let label = '';
    let color = '';
    if (score < 40) {
      label = 'Weak';
      color = '#FF4444';
    } else if (score < 60) {
      label = 'Medium';
      color = '#FFA500';
    } else if (score < 80) {
      label = 'Strong';
      color = '#4CAF50';
    } else {
      label = 'Excellent';
      color = '#9C27B0';
    }

    return { score, label, color };
  };

  const generateSuggestion = () => {
    // Generate a strong alternative password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let suggestion = '';
    for (let i = 0; i < 18; i++) {
      suggestion += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return suggestion;
  };

  const generateMemorablePassword = () => {
    const { interest, year, favorite } = memorableInputs;
    if (!interest || !year || !favorite) {
      return '';
    }

    // Create a memorable but strong password
    const symbols = ['!', '@', '#', '$', '%', '&', '*'];
    const symbol1 = symbols[Math.floor(Math.random() * symbols.length)];
    const symbol2 = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Capitalize first letter of interest and favorite
    const interestCap = interest.charAt(0).toUpperCase() + interest.slice(1).toLowerCase();
    const favoriteCap = favorite.charAt(0).toUpperCase() + favorite.slice(1).toLowerCase();
    
    return `${interestCap}${symbol1}${favoriteCap}${year}${symbol2}`;
  };

  const handleMemorableSubmit = () => {
    const memorable = generateMemorablePassword();
    if (memorable) {
      setPassword(memorable);
      setCustomPassword(memorable); // Also show in strength checker
      setShowMemorableForm(false);
      setMemorableInputs({ interest: '', year: '', favorite: '' });
      
      // Log memorable password generation
      logAction('password', 'Password Generator', 'memorable_password_generated', {
        has_interest: !!memorableInputs.interest,
        has_year: !!memorableInputs.year,
        has_favorite: !!memorableInputs.favorite,
        password_length: memorable.length
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Log copy action
    logButtonClick('password', 'Password Generator', 'copy_password');
  };

  if (isLoading) {
    return (
      <>
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
                <h2 className="text-3xl font-bold text-white mb-2">Password Generator</h2>
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
      
      {/* Changelog Modal */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
      </>
    );
  }

  return (
    <>
    <div 
      className="min-h-screen py-8 px-4 transition-all duration-700"
      style={{ 
        backgroundColor: (isAutosoftPassword || showMemorableForm) ? '#330000' : '#0b0f19',
        animation: (isAutosoftPassword || showMemorableForm) ? 'redPulse 2s ease-in-out infinite' : 'none'
      }}
    >
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

      <style>{`
        @keyframes redPulse {
          0%, 100% {
            background-color: #330000;
          }
          50% {
            background-color: #440000;
          }
        }
      `}</style>
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <div
                className="w-2 h-2"
                style={{
                  backgroundColor: ['#FF4444', '#FFA500', '#4CAF50', '#9C27B0', '#2196F3'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Password Generator</h1>
            <p className="text-white text-opacity-70">Create secure passwords and test their strength</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Generator Section */}
            <div 
              className="rounded-3xl p-8 border"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-white text-opacity-80" />
                <h2 className="text-xl font-semibold text-white">Generate Password</h2>
              </div>

            {/* Generated Password Display */}
            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={password}
                  readOnly
                  className="flex-1 text-white px-4 py-3 rounded-full font-mono text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(password)}
                  className="px-4 py-3 rounded-full font-medium transition-colors"
                  style={{
                    background: 'rgba(150, 180, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(150, 180, 255, 0.15)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.35)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.25)'}
                  title="Copy"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="px-4 py-3 rounded-full font-medium transition-colors"
                  style={{
                    background: 'rgba(150, 180, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(150, 180, 255, 0.15)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.35)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.25)'}
                  title="Generate new"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Length Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-white text-opacity-70">Length</label>
                <span className="text-sm font-semibold text-white">{length} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-2 bg-[#5f6368] rounded-lg appearance-none cursor-pointer accent-[#8ab4f8]"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-white text-opacity-90">Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-white text-opacity-90">Lowercase (a-z)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-white text-opacity-90">Numbers (0-9)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-white text-opacity-90">Special characters (!@#$%)</span>
              </label>
            </div>
          </div>

          {/* Strength Checker Section */}
          <div 
            className="rounded-3xl p-8 border"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-white text-opacity-80" />
              <h2 className="text-xl font-semibold text-white">Strength Check</h2>
            </div>

            {/* Custom Password Input */}
            <div className="mb-6">
              <input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full text-white px-4 py-3 rounded-full font-mono text-sm placeholder-white placeholder-opacity-40"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>

            {/* Strength Meter */}
            {customPassword && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white text-opacity-70">Strength</span>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div 
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${strength.score}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-white text-opacity-60 mt-1 text-right">{strength.score}/100</p>
                </div>

                {/* Autosoft01 Warning */}
                {isAutosoftPassword && (
                  <div className="bg-[#FF0000] bg-opacity-20 border-2 border-[#FF0000] rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-[#FF0000]" />
                      <h3 className="text-[#FF0000] font-bold">WARNING: Test Password Detected!</h3>
                    </div>
                    <p className="text-[#e8eaed] text-sm mb-3">
                      This is a test password that is not secure. Change it immediately to a stronger password.
                    </p>
                    <button
                      onClick={() => setShowMemorableForm(true)}
                      className="w-full px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-lg font-medium transition-colors"
                    >
                      Create a secure password
                    </button>
                  </div>
                )}

                {/* Weak/Medium Password Suggestion */}
                {!isAutosoftPassword && strength.score < 60 && strength.score > 0 && (
                  <div className="bg-[#FFA500] bg-opacity-20 border border-[#FFA500] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-[#FFA500]" />
                      <h3 className="text-[#FFA500] font-semibold">Suggestion</h3>
                    </div>
                    <p className="text-[#e8eaed] text-sm mb-3">
                      Your password is not strong enough. Try one of these options:
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generateSuggestion()}
                          readOnly
                          className="flex-1 text-white px-3 py-2 rounded-full font-mono text-xs"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                        <button
                          onClick={() => {
                            const suggestion = generateSuggestion();
                            setCustomPassword(suggestion);
                            copyToClipboard(suggestion);
                          }}
                          className="px-3 py-2 rounded-full transition-colors text-sm font-medium text-white"
                          style={{
                            background: 'rgba(255, 165, 0, 0.8)'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 140, 0, 0.9)'}
                          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 165, 0, 0.8)'}
                        >
                          Use this
                        </button>
                      </div>
                      <button
                        onClick={() => setShowMemorableForm(true)}
                        className="w-full px-4 py-2 rounded-full font-medium transition-colors text-sm"
                        style={{
                          background: 'rgba(150, 180, 255, 0.25)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(150, 180, 255, 0.15)',
                          color: '#cfe1ff'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.35)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.25)'}
                      >
                        Or create a memorable password
                      </button>
                    </div>
                  </div>
                )}

                {/* Strength Tips */}
                {!isAutosoftPassword && (
                <div 
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <h3 className="text-sm font-semibold text-white mb-2">Tips for a stronger password:</h3>
                  <ul className="text-xs text-white text-opacity-70 space-y-1">
                    <li>• At least 12 characters long</li>
                    <li>• Mix of upper/lowercase, numbers and symbols</li>
                    <li>• Avoid repeating characters or patterns</li>
                    <li>• Don't use common words</li>
                  </ul>
                </div>
                )}

                {!isAutosoftPassword && strength.score >= 80 && (
                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: 'rgba(156, 39, 176, 0.2)',
                      border: '1px solid rgba(156, 39, 176, 0.4)'
                    }}
                  >
                    <p className="text-white text-center font-semibold">
                      Excellent password!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Memorable Password Form Modal */}
        {showMemorableForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
            <div 
              className="rounded-3xl p-8 max-w-md w-full"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Create a Memorable Password</h2>
              <p className="text-sm text-white text-opacity-70 mb-4">
                Enter your favorite things to create a strong but easy-to-remember password
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white text-opacity-70 mb-1">Your interest or hobby</label>
                  <input
                    type="text"
                    value={memorableInputs.interest}
                    onChange={(e) => setMemorableInputs({...memorableInputs, interest: e.target.value})}
                    placeholder="e.g. Football, Music, Travel"
                    className="w-full text-white px-4 py-2 rounded-full text-sm placeholder-white placeholder-opacity-40"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white text-opacity-70 mb-1">Important year</label>
                  <input
                    type="text"
                    value={memorableInputs.year}
                    onChange={(e) => setMemorableInputs({...memorableInputs, year: e.target.value})}
                    placeholder="e.g. 1990, 2024"
                    maxLength="4"
                    className="w-full text-white px-4 py-2 rounded-full text-sm placeholder-white placeholder-opacity-40"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white text-opacity-70 mb-1">Favorite thing</label>
                  <input
                    type="text"
                    value={memorableInputs.favorite}
                    onChange={(e) => setMemorableInputs({...memorableInputs, favorite: e.target.value})}
                    placeholder="e.g. Cat, Pizza, Beach"
                    className="w-full text-white px-4 py-2 rounded-full text-sm placeholder-white placeholder-opacity-40"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowMemorableForm(false);
                    setMemorableInputs({ interest: '', year: '', favorite: '' });
                  }}
                  className="flex-1 px-4 py-2 rounded-full font-medium transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMemorableSubmit}
                  disabled={!memorableInputs.interest || !memorableInputs.year || !memorableInputs.favorite}
                  className="flex-1 px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(150, 180, 255, 0.3)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.background = 'rgba(150, 180, 255, 0.4)')}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.3)'}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link to="/">
            <button 
              className="px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
              style={{
                background: 'rgba(150, 180, 255, 0.3)',
                color: '#cfe1ff'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.4)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(150, 180, 255, 0.3)'}
            >
              <ArrowLeft className="w-4 h-4" />
              Check out other tools
            </button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s linear forwards;
        }
      `}</style>
    </div>
    
    <FloatingFeedbackButton />
    {/* language toggle removed */}
    <ChangelogModal 
      isOpen={showChangelog} 
      onClose={() => setShowChangelog(false)}
      currentVersion={BUILD_VERSION}
    />
  </>
  );
};

export default function WrappedPasswordGenerator() {
  return (
    <ToolStatusWrapper toolId="password">
      <PasswordGenerator />
    </ToolStatusWrapper>
  );
}
