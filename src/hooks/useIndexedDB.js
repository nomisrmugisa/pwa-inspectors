import { useState, useEffect } from 'react';

const DB_NAME = 'QIMSInspectionDB';
const DB_VERSION = 1;
const ASSIGNMENTS_STORE = 'assignments';
const INSPECTIONS_STORE = 'inspections';

const useIndexedDB = () => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize database
  useEffect(() => {
    console.log('Initializing IndexedDB...');
    const initDB = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        setError('Failed to open database');
        setIsReady(false);
      };

      request.onsuccess = () => {
        console.log('IndexedDB opened successfully');
        setDb(request.result);
        setIsReady(true);
        setError(null);
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed, creating stores...');
        const db = event.target.result;

        // Create assignments store
        if (!db.objectStoreNames.contains(ASSIGNMENTS_STORE)) {
          console.log('Creating assignments store...');
          const assignmentsStore = db.createObjectStore(ASSIGNMENTS_STORE, { keyPath: 'id' });
          assignmentsStore.createIndex('facility', 'facility', { unique: false });
          assignmentsStore.createIndex('inspector', 'inspector', { unique: false });
        }

        // Create inspections store
        if (!db.objectStoreNames.contains(INSPECTIONS_STORE)) {
          console.log('Creating inspections store...');
          const inspectionsStore = db.createObjectStore(INSPECTIONS_STORE, { keyPath: 'id' });
          inspectionsStore.createIndex('assignmentId', 'assignmentId', { unique: false });
          inspectionsStore.createIndex('facility', 'facility', { unique: false });
        }
      };
    };

    initDB();
  }, []);

  // Initialize with sample data
  const initializeWithSampleData = async () => {
    console.log('initializeWithSampleData called, isReady:', isReady);
    if (!isReady) {
      console.log('Database not ready, returning early');
      return { success: false, error: 'Database not ready' };
    }

    const sampleAssignments = [
      {
        id: 'SkO45xh7bcB',
        inspector: 'James Bond',
        facility: 'SK-Home',
        sections: [
          'FACILITY:-Bleeding room',
          'FACILITY:-Pharmacy/Dispensary',
          'FACILITY:-Safety and waste management'
        ],
        inspectionPeriod: {
          startDate: '2025-07-11',
          endDate: '2025-07-11'
        },
        assignedDate: '2025-07-04T19:15:39.234Z'
      },
      {
        id: 'hZtbWsPQOnS',
        inspector: 'Mario Rossi',
        facility: 'SK-Home',
        sections: [
          'FACILITY:-Procedure room'
        ],
        inspectionPeriod: {
          startDate: '2025-07-06',
          endDate: '2025-07-06'
        },
        assignedDate: '2025-07-04T19:15:39.234Z'
      }
    ];

    try {
      console.log('Starting sample data initialization...');
      const transaction = db.transaction([ASSIGNMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(ASSIGNMENTS_STORE);

      // Clear existing data
      console.log('Clearing existing data...');
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
          console.log('Data cleared successfully');
          resolve();
        };
        clearRequest.onerror = () => {
          console.error('Error clearing data:', clearRequest.error);
          reject(clearRequest.error);
        };
      });

      // Add sample data
      console.log('Adding sample assignments...');
      for (const assignment of sampleAssignments) {
        await new Promise((resolve, reject) => {
          const addRequest = store.add(assignment);
          addRequest.onsuccess = () => {
            console.log('Added assignment:', assignment.id);
            resolve();
          };
          addRequest.onerror = () => {
            console.error('Error adding assignment:', assignment.id, addRequest.error);
            reject(addRequest.error);
          };
        });
      }

      console.log('Sample data initialization completed successfully');
      return { success: true };
    } catch (err) {
      console.error('Failed to initialize sample data:', err);
      setError('Failed to initialize sample data: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Get all assignments
  const getAssignments = async () => {
    console.log('getAssignments called, isReady:', isReady);
    if (!isReady) {
      console.log('Database not ready, returning empty array');
      return [];
    }

    try {
      console.log('Getting assignments from database...');
      const transaction = db.transaction([ASSIGNMENTS_STORE], 'readonly');
      const store = transaction.objectStore(ASSIGNMENTS_STORE);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('Assignments retrieved:', request.result);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error('Error getting assignments:', request.error);
          reject(request.error);
        };
      });
    } catch (err) {
      console.error('Failed to get assignments:', err);
      setError('Failed to get assignments: ' + err.message);
      return [];
    }
  };

  // Add new assignment
  const addAssignment = async (assignment) => {
    if (!isReady) return { success: false, error: 'Database not ready' };

    try {
      const transaction = db.transaction([ASSIGNMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(ASSIGNMENTS_STORE);
      const request = store.add(assignment);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError('Failed to add assignment: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Update assignment
  const updateAssignment = async (assignment) => {
    if (!isReady) return { success: false, error: 'Database not ready' };

    try {
      const transaction = db.transaction([ASSIGNMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(ASSIGNMENTS_STORE);
      const request = store.put(assignment);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError('Failed to update assignment: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete assignment
  const deleteAssignment = async (id) => {
    if (!isReady) return { success: false, error: 'Database not ready' };

    try {
      const transaction = db.transaction([ASSIGNMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(ASSIGNMENTS_STORE);
      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError('Failed to delete assignment: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Save inspection data
  const saveInspection = async (assignmentId, inspectionData) => {
    if (!isReady) return { success: false, error: 'Database not ready' };

    try {
      const transaction = db.transaction([INSPECTIONS_STORE], 'readwrite');
      const store = transaction.objectStore(INSPECTIONS_STORE);
      
      const inspection = {
        id: `${assignmentId}_${Date.now()}`,
        assignmentId,
        data: inspectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const request = store.add(inspection);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError('Failed to save inspection: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Get inspections for an assignment
  const getInspections = async (assignmentId) => {
    if (!isReady) return [];

    try {
      const transaction = db.transaction([INSPECTIONS_STORE], 'readonly');
      const store = transaction.objectStore(INSPECTIONS_STORE);
      const index = store.index('assignmentId');
      const request = index.getAll(assignmentId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError('Failed to get inspections: ' + err.message);
      return [];
    }
  };

  return {
    isReady,
    error,
    initializeWithSampleData,
    getAssignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    saveInspection,
    getInspections
  };
};

export default useIndexedDB; 