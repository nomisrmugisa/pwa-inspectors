import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useStorage } from '../hooks/useStorage';

export function HomePage() {
  const navigate = useNavigate();
  const { 
    configuration, 
    stats, 
    isOnline, 
    syncEvents, 
    retryEvent,
    deleteEvent,
    showToast 
  } = useApp();
  
  const storage = useStorage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load events from storage
  useEffect(() => {
    const loadEvents = async () => {
      if (!storage.isReady) return;
      
      try {
        setIsLoading(true);
        const allEvents = await storage.getAllEvents();
        setEvents(allEvents || []);
      } catch (error) {
        console.error('Failed to load events:', error);
        showToast('Failed to load events', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [storage.isReady, stats]); // Reload when stats change (after sync)

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) {
      return events;
    }
    
    const search = searchTerm.toLowerCase();
    return events.filter(event => {
      const eventDate = new Date(event.eventDate).toLocaleDateString().toLowerCase();
      const orgUnitName = configuration?.organisationUnits?.find(
        ou => ou.id === event.orgUnit
      )?.displayName?.toLowerCase() || '';
      
      return eventDate.includes(search) || 
             orgUnitName.includes(search) ||
             (event.status || event.syncStatus || '').toLowerCase().includes(search);
    });
  }, [events, searchTerm, configuration]);


  const handleNewForm = () => {
    if (!configuration) {
      showToast('Configuration not loaded yet', 'warning');
      return;
    }
    navigate('/form');
  };

  const handleEditForm = (event) => {
    navigate(`/form/${event.event}`);
  };

  const handleSync = () => {
    syncEvents();
  };

  const handleRetryEvent = async (eventId) => {
    try {
      await retryEvent(eventId);
      // Reload events to show updated status
      const allEvents = await storage.getAllEvents();
      setEvents(allEvents || []);
    } catch (error) {
      console.error('Failed to retry event:', error);
      showToast('Failed to retry event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      // Reload events to show updated list
      const allEvents = await storage.getAllEvents();
      setEvents(allEvents || []);
    } catch (error) {
      console.error('Failed to delete event:', error);
      showToast('Failed to delete event', 'error');
    }
  };



  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced':
        return '✅';
      case 'pending':
        return '⏳';
      case 'error':
        return '❌';
      case 'draft':
        return '📝';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'synced':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatEventDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getOrganisationUnitName = (orgUnitId) => {
    const orgUnit = configuration?.organisationUnits?.find(ou => ou.id === orgUnitId);
    return orgUnit?.displayName || 'Unknown Organisation';
  };

  const getStatusText = (event) => {
    const status = event.status || event.syncStatus || 'unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!configuration) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Program Info Header */}
      <div className="program-header">
        <div className="program-info">
          <h1 className="program-title">{configuration.program.displayName}</h1>
          <p className="program-subtitle">{configuration.programStage.displayName}</p>
          {configuration.program.description && (
            <p className="program-description">{configuration.program.description}</p>
          )}
        </div>
        
        <div className="quick-actions">
          <button 
            className="btn btn-primary btn-large new-form-btn"
            onClick={handleNewForm}
          >
            New Inspection
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalEvents}</h3>
            <p>Total Inspections</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingEvents}</h3>
            <p>Pending Sync</p>
          </div>
        </div>
        
        <div className="stat-card synced">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.syncedEvents}</h3>
            <p>Synced</p>
          </div>
        </div>

        {stats.errorEvents > 0 && (
          <div className="stat-card error">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.errorEvents}</h3>
              <p>Errors</p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Actions */}
      {(stats.pendingEvents > 0 || stats.errorEvents > 0) && (
        <div className="sync-section">
          <div className="sync-info">
            {stats.pendingEvents > 0 && (
              <p>📤 {stats.pendingEvents} inspections waiting to sync</p>
            )}
            {stats.errorEvents > 0 && (
              <p style={{ color: '#000000' }}>❌ {stats.errorEvents} inspections failed to sync</p>
            )}
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={!isOnline}
          >
            🔄 Sync Now
          </button>
        </div>
      )}



      {/* Forms Section */}
      <div className="forms-section">
        <div className="section-header">
          <h3>Recent Inspections</h3>
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>
        
        <div className="forms-list">
          {isLoading ? (
            <div className="loading-list">
              <div className="spinner"></div>
              <p>Loading inspections...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              {events.length === 0 ? (
                <>
                  <div className="empty-icon">📋</div>
                  <h4>No inspections yet</h4>
                  <p>Click "New Inspection" to start your first facility inspection</p>
                </>
              ) : (
                <>
                  <div className="empty-icon">🔍</div>
                  <h4>No inspections found</h4>
                  <p>Try adjusting your search terms</p>
                </>
              )}
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
              .map((event) => (
                <div 
                  key={event.event} 
                  className="form-item"
                  onClick={() => handleEditForm(event)}
                >
                  <div className="form-info">
                    <div className="form-header">
                      <h4 className="form-title">
                        Inspection - {formatEventDate(event.eventDate)}
                      </h4>
                      <div className={`form-status ${getStatusColor(event.status || event.syncStatus)}`}>
                        <span className="status-icon">
                          {getStatusIcon(event.status || event.syncStatus)}
                        </span>
                        <span className="status-text">
                          {getStatusText(event)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="form-details">
                      <p className="org-unit">
                        🏢 {getOrganisationUnitName(event.orgUnit)}
                      </p>
                      <p className="timestamps">
                        📅 Created: {formatDateTime(event.createdAt)}
                        {event.updatedAt && event.updatedAt !== event.createdAt && (
                          <span> • Updated: {formatDateTime(event.updatedAt)}</span>
                        )}
                      </p>
                      
                      {event.dataValues && event.dataValues.length > 0 && (
                        <p className="data-summary">
                          📊 {event.dataValues.length} field(s) completed
                        </p>
                      )}

                        {/* Show submitted value for facility service */}
                        {event.dataValues && (
                            (() => {
                                const field = event.dataValues.find(dv => dv.dataElement === 'jpcDY2i8ZDE');
                                return field ? (
                                    <p className="submitted-value">
                                        ⚙️Facility Service Department: {field.value}
                                    </p>
                                ) : null;
                            })()
                        )}
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    {(event.status === 'error' || event.syncStatus === 'error') && (
                      <button
                        className="btn btn-secondary btn-sm retry-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the edit form
                          handleRetryEvent(event.event);
                        }}
                        disabled={!isOnline}
                        title={`Retry sync: ${event.syncError || 'Unknown error'}`}
                      >
                        🔄 Retry
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm delete-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the edit form
                        handleDeleteEvent(event.event);
                      }}
                      title="Delete this inspection"
                    >
                      🗑️ Delete
                    </button>

                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
