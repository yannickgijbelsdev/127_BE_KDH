import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Users, MousePointer, Eye, TrendingUp, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedTool, setSelectedTool] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    fetchStats();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedTool !== 'all') {
      fetchToolEvents(selectedTool);
    } else {
      fetchEvents();
    }
  }, [selectedTool, currentPage]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/events?page=${currentPage}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchToolEvents = async (toolId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/tool/${toolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEvents(data);
      setTotalPages(1); // Tool events don't have pagination yet
    } catch (err) {
      console.error('Failed to fetch tool events:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'page_visit':
        return <Eye className="w-4 h-4" />;
      case 'button_click':
        return <MousePointer className="w-4 h-4" />;
      case 'action':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'page_visit':
        return 'bg-blue-500';
      case 'button_click':
        return 'bg-green-500';
      case 'action':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-[#e8eaed]">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202124]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/localhost/dashboard">
            <ArrowLeft className="w-6 h-6 text-[#9aa0a6] hover:text-[#e8eaed] cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold text-[#e8eaed]">Analytics Dashboard</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-8 h-8 text-[#8ab4f8]" />
                <p className="text-sm text-[#9aa0a6]">Total Events</p>
              </div>
              <p className="text-3xl font-bold text-[#e8eaed]">{stats.total_events}</p>
            </div>

            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-green-500" />
                <p className="text-sm text-[#9aa0a6]">Unique Visitors</p>
              </div>
              <p className="text-3xl font-bold text-[#e8eaed]">{stats.unique_visitors}</p>
            </div>

            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <p className="text-sm text-[#9aa0a6]">Most Used Tool</p>
              </div>
              <p className="text-lg font-bold text-[#e8eaed]">
                {stats.events_by_tool[0]?.tool_name || 'N/A'}
              </p>
              <p className="text-sm text-[#9aa0a6]">
                {stats.events_by_tool[0]?.count || 0} events
              </p>
            </div>

            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center gap-3 mb-2">
                <MousePointer className="w-8 h-8 text-orange-500" />
                <p className="text-sm text-[#9aa0a6]">Total Actions</p>
              </div>
              <p className="text-3xl font-bold text-[#e8eaed]">
                {stats.events_by_type.find(e => e._id === 'action')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Tools Breakdown */}
        {stats && (
          <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368] mb-8">
            <h2 className="text-xl font-bold text-[#e8eaed] mb-4">Events by Tool</h2>
            <div className="space-y-4">
              {stats.events_by_tool.map((tool) => (
                <div key={tool._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#8ab4f8] rounded-full"></div>
                    <span className="text-[#e8eaed]">{tool.tool_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#9aa0a6]">{tool.count} events</span>
                    <button
                      onClick={() => setSelectedTool(tool._id)}
                      className="px-3 py-1 bg-[#5f6368] hover:bg-[#7a8086] rounded text-sm text-[#e8eaed] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Log */}
        <div className="bg-[#303134] rounded-lg border border-[#5f6368]">
          <div className="p-6 border-b border-[#5f6368] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#e8eaed]">Event Log</h2>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368]"
            >
              <option value="all">All Tools</option>
              {stats?.events_by_tool.map((tool) => (
                <option key={tool._id} value={tool._id}>{tool.tool_name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#202124] border-b border-[#5f6368]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Tool</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Event Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5f6368]">
                {events.map((event, index) => (
                  <tr key={event.id || index} className="hover:bg-[#3c4043] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#e8eaed]">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#e8eaed]">
                      {event.tool_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getEventTypeColor(event.event_type)}`}>
                          {getEventTypeIcon(event.event_type)}
                        </div>
                        <span className="text-sm text-[#e8eaed]">{event.event_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <details className="cursor-pointer">
                        <summary className="text-sm text-[#8ab4f8] hover:text-[#aac8f9]">
                          View Data
                        </summary>
                        <pre className="mt-2 text-xs text-[#9aa0a6] bg-[#202124] p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.event_data, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
