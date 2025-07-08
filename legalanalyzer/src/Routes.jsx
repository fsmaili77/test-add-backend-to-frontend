import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

// Page imports
import Login from "pages/login";
import Dashboard from "pages/dashboard";
import DocumentUpload from "pages/document-upload";
import DocumentViewer from "pages/document-viewer";
import SearchResults from "pages/search-results";
import AnalysisDashboard from "pages/analysis-dashboard";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/document-upload" element={<DocumentUpload />} />
          <Route path="/document-viewer" element={<DocumentViewer />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/analysis-dashboard" element={<AnalysisDashboard />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;