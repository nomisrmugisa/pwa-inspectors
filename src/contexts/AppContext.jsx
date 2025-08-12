import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAPI } from '../hooks/useAPI';
import { useStorage } from '../hooks/useStorage';

// Initial state
const initialState = {
  inspectionDate: null,
  // Authentication
  isAuthenticated: false,
  user: null,
  serverUrl: '',
  
  // Configuration - like Android DHIS2 app
  configuration: null,
  
  // User assignments from DataStore
  userAssignments: [],
  
  // UI State
  loading: false,
  error: null,
  toast: null,
  
  // Network state
  isOnline: navigator.onLine,
  
  // Sync state
  pendingEvents: [],
  lastSyncTime: null,
  syncInProgress: false,
  
  // Statistics
  stats: {
    totalEvents: 0,
    pendingEvents: 0,
    syncedEvents: 0,
    errorEvents: 0
  }
};

// Action types
const ActionTypes = {
  // Auth actions
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  
  // Configuration actions
  FETCH_CONFIGURATION_START: 'FETCH_CONFIGURATION_START',
  FETCH_CONFIGURATION_SUCCESS: 'FETCH_CONFIGURATION_SUCCESS',
  FETCH_CONFIGURATION_FAILURE: 'FETCH_CONFIGURATION_FAILURE',
  
  // User assignments actions
  UPDATE_USER_ASSIGNMENTS: 'UPDATE_USER_ASSIGNMENTS',
  
  // UI actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST',
  
  // Network actions
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  
  // Sync actions
  SYNC_START: 'SYNC_START',
  SYNC_SUCCESS: 'SYNC_SUCCESS',
  SYNC_FAILURE: 'SYNC_FAILURE',
  UPDATE_PENDING_EVENTS: 'UPDATE_PENDING_EVENTS',
  
  // Stats actions
  UPDATE_STATS: 'UPDATE_STATS',

  SET_INSPECTION_DATE: 'SET_INSPECTION_DATE'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_INSPECTION_DATE:
      return {
        ...state,
        inspectionDate: action.payload
      };

    case ActionTypes.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        serverUrl: action.payload.serverUrl,
        error: null
      };
      
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isOnline: state.isOnline
      };

    case ActionTypes.UPDATE_USER_ASSIGNMENTS:
      return {
        ...state,
        userAssignments: action.payload
      };

    case ActionTypes.FETCH_CONFIGURATION_START:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case ActionTypes.FETCH_CONFIGURATION_SUCCESS:
      return {
        ...state,
        loading: false,
        configuration: action.payload,
        error: null
      };
      
    case ActionTypes.FETCH_CONFIGURATION_FAILURE:
      return {
        ...state,
        loading: false,
        configuration: null,
        error: action.payload
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ActionTypes.SHOW_TOAST:
      return {
        ...state,
        toast: action.payload
      };
      
    case ActionTypes.HIDE_TOAST:
      return {
        ...state,
        toast: null
      };
      
    case ActionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload
      };
      
    case ActionTypes.SYNC_START:
      return {
        ...state,
        syncInProgress: true
      };
      
    case ActionTypes.SYNC_SUCCESS:
      return {
        ...state,
        syncInProgress: false,
        lastSyncTime: new Date().toISOString(),
        pendingEvents: action.payload.remainingEvents || []
      };
      
    case ActionTypes.SYNC_FAILURE:
      return {
        ...state,
        syncInProgress: false,
        error: action.payload
      };
      
    case ActionTypes.UPDATE_PENDING_EVENTS:
      return {
        ...state,
        pendingEvents: action.payload
      };
      
    case ActionTypes.UPDATE_STATS:
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const api = useAPI();
  const storage = useStorage();
  // const [userAssignments, setUserAssignments] = useState([]);



  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      console.log("Initializing app...");
      // Wait for storage to be ready before trying to use it
      if (!storage.isReady) {
        return;
      }
      
      try {
        // Try to restore authentication
        const auth = await storage.getAuth();
        if (auth?.serverUrl && auth?.credentials) {
          const { serverUrl, username, password } = auth;
          
          // Configure API
          api.setConfig(serverUrl, username, password);
          
          // Test authentication
          const authResult = await api.testAuth();
          if (authResult.success) {
            dispatch({
              type: ActionTypes.LOGIN_SUCCESS,
              payload: {
                user: authResult.user,
                serverUrl
              }
            });
            
            // Fetch configuration immediately after login like Android app
            await fetchConfiguration();

            // Fetch user assignments
            await fetchUserAssignments();
          } else {
            // Clear invalid credentials
            await storage.clearAuth();
          }
        }
        
        // Load stats
        const stats = await storage.getStats();
        if (stats) {
          dispatch({
            type: ActionTypes.UPDATE_STATS,
            payload: stats
          });
        }
        
        // Load pending events
        const events = await storage.getEvents({ status: 'pending' });
        dispatch({
          type: ActionTypes.UPDATE_PENDING_EVENTS,
          payload: events
        });
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Don't show error to user if it's just storage not ready
        if (error.message !== 'Storage not ready') {
          dispatch({
            type: ActionTypes.SET_ERROR,
            payload: 'Failed to initialize application'
          });
        }
      }
    };

    // Only run initialization when storage is ready
    if (storage.isReady) {
      initializeApp();
    }
  }, [storage.isReady]); // Depend on storage.isReady instead of storage itself

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: true });
    const handleOffline = () => dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: ActionTypes.HIDE_TOAST });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  const setEventDate = (date) => {
    dispatch({
      type: ActionTypes.SET_INSPECTION_DATE,
      payload: date
    });
  }

  /**
   * Fetch complete data collection configuration like Android DHIS2 app
   */
  const fetchConfiguration = async () => {
    dispatch({ type: ActionTypes.FETCH_CONFIGURATION_START });
    
    try {
      const configuration = await api.getDataCollectionConfiguration();
      
      // Store configuration locally if storage is ready
      if (storage.isReady) {
        try {
          await storage.setConfiguration(configuration);
        } catch (storageError) {
          console.warn('Failed to store configuration:', storageError);
          // Continue anyway since we have the configuration
        }
      }
      
      dispatch({
        type: ActionTypes.FETCH_CONFIGURATION_SUCCESS,
        payload: configuration
      });
      
      showToast(`Loaded: ${configuration.program.displayName}`, 'success');
      
      return configuration;
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      
      // Try to load from local storage as fallback
      if (storage.isReady) {
        try {
          const localConfig = await storage.getConfiguration();
          if (localConfig) {
            dispatch({
              type: ActionTypes.FETCH_CONFIGURATION_SUCCESS,
              payload: localConfig
            });
            showToast('Using offline configuration', 'info');
            return localConfig;
          }
        } catch (localError) {
          console.error('Failed to load local configuration:', localError);
        }
      }
      
      dispatch({
        type: ActionTypes.FETCH_CONFIGURATION_FAILURE,
        payload: error.message
      });
      
      showToast(`Configuration error: ${error.message}`, 'error');
      throw error;
    }
  };

  /**
   * Fetch user assignments from DataStore
   */
  // const fetchUserAssignments = async () => {
  //   try {
  //     console.log('************ Final user assignments:**************');
  //     // Step 1: Start Fetching Assignments
  //     console.log('Step 1: 🔄 Fetching assignments from DataStore...');
  //     // Step 2: Get Current User
  //     const userResult = await api.getMe();
  //     console.log('Step 2: 👤 Current user:', {
  //       id: userResult.id,
  //       username: userResult.username,
  //       displayName: userResult.displayName
  //     });
  //     // Step 3: Fetch Assignments Data
  //     const datastoreResponse = await api.getInspectionAssignments();
  //     console.log('Step 3: 📊 Raw DataStore response:', datastoreResponse);
  //     const assignmentsData = datastoreResponse;
  //     console.log('Step 3: 📋 Processing assignments data:', assignmentsData);
  //     // Step 4: Log Facilities
  //     // if (assignmentsData && assignmentsData.inspections) {
  //     //   const facilities = assignmentsData.inspections.map(i => i.facility).filter(f => f);
  //     //   console.log('Step 4: 🏥 Facilities found in DataStore:', facilities);
  //     // }
  //
  //     // if (assignmentsData && Array.isArray(assignmentsData)) {
  //     //   const facilities = assignmentsData.map(inspection => ({
  //     //     id: inspection.facilityId,
  //     //     name: inspection.facilityName
  //     //   }));
  //     //
  //     //   console.log('Step 4: 🏥 Facilities found in DataStore:', facilities);
  //     // }
  //
  //     if (datastoreResponse && Array.isArray(datastoreResponse)) {
  //       const facilities = datastoreResponse.map(inspection => ({
  //         facility: {
  //           id: inspection.facilityId,
  //           name: inspection.facilityName
  //         }
  //       }));
  //
  //       console.log('Setting facilities:', facilities);
  //       dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: facilities });
  //     }
  //
  //     // Step 5: Validate Data Structure
  //     if (!assignmentsData || !assignmentsData.inspections || !Array.isArray(assignmentsData.inspections)) {
  //       console.warn('Step 5: ⚠️ No valid inspections found in DataStore response');
  //       dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: [] });
  //       return;
  //     }
  //     // Step 6: Filter Assignments for Current User
  //     const userAssignments = [];
  //     assignmentsData.inspections.forEach(inspection => {
  //       if (!inspection.facility || !inspection.assignments || !Array.isArray(inspection.assignments)) {
  //         console.warn('Step 6: ⚠️ Invalid inspection structure:', inspection);
  //         return;
  //       }
  //       // Find assignments for current user by assignment.id === userResult.id
  //       const userInspectionAssignments = inspection.assignments.filter(
  //         assignment => assignment.id === userResult.id
  //       );
  //       userInspectionAssignments.forEach(assignment => {
  //         userAssignments.push({
  //           facility: inspection.facility,
  //           assignment: assignment,
  //           inspectionPeriod: assignment.period || '2025' // Default period
  //         });
  //       });
  //     });
  //     console.log('Step 7: 🎯 Final user assignments:', userAssignments);
  //
  //     // Update state
  //     dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: userAssignments });
  //
  //     if (userAssignments.length > 0) {
  //       showToast(`Found ${userAssignments.length} inspection assignment(s)`, 'success');
  //     } else {
  //       showToast('No inspection assignments found for your account', 'warning');
  //     }
  //
  //   } catch (error) {
  //     console.error('❌ Failed to fetch user assignments:', error);
  //     dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: [] });
  //     showToast(`Failed to load assignments: ${error.message}`, 'error');
  //   }
  // };

  const fetchUserAssignments = async () => {
        try {
          console.log('************ Final user assignments:**************');
          // Step 1: Start Fetching Assignments
          console.log('Step 1: 🔄 Fetching assignments from DataStore...');
          // Step 2: Get Current User
          const userResult = await api.getMe();
          console.log('Step 2: 👤 Current user:', {
            id: userResult.id,
            username: userResult.username,
            displayName: userResult.displayName
          });
          // Step 3: Fetch Assignments Data
          const datastoreResponse = await api.getInspectionAssignments();
          console.log('Step 3: 📊 Raw DataStore response:', datastoreResponse);
          const assignmentsData = datastoreResponse;
          console.log('Step 3: 📋 Processing assignments data:', assignmentsData);

            // Step 4: Log Facilities
          if (datastoreResponse && Array.isArray(datastoreResponse)) {
            const facilities = datastoreResponse.map(inspection => {
              // Prefer the assignment entry for the current user when present
              const norm = (v) => (v ?? '').toString().trim().toLowerCase();
              const inspectorAssignment = (inspection.assignments || []).find(a => {
                const aName = norm(a.inspectorName);
                const iName = norm(userResult.displayName || userResult.username);
                return aName === iName || aName.includes(iName) || iName.includes(aName);
              });
              return {
                facility: {
                  id: inspection.facilityId,
                  name: inspection.facilityName
                },
                assignment: {
                  // Sections from the inspector-specific assignment if available; fall back to all
                  sections: inspectorAssignment?.sections || (inspection.assignments || []).flatMap(a => Array.isArray(a.sections) ? a.sections : []),
                  inspectionPeriod: {
                    startDate: inspection.startDate,
                    endDate: inspection.endDate
                  },
                  // Prefer per-assignment values, then facility-level fallbacks
                  type: inspectorAssignment?.type || inspection.type || inspection.Type || inspection.inspectionType || null,
                  inspectionId: inspectorAssignment?.inspectionId || inspectorAssignment?.inspectionID || inspection.inspectionId || inspection.inspectionID || inspection.id || inspection.Id || null
                }
              };
            });

            console.log('Processing facilities:', facilities);

            // Update the state with facilities
            dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: facilities });

            if (facilities.length > 0) {
              showToast(`Found ${facilities.length} facility assignments`, 'success');
            } else {
              showToast('No facility assignments found', 'warning');
            }
          } else {
            console.warn('Invalid or empty response from DataStore');
            dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: [] });
          }
        } catch (error) {
          console.error('Failed to fetch user assignments:', error);
          dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: [] });
          showToast(`Failed to load assignments: ${error.message}`, 'error');
        }
      };

  // Authentication functions
  const login = async (serverUrl, username, password) => {
    dispatch({ type: ActionTypes.LOGIN_START });
    
    try {
      // Clean URL
      const cleanUrl = serverUrl.replace(/\/$/, '');
      
      // Configure API
      api.setConfig(cleanUrl, username, password);
      
      // Test authentication
      const authResult = await api.testAuth();
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Invalid credentials');
      }
      
      // Store credentials only if storage is ready
      if (storage.isReady) {
        try {
          await storage.setAuth({
            serverUrl: cleanUrl,
            username,
            password,
            credentials: btoa(`${username}:${password}`)
          });
        } catch (storageError) {
          console.warn('Failed to store credentials:', storageError);
          // Continue anyway since authentication succeeded
        }
      }
      
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: authResult.user,
          serverUrl: cleanUrl
        }
      });
      
      showToast(`Welcome, ${authResult.user.displayName}!`, 'success');
      
      // Immediately fetch configuration like Android app
      await fetchConfiguration();

      // Fetch user assignments
      await fetchUserAssignments();
      
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: error.message
      });
      
      showToast(`Login failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const logout = async () => {
    const confirmed = window.confirm(
        "Logging out will clear all synced data from this device. Do you want to continue?"
    );
    if (!confirmed) return;

    try {
      if (storage.isReady) {
        try {
          await storage.clearSyncedEvents();
          await storage.clearAuth();
        } catch (storageError) {
          console.warn('Failed to clear stored credentials:', storageError);
          // Continue with logout anyway
        }
      }
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if storage fails
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out', 'info');
    }
  };

  // Event management functions
  const saveEvent = async (eventData, isDraft = false) => {
    try {
      if (!storage.isReady) {
        throw new Error('Storage not ready - please wait and try again');
      }

      const eventId = eventData.event || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const event = {
        ...eventData,
        event: eventId,
        status: isDraft ? 'draft' : 'pending',
        syncStatus: isDraft ? 'draft' : 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await storage.saveEvent(event);
      
      // Update stats
      await updateStats();
      
      showToast(isDraft ? 'Inspection draft saved' : 'Inspection saved', 'success');
      
      return event;
    } catch (error) {
      console.error('Failed to save event:', error);
      showToast(`Save failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const syncEvents = async () => {
    if (!state.isOnline) {
      showToast('Cannot sync while offline', 'warning');
      return;
    }

    if (!storage.isReady) {
      showToast('Storage not ready - please wait and try again', 'warning');
      return;
    }
    
    dispatch({ type: ActionTypes.SYNC_START });
    
    try {
      const pendingEvents = await storage.getEvents({ status: 'pending' });
      
      if (pendingEvents.length === 0) {
        showToast('No inspections to sync', 'info');
        dispatch({ type: ActionTypes.SYNC_SUCCESS, payload: { remainingEvents: [] } });
        return;
      }
      
      const results = [];
      const failedEvents = [];
      
      for (const event of pendingEvents) {
        try {
          // const response = await api.submitEvent(event);
          //
          // if (response.status === 'SUCCESS' || response.httpStatus === 'OK') {
          //   // Mark as synced
          //   await storage.updateEvent(event.event, {
          //     ...event,
          //     status: 'synced',
          //     syncStatus: 'synced',
          //     syncedAt: new Date().toISOString()
          //   });
          //   results.push({ event: event.event, status: 'success' });
          // } else {
          //   throw new Error('Server rejected event');
          // }

          // Clean payload before submission
          // DHIS2 will generate the event UID on create; omit local temp ID to avoid 409 conflicts
          const cleanEvent = {
            program: event.program,
            programStage: event.programStage,
            orgUnit: event.orgUnit,
            eventDate: event.eventDate,
            status: 'ACTIVE',
            dataValues: Array.isArray(event.dataValues) ? event.dataValues : []
          };

          // Only include trackedEntityInstance if it exists
          if (event.trackedEntityInstance) {
            cleanEvent.trackedEntityInstance = event.trackedEntityInstance;
            console.log('🔗 Including trackedEntityInstance in sync event:', event.trackedEntityInstance);
          } else {
            console.log('ℹ️ No trackedEntityInstance available - syncing event without TEI link');
          }

          // Clean up event data - remove any undefined or null values
          Object.keys(cleanEvent).forEach(key => {
            if (cleanEvent[key] === undefined || cleanEvent[key] === null) {
              delete cleanEvent[key];
            }
          });

          console.log('📝 Final clean event for sync:', cleanEvent);

          const response = await api.submitEvent(cleanEvent); // Submit cleaned event

          const topLevelStatus = response?.status || response?.httpStatus || response?.response?.status;
          const importSummaries = response?.response?.importSummaries || response?.importSummaries || [];
          const firstSummary = Array.isArray(importSummaries) && importSummaries.length > 0 ? importSummaries[0] : null;
          const summaryStatus = firstSummary?.status || firstSummary?.httpStatus;

          if (topLevelStatus === 'SUCCESS' || topLevelStatus === 'OK' || summaryStatus === 'SUCCESS') {
            const serverEventId = firstSummary?.reference || firstSummary?.uid || response?.response?.uid || null;
            // Mark as synced in local storage (keep tracking fields for local use)
            await storage.updateEvent(event.event, {
              ...event,
              status: 'synced',
              syncStatus: 'synced',
              syncedAt: new Date().toISOString(),
              serverEventId
            });
            results.push({event: event.event, status: 'success'});
          }

        } catch (error) {
          console.error(`Failed to sync event ${event.event}:`, error);
          
          // Mark as error
          await storage.updateEvent(event.event, {
            ...event,
            status: 'error',
            syncStatus: 'error',
            syncError: error.message
          });
          
          failedEvents.push(event);
          results.push({ event: event.event, status: 'error', error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      if (successCount > 0) {
        showToast(`Synced ${successCount} inspection(s)`, 'success');
      }
      
      if (errorCount > 0) {
        showToast(`${errorCount} inspection(s) failed to sync`, 'error');
      }
      
      // Update pending events
      const remainingPending = await storage.getEvents({ status: 'pending' });
      
      dispatch({
        type: ActionTypes.SYNC_SUCCESS,
        payload: { remainingEvents: remainingPending }
      });
      
      // Update stats
      await updateStats();
      
    } catch (error) {
      console.error('Sync failed:', error);
      dispatch({
        type: ActionTypes.SYNC_FAILURE,
        payload: error.message
      });
      showToast(`Sync failed: ${error.message}`, 'error');
    }
  };

  // Retry a single failed event
  const retryEvent = async (eventId) => {
    if (!state.isOnline) {
      showToast('Cannot retry while offline', 'warning');
      return;
    }

    if (!storage.isReady) {
      showToast('Storage not ready - please wait and try again', 'warning');
      return;
    }

    try {
      // Get the failed event
      const event = await storage.getEvent(eventId);
      if (!event) {
        showToast('Event not found', 'error');
        return;
      }

      if (event.status !== 'error' && event.syncStatus !== 'error') {
        showToast('Event is not in error state', 'info');
        return;
      }

      // Mark as pending to retry
      await storage.updateEvent(eventId, {
        ...event,
        status: 'pending',
        syncStatus: 'pending',
        syncError: null
      });

      // Try to sync this single event
      const cleanEvent = {
        program: event.program,
        programStage: event.programStage,
        orgUnit: event.orgUnit,
        eventDate: event.eventDate,
        status: 'ACTIVE',
        dataValues: Array.isArray(event.dataValues) ? event.dataValues : []
      };

      // Only include trackedEntityInstance if it exists
      if (event.trackedEntityInstance) {
        cleanEvent.trackedEntityInstance = event.trackedEntityInstance;
      }

      // Clean up event data - remove any undefined or null values
      Object.keys(cleanEvent).forEach(key => {
        if (cleanEvent[key] === undefined || cleanEvent[key] === null) {
          delete cleanEvent[key];
        }
      });

      const response = await api.submitEvent(cleanEvent);

      const topLevelStatus = response?.status || response?.httpStatus || response?.response?.status;
      const importSummaries = response?.response?.importSummaries || response?.importSummaries || [];
      const firstSummary = Array.isArray(importSummaries) && importSummaries.length > 0 ? importSummaries[0] : null;
      const summaryStatus = firstSummary?.status || firstSummary?.httpStatus;

      if (topLevelStatus === 'SUCCESS' || topLevelStatus === 'OK' || summaryStatus === 'SUCCESS') {
        const serverEventId = firstSummary?.reference || firstSummary?.uid || response?.response?.uid || null;
        // Mark as synced
        await storage.updateEvent(eventId, {
          ...event,
          status: 'synced',
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          serverEventId
        });
        showToast('Event synced successfully', 'success');
      } else {
        throw new Error('Server rejected event');
      }

      // Update stats
      await updateStats();
      
      // Refresh events list
      const events = await storage.getEvents();
      dispatch({
        type: ActionTypes.SET_EVENTS,
        payload: events
      });

    } catch (error) {
      console.error(`Failed to retry event ${eventId}:`, error);
      
      // Mark as error again
      const event = await storage.getEvent(eventId);
      if (event) {
        await storage.updateEvent(eventId, {
          ...event,
          status: 'error',
          syncStatus: 'error',
          syncError: error.message
        });
      }
      
      showToast(`Retry failed: ${error.message}`, 'error');
    }
  };

  // Delete a single event
  const deleteEvent = async (eventId) => {
    if (!storage.isReady) {
      showToast('Storage not ready - please wait and try again', 'warning');
      return;
    }

    try {
      // Get the event to check if it exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        showToast('Event not found', 'error');
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete this inspection?\n\n` +
        `Facility: ${event.orgUnit}\n` +
        `Date: ${event.eventDate}\n\n` +
        `This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      // Delete the event from storage
      await storage.deleteEvent(eventId);
      
      showToast('Event deleted successfully', 'success');
      
      // Update stats
      await updateStats();
      
      // Refresh events list
      const events = await storage.getAllEvents();
      dispatch({
        type: ActionTypes.UPDATE_PENDING_EVENTS,
        payload: events
      });

    } catch (error) {
      console.error(`Failed to delete event ${eventId}:`, error);
      showToast(`Failed to delete event: ${error.message}`, 'error');
    }
  };

  const updateStats = async () => {
    try {
      if (!storage.isReady) {
        console.warn('Storage not ready for stats update');
        return;
      }

      const events = await storage.getAllEvents();
      const stats = {
        totalEvents: events.length,
        pendingEvents: events.filter(e => e.status === 'pending').length,
        syncedEvents: events.filter(e => e.status === 'synced').length,
        errorEvents: events.filter(e => e.status === 'error').length
      };
      
      await storage.setStats(stats);
      dispatch({ type: ActionTypes.UPDATE_STATS, payload: stats });
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  // Utility functions
  const showToast = (message, type = 'info') => {
    dispatch({
      type: ActionTypes.SHOW_TOAST,
      payload: { message, type }
    });
  };

  const hideToast = () => {
    dispatch({ type: ActionTypes.HIDE_TOAST });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    ...state,
    // userAssignments,
    // setUserAssignments,
    // Actions
    setEventDate,
    login,
    logout,
    fetchConfiguration,
    saveEvent,
    syncEvents,
    retryEvent,
    deleteEvent,
    updateStats,
    showToast,
    hideToast,
    clearError
  };

  return (
    <AppContext.Provider value={{
      ...state,
      api,
      storage,
      userAssignments: state.userAssignments, // Expose userAssignments from state
      setUserAssignments: (assignments) => dispatch({ type: ActionTypes.UPDATE_USER_ASSIGNMENTS, payload: assignments }), // Expose setUserAssignments
      login,
      logout,
      fetchUserAssignments,
      saveEvent,
      syncEvents,
      retryEvent,
      deleteEvent,
      updateStats,
      showToast,
      hideToast,
      clearError,
      setEventDate
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 