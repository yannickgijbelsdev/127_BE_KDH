import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Settings, Users, Code, Home, ChevronLeft, ChevronRight, BarChart3, MessageSquare, Lightbulb, Package } from 'lucide-react';

const AdminNavBar = () => {
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Standaard ingeklapt
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount and when storage changes
    const checkAuth = () => {
      const userData = localStorage.getItem('admin_user');
      const token = localStorage.getItem('admin_token');
      
      if (userData && token) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsVisible(true);
        } catch (err) {
          console.error('Failed to parse user data:', err);
          setIsVisible(false);
        }
      } else {
        setUser(null);
        setIsVisible(false);
      }
    };

    checkAuth();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', checkAuth);
    
    // Custom event for same-tab updates
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    // Force reload to update app state
    window.location.href = '/localhost';
  };

  const handleDashboard = () => {
    navigate('/localhost/dashboard');
  };

  const getInitials = (username) => {
    if (!username) return 'AD';
    return username.substring(0, 2).toUpperCase();
  };

  // Don't render if not logged in
  if (!user || !isVisible) return null;

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-[#303134] border-r-2 border-[#8ab4f8] shadow-2xl transition-all duration-300 z-[100] ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Avatar */}
          <div className="p-4 border-b border-[#5f6368]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8ab4f8] rounded-full flex items-center justify-center text-[#202124] font-bold text-lg flex-shrink-0">
                  {getInitials(user.username)}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-[#e8eaed] font-semibold truncate">{user.username}</p>
                    <p className="text-xs text-[#9aa0a6] truncate">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <Link 
              to="/"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </Link>

            <Link 
              to="/localhost/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>

            <Link 
              to="/localhost/users"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Users</span>}
            </Link>

            <Link 
              to="/localhost/analytics"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Analytics</span>}
            </Link>

            <Link 
              to="/localhost/feedback"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Feedback</span>}
            </Link>

            <Link 
              to="/localhost/suggestions"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Lightbulb className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Tool Suggesties</span>}
            </Link>

            <Link 
              to="/autosoft"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Package className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Autosoft Vervangtoestellen</span>}
            </Link>

            <div className="px-4 py-2 mt-4">
              {!isCollapsed && (
                <p className="text-xs text-[#9aa0a6] uppercase font-semibold mb-2">Tools</p>
              )}
            </div>

            <Link 
              to="/localhost/tool/dpd"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Code className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Dead Pixel Detector</span>}
            </Link>

            <Link 
              to="/localhost/tool/password"
              className="flex items-center gap-3 px-4 py-3 text-[#e8eaed] hover:bg-[#5f6368] transition-colors"
            >
              <Code className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Password Generator</span>}
            </Link>
          </div>

          {/* Footer with Logout */}
          <div className="border-t border-[#5f6368] p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-5 h-5 text-white flex-shrink-0" />
              {!isCollapsed && <span className="text-white font-medium">Uitloggen</span>}
            </button>
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#8ab4f8] rounded-full flex items-center justify-center shadow-lg hover:bg-[#aac8f9] transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#202124]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#202124]" />
          )}
        </button>
      </div>

      {/* Spacer to prevent content from going under sidebar */}
      <div className={`${isCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`} />
    </>
  );
};

export default AdminNavBar;
