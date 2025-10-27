import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Monitor, Printer, Activity } from 'lucide-react';

// Build version - Update this with each change
const BUILD_VERSION = '1.2.5';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Available tools/pages
  const tools = [
    {
      id: 'dpd',
      name: 'Dead Pixel Detector',
      description: 'Test uw scherm op dode pixels met verschillende kleuren',
      keywords: ['pixel', 'dead', 'detector', 'scherm', 'test', 'dode'],
      path: '/dpd',
      icon: Monitor,
    },
    {
      id: 'printer',
      name: 'Printer Tester',
      description: 'Test uw printer op kwaliteit, kleuren, lijnen en uitlijning',
      keywords: ['printer', 'test', 'print', 'kwaliteit', 'kleuren', 'lijnen', 'afdrukken'],
      path: '/printer',
      icon: Printer,
    },
    {
      id: 'sscreen',
      name: 'Screen Refresh Tester',
      description: 'Test de verversingssnelheid en vloeiendheid van uw scherm',
      keywords: ['screen', 'refresh', 'rate', 'fps', 'verversing', 'scherm', 'snelheid', 'hz'],
      path: '/sscreen',
      icon: Activity,
    },
  ];

  // Filter tools based on search query
  const filteredTools = tools.filter(tool => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  const showResults = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <img 
          src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
          alt="127 Logo" 
          className="w-32 h-auto mx-auto brightness-110"
        />
        <p className="text-xs text-[#9aa0a6] text-center mt-3">Build {BUILD_VERSION}</p>
      </div>

      {/* Search Container */}
      <div className="w-full max-w-2xl">
        {/* Search Bar */}
        <div 
          className={`relative transition-all duration-200 ${
            isFocused || showResults 
              ? 'shadow-2xl' 
              : 'shadow-lg hover:shadow-2xl'
          }`}
        >
          <div className="relative group">
            {/* Animated gradient border on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 rounded-full opacity-0 group-hover:opacity-75 blur-sm transition-opacity duration-300 animate-gradient-rotate"></div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Zoek naar tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="relative w-full pl-14 pr-4 py-4 text-base bg-[#303134] border border-[#5f6368] text-[#e8eaed] rounded-full focus:outline-none focus:border-[#8ab4f8] transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute w-full mt-2 bg-[#303134] rounded-3xl shadow-2xl border border-[#5f6368] overflow-hidden z-10">
              {filteredTools.length > 0 ? (
                <div className="py-2">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link 
                        key={tool.id} 
                        to={tool.path}
                        className="block"
                      >
                        <div className="px-6 py-4 hover:bg-[#3c4043] transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="bg-[#3c4043] p-2 rounded-full">
                              <Icon className="w-5 h-5 text-[#8ab4f8]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-base font-medium text-[#e8eaed]">
                                {tool.name}
                              </div>
                              <div className="text-sm text-[#9aa0a6] mt-0.5">
                                {tool.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-[#e8eaed]">Geen resultaten voor "{searchQuery}"</p>
                  <p className="text-sm text-[#9aa0a6] mt-1">
                    Probeer: pixel, scherm, test
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Tools - Only show when not searching */}
        {!showResults && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="flex gap-3 justify-center flex-wrap">
              {tools.map((tool) => (
                <Link key={tool.id} to={tool.path}>
                  <button 
                    className="px-5 py-2.5 bg-[#303134] hover:bg-[#3c4043] text-[#e8eaed] rounded-full text-sm transition-colors border border-[#5f6368]"
                  >
                    {tool.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;