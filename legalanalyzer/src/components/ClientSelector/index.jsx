// src/components/ClientSelector/index.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import clientService from 'services/clientService';

const ClientSelector = ({ onClientSelect, required = false }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
    
    // Load previously selected client
    const currentSelected = clientService.getSelectedClient();
    if (currentSelected) {
      setSelectedClient(currentSelected);
      if (onClientSelect) {
        onClientSelect(currentSelected);
      }
    }
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const result = await clientService.getClients();
      if (result.success) {
        setClients(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    clientService.setSelectedClient(client);
    setShowDropdown(false);
    setSearchTerm('');
    
    if (onClientSelect) {
      onClientSelect(client);
    }
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    clientService.clearSelectedClient();
    
    if (onClientSelect) {
      onClientSelect(null);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="bg-surface border border-border-light rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon name="AlertCircle" size={20} className="text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 mb-1">No Clients Available</p>
            <p className="text-sm text-amber-700 mb-3">
              You need to add clients before uploading documents.
            </p>
            <Link
              to="/clients"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              <Icon name="UserPlus" size={14} />
              Add Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Select Client {required && <span className="text-error">*</span>}
      </label>
      
      {selectedClient ? (
        <div className="bg-surface border-2 border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {selectedClient.firstName.charAt(0)}{selectedClient.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {selectedClient.firstName} {selectedClient.lastName}
                </p>
                <p className="text-sm text-text-secondary">{selectedClient.email}</p>
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="p-2 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors"
              title="Clear selection"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-4 py-3 border border-border-light rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-accent hover:border-primary transition-colors flex items-center justify-between"
          >
            <span className="text-text-secondary">Choose a client...</span>
            <Icon name={showDropdown ? "ChevronUp" : "ChevronDown"} size={20} />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>

              {/* Dropdown */}
              <div className="absolute z-20 w-full mt-2 bg-surface border border-border-light rounded-lg shadow-elevation-2 max-h-80 overflow-hidden">
                {/* Search */}
                <div className="p-3 border-b border-border-light">
                  <div className="relative">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search clients..."
                      className="w-full pl-9 pr-3 py-2 border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Client List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary text-sm">
                      No clients found
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left border-b border-border-light last:border-b-0"
                      >
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {client.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Add New Client Link */}
                <div className="p-3 border-t border-border-light bg-gray-50">
                  <Link
                    to="/clients"
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:text-blue-700 font-medium"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Icon name="UserPlus" size={14} />
                    Add New Client
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {required && !selectedClient && (
        <p className="text-xs text-text-secondary mt-1">
          Please select a client before uploading documents
        </p>
      )}
    </div>
  );
};

export default ClientSelector;