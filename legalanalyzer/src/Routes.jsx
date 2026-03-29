// src/Routes.jsx
import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";

// Lazy-loaded page imports — loaded on demand to avoid ERR_INSUFFICIENT_RESOURCES
const Login = lazy(() => import("pages/login"));
const Register = lazy(() => import("pages/register"));
const Dashboard = lazy(() => import("pages/dashboard"));
const DocumentUpload = lazy(() => import("pages/document-upload"));
const DocumentViewer = lazy(() => import("pages/document-viewer"));
const SearchResults = lazy(() => import("pages/search-results"));
const AnalysisDashboard = lazy(() => import("pages/analysis-dashboard"));
const ServicePlus = lazy(() => import("pages/service-plus"));
const ClientManagement = lazy(() => import("pages/clients"));
const UserManagement = lazy(() => import("pages/admin/UserManagement"));
const AuditLogs = lazy(() => import("pages/admin/AuditLogs"));

// Simple full-screen loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;