import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useStorage } from '../hooks/useStorage';
import { InspectionPreview } from '../components/InspectionPreview';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    configuration,
    stats,
    isOnline,
    syncEvents,
    retryEvent,
    deleteEvent,
    showToast,
    userAssignments,
    user,
    logout
  } = useApp();

  const storage = useStorage();

  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);

  // Get facility filter from URL parameters or localStorage
  useEffect(() => {
    const facilityId = searchParams.get('facility');
    if (facilityId) {
      setSelectedFacilityId(facilityId);
      console.log('🏥 Dashboard filtering by facility:', facilityId);
      // Store in localStorage for persistence
      localStorage.setItem('lastSelectedFacility', facilityId);
    }
    // Removed auto-assignment logic per user request - facility field should be blank on login
  }, [searchParams, userAssignments]);

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

  // Filter events based on search term and selected facility
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // First filter by selected facility if specified
    if (selectedFacilityId) {
      filtered = filtered.filter(event => event.orgUnit === selectedFacilityId);
      console.log(`🏥 Filtered ${events.length} events to ${filtered.length} for facility: ${selectedFacilityId}`);
    }

    // Then filter by search term if provided
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.eventDate).toLocaleDateString().toLowerCase();
        const orgUnitName = configuration?.organisationUnits?.find(
          ou => ou.id === event.orgUnit
        )?.displayName?.toLowerCase() || '';

        return eventDate.includes(search) ||
          orgUnitName.includes(search) ||
          (event.status || event.syncStatus || '').toLowerCase().includes(search);
      });
    }

    return filtered;
  }, [events, searchTerm, selectedFacilityId, configuration]);


  // Helper to generate DHIS2 compatible ID
  const generateDHIS2Id = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = chars.charAt(Math.floor(Math.random() * 52)); // Start with letter
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * 62));
    }
    return result;
  };

  const handleNewForm = async () => {
    if (!configuration) {
      showToast('Configuration not loaded yet', 'warning');
      return;
    }

    // Navigate to the new form page
    navigate('/form?new=true');
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
    // If offline and status is error, show as pending
    if (!isOnline && status === 'error') {
      return '⏱';
    }

    switch (status) {
      case 'synced':
        return '✓';
      case 'pending':
        return '⏱';
      case 'error':
        return '✗';
      case 'draft':
        return '📄';
      default:
        return '?';
    }
  };

  const getStatusColor = (status) => {
    // If offline and status is error, show as pending (warning color)
    if (!isOnline && status === 'error') {
      return 'warning';
    }

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

  const getFacilityName = (orgUnitId) => {
    // First try to get facility name from userAssignments (dataStore)
    const userAssignment = userAssignments?.find(assignment =>
      assignment.facility && assignment.facility.id === orgUnitId
    );

    if (userAssignment && userAssignment.facility.name) {
      return userAssignment.facility.name;
    }

    // Fallback to organization unit name from configuration
    const orgUnit = configuration?.organisationUnits?.find(ou => ou.id === orgUnitId);
    return orgUnit?.displayName || 'Unknown Facility';
  };

  const getStatusText = (event) => {
    const status = event.status || event.syncStatus || 'unknown';

    // If offline and status is error, show as pending submission
    if (!isOnline && status === 'error') {
      return 'Pending Submission';
    }

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

      {/* Inspector Details Section */}
      {user && (
        <div className="inspector-details-section" style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👤 Inspector Details
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Name</span>
              <span style={{ fontSize: '14px', color: '#212529', fontWeight: '600' }}>
                {user.displayName || user.username || 'N/A'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Username</span>
              <span style={{ fontSize: '14px', color: '#212529' }}>
                {user.username || 'N/A'}
              </span>
            </div>
            {user.id && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>User ID</span>
                <span style={{ fontSize: '14px', color: '#212529', fontFamily: 'monospace' }}>
                  {user.id}
                </span>
              </div>
            )}
            {userAssignments && userAssignments.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Assigned Facilities</span>
                <span style={{ fontSize: '14px', color: '#212529', fontWeight: '600' }}>
                  {userAssignments.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card total">
          <div className="stat-icon">[T]</div>
          <div className="stat-content">
            <h3>{stats.totalEvents}</h3>
            <p>Total Inspections</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏱</div>
          <div className="stat-content">
            <h3>{stats.pendingEvents}</h3>
            <p>Pending Sync</p>
          </div>
        </div>

        <div className="stat-card synced">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.syncedEvents}</h3>
            <p>Synced</p>
          </div>
        </div>

        {stats.errorEvents > 0 && (
          <div className={`stat-card ${isOnline ? 'error' : 'pending'}`}>
            <div className="stat-icon">{isOnline ? '✗' : '⏱'}</div>
            <div className="stat-content">
              <h3>{stats.errorEvents}</h3>
              <p>{isOnline ? 'Errors' : 'Pending Submission'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Actions */}
      {(stats.pendingEvents > 0 || stats.errorEvents > 0) && (
        <div className="sync-section">
          <div className="sync-info">
            {stats.pendingEvents > 0 && (
              <p>Upload: {stats.pendingEvents} inspections waiting to sync</p>
            )}
            {stats.errorEvents > 0 && (
              <p style={{ color: '#000000' }}>
                {isOnline ? '✗' : '⏱'} {stats.errorEvents} inspections {isOnline ? 'failed to sync' : 'pending submission (offline)'}
              </p>
            )}
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={!isOnline}
          >
            ↻ Sync Now
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
            <span className="search-icon">[S]</span>
          </div>
        </div>

        {/* Facility Filter Display and Selector */}
        <div className="facility-filter-section" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div className="facility-filter-info">
            {selectedFacilityId ? (
              <div className="current-facility-filter" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#1976d2'
              }}>
                🏥 Showing inspections for: <strong>{(() => {
                  const facility = userAssignments?.find(a => a.facility.id === selectedFacilityId);
                  return facility?.facility.displayName || facility?.facility.name || selectedFacilityId;
                })()}</strong>
                <button
                  onClick={() => {
                    setSelectedFacilityId(null);
                    navigate('/home');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '16px',
                    borderRadius: '50%',
                    marginLeft: '4px'
                  }}
                  title="Show all facilities"
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                📊 Showing inspections from all facilities
              </div>
            )}
          </div>

          <div className="facility-selector-container">
            <label style={{ fontSize: '12px', color: '#6c757d', marginRight: '8px' }}>
              Filter by facility:
            </label>
            <select
              value={selectedFacilityId || ''}
              onChange={(e) => {
                const facilityId = e.target.value;
                if (facilityId) {
                  setSelectedFacilityId(facilityId);
                  navigate(`/home?facility=${facilityId}`);
                } else {
                  setSelectedFacilityId(null);
                  navigate('/home');
                }
              }}
              className="facility-selector"
              style={{
                padding: '6px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white',
                minWidth: '200px'
              }}
            >
              <option value="">All Facilities</option>
              {userAssignments?.map(assignment => (
                <option key={assignment.facility.id} value={assignment.facility.id}>
                  {assignment.facility.displayName || assignment.facility.name}
                </option>
              ))}
            </select>
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
                  <div className="empty-icon">[T]</div>
                  <h4>No inspections yet</h4>
                  <p>Click "New Inspection" to start your first facility inspection</p>
                </>
              ) : (
                <>
                  <div className="empty-icon">[S]</div>
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
                        Facility: {getFacilityName(event.orgUnit)}
                      </p>
                      <p className="timestamps">
                        Date: Created: {formatDateTime(event.createdAt)}
                        {event.updatedAt && event.updatedAt !== event.createdAt && (
                          <span> • Updated: {formatDateTime(event.updatedAt)}</span>
                        )}
                      </p>

                      {event.dataValues && event.dataValues.length > 0 && (
                        <p className="data-summary">
                          Data: {event.dataValues.length} field(s) completed
                        </p>
                      )}

                      {/* Show submitted value for facility service departments */}
                      {event.dataValues && (
                        (() => {
                          const field = event.dataValues.find(dv => dv.dataElement === 'jpcDY2i8ZDE');
                          if (!field) return null;

                          // Try to parse as JSON array, fallback to string display
                          let displayValue = field.value;
                          try {
                            const parsedValue = JSON.parse(field.value);
                            if (Array.isArray(parsedValue)) {
                              displayValue = parsedValue.length > 0
                                ? `${parsedValue.length} selected: ${parsedValue.join(', ')}`
                                : 'None selected';
                            }
                          } catch (e) {
                            // Keep original value if not valid JSON
                          }

                          return (
                            <p className="submitted-value">
                              Settings: Facility Service Departments: {displayValue}
                            </p>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    {/* Preview Button - only show if event has data */}
                    {event.dataValues && event.dataValues.length > 0 && (
                      <button
                        className="btn btn-primary btn-sm preview-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the edit form
                          setPreviewEvent(event);
                        }}
                        title="Preview inspection data by sections"
                      >
                        📋 Preview
                      </button>
                    )}

                    {(event.status === 'error' || event.syncStatus === 'error') && (
                      <button
                        className="btn btn-secondary btn-sm retry-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the edit form
                          handleRetryEvent(event.event);
                        }}
                        disabled={!isOnline}
                        title={isOnline
                          ? `Retry sync: ${event.syncError || 'Unknown error'}`
                          : 'Cannot retry while offline - will sync when connection is restored'
                        }
                      >
                        {isOnline ? '↻ Retry' : '⏱ Pending'}
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
                      Delete
                    </button>

                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Inspection Preview Modal */}
      {previewEvent && (
        <InspectionPreview
          event={previewEvent}
          onClose={() => setPreviewEvent(null)}
        />
      )}
    </div>
  );
}
