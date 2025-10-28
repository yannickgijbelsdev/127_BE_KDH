import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Code, Power, PowerOff } from 'lucide-react';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tools`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTools(data);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = async (toolId, enabled) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !enabled })
      });
      fetchTools();
    } catch (err) {
      console.error('Failed to toggle tool:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-[#e8eaed]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202124]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">{/* Extra padding for global nav */}
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-[#e8eaed] mb-8">Admin Dashboard</h1>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
            <div className="flex items-center gap-4">
              <Code className="w-12 h-12 text-[#8ab4f8]" />
              <div>
                <p className="text-2xl font-bold text-[#e8eaed]">{tools.length}</p>
                <p className="text-[#9aa0a6]">Total Tools</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
            <div className="flex items-center gap-4">
              <Power className="w-12 h-12 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-[#e8eaed]">
                  {tools.filter(t => t.enabled).length}
                </p>
                <p className="text-[#9aa0a6]">Active Tools</p>
              </div>
            </div>
          </div>
          
          <Link to="/localhost/users" className="bg-[#303134] rounded-lg p-6 border border-[#5f6368] hover:border-[#8ab4f8] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <Users className="w-12 h-12 text-[#8ab4f8]" />
              <div>
                <p className="text-2xl font-bold text-[#e8eaed]">Manage</p>
                <p className="text-[#9aa0a6]">Users</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Tools Management */}
        <div className="bg-[#303134] rounded-lg border border-[#5f6368]">
          <div className="p-6 border-b border-[#5f6368]">
            <h2 className="text-xl font-bold text-[#e8eaed]">Tools Management</h2>
          </div>
          
          <div className="divide-y divide-[#5f6368]">
            {tools.map((tool) => (
              <div key={tool.id} className="p-6 flex items-center justify-between hover:bg-[#3c4043] transition-colors">
                <div className="flex items-center gap-4">
                  {tool.enabled ? (
                    <Power className="w-6 h-6 text-green-500" />
                  ) : (
                    <PowerOff className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-[#e8eaed]">{tool.name}</h3>
                    <p className="text-sm text-[#9aa0a6]">{tool.path}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTool(tool.id, tool.enabled)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      tool.enabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {tool.enabled ? 'Disable' : 'Enable'}
                  </button>
                  
                  <Link
                    to={`/localhost/tool/${tool.id}`}
                    className="px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
                  >
                    Edit Code
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
