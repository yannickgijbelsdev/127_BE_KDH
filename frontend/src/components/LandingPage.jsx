import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Monitor, Printer, Activity, Video, Lock, Plus } from 'lucide-react';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolSuggestionModal from './ToolSuggestionModal';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.8.2';

const LandingPage = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [showToolSuggestion, setShowToolSuggestion] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [enabledToolIds, setEnabledToolIds] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [videoPlaylist, setVideoPlaylist] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch video playlist from Pexels for landing page - fetch multiple videos
  useEffect(() => {
    const fetchVideoPlaylist = async () => {
      try {
        // Fetch multiple pages to get more variety
        const pages = [1, 2, 3];
        const allVideos = [];

        for (const page of pages) {
          const response = await fetch(
            `https://api.pexels.com/videos/search?query=coding+programming+developer+computer+screen+typing&orientation=landscape&per_page=10&page=${page}`,
            {
              headers: {
                Authorization: 'SBv6ZOHirhcApz4iLkxYd7c2RDXBWJPKbc8AWDku666r3zU6Tdc2sOih'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.videos && data.videos.length > 0) {
              allVideos.push(...data.videos);
            }
          }
        }

        if (allVideos.length > 0) {
          // Shuffle videos for random order and select 10 for playlist
          const shuffled = allVideos.sort(() => Math.random() - 0.5);
          const selectedVideos = shuffled.slice(0, 10).map(video => {
            const videoFile = video.video_files.find(file => file.quality === 'hd') || video.video_files[0];
            return videoFile.link;
          });
          
          setVideoPlaylist(selectedVideos);
          console.log(`Pexels video playlist loaded: ${selectedVideos.length} coding videos`);
        }
      } catch (error) {
        console.error('Error fetching Pexels video playlist:', error);
      }
    };

    fetchVideoPlaylist();
  }, []); // Empty dependency array - only run once on mount

  // Handle video end - switch to next video
  const handleVideoEnd = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoPlaylist.length);
      setIsTransitioning(false);
    }, 300); // Short transition delay
  };

  // Icon mapping for tools
  const iconMap = {
    'dpd': Monitor,
    'printer': Printer,
    'sscreen': Activity,
    'wea': Video,
    'password': Lock
  };

  // All available tools metadata
  const allToolsMetadata = [
    {
      id: 'dpd',
      name: 'Dead Pixel Detector',
      description: 'Test je scherm op dode pixels',
      icon: Monitor,
      path: '/dpd',
      keywords: ['pixel', 'scherm', 'test', 'dead', 'monitor', 'display']
    },
    {
      id: 'printer',
      name: 'Printer Tester',
      description: 'Test je printer met verschillende patronen',
      icon: Printer,
      path: '/printer',
      keywords: ['print', 'printer', 'test', 'papier', 'kleur', 'pattern']
    },
    {
      id: 'sscreen',
      name: 'Screen Refresh Tester',
      description: 'Meet de refresh rate van je scherm',
      icon: Activity,
      path: '/sscreen',
      keywords: ['refresh', 'rate', 'fps', 'hz', 'scherm', 'speed']
    },
    {
      id: 'wea',
      name: 'Webcam & Audio Tester',
      description: 'Test je webcam en microfoon',
      icon: Video,
      path: '/wea',
      keywords: ['webcam', 'camera', 'audio', 'microfoon', 'microphone', 'test']
    },
    {
      id: 'password',
      name: 'Password Generator',
      description: 'Genereer veilige wachtwoorden',
      icon: Lock,
      path: '/password',
      keywords: ['password', 'wachtwoord', 'generator', 'veilig', 'security']
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Video Background from Pexels - Playlist with transitions */}
        <div className="absolute inset-0 z-0 overflow-hidden" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          {videoPlaylist.length > 0 && videoPlaylist[currentVideoIndex] ? (
            <video
              key={currentVideoIndex}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)',
                width: '105%',
                height: '105%',
                marginLeft: '-2.5%',
                marginTop: '-2.5%',
                opacity: isTransitioning ? 0.3 : 1
              }}
            >
              <source src={videoPlaylist[currentVideoIndex]} type="video/mp4" />
            </video>
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
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        {/* Language Toggle */}
        <LanguageToggle />

        {/* 127 Logo Top Left */}
        <div className="absolute top-8 left-8 z-30">
          <img 
            src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
            alt="127 Logo" 
            className="h-12 w-auto brightness-110"
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
                    placeholder="Zoek een tool..."
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
                                  Mis je nog een tool?
                                </div>
                                <div className="text-sm text-white text-opacity-70 mt-0.5">
                                  Laat het ons weten en we kijken wat we kunnen doen!
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-6 py-8 text-center text-white text-opacity-70">
                          Geen tools gevonden
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
                                  Mis je nog een tool?
                                </div>
                                <div className="text-sm text-white text-opacity-70 mt-0.5">
                                  Laat het ons weten en we kijken wat we kunnen doen!
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
                    Tool Voorstellen
                  </button>
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
