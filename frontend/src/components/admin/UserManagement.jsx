import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit, Trash2, Shield, Mail, User as UserIcon } from 'lucide-react';
import TwoFactorSetup from './TwoFactorSetup';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selected2FAUser, setSelected2FAUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user',
    is2FAEnabled: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
      } else {
        // Create user
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ email: '', username: '', password: '', role: 'user', is2FAEnabled: false });
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      is2FAEnabled: user.is2FAEnabled
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handle2FASetup = (user) => {
    setSelected2FAUser(user);
    setShow2FAModal(true);
  };

  const handleDisable2FA = async (userId) => {
    if (!window.confirm('Weet je zeker dat je 2FA wilt uitschakelen?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/disable-2fa`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/localhost/dashboard">
              <ArrowLeft className="w-6 h-6 text-[#9aa0a6] hover:text-[#e8eaed] cursor-pointer" />
            </Link>
            <h1 className="text-3xl font-bold text-[#e8eaed]">User Management</h1>
          </div>
          
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: '', username: '', password: '', role: 'user', is2FAEnabled: false });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Nieuwe Gebruiker
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#303134] rounded-lg border border-[#5f6368] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#202124] border-b border-[#5f6368]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Gebruiker</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#9aa0a6]">2FA</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-[#9aa0a6]">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5f6368]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#3c4043] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#8ab4f8] rounded-full flex items-center justify-center text-[#202124] font-bold">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#e8eaed] font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#e8eaed]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                        : 'bg-blue-500 bg-opacity-20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.is2FAEnabled ? (
                        <>
                          <Shield className="w-5 h-5 text-green-500" />
                          <button
                            onClick={() => handleDisable2FA(user.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Uitschakelen
                          </button>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 text-[#5f6368]" />
                          <button
                            onClick={() => handle2FASetup(user)}
                            className="text-xs text-[#8ab4f8] hover:text-[#aac8f9]"
                          >
                            Instellen
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg text-sm transition-colors mr-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-[#303134] rounded-lg p-6 max-w-md w-full border border-[#5f6368]">
            <h2 className="text-xl font-bold text-[#e8eaed] mb-4">
              {editingUser ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Gebruikersnaam
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                  Wachtwoord {editingUser && '(laat leeg om te behouden)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-2 rounded-lg border border-[#5f6368]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
                >
                  {editingUser ? 'Opslaan' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && selected2FAUser && (
        <TwoFactorSetup
          userId={selected2FAUser.id}
          userEmail={selected2FAUser.email}
          onClose={() => {
            setShow2FAModal(false);
            setSelected2FAUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
