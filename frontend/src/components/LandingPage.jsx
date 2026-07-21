import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Monitor, Printer, Video, Lock, Plus, Wrench } from 'lucide-react';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolSuggestionModal from './ToolSuggestionModal';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.8.3';

const LandingPage = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [showToolSuggestion, setShowToolSuggestion] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Optimistic default: show all known tools instantly, then reconcile with backend.
  const [enabledToolIds, setEnabledToolIds] = useState(['dpd', 'printer', 'wea', 'password']);
  const [loadingTools, setLoadingTools] = useState(false);

  // Icon mapping for tools
  const iconMap = {
    'dpd': Monitor,
    'printer': Printer,
    'wea': Video,
    'password': Lock
  };

  // All available tools metadata with translations
  const allToolsMetadata = [
    {
      id: 'dpd',
      name: t('Dead Pixel Detector', 'Dead Pixel Detector'),
      description: t('Test je scherm op dode pixels', 'Test your screen for dead pixels'),
      icon: Monitor,
      path: '/dpd',
      keywords: ['pixel', 'scherm', 'test', 'dead', 'monitor', 'display', 'screen']
    },
    {
      id: 'printer',
      name: t('Printer Tester', 'Printer Tester'),
      description: t('Test je printer met verschillende patronen', 'Test your printer with different patterns'),
      icon: Printer,
      path: '/printer',
      keywords: ['print', 'printer', 'test', 'papier', 'paper', 'kleur', 'color', 'pattern']
    },
    {
      id: 'wea',
      name: t('Webcam & Audio Tester', 'Webcam & Audio Tester'),
      description: t('Test je webcam en microfoon', 'Test your webcam and microphone'),
      icon: Video,
      path: '/wea',
      keywords: ['webcam', 'camera', 'audio', 'microfoon', 'microphone', 'test']
    },
    {
      id: 'password',
      name: t('Wachtwoord Generator', 'Password Generator'),
      description: t('Genereer veilige wachtwoorden', 'Generate secure passwords'),
      icon: Lock,
      path: '/password',
      keywords: ['password', 'wachtwoord', 'generator', 'veilig', 'security', 'secure']
    },
  ];

  // Fetch enabled tools from backend
  useEffect(() => {
    const fetchEnabledTools = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tools`);
        if (response.ok) {
          const enabledTools = await response.json();
          setEnabledToolIds(enabledTools.map(t => t.id));
        } else {
          // If backend fails, show all tools
          setEnabledToolIds(allToolsMetadata.map(t => t.id));
        }
      } catch (error) {
        console.error('Error fetching enabled tools:', error);
        // If backend fails, show all tools
        setEnabledToolIds(allToolsMetadata.map(t => t.id));
      } finally {
        setLoadingTools(false);
      }
    };

    fetchEnabledTools();
  }, []);

  // Filter tools based on enabled status
  const allTools = allToolsMetadata.filter(tool => enabledToolIds.includes(tool.id));

  // Randomly select 3 tools to display - changes on each page load
  const displayedTools = useMemo(() => {
    if (allTools.length === 0) return [];
    const shuffled = [...allTools].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(3, allTools.length));
  }, [allTools.length]);

  // Log page visit
  useEffect(() => {
    if (!loadingTools) {
      logPageVisit('home', 'Landing Page');
      
      // Log which tools are displayed
      logAction('home', 'Landing Page', 'tools_displayed', {
        tool_ids: displayedTools.map(t => t.id),
        tool_names: displayedTools.map(t => t.name),
        enabled_tools_count: allTools.length
      });
    }
  }, [loadingTools, displayedTools.length]);

  // Filter tools based on search query
  const filteredTools = allTools.filter(tool => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.keywords.some(keyword => keyword.includes(searchLower))
    );
  });

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        setShowResults(true);
        logAction('home', 'Landing Page', 'search_query', {
          query: searchQuery,
          results_count: filteredTools.length,
          matching_tools: filteredTools.map(t => t.id)
        });
      } else {
        setShowResults(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, filteredTools.length]);
  
  const handleToolClick = (toolId, toolName) => {
    logButtonClick('home', 'Landing Page', `tool_clicked_${toolId}`);
    logAction('home', 'Landing Page', 'tool_navigation', {
      tool_id: toolId,
      tool_name: toolName,
      from_search: showResults
    });
  };

  return (
    <>
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0b0f19' }}>
        {/* Solid dark (toolbox) background */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: '#0b0f19' }}></div>

        {/* Language Toggle */}
        <LanguageToggle />

        {/* 127 Logo Top Left */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30">
          <img 
            src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
            alt="127 Logo" 
            className="h-8 sm:h-12 w-auto brightness-110"
            draggable="false"
          />
        </div>

        {/* Central Glass Card */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl p-12 rounded-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="relative">
                <div 
                  className="flex items-center px-6 py-4 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <Search className="w-5 h-5 text-white opacity-70" />
                  <input
                    type="text"
                    placeholder={t('Zoek een tool...', 'Search for a tool...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    className="flex-1 px-4 bg-transparent text-white placeholder-white placeholder-opacity-60 focus:outline-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && (
                  <div 
                    className="absolute w-full mt-3 rounded-2xl overflow-hidden animate-fade-in z-20"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {filteredTools.length > 0 ? (
                      <>
                        <div className="divide-y divide-white divide-opacity-10">
                        {filteredTools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <Link 
                              key={tool.id} 
                              to={tool.path}
                              onClick={() => handleToolClick(tool.id, tool.name)}
                              className="block"
                            >
                              <div className="px-6 py-4 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                  <div 
                                    className="p-2 rounded-full"
                                    style={{ background: 'rgba(255, 255, 255, 0.15)' }}
                                  >
                                    <Icon className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-base font-medium text-white">
                                      {tool.name}
                                    </div>
                                    <div className="text-sm text-white text-opacity-70 mt-0.5">
                                      {tool.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        </div>
                        
                        {/* Tool suggestion section */}
                        <div className="border-t border-white border-opacity-10">
                          <button
                            onClick={() => {
                              setShowToolSuggestion(true);
                              logButtonClick('home', 'Landing Page', 'suggest_tool_from_search');
                            }}
                            className="w-full px-6 py-4 hover:bg-white hover:bg-opacity-10 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="p-2 rounded-full"
                                style={{ background: 'rgba(150, 180, 255, 0.3)' }}
                              >
                                <Plus className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-base font-medium text-white">
                                  {t('Mis je nog een tool?', 'Missing a tool?')}
                                </div>
                                <div className="text-sm text-white text-opacity-70 mt-0.5">
                                  {t('Laat het ons weten en we kijken wat we kunnen doen!', 'Let us know and we\'ll see what we can do!')}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-6 py-8 text-center text-white text-opacity-70">
                          {t('Geen tools gevonden', 'No tools found')}
                        </div>
                        
                        {/* Tool suggestion for no results */}
                        <div className="border-t border-white border-opacity-10">
                          <button
                            onClick={() => {
                              setShowToolSuggestion(true);
                              logButtonClick('home', 'Landing Page', 'suggest_tool_no_results');
                            }}
                            className="w-full px-6 py-4 hover:bg-white hover:bg-opacity-10 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="p-2 rounded-full"
                                style={{ background: 'rgba(150, 180, 255, 0.3)' }}
                              >
                                <Plus className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-base font-medium text-white">
                                  {t('Mis je nog een tool?', 'Missing a tool?')}
                                </div>
                                <div className="text-sm text-white text-opacity-70 mt-0.5">
                                  {t('Laat het ons weten en we kijken wat we kunnen doen!', 'Let us know and we\'ll see what we can do!')}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tool Chips */}
              {!showResults && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-center gap-3 flex-wrap">
                    {displayedTools.map((tool) => (
                      <Link key={tool.id} to={tool.path} onClick={() => handleToolClick(tool.id, tool.name)}>
                        <button 
                          className="px-6 py-3 rounded-full text-white font-medium text-sm transition-all hover:shadow-lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.boxShadow = '';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.boxShadow = '';
                          }}
                        >
                          {tool.name}
                        </button>
                      </Link>
                    ))}
                  </div>

                  {/* Tool Voorstellen Button */}
                  <button
                    onClick={() => {
                      setShowToolSuggestion(true);
                      logButtonClick('home', 'Landing Page', 'suggest_tool_button');
                    }}
                    className="w-full px-6 py-4 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(150, 180, 255, 0.25)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(150, 180, 255, 0.15)',
                      color: '#cfe1ff',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(150, 180, 255, 0.35)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(150, 180, 255, 0.25)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('Tool Voorstellen', 'Suggest Tool')}
                  </button>

                  {/* Developer Toolbox entry */}
                  <Link to="/tools" data-testid="open-toolbox-link" className="block">
                    <button
                      className="w-full px-6 py-4 rounded-full font-medium text-sm text-white flex items-center justify-center gap-2 transition-colors"
                      style={{
                        background: '#000000',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      <Wrench className="w-4 h-4" />
                      Toolbox
                    </button>
                  </Link>
                </div>
              )}

              {/* Build Version */}
              <div className="text-center">
                <button
                  onClick={() => setShowChangelog(true)}
                  className="text-xs cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: '#8fa8ff',
                    opacity: 0.8,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Koodh Logo Footer */}
        <div className="absolute bottom-0 left-0 z-30 pb-6 pl-8">
          <a
            href="https://koodh.com"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="koodh-footer-link"
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src="https://customer-assets-agu9un31.emergentagent.net/job_c356018c-cf17-411c-a1d0-23a56c5d3773/artifacts/8bwbwtt6_koodh-logo.png"
              alt="Koodh"
              className="h-6 w-auto"
              draggable="false"
              data-testid="koodh-footer-logo"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </a>
        </div>
      </div>

      <FloatingFeedbackButton />
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
      <ToolSuggestionModal 
        isOpen={showToolSuggestion}
        onClose={() => setShowToolSuggestion(false)}
      />
    </>
  );
};

export default LandingPage;
