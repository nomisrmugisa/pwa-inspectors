import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useStorage } from '../hooks/useStorage';
import { InspectionPreview } from '../components/InspectionPreview';
import indexedDBService from '../services/indexedDBService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    configuration,
    stats,
    pendingEvents,
    isOnline,
    syncEvents,
    retryEvent,
    deleteEvent,
    clearAllInspections,
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
  const [mostRecentDraft, setMostRecentDraft] = useState(null);

  // State for success popup
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleConfirmClear = async () => {
    const success = await clearAllInspections();
    if (success) {
      setEvents([]);
      setMostRecentDraft(null);
    }
    setShowClearConfirm(false);
  };

  // Check for most recent draft on load - dependent on user being present
  useEffect(() => {
    const checkDraft = async () => {
      if (!user) return; // Wait for user to be loaded

      try {
        const draft = await indexedDBService.getMostRecentFormData();

        // Verify draft belongs to current user
        const currentUserId = user.username || user.id;

        // The service should already filter by user, but we double-check here
        // We accept if userId matches, or if draft has no userId (legacy/anonymous) but we want to be strict now
        if (draft && draft.eventId && draft.metadata?.isDraft) {

          // STRICT CHECK: Only show if it matches the current user
          if (draft.userId === currentUserId || (!draft.userId && currentUserId === 'admin')) {
            console.log('📋 Found most recent draft for user:', currentUserId, draft.eventId);
            setMostRecentDraft(draft);
          } else {
            console.log('⚠️ Ignoring draft for different user:', draft.userId, 'Current:', currentUserId);
          }
        }
      } catch (error) {
        console.error('Failed to check for drafts:', error);
      }
    };

    checkDraft();
  }, [user]);

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

  // Centralized function to load events from storage
  const loadEvents = async () => {
    if (!storage.isReady) return;

    try {
      setIsLoading(true);

      // Load submitted/synced events from DHIS2PWA database
      const submittedEvents = await storage.getAllEvents();

      // Load Type 1 auto-saved draft events from InspectionFormDB database
      const autoSavedDrafts = await indexedDBService.getAllFormData();

      // Convert Type 1 auto-saved drafts to event format for display
      const convertedAutoSavedDrafts = autoSavedDrafts
        .map(draft => ({
          event: draft.eventId,
          orgUnit: draft.formData?.orgUnit,
          eventDate: draft.formData?.eventDate || new Date().toISOString().split('T')[0],
          status: 'auto-draft',
          syncStatus: 'auto-draft',
          createdAt: draft.createdAt,
          updatedAt: draft.lastUpdated,
          isDraft: true,
          isAutoSaved: true,
          _draftData: draft
        }));

      // Filter out auto-saved drafts that already exist in submitted/synced events
      // Robust de-duplication by normalizing IDs
      const uniqueAutoSavedDrafts = convertedAutoSavedDrafts.filter(draft => {
        const draftId = (draft.event || '').toString().trim();
        if (!draftId) return true; // Keep if no ID (shouldn't happen)

        return !submittedEvents.some(submitted => {
          const submittedId = (submitted.event || '').toString().trim();
          return submittedId === draftId;
        });
      });

      // Combine all types of events
      const allEvents = [...submittedEvents, ...uniqueAutoSavedDrafts];

      console.log(`📊 Loaded events: ${submittedEvents.length} submitted/synced, ${convertedAutoSavedDrafts.length} drafts`);
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load events on mount and when storage is ready
  useEffect(() => {
    loadEvents();
  }, [storage.isReady]);

  // Auto-refresh events when window regains focus (e.g., returning from Form page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - refreshing events...');
      loadEvents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [storage.isReady]);

  // Auto-refresh when context state changes (after sync/retry operations)
  useEffect(() => {
    console.log('📊 Context state changed, reloading events from storage...');
    loadEvents();
  }, [pendingEvents, stats]);

  // Filter events based on search term and selected facility
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // First filter by selected facility if specified
    if (selectedFacilityId) {
      filtered = filtered.filter(event => event.orgUnit === selectedFacilityId);
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

  // Calculate stats based on the current view (filtered by facility, but NOT by search term)
  // This ensures the dashboard stats match what the user sees in the list (mostly)
  const dashboardStats = useMemo(() => {
    let statEvents = events;

    // Filter by facility if selected
    if (selectedFacilityId) {
      statEvents = statEvents.filter(event => event.orgUnit === selectedFacilityId);
    }

    const newStats = {
      totalEvents: statEvents.length,
      pendingEvents: 0,
      syncedEvents: 0,
      errorEvents: 0
    };

    statEvents.forEach(event => {
      const status = event.status || event.syncStatus;

      if (status === 'synced') {
        newStats.syncedEvents++;
      } else if (status === 'error' || event.syncStatus === 'error') {
        newStats.errorEvents++;
      } else {
        // All others (pending, draft, auto-draft) count as Pending
        newStats.pendingEvents++;
      }
    });

    return newStats;
  }, [events, selectedFacilityId]);


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

  const handleSync = async () => {
    await syncEvents();
    // Force refresh the list after sync attempt
    await loadEvents();
  };

  const handleRetryEvent = async (eventId) => {
    try {
      const success = await retryEvent(eventId);

      if (success) {
        // Reload all events to show updated status correctly
        await loadEvents();

        // Show success popup
        setSuccessMessage('Inspection synced successfully!');
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Failed to retry event:', error);
      showToast('Failed to retry event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      // Reload all events to show updated list
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      showToast('Failed to delete event', 'error');
    }
  };



  const getStatusIcon = (status, event) => {
    // 1. Synced
    if (status === 'synced') {
      return '✓';
    }

    // 2. Error (Online only)
    if (isOnline && (status === 'error' || event?.syncStatus === 'error')) {
      return '✗';
    }

    // 3. Pending Submission (Everything else: Pending, Drafts, Offline Errors)
    return '⏱';
  };

  const getStatusColor = (status, event) => {
    // 1. Synced
    if (status === 'synced') {
      return 'success';
    }

    // 2. Error (Online only)
    if (isOnline && (status === 'error' || event?.syncStatus === 'error')) {
      return 'error';
    }

    // 3. Pending Submission (Everything else)
    return 'warning';
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

    // 1. Synced
    if (status === 'synced') {
      return 'Synced';
    }

    // 2. Error (Online only)
    if (isOnline && (status === 'error' || event.syncStatus === 'error')) {
      return 'Error';
    }

    // 3. Pending Submission (Everything else)
    return 'Pending Submission';
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

      {/* Draft Resume Prompt */}
      {mostRecentDraft && (
        <div style={{
          backgroundColor: '#fff9c4',
          border: '1px solid #fbc02d',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <div>
              <h4 style={{ margin: 0, color: '#f57f17' }}>Draft in Progress</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#5f6368' }}>
                You have an unfinished inspection for <strong>{getFacilityName(mostRecentDraft.formData?.orgUnit)}</strong>.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/form/${mostRecentDraft.eventId}`)}
              style={{ padding: '8px 16px', backgroundColor: '#f57f17', borderColor: '#f57f17' }}
            >
              Resume Draft
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setMostRecentDraft(null)}
              style={{ color: '#5f6368', background: 'none', border: 'none' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
            <h3>{dashboardStats.totalEvents}</h3>
            <p>Total Inspections</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏱</div>
          <div className="stat-content">
            <h3>{dashboardStats.pendingEvents}</h3>
            <p>Pending Submission</p>
          </div>
        </div>

        <div className="stat-card synced">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{dashboardStats.syncedEvents}</h3>
            <p>Synced</p>
          </div>
        </div>

        {dashboardStats.errorEvents > 0 && (
          <div className="stat-card error">
            <div className="stat-icon">✗</div>
            <div className="stat-content">
              <h3>{dashboardStats.errorEvents}</h3>
              <p>Errors</p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Actions */}
      <div className="sync-section">
        <div className="sync-info">
          {dashboardStats.pendingEvents > 0 && (
            <p>Upload: {dashboardStats.pendingEvents} inspections waiting to sync</p>
          )}
          {dashboardStats.errorEvents > 0 && (
            <p style={{ color: '#000000' }}>
              ✗ {dashboardStats.errorEvents} inspections failed to sync
            </p>
          )}
          {dashboardStats.pendingEvents === 0 && dashboardStats.errorEvents === 0 && (
            <p style={{ color: '#6c757d', fontSize: '14px' }}>✓ All records are up to date</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {(dashboardStats.pendingEvents > 0 || dashboardStats.errorEvents > 0) && (
            <button
              className="btn btn-secondary"
              onClick={handleSync}
              disabled={!isOnline}
            >
              ↻ Sync Now
            </button>
          )}

          <button
            className="btn btn-danger"
            onClick={() => setShowClearConfirm(true)}
            style={{
              backgroundColor: '#dc3545',
              color: '#ffffff',
              padding: '8px 16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
            }}
            title="Clear all data for all inspectors on this device"
          >
            🗑 Clear All
          </button>
        </div>
      </div>



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
                      <div className={`form-status ${getStatusColor(event.status || event.syncStatus, event)}`}>
                        <span className="status-icon">
                          {getStatusIcon(event.status || event.syncStatus, event)}
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

                    {/* Retry Button - Show for Error OR Pending Submission (ALL drafts included) */}
                    {(event.status !== 'synced' && event.syncStatus !== 'synced') && (
                      <button
                        className="btn btn-secondary btn-sm retry-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the edit form
                          handleRetryEvent(event.event);
                        }}
                        disabled={!isOnline}
                        title={isOnline
                          ? 'Retry sync / Submit now'
                          : 'Cannot sync while offline'
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


      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
      >
        <DialogTitle sx={{ color: '#991b1b' }}>
          Confirm Data Wipe
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to <strong>delete all inspections</strong> from this device?
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            This includes:
          </Typography>
          <ul style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            <li>All saved drafts</li>
            <li>All inspections waiting to be synced</li>
            <li>All locally stored history of synced inspections</li>
          </ul>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: '#991b1b' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearConfirm(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmClear} variant="contained" color="error">
            Yes, Clear All Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <DialogTitle id="alert-dialog-title" sx={{ p: 0, mb: 1 }}>
            {"Success!"}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {successMessage}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              variant="contained"
              autoFocus
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
