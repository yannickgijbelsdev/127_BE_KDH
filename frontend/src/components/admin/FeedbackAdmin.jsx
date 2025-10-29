import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const FeedbackAdmin = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    fetchStats();
    fetchFeedback();
  }, [currentPage]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/feedback/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/feedback?page=${currentPage}&limit=${limit}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setFeedback(data.feedback || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating) => {
    if (rating <= 4) return 'text-red-500 bg-red-500/20';
    if (rating <= 7) return 'text-orange-500 bg-orange-500/20';
    return 'text-green-500 bg-green-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-[#e8eaed]">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202124] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-10 h-10 text-[#8ab4f8]" />
            <div>
              <h1 className="text-3xl font-bold text-[#e8eaed]">Gebruikers Feedback</h1>
              <p className="text-[#9aa0a6]">Bekijk wat gebruikers te zeggen hebben</p>
            </div>
          </div>
          <Link to="/localhost/dashboard">
            <button className="px-4 py-2 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg font-medium transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Terug naar Dashboard
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#9aa0a6] text-sm">Totaal Feedback</p>
                <MessageSquare className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <p className="text-3xl font-bold text-[#e8eaed]">{stats.total_feedback}</p>
            </div>

            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#9aa0a6] text-sm">Gemiddelde Score</p>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-[#e8eaed]">
                {stats.average_rating} <span className="text-lg text-[#9aa0a6]">/ 10</span>
              </p>
            </div>

            <div className="bg-[#303134] rounded-lg p-6 border border-[#5f6368]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#9aa0a6] text-sm">Score Verdeling</p>
                <TrendingUp className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <div className="flex gap-1 mt-2">
                {Object.entries(stats.rating_distribution).map(([rating, count]) => (
                  <div
                    key={rating}
                    className="flex-1 bg-[#202124] rounded overflow-hidden"
                    style={{ height: `${Math.max(10, (count / stats.total_feedback) * 100)}px` }}
                    title={`${rating}: ${count} feedback(s)`}
                  >
                    <div
                      className={`h-full ${
                        parseInt(rating) <= 4
                          ? 'bg-red-500'
                          : parseInt(rating) <= 7
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        <div className="bg-[#303134] rounded-lg border border-[#5f6368] overflow-hidden">
          <div className="p-6 border-b border-[#5f6368]">
            <h2 className="text-xl font-bold text-[#e8eaed]">Alle Feedback</h2>
          </div>

          <div className="divide-y divide-[#5f6368]">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-[#3c4043] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full font-bold ${getRatingColor(item.rating)}`}>
                      {item.rating}/10
                    </div>
                    <span className="text-sm text-[#9aa0a6]">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#8ab4f8] mb-1">Feedback:</h3>
                  <p className="text-[#e8eaed]">{item.feedback_text}</p>
                </div>

                {item.suggestions && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#8ab4f8] mb-1">Suggesties:</h3>
                    <p className="text-[#e8eaed]">{item.suggestions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[#9aa0a6] text-xs">IP Adres</p>
                    <p className="text-[#e8eaed] font-mono">{item.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#9aa0a6] text-xs">Browser</p>
                    <p className="text-[#e8eaed]">
                      {item.browser_name} {item.browser_version}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9aa0a6] text-xs">Besturingssysteem</p>
                    <p className="text-[#e8eaed]">{item.operating_system || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#9aa0a6] text-xs">GPU</p>
                    <p className="text-[#e8eaed] text-xs truncate" title={item.gpu_renderer}>
                      {item.gpu_vendor || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-[#5f6368] flex items-center justify-between">
              <div className="text-sm text-[#9aa0a6]">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} feedback
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#202124] text-[#e8eaed] rounded-lg border border-[#5f6368] hover:bg-[#3c4043] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-[#8ab4f8] text-[#202124] border-[#8ab4f8]'
                            : 'bg-[#202124] text-[#e8eaed] border-[#5f6368] hover:bg-[#3c4043]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#202124] text-[#e8eaed] rounded-lg border border-[#5f6368] hover:bg-[#3c4043] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAdmin;
