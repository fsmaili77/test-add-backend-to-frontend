// src/Routes.jsx
import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import UserManagement from "pages/admin/UserManagement";
import AuditLogs from "pages/admin/AuditLogs";
import ClientManagement from "pages/clients";

// Page imports
import Login from "pages/login";
import Register from "pages/register";
import Dashboard from "pages/dashboard";
import DocumentUpload from "pages/document-upload";
import DocumentViewer from "pages/document-viewer";
import SearchResults from "pages/search-results";
import AnalysisDashboard from "pages/analysis-dashboard";
import ServicePlus from "pages/service-plus";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/document-upload"
            element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/document-viewer"
            element={
              <ProtectedRoute>
                <DocumentViewer />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/search-results"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analysis-dashboard"
            element={
              <ProtectedRoute>
                <AnalysisDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/service-plus"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Lawyer']}>
                <ServicePlus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientManagement />
              </ProtectedRoute>
            }
          />

          {/* Fallback - redirect to dashboard if authenticated, otherwise to login */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;