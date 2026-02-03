/**
 * Custom hook for incremental field-by-field saving to IndexedDB
 * Provides debounced saving to avoid excessive writes
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import indexedDBService from '../services/indexedDBService';

export const useIncrementalSave = (eventId, options = {}) => {
  const {
    debounceMs = 300,
    onSaveSuccess,
    onSaveError,
    enableLogging = true
  } = options;

  // Use refs for callbacks to keep internal functions stable even if callbacks change
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    onSaveSuccessRef.current = onSaveSuccess;
    onSaveErrorRef.current = onSaveError;
  }, [onSaveSuccess, onSaveError]);

  // Form data state - this is the main state that FormPage uses
  const [formData, setFormData] = useState({
    orgUnit: '',
    eventDate: (() => {
      const today = new Date();
      if (!isNaN(today.getTime())) {
        return today.toISOString().split('T')[0];
      }
      return '2025-01-01';
    })()
  });

  // Store pending saves to batch them
  const pendingSaves = useRef(new Map());
  const saveTimeoutRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize IndexedDB on first use
  useEffect(() => {
    const initDB = async () => {
      if (!isInitialized.current) {
        try {
          await indexedDBService.init();
          isInitialized.current = true;
          if (enableLogging) {
            console.log('🔧 useIncrementalSave: IndexedDB initialized');
          }
        } catch (error) {
          console.error('❌ useIncrementalSave: Failed to initialize IndexedDB:', error);
          onSaveError(error);
        }
      }
    };

    initDB();
  }, [onSaveError, enableLogging]);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    if (pendingSaves.current.size === 0) return;

    try {
      // Get all pending field updates
      const updates = Array.from(pendingSaves.current.entries());

      if (enableLogging) {
        console.log(`💾 Saving ${updates.length} field(s) to IndexedDB:`, updates.map(([key]) => key));
      }

      // Save each field individually to maintain incremental approach
      for (const [fieldKey, fieldValue] of updates) {
        await indexedDBService.saveFormData(eventId, fieldKey, fieldValue, {
          lastFieldUpdated: fieldKey,
          updateCount: (await indexedDBService.getFormData(eventId))?.metadata?.updateCount || 0 + 1
        });
      }

      // Clear pending saves
      pendingSaves.current.clear();

      // Notify success
      if (onSaveSuccessRef.current) {
        onSaveSuccessRef.current({
          eventId,
          savedFields: updates.length,
          timestamp: new Date().toISOString()
        });
      }

      if (enableLogging) {
        console.log(`✅ Successfully saved ${updates.length} field(s) for event ${eventId}`);
      }

    } catch (error) {
      console.error('❌ Failed to save fields to IndexedDB:', error);
      if (onSaveErrorRef.current) onSaveErrorRef.current(error);
    }
  }, [eventId, enableLogging]);

  // Save field function
  const saveField = useCallback((fieldKey, fieldValue) => {
    if (!eventId) {
      console.warn('⚠️ useIncrementalSave: No eventId provided, skipping save');
      return;
    }

    // Add to pending saves
    pendingSaves.current.set(fieldKey, fieldValue);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new debounced save
    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave();
    }, debounceMs);

    if (enableLogging) {
      console.log(`📝 Queued field save: ${fieldKey} = ${fieldValue} (debounce: ${debounceMs}ms)`);
    }
  }, [eventId, debounceMs, debouncedSave, enableLogging]);

  // Immediate save function (for critical fields)
  const saveFieldImmediate = useCallback(async (fieldKey, fieldValue, metadata = {}) => {
    if (!eventId) {
      console.warn('⚠️ useIncrementalSave: No eventId provided, skipping immediate save');
      return;
    }

    try {
      await indexedDBService.saveFormData(eventId, fieldKey, fieldValue, {
        ...metadata,
        immediateSave: true,
        timestamp: new Date().toISOString()
      });

      if (onSaveSuccessRef.current) {
        onSaveSuccessRef.current({
          eventId,
          savedFields: 1,
          immediate: true,
          fieldKey,
          timestamp: new Date().toISOString()
        });
      }

      if (enableLogging) {
        console.log(`⚡ Immediately saved field: ${fieldKey} = ${fieldValue}`);
      }

    } catch (error) {
      console.error('❌ Failed to immediately save field:', error);
      if (onSaveErrorRef.current) onSaveErrorRef.current(error);
    }
  }, [eventId, enableLogging]);

  // Save multiple fields at once
  const saveFields = useCallback((fieldsObject) => {
    Object.entries(fieldsObject).forEach(([key, value]) => {
      saveField(key, value);
    });
  }, [saveField]);

  // Force save all pending changes immediately
  const flushPendingSaves = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    return await debouncedSave();
  }, [debouncedSave]);

  // Load existing form data
  const loadFormData = useCallback(async () => {
    if (!eventId) return null;

    try {
      const data = await indexedDBService.getFormData(eventId);
      if (enableLogging && data) {
        console.log(`📖 Loaded existing form data for event ${eventId}:`, {
          fields: Object.keys(data.formData).length,
          lastUpdated: data.lastUpdated
        });
      }
      return data;
    } catch (error) {
      console.error('❌ Failed to load form data:', error);
      if (onSaveErrorRef.current) onSaveErrorRef.current(error);
      return null;
    }
  }, [eventId, enableLogging]);

  // Update section metadata
  const updateSectionMetadata = useCallback(async (sectionName, isCompleted = false) => {
    if (!eventId) return;

    try {
      const existingData = await indexedDBService.getFormData(eventId);
      const completedSections = existingData?.metadata?.completedSections || [];

      const updatedMetadata = {
        currentSection: sectionName,
        completedSections: isCompleted && !completedSections.includes(sectionName)
          ? [...completedSections, sectionName]
          : completedSections,
        lastSectionUpdate: new Date().toISOString()
      };

      // Save metadata update
      await indexedDBService.saveFormData(eventId, '_metadata_update', null, updatedMetadata);

      if (enableLogging) {
        console.log(`📋 Updated section metadata: ${sectionName} (completed: ${isCompleted})`);
      }

    } catch (error) {
      console.error('❌ Failed to update section metadata:', error);
      if (onSaveErrorRef.current) onSaveErrorRef.current(error);
    }
  }, [eventId, enableLogging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Flush any pending saves on unmount
      if (pendingSaves.current.size > 0) {
        debouncedSave();
      }
    };
  }, [debouncedSave]);

  return {
    formData,
    setFormData,
    saveField,
    saveFieldImmediate,
    saveFields,
    flushPendingSaves,
    loadFormData,
    updateSectionMetadata,
    isInitialized: isInitialized.current
  };
};
