import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw, Lock, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Progress } from './ui/progress';
import HalloweenDecoration from './HalloweenDecoration';

const BUILD_VERSION = '1.3.7';

const PasswordGenerator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' });
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAutosoftPassword, setIsAutosoftPassword] = useState(false);
  const [showMemorableForm, setShowMemorableForm] = useState(false);
  const [memorableInputs, setMemorableInputs] = useState({
    interest: '',
    year: '',
    favorite: '',
  });

  // Loading animation
  useEffect(() => {
    const duration = 2000;
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

  // Generate initial password
  useEffect(() => {
    if (!isLoading) {
      generatePassword();
    }
  }, [isLoading]);

  // Calculate password strength
  useEffect(() => {
    if (customPassword) {
      // Check for Autosoft01 password
      if (customPassword === 'Autosoft01') {
        setIsAutosoftPassword(true);
        setStrength({ score: 0, label: 'Test Wachtwoord', color: '#FF0000' });
        setShowConfetti(false);
        return;
      } else {
        setIsAutosoftPassword(false);
      }

      const result = calculateStrength(customPassword);
      setStrength(result);
      
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
      label = 'Zwak';
      color = '#FF4444';
    } else if (score < 60) {
      label = 'Gemiddeld';
      color = '#FFA500';
    } else if (score < 80) {
      label = 'Sterk';
      color = '#4CAF50';
    } else {
      label = 'Uitstekend';
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
      setShowMemorableForm(false);
      setMemorableInputs({ interest: '', year: '', favorite: '' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Password Generator</h2>
            </div>
            <Progress value={loadingProgress} className="h-3 bg-[#303134]" />
            <p className="text-center text-sm text-[#9aa0a6]">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4 transition-colors duration-500"
      style={{ backgroundColor: isAutosoftPassword ? '#3d0000' : '#202124' }}
    >
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
          <img 
            src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
            alt="127 Logo" 
            className="w-24 h-auto mx-auto mb-4 brightness-110"
          />
          <h1 className="text-3xl font-bold text-[#e8eaed] mb-2">Wachtwoord Generator</h1>
          <p className="text-[#9aa0a6]">Maak veilige wachtwoorden en test de sterkte</p>
          <p className="text-xs text-[#9aa0a6] mt-2">Build {BUILD_VERSION}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generator Section */}
          <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#8ab4f8]" />
              <h2 className="text-xl font-semibold text-[#e8eaed]">Genereer Wachtwoord</h2>
            </div>

            {/* Generated Password Display */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  readOnly
                  className="flex-1 bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(password)}
                  className="px-4 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg transition-colors"
                  title="Kopieer"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="px-4 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg transition-colors"
                  title="Genereer nieuw"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Length Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[#9aa0a6]">Lengte</label>
                <span className="text-sm font-semibold text-[#e8eaed]">{length} karakters</span>
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
                <span className="text-sm text-[#e8eaed]">Hoofdletters (A-Z)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-[#e8eaed]">Kleine letters (a-z)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-[#e8eaed]">Cijfers (0-9)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="w-4 h-4 accent-[#8ab4f8]"
                />
                <span className="text-sm text-[#e8eaed]">Speciale tekens (!@#$%)</span>
              </label>
            </div>
          </div>

          {/* Strength Checker Section */}
          <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-[#8ab4f8]" />
              <h2 className="text-xl font-semibold text-[#e8eaed]">Sterkte Check</h2>
            </div>

            {/* Custom Password Input */}
            <div className="mb-6">
              <input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Voer je wachtwoord in..."
                className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] font-mono text-sm placeholder-[#5f6368]"
              />
            </div>

            {/* Strength Meter */}
            {customPassword && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#9aa0a6]">Sterkte</span>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#202124] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${strength.score}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#9aa0a6] mt-1 text-right">{strength.score}/100</p>
                </div>

                {/* Autosoft01 Warning */}
                {isAutosoftPassword && (
                  <div className="bg-[#FF0000] bg-opacity-20 border-2 border-[#FF0000] rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-[#FF0000]" />
                      <h3 className="text-[#FF0000] font-bold">WAARSCHUWING: Test Wachtwoord Gedetecteerd!</h3>
                    </div>
                    <p className="text-[#e8eaed] text-sm mb-3">
                      Dit is een test wachtwoord dat niet veilig is. Verander dit onmiddellijk naar een sterker wachtwoord.
                    </p>
                    <button
                      onClick={() => setShowMemorableForm(true)}
                      className="w-full px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-lg font-medium transition-colors"
                    >
                      Maak een veilig wachtwoord
                    </button>
                  </div>
                )}

                {/* Weak/Medium Password Suggestion */}
                {!isAutosoftPassword && strength.score < 60 && strength.score > 0 && (
                  <div className="bg-[#FFA500] bg-opacity-20 border border-[#FFA500] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-[#FFA500]" />
                      <h3 className="text-[#FFA500] font-semibold">Suggestie</h3>
                    </div>
                    <p className="text-[#e8eaed] text-sm mb-3">
                      Je wachtwoord is niet sterk genoeg. Probeer een van deze opties:
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generateSuggestion()}
                          readOnly
                          className="flex-1 bg-[#202124] text-[#e8eaed] px-3 py-2 rounded-lg border border-[#5f6368] font-mono text-xs"
                        />
                        <button
                          onClick={() => {
                            const suggestion = generateSuggestion();
                            setCustomPassword(suggestion);
                            copyToClipboard(suggestion);
                          }}
                          className="px-3 py-2 bg-[#FFA500] hover:bg-[#FF8C00] text-[#202124] rounded-lg transition-colors text-sm font-medium"
                        >
                          Gebruik dit
                        </button>
                      </div>
                      <button
                        onClick={() => setShowMemorableForm(true)}
                        className="w-full px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors text-sm"
                      >
                        Of maak een memorabel wachtwoord
                      </button>
                    </div>
                  </div>
                )}

                {/* Strength Tips */}
                {!isAutosoftPassword && (
                <div className="bg-[#202124] rounded-lg p-4 border border-[#5f6368]">
                  <h3 className="text-sm font-semibold text-[#e8eaed] mb-2">Tips voor sterker wachtwoord:</h3>
                  <ul className="text-xs text-[#9aa0a6] space-y-1">
                    <li>• Minimaal 12 karakters lang</li>
                    <li>• Mix van hoofd/kleine letters, cijfers en symbolen</li>
                    <li>• Vermijd herhalende karakters of patronen</li>
                    <li>• Gebruik geen veelvoorkomende woorden</li>
                  </ul>
                </div>
                )}

                {!isAutosoftPassword && strength.score >= 80 && (
                  <div className="bg-[#9C27B0] bg-opacity-20 border border-[#9C27B0] rounded-lg p-4">
                    <p className="text-[#e8eaed] text-center font-semibold">
                      Uitstekend wachtwoord!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Memorable Password Form Modal */}
        {showMemorableForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
            <div className="bg-[#303134] rounded-lg p-6 max-w-md w-full border border-[#5f6368]">
              <h2 className="text-xl font-bold text-[#e8eaed] mb-4">Maak een Memorabel Wachtwoord</h2>
              <p className="text-sm text-[#9aa0a6] mb-4">
                Vul je favoriete dingen in om een sterk maar makkelijk te onthouden wachtwoord te maken
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9aa0a6] mb-1">Jouw interesse of hobby</label>
                  <input
                    type="text"
                    value={memorableInputs.interest}
                    onChange={(e) => setMemorableInputs({...memorableInputs, interest: e.target.value})}
                    placeholder="bijv. Voetbal, Muziek, Reizen"
                    className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368] text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#9aa0a6] mb-1">Belangrijk jaar</label>
                  <input
                    type="text"
                    value={memorableInputs.year}
                    onChange={(e) => setMemorableInputs({...memorableInputs, year: e.target.value})}
                    placeholder="bijv. 1990, 2024"
                    maxLength="4"
                    className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368] text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#9aa0a6] mb-1">Favoriete ding</label>
                  <input
                    type="text"
                    value={memorableInputs.favorite}
                    onChange={(e) => setMemorableInputs({...memorableInputs, favorite: e.target.value})}
                    placeholder="bijv. Kat, Pizza, Strand"
                    className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368] text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowMemorableForm(false);
                    setMemorableInputs({ interest: '', year: '', favorite: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleMemorableSubmit}
                  disabled={!memorableInputs.interest || !memorableInputs.year || !memorableInputs.favorite}
                  className="flex-1 px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Genereer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link to="/">
            <button className="px-6 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto">
              <ArrowLeft className="w-4 h-4" />
              Bekijk ook andere tools
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
  );
};

export default PasswordGenerator;
