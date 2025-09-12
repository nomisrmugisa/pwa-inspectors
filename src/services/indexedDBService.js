/**
 * IndexedDB Service for Incremental Form Data Saving
 * Provides real-time field-by-field persistence for inspection forms
 */

class IndexedDBService {
  constructor() {
    this.dbName = 'InspectionFormDB';
    this.version = 1;
    this.storeName = 'formData';
    this.db = null;
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
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'eventId' });
          
          // Create indexes for efficient querying
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          store.createIndex('isDraft', 'metadata.isDraft', { unique: false });
          store.createIndex('facilityId', 'formData.orgUnit', { unique: false });
          
          console.log('📦 Created IndexedDB object store:', this.storeName);
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

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // First, get existing data
      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const existingData = getRequest.result || {
          eventId: eventId,
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

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const data = {
        eventId: eventId,
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
   * Get all draft forms
   */
  async getAllDrafts() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('isDraft');
      const request = index.getAll(true);

      request.onsuccess = () => {
        console.log(`📋 Retrieved ${request.result.length} draft forms from IndexedDB`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to get draft forms from IndexedDB:', request.error);
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
