import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Code as CodeIcon, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

const ToolEditor = () => {
  const { toolId } = useParams();
  const [tool, setTool] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTool();
  }, [toolId]);

  const fetchTool = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tools/${toolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTool(data);
      
      // Load actual file content
      const fileResponse = await fetch(data.file_path);
      if (fileResponse.ok) {
        const fileContent = await fileResponse.text();
        setCode(fileContent);
      } else {
        // Try to read from backend
        setCode(data.code || '// Code not available');
      }
    } catch (err) {
      console.error('Failed to fetch tool:', err);
      setMessage('Error loading tool');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          file_path: tool.file_path
        })
      });

      if (response.ok) {
        setMessage('Code succesvol opgeslagen! Refresh de pagina om wijzigingen te zien.');
      } else {
        setMessage('Error: Kon code niet opslaan');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="bg-[#303134] border-b border-[#5f6368] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/localhost/dashboard">
              <ArrowLeft className="w-6 h-6 text-[#9aa0a6] hover:text-[#e8eaed] cursor-pointer" />
            </Link>
            <CodeIcon className="w-6 h-6 text-[#8ab4f8]" />
            <div>
              <h1 className="text-2xl font-bold text-[#e8eaed]">{tool?.name}</h1>
              <p className="text-sm text-[#9aa0a6]">{tool?.file_path}</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500 bg-opacity-20 border border-red-500' 
              : 'bg-green-500 bg-opacity-20 border border-green-500'
          }`}>
            <AlertCircle className={`w-5 h-5 ${
              message.includes('Error') ? 'text-red-500' : 'text-green-500'
            }`} />
            <p className={message.includes('Error') ? 'text-red-500' : 'text-green-500'}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-[#1e1e1e] rounded-lg border border-[#5f6368] overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
            }}
          />
        </div>

        <div className="mt-4 p-4 bg-[#303134] rounded-lg border border-[#5f6368]">
          <p className="text-sm text-[#9aa0a6]">
            <strong className="text-[#e8eaed]">Let op:</strong> Na het opslaan moet je de frontend mogelijk refreshen om de wijzigingen te zien. 
            Gebruik <code className="bg-[#202124] px-2 py-1 rounded text-[#8ab4f8]">Ctrl+S</code> of klik op de Opslaan knop.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToolEditor;
