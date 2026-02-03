/**
 * IndexedDB Service for Incremental Form Data Saving
 * Provides real-time field-by-field persistence for inspection forms
 */

class IndexedDBService {
  constructor() {
    this.dbName = 'InspectionFormDB';
    this.version = 2; // Increased version for user association schema
    this.storeName = 'formData';
    this.db = null;
  }

  /**
   * Get current user information from storage
   */
  async getCurrentUser() {
    try {
      // Access the main DHIS2PWA database directly to get current user
      const request = indexedDB.open('DHIS2PWA', 2);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['auth'], 'readonly');
          const store = transaction.objectStore('auth');
          const authRequest = store.get('current');

          authRequest.onsuccess = () => {
            const authData = authRequest.result;
            db.close(); // Close connection
            resolve(authData?.user || null);
          };

          authRequest.onerror = () => {
            console.warn('⚠️ Could not get auth data for user association');
            db.close(); // Close connection
            resolve(null);
          };
        };

        request.onerror = () => {
          console.warn('⚠️ Could not open DHIS2PWA database for user association');
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('⚠️ DHIS2PWA database access blocked');
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('⚠️ Could not get current user for draft association:', error);
      return null;
    }
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'eventId' });

          // Create indexes for efficient querying
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          store.createIndex('isDraft', 'metadata.isDraft', { unique: false });
          store.createIndex('facilityId', 'formData.orgUnit', { unique: false });
          store.createIndex('userId', 'userId', { unique: false }); // NEW: Index for user-specific queries
          store.createIndex('userIdAndDraft', ['userId', 'metadata.isDraft'], { unique: false }); // NEW: Compound index

          console.log('📦 Created IndexedDB object store:', this.storeName);
        } else if (oldVersion < 2) {
          // Handle schema upgrade for existing databases
          const transaction = event.target.transaction;
          const store = transaction.objectStore(this.storeName);

          // Add new indexes if they don't exist
          if (!store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false });
            console.log('📦 Added userId index to existing store');
          }
          if (!store.indexNames.contains('userIdAndDraft')) {
            store.createIndex('userIdAndDraft', ['userId', 'metadata.isDraft'], { unique: false });
            console.log('📦 Added userIdAndDraft compound index to existing store');
          }
        }
      };
    });
  }

  /**
   * Save form data incrementally (field by field)
   */
  async saveFormData(eventId, fieldKey, fieldValue, metadata = {}) {
    if (!this.db) {
      await this.init();
    }

    // Get current user for association
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.username || currentUser?.id || 'anonymous';

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // First, get existing data
      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const existingData = getRequest.result || {
          eventId: eventId,
          userId: userId, // NEW: Associate with current user
          userDisplayName: currentUser?.displayName || userId, // NEW: Store display name for reference
          formData: {},
          metadata: {
            isDraft: true,
            completedSections: [],
            currentSection: null,
            ...metadata
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };

        // Ensure userId is always set (for existing drafts without userId)
        if (!existingData.userId) {
          existingData.userId = userId;
          existingData.userDisplayName = currentUser?.displayName || userId;
        }

        // Update the specific field
        existingData.formData[fieldKey] = fieldValue;
        existingData.lastUpdated = new Date().toISOString();

        // Update metadata if provided
        if (metadata) {
          existingData.metadata = {
            ...existingData.metadata,
            ...metadata
          };
        }

        // Save updated data
        const putRequest = store.put(existingData);

        putRequest.onsuccess = () => {
          console.log(`💾 Saved field ${fieldKey} to IndexedDB for event ${eventId}`);
          resolve(existingData);
        };

        putRequest.onerror = () => {
          console.error('❌ Failed to save field to IndexedDB:', putRequest.error);
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        console.error('❌ Failed to get existing data from IndexedDB:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Save complete form data (bulk update)
   */
  async saveCompleteFormData(eventId, formData, metadata = {}) {
    if (!this.db) {
      await this.init();
    }

    // Get current user for association
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.username || currentUser?.id || 'anonymous';

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const data = {
        eventId: eventId,
        userId: userId, // NEW: Associate with current user
        userDisplayName: currentUser?.displayName || userId, // NEW: Store display name for reference
        formData: formData,
        metadata: {
          isDraft: true,
          completedSections: [],
          currentSection: null,
          ...metadata
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`💾 Saved complete form data to IndexedDB for event ${eventId}`);
        resolve(data);
      };

      request.onerror = () => {
        console.error('❌ Failed to save complete form data to IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get form data by event ID
   */
  async getFormData(eventId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(eventId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`📖 Retrieved form data from IndexedDB for event ${eventId}`);
        } else {
          console.log(`📭 No form data found in IndexedDB for event ${eventId}`);
        }
        resolve(result);
      };

      request.onerror = () => {
        console.error('❌ Failed to get form data from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all draft forms for the current user
   */
  async getAllDrafts() {
    if (!this.db) {
      await this.init();
    }

    // Get current user for filtering
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.username || currentUser?.id || 'anonymous';

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userIdAndDraft');

      // Query for current user's drafts only
      const request = index.getAll([userId, true]);

      request.onsuccess = () => {
        console.log(`📋 Retrieved ${request.result.length} draft forms for user ${userId} from IndexedDB`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to get draft forms from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all draft forms for all users (admin/debug function)
   */
  async getAllDraftsAllUsers() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('isDraft');
      const request = index.getAll(true);

      request.onsuccess = () => {
        console.log(`📋 Retrieved ${request.result.length} draft forms from all users from IndexedDB`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to get draft forms from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get the most recent form data for the current user (by lastUpdated timestamp)
   * Useful for restoring the last form the user was working on
   */
  async getMostRecentFormData() {
    if (!this.db) {
      await this.init();
    }

    // Get current user for filtering
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.username || currentUser?.id || 'anonymous';

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');

      // Get all records for current user, then find most recent
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const userRecords = request.result;

        // Filter for records that are explicitly drafts (not marked as submitted)
        const draftRecords = userRecords.filter(record =>
          record.metadata?.isDraft !== false &&
          !record.metadata?.isSubmitted &&
          !record.metadata?.isFromOfflineStorage // Don't suggest items that came from main offlineStorage
        );

        if (draftRecords.length === 0) {
          resolve(null);
          return;
        }

        // Find the most recent record by lastUpdated timestamp
        const mostRecent = draftRecords.reduce((latest, current) => {
          return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
        });

        console.log(`📖 Retrieved most recent draft for user ${userId}: ${mostRecent.eventId}`);
        resolve(mostRecent);
      };

      request.onerror = () => {
        console.error('❌ Failed to get most recent form data from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all form data records for the current user (for debugging/management)
   */
  async getAllFormData() {
    if (!this.db) {
      await this.init();
    }

    // Get current user for filtering
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.username || currentUser?.id || 'anonymous';

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        // Sort by lastUpdated (most recent first)
        const sorted = (request.result || []).sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.createdAt || 0);
          const dateB = new Date(b.lastUpdated || b.createdAt || 0);
          return dateB - dateA; // Descending order
        });
        console.log(`📋 Retrieved ${sorted.length} form data records for user ${userId}`);
        resolve(sorted);
      };

      request.onerror = () => {
        console.error('❌ Failed to get all form data from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all form data records for all users (admin/debug function)
   */
  async getAllFormDataAllUsers() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by lastUpdated (most recent first)
        const sorted = (request.result || []).sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.createdAt || 0);
          const dateB = new Date(b.lastUpdated || b.createdAt || 0);
          return dateB - dateA; // Descending order
        });
        console.log(`📋 Retrieved ${sorted.length} form data records from all users`);
        resolve(sorted);
      };

      request.onerror = () => {
        console.error('❌ Failed to get all form data from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete form data
   */
  async deleteFormData(eventId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(eventId);

      request.onsuccess = () => {
        console.log(`🗑️ Deleted form data from IndexedDB for event ${eventId}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Failed to delete form data from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark form as submitted (no longer draft)
   */
  async markAsSubmitted(eventId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.metadata.isDraft = false;
          data.metadata.submittedAt = new Date().toISOString();
          data.lastUpdated = new Date().toISOString();

          const putRequest = store.put(data);

          putRequest.onsuccess = () => {
            console.log(`✅ Marked form as submitted for event ${eventId}`);
            resolve(data);
          };

          putRequest.onerror = () => {
            console.error('❌ Failed to mark form as submitted:', putRequest.error);
            reject(putRequest.error);
          };
        } else {
          reject(new Error(`Form data not found for event ${eventId}`));
        }
      };

      getRequest.onerror = () => {
        console.error('❌ Failed to get form data for submission marking:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 Cleared all form data from IndexedDB');
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Failed to clear IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }
}

// Create singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
