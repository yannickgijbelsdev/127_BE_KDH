import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';

const AdminNavBar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    
    if (userData && token) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    navigate('/localhost');
  };

  const handleDashboard = () => {
    navigate('/localhost/dashboard');
  };

  const getInitials = (username) => {
    if (!username) return 'AD';
    return username.substring(0, 2).toUpperCase();
  };

  // Don't render if not logged in or on admin pages
  if (!user) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-4">
      <div className="flex items-center gap-3 bg-[#303134] px-4 py-2 rounded-lg border border-[#5f6368] shadow-2xl">
        <div className="w-10 h-10 bg-[#8ab4f8] rounded-full flex items-center justify-center text-[#202124] font-bold">
          {getInitials(user.username)}
        </div>
        <span className="text-[#e8eaed] font-medium">{user.username}</span>
        
        <button
          onClick={handleDashboard}
          className="p-2 bg-[#5f6368] hover:bg-[#7a8086] rounded-lg transition-colors"
          title="Dashboard"
        >
          <Settings className="w-5 h-5 text-[#e8eaed]" />
        </button>
        
        <button
          onClick={handleLogout}
          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          title="Uitloggen"
        >
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default AdminNavBar;
