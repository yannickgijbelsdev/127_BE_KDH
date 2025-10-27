import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Monitor } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
            alt="127 Logo" 
            className="w-32 h-auto mx-auto mb-4"
          />
          <h1 className="text-5xl font-normal text-gray-800 text-center tracking-tight">
            127.be
          </h1>
        </div>

        {/* Search Container */}
        <div className="w-full max-w-2xl">
          {/* Search Bar */}
          <div 
            className={`relative transition-all duration-200 ${
              isFocused || showResults 
                ? 'shadow-lg' 
                : 'shadow-md hover:shadow-lg'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Zoek naar tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-14 pr-4 py-4 text-base border border-gray-200 rounded-full focus:outline-none transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute w-full mt-2 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden z-10">
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
                          <div className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="bg-gray-100 p-2 rounded-full">
                                <Icon className="w-5 h-5 text-gray-700" />
                              </div>
                              <div className="flex-1">
                                <div className="text-base font-medium text-gray-900">
                                  {tool.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-0.5">
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
                    <p className="text-gray-600">Geen resultaten voor "{searchQuery}"</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Probeer: pixel, scherm, test
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Suggestions - Only show when not searching */}
          {!showResults && (
            <div className="mt-8 text-center animate-fade-in">
              <p className="text-sm text-gray-500 mb-3">Populaire zoekopdrachten:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button 
                  onClick={() => setSearchQuery('pixel')}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm transition-colors border border-gray-200"
                >
                  pixel test
                </button>
                <button 
                  onClick={() => setSearchQuery('scherm')}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm transition-colors border border-gray-200"
                >
                  scherm testen
                </button>
                <button 
                  onClick={() => setSearchQuery('dode pixels')}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm transition-colors border border-gray-200"
                >
                  dode pixels
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>© 2025 127.be</div>
            <div>Tools voor al uw technische behoeften</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;