// src/services/clientService.js

import { getClients, createClient, getClientById, getUserIdFromToken } from './apiService';

/**
 * Fetch only the clients that belong to the currently logged-in user.
 */
export const fetchUserClients = async () => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error('User not authenticated');
  return getClients(); // apiService already injects userId
};

/**
 * Create a new client under the current user.
 */
export const addClient = async (clientData) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error('User not authenticated');
  return createClient(clientData); // apiService already injects userId
};

/**
 * Get one client — will fail server-side if it doesn't belong to current user.
 */
export const fetchClientById = async (clientId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error('User not authenticated');
  return getClientById(clientId);
};

/**
 * Validate that a clientId actually belongs to the current user.
 * Use this before trusting a clientId from localStorage/URL params.
 */
export const validateClientOwnership = async (clientId) => {
  try {
    const client = await getClientById(clientId);
    return !!client;
  } catch {
    return false;
  }
};