// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from 'components/AppIcon';
import GlobalHeader from 'components/ui/GlobalHeader';
import authService from 'services/authService';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    isActive: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [pagination.page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      fetchUsers();
    }
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/usermanagement/users`, {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: filters.search || undefined,
          role: filters.role !== 'all' ? filters.role : undefined,
          isActive: filters.isActive !== 'all' ? filters.isActive === 'true' : undefined
        },
        headers: authService.getAuthHeaders()
      });

      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/usermanagement/roles`, {
        headers: authService.getAuthHeaders()
      });
      setRoles(response.data.roles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}? They will no longer be able to access the platform.`)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/usermanagement/users/${userId}/deactivate`, {}, {
        headers: authService.getAuthHeaders()
      });
      fetchUsers();
      alert('User deactivated successfully');
    } catch (err) {
      alert('Failed to deactivate user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleActivateUser = async (userId, userName) => {
    try {
      await axios.put(`${API_URL}/usermanagement/users/${userId}/activate`, {}, {
        headers: authService.getAuthHeaders()
      });
      fetchUsers();
      alert(`${userName} has been activated successfully`);
    } catch (err) {
      alert('Failed to activate user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleResetQuota = async (userId, userName) => {
    if (!confirm(`Reset document quota for ${userName}? This will set their processed documents count to 0.`)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/usermanagement/users/${userId}/reset-quota`, {}, {
        headers: authService.getAuthHeaders()
      });
      fetchUsers();
      alert('Quota reset successfully');
    } catch (err) {
      alert('Failed to reset quota: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/usermanagement/users/${selectedUser.id}`,
        {
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          organization: selectedUser.organization,
          position: selectedUser.position,
          documentQuota: selectedUser.documentQuota,
          subscriptionTier: selectedUser.subscriptionTier
        },
        { headers: authService.getAuthHeaders() }
      );
      setShowEditModal(false);
      fetchUsers();
      alert('User updated successfully');
    } catch (err) {
      alert('Failed to update user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditRoles = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setShowRoleModal(true);
  };

  const handleUpdateRoles = async (e) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      alert('Please select at least one role');
      return;
    }

    try {
      await axios.put(
        `${API_URL}/usermanagement/users/${selectedUser.id}/roles`,
        { roles: selectedRoles },
        { headers: authService.getAuthHeaders() }
      );
      setShowRoleModal(false);
      fetchUsers();
      alert('User roles updated successfully');
    } catch (err) {
      alert('Failed to update roles: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleRole = (roleName) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: 'bg-red-100 text-red-800',
      Manager: 'bg-purple-100 text-purple-800',
      Lawyer: 'bg-blue-100 text-blue-800',
      User: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getQuotaPercentage = (processed, quota) => {
    if (quota === -1) return 0;
    return Math.min(100, (processed / quota) * 100);
  };

  const getQuotaColor = (processed, quota) => {
    const percentage = getQuotaPercentage(processed, quota);
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="pt-20 px-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">User Management</h1>
              <p className="text-text-secondary">Manage user accounts, roles, and permissions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Total Users</p>
              <p className="text-2xl font-bold text-primary">{pagination.totalCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">Search Users</label>
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, email, or organization..."
                  className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Users</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading users...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-error">
              <Icon name="AlertCircle" size={20} />
              <span>{error}</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary">No users found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border-light">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Quota Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {user.firstName?.charAt(0) || user.username?.charAt(0) || '?'}
                                {user.lastName?.charAt(0) || user.username?.charAt(1) || ''}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text-primary truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-text-secondary truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role, idx) => (
                              <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary truncate max-w-xs">
                            {user.organization || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-text-primary font-medium">
                                {user.documentsProcessedThisMonth}/{user.documentQuota === -1 ? '∞' : user.documentQuota}
                              </span>
                              {user.documentQuota !== -1 && (
                                <span className="text-xs text-text-secondary">
                                  {Math.round(getQuotaPercentage(user.documentsProcessedThisMonth, user.documentQuota))}%
                                </span>
                              )}
                            </div>
                            {user.documentQuota !== -1 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all ${getQuotaColor(user.documentsProcessedThisMonth, user.documentQuota)}`}
                                  style={{ width: `${getQuotaPercentage(user.documentsProcessedThisMonth, user.documentQuota)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleEditRoles(user)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit Roles"
                            >
                              <Icon name="Shield" size={16} />
                            </button>
                            <button
                              onClick={() => handleResetQuota(user.id, `${user.firstName} ${user.lastName}`)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Reset Quota"
                            >
                              <Icon name="RefreshCw" size={16} />
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => handleDeactivateUser(user.id, `${user.firstName} ${user.lastName}`)}
                                className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors"
                                title="Deactivate User"
                              >
                                <Icon name="UserX" size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id, `${user.firstName} ${user.lastName}`)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Activate User"
                              >
                                <Icon name="UserCheck" size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-border-light flex items-center justify-between bg-gray-50">
                <div className="text-sm text-text-secondary">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</span> of{' '}
                  <span className="font-medium">{pagination.totalCount}</span> users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-border-light rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-text-secondary flex items-center">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-border-light rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg shadow-elevation-3 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">Edit User</h3>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">First Name</label>
                  <input
                    type="text"
                    value={selectedUser.firstName || ''}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Last Name</label>
                  <input
                    type="text"
                    value={selectedUser.lastName || ''}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Organization</label>
                  <input
                    type="text"
                    value={selectedUser.organization || ''}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Position</label>
                  <input
                    type="text"
                    value={selectedUser.position || ''}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Document Quota</label>
                  <input
                    type="number"
                    value={selectedUser.documentQuota || 50}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, documentQuota: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    min="-1"
                  />
                  <p className="text-xs text-text-secondary mt-1">Set to -1 for unlimited documents</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Subscription Tier</label>
                  <select
                    value={selectedUser.subscriptionTier || 'Free'}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, subscriptionTier: e.target.value }))}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="Free">Free</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-light">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Roles Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg shadow-elevation-3 max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">Edit User Roles</h3>
                <button 
                  onClick={() => setShowRoleModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-text-secondary">
                  Managing roles for: <span className="font-medium text-text-primary">{selectedUser.email}</span>
                </p>
              </div>

              <form onSubmit={handleUpdateRoles} className="space-y-4">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center p-3 border border-border-light rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.name)}
                        onChange={() => toggleRole(role.name)}
                        className="h-4 w-4 text-primary focus:ring-accent border-border-medium rounded"
                      />
                      <div className="ml-3 flex-1">
                        <span className="font-medium text-text-primary">{role.name}</span>
                        <p className="text-xs text-text-secondary mt-0.5">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-light">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedRoles.length === 0}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Roles
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;