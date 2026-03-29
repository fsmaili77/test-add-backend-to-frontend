// src/components/ClientSelector/index.jsx

import { useEffect, useState } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { fetchUserClients } from '../../services/clientService';

const ClientSelector = () => {
  const { selectedClientId, setSelectedClientId } = useClient();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await fetchUserClients(); // Only current user's clients
        setClients(data);

        // Auto-select first client if none selected, or validate stored selection
        if (data.length > 0) {
          const storedClientId = localStorage.getItem('selectedClientId');
          const isValid = storedClientId && data.some((c) => String(c.id) === storedClientId);
          if (!isValid) {
            setSelectedClientId(String(data[0].id));
          }
        } else {
          setSelectedClientId(null);
        }
      } catch (err) {
        setError('Failed to load clients');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []); // Re-runs when user changes because context resets on logout

  const handleChange = (e) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
  };

  if (loading) return <span className="text-sm text-gray-500">Loading clients...</span>;
  if (error) return <span className="text-sm text-red-500">{error}</span>;
  if (clients.length === 0) return <span className="text-sm text-gray-400">No clients found</span>;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="client-selector" className="text-sm font-medium text-gray-700">
        Client:
      </label>
      <select
        id="client-selector"
        value={selectedClientId || ''}
        onChange={handleChange}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {clients.map((client) => (
          <option key={client.id} value={String(client.id)}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientSelector;