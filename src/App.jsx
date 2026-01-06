import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { LoadingScreen } from './components/LoadingScreen';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { DebugInfo } from './components/DebugInfo';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { FormPage } from './pages/FormPage';
import { CSVDemoPage } from './pages/CSVDemoPage';
import { AltFormPage } from './pages/AltFormPage';
import { IncSaveTest } from './pages/IncSaveTest';
import ActiveInspectionsDebug from './components/ActiveInspectionsDebug';

// Main App Router
function AppRouter() {
  const { isAuthenticated, configuration, loading, toast, isOnline, stats, syncEvents } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }


  useEffect(() => {
    // console.log("sync now ", isOnline, stats.pendingEvents);
    if (isOnline && stats.pendingEvents > 0) {
      syncEvents();
    }
  }, [isOnline, stats.pendingEvents]);

  return (
    <div className="app">
      {toast && <Toast {...toast} />}
      <DebugInfo />

      <Router>
        {isAuthenticated && <Header />}

        <main className="main-content">
          <Routes>
            {!isAuthenticated ? (
              // Not authenticated - show login (allow test route without auth)
              <>
                <Route path="/inc-save-test" element={<IncSaveTest />} />
                <Route path="/debug-inspections" element={<ActiveInspectionsDebug />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : !configuration ? (
              // Authenticated but no configuration - show loading or error
              <Route path="*" element={
                <div className="loading-container">
                  <div className="loading-content">
                    <div className="spinner"></div>
                    <p>Loading data collection configuration...</p>
                  </div>
                </div>
              } />
            ) : (
              // Authenticated and configured - show app pages
              <>
                <Route path="/home" element={<HomePage />} />
                <Route path="/form" element={<FormPage />} />
                <Route path="/form-alt" element={<AltFormPage />} />
                <Route path="/form/:eventId" element={<FormPage />} />
                <Route path="/csv-demo" element={<CSVDemoPage />} />
                <Route path="/inc-save-test" element={<IncSaveTest />} />
                <Route path="/debug-inspections" element={<ActiveInspectionsDebug />} />
                {/* Default route - go directly to form like Android app */}
                <Route path="/" element={<Navigate to="/form" replace />} />
                <Route path="*" element={<Navigate to="/form" replace />} />
              </>
            )}
          </Routes>
        </main>
      </Router>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
} 