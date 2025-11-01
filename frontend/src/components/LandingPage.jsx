import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Monitor, Printer, Activity, Video, Lock, Plus } from 'lucide-react';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolSuggestionModal from './ToolSuggestionModal';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.7.0';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [showToolSuggestion, setShowToolSuggestion] = useState(false);
  const [enabledToolIds, setEnabledToolIds] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);

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

  // Filter tools based on search query (search all tools)
  const filteredTools = allTools.filter(tool => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  // Log search activity
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        logAction('home', 'Landing Page', 'search_query', {
          query: searchQuery,
          results_count: filteredTools.length,
          matching_tools: filteredTools.map(t => t.id)
        });
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const showResults = searchQuery.trim().length > 0;
  
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
      <AutumnDecoration />
      <div className="min-h-screen bg-gradient-to-br from-[#202124] to-[#292a2d] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-2xl text-center space-y-8 relative z-10">
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
            alt="127 Logo" 
            className="w-48 h-auto mx-auto mb-4 brightness-110"
           draggable="false"/>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-[#303134] rounded-full border border-[#5f6368] hover:border-[#8ab4f8] transition-colors focus-within:border-[#8ab4f8]">
              <Search className="w-5 h-5 ml-5 text-[#9aa0a6]" />
              <input
                type="text"
                placeholder="Zoek een tool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute w-full mt-2 bg-[#303134] rounded-lg border border-[#5f6368] shadow-2xl overflow-hidden animate-fade-in z-20">
                {filteredTools.length > 0 ? (
                  <div className="divide-y divide-[#5f6368]">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link 
                        key={tool.id} 
                        to={tool.path}
                        onClick={() => handleToolClick(tool.id, tool.name)}
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
                  <div className="px-6 py-8 text-center text-[#9aa0a6]">
                    Geen tools gevonden
                  </div>
                )}
              </div>
            )}
          </div>

        {!showResults && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="flex gap-3 justify-center flex-wrap">
              {displayedTools.map((tool) => (
                <Link key={tool.id} to={tool.path} onClick={() => handleToolClick(tool.id, tool.name)}>
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

          <button 
            onClick={() => setShowChangelog(true)}
            className="text-xs text-[#8ab4f8] hover:text-[#aac8f9] cursor-pointer underline"
          >
            Build {BUILD_VERSION}
          </button>
        </div>
      </div>
      
      <FloatingFeedbackButton />
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
    </>
  );
};

export default LandingPage;
