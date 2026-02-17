// src/services/clientService.js
import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';

class ClientService {
  // Get all clients for the current user
  async getClients() {
    try {
      const response = await axios.get(`${API_URL}/clients`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get clients error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch clients'
      };
    }
  }

  // Get a single client by ID
  async getClient(clientId) {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get client error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch client'
      };
    }
  }

  // Create a new client
  async createClient(clientData) {
    try {
      const response = await axios.post(`${API_URL}/clients`, clientData, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create client error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create client'
      };
    }
  }

  // Update a client
  async updateClient(clientId, clientData) {
    try {
      const response = await axios.put(`${API_URL}/clients/${clientId}`, clientData, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update client error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update client'
      };
    }
  }

  // Delete a client
  async deleteClient(clientId) {
    try {
      const response = await axios.delete(`${API_URL}/clients/${clientId}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete client error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete client'
      };
    }
  }

  // Get currently selected client from localStorage
  getSelectedClient() {
    const clientJson = localStorage.getItem('selectedClient');
    return clientJson ? JSON.parse(clientJson) : null;
  }

  // Set selected client in localStorage
  setSelectedClient(client) {
    if (client) {
      localStorage.setItem('selectedClient', JSON.stringify(client));
    } else {
      localStorage.removeItem('selectedClient');
    }
  }

  // Clear selected client
  clearSelectedClient() {
    localStorage.removeItem('selectedClient');
  }

  // Get documents for a specific client
  async getClientDocuments(clientId) {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}/documents`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get client documents error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch client documents'
      };
    }
  }
}

const clientService = new ClientService();
export default clientService;