// src/pages/clients/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from 'components/AppIcon';
import GlobalHeader from 'components/ui/GlobalHeader';
import { getAuthHeaders } from 'services/authService'; // FIX: named import, no default export exists

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';

const ClientManagement = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    address: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchClients();
  }, [searchTerm, showActiveOnly]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/clientmanagement/clients`, {
        params: {
          search: searchTerm || undefined,
          isActive: showActiveOnly ? true : undefined
        },
        headers: getAuthHeaders()
      });
      setClients(response.data.clients);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Fetch clients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingClient) {
        await axios.put(
          `${API_URL}/clientmanagement/clients/${editingClient.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
        alert('Client updated successfully');
      } else {
        await axios.post(
          `${API_URL}/clientmanagement/clients`,
          formData,
          { headers: getAuthHeaders() }
        );
        alert('Client created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save client');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      company: '',
      address: '',
      notes: ''
    });
    setFormErrors({});
    setEditingClient(null);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phoneNumber: client.phoneNumber || '',
      company: client.company || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (client) => {
    if (!confirm(`Delete client ${client.firstName} ${client.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/clientmanagement/clients/${client.id}`,
        { headers: getAuthHeaders() }
      );
      alert('Client deleted successfully');
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleToggleActive = async (client) => {
    try {
      const endpoint = client.isActive ? 'deactivate' : 'activate';
      await axios.put(
        `${API_URL}/clientmanagement/clients/${client.id}/${endpoint}`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update client status');
    }
  };

  const handleSelectClient = (clientId) => {
    localStorage.setItem('selectedClientId', clientId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="pt-20 px-6 max-w-7xl mx-auto pb-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Client Management</h1>
              <p className="text-text-secondary">Manage your client list and their documents</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="UserPlus" size={20} />
              Add New Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Clients</p>
                  <p className="text-2xl font-bold text-text-primary">{clients.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Active Clients</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {clients.filter(c => c.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Icon name="FileText" size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Selected Client</p>
                  <p className="text-sm font-medium text-text-primary">
                    {localStorage.getItem('selectedClientId') ? 'Set' : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients by name, email, or company..."
                  className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-accent border-border-medium rounded"
              />
              <span className="text-sm text-text-secondary">Active only</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading clients...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-error">
              <Icon name="AlertCircle" size={20} />
              <span>{error}</span>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary mb-4">No clients found</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client.id} className="bg-surface rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {client.firstName} {client.lastName}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Icon name="Mail" size={14} />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Icon name="Phone" size={14} />
                      <span>{client.phoneNumber}</span>
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Icon name="Briefcase" size={14} />
                      <span className="truncate">{client.company}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border-light">
                  <button
                    onClick={() => handleSelectClient(client.id)}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Icon name="Edit" size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(client)}
                    className={`p-2 rounded-lg transition-colors ${
                      client.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={client.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Icon name={client.isActive ? 'UserX' : 'UserCheck'} size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
                    className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg shadow-elevation-3 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </h3>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">First Name *</label>
                      <input
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.firstName ? 'border-error' : 'border-border-light'}`}
                        placeholder="John"
                      />
                      {formErrors.firstName && <p className="mt-1 text-sm text-error">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Last Name *</label>
                      <input
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.lastName ? 'border-error' : 'border-border-light'}`}
                        placeholder="Doe"
                      />
                      {formErrors.lastName && <p className="mt-1 text-sm text-error">{formErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Email Address *</label>
                    <input
                      type="email" name="email" value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${formErrors.email ? 'border-error' : 'border-border-light'}`}
                      placeholder="john.doe@example.com"
                    />
                    {formErrors.email && <p className="mt-1 text-sm text-error">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Phone Number</label>
                    <input
                      type="tel" name="phoneNumber" value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Company</label>
                    <input
                      type="text" name="company" value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="ABC Corporation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Address</label>
                    <textarea
                      name="address" value={formData.address}
                      onChange={handleInputChange} rows={2}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
                    <textarea
                      name="notes" value={formData.notes}
                      onChange={handleInputChange} rows={3}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Additional notes about the client..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border-light">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingClient ? 'Update Client' : 'Create Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManagement;