import { useRef, useCallback, useEffect, useState } from 'react';

// IndexedDB storage service
class StorageService {
  constructor() {
    this.dbName = 'DHIS2PWA';
    this.version = 2; // Increased version for new configuration schema
    this.db = null;
    this.isReady = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked. Please close other tabs of this app.');
        // We don't reject here because it might unblock later, 
        // but we log it to help debugging.
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${this.version}`);

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'event' });
          eventStore.createIndex('status', 'status', { unique: false });
          eventStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          eventStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        // New configuration store for complete metadata
        if (!db.objectStoreNames.contains('configuration')) {
          db.createObjectStore('configuration', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  async ensureReady() {
    if (!this.isReady) {
      await this.init();
    }
  }

  // Authentication methods
  async setAuth(authData) {
    await this.ensureReady();
    const transaction = this.db.transaction(['auth'], 'readwrite');
    const store = transaction.objectStore('auth');

    await new Promise((resolve, reject) => {
      const request = store.put({ id: 'current', ...authData });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAuth() {
    await this.ensureReady();
    const transaction = this.db.transaction(['auth'], 'readonly');
    const store = transaction.objectStore('auth');

    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, ...authData } = result;
          resolve(authData);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAuth() {
    await this.ensureReady();
    const transaction = this.db.transaction(['auth'], 'readwrite');
    const store = transaction.objectStore('auth');

    await new Promise((resolve, reject) => {
      const request = store.delete('current');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Configuration methods (new - for complete program stage metadata)
  async setConfiguration(configuration) {
    await this.ensureReady();
    const transaction = this.db.transaction(['configuration'], 'readwrite');
    const store = transaction.objectStore('configuration');

    const configRecord = {
      id: 'current',
      ...configuration,
      updatedAt: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(configRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConfiguration() {
    await this.ensureReady();
    const transaction = this.db.transaction(['configuration'], 'readonly');
    const store = transaction.objectStore('configuration');

    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, updatedAt, ...configuration } = result;
          resolve(configuration);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearConfiguration() {
    await this.ensureReady();
    const transaction = this.db.transaction(['configuration'], 'readwrite');
    const store = transaction.objectStore('configuration');

    await new Promise((resolve, reject) => {
      const request = store.delete('current');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Event methods
  async saveEvent(eventData) {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    const eventRecord = {
      ...eventData,
      updatedAt: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(eventRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateEvent(eventId, updates) {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(eventId);
      getRequest.onsuccess = () => {
        const existingEvent = getRequest.result;
        if (existingEvent) {
          const updatedEvent = {
            ...existingEvent,
            ...updates,
            updatedAt: new Date().toISOString()
          };

          const putRequest = store.put(updatedEvent);
          putRequest.onsuccess = () => resolve(updatedEvent);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Event not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getEvent(eventId) {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const request = store.get(eventId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(eventId) {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    await new Promise((resolve, reject) => {
      const request = store.delete(eventId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEvents() {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getEvents(filter = {}) {
    await this.ensureReady();
    const transaction = this.db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');

    return new Promise((resolve, reject) => {
      const events = [];
      let request;

      if (filter.status) {
        const index = store.index('status');
        request = index.openCursor(IDBKeyRange.only(filter.status));
      } else if (filter.syncStatus) {
        const index = store.index('syncStatus');
        request = index.openCursor(IDBKeyRange.only(filter.syncStatus));
      } else {
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const eventData = cursor.value;

          // Apply additional filters
          let includeEvent = true;

          if (filter.program && eventData.program !== filter.program) {
            includeEvent = false;
          }

          if (filter.orgUnit && eventData.orgUnit !== filter.orgUnit) {
            includeEvent = false;
          }

          if (filter.startDate && eventData.eventDate < filter.startDate) {
            includeEvent = false;
          }

          if (filter.endDate && eventData.eventDate > filter.endDate) {
            includeEvent = false;
          }

          if (includeEvent) {
            events.push(eventData);
          }

          cursor.continue();
        } else {
          // Sort by created date (newest first)
          events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          resolve(events);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Legacy metadata methods (kept for backward compatibility)
  async storeMetadata(key, data) {
    await this.ensureReady();
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    await new Promise((resolve, reject) => {
      const request = store.put({
        key,
        data,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key) {
    await this.ensureReady();
    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearMetadata(key = null) {
    await this.ensureReady();
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    if (key) {
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Statistics methods
  async setStats(stats) {
    await this.ensureReady();
    const transaction = this.db.transaction(['stats'], 'readwrite');
    const store = transaction.objectStore('stats');

    await new Promise((resolve, reject) => {
      const request = store.put({
        id: 'current',
        ...stats,
        updatedAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStats() {
    await this.ensureReady();
    const transaction = this.db.transaction(['stats'], 'readonly');
    const store = transaction.objectStore('stats');

    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, updatedAt, ...stats } = result;
          resolve(stats);
        } else {
          resolve({
            totalEvents: 0,
            pendingEvents: 0,
            syncedEvents: 0,
            errorEvents: 0
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedEvents() {
    await this.ensureReady();
    const allEvents = await this.getAllEvents();
    const syncedEvents = allEvents.filter(e => e.syncStatus === 'synced');
    for (const event of syncedEvents) {
      await this.deleteEvent(event.event); // or event.id if your key is 'id'
    }
  }

  async clearAllEvents() {
    await this.ensureReady();
    const stores = ['events', 'stats'];
    const transaction = this.db.transaction(stores, 'readwrite');

    await Promise.all(stores.map(storeName => {
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));

    // Re-initialize stats
    await this.setStats({
      totalEvents: 0,
      pendingEvents: 0,
      syncedEvents: 0,
      errorEvents: 0
    });
  }

  // Utility methods
  async clearAll() {
    await this.ensureReady();
    const storeNames = ['auth', 'events', 'metadata', 'configuration', 'stats'];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    const promises = storeNames.map(storeName => {
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async exportData() {
    await this.ensureReady();

    const [auth, events, metadata, configuration, stats] = await Promise.all([
      this.getAuth(),
      this.getAllEvents(),
      this.getAllMetadata(),
      this.getConfiguration(),
      this.getStats()
    ]);

    return {
      auth,
      events,
      metadata,
      configuration,
      stats,
      exportedAt: new Date().toISOString()
    };
  }

  async getAllMetadata() {
    await this.ensureReady();
    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        const metadata = {};
        results.forEach(item => {
          metadata[item.key] = item.data;
        });
        resolve(metadata);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Legacy methods for backward compatibility
  async storeAuth(authData) {
    return this.setAuth(authData);
  }

  async storeEvent(eventData) {
    return this.saveEvent(eventData);
  }

  async getEventsByStatus(status) {
    return this.getEvents({ status });
  }

  async updateEventSyncStatus(eventId, status, serverId = null) {
    const updates = { syncStatus: status };
    if (serverId) {
      updates.serverId = serverId;
    }
    if (status === 'synced') {
      updates.syncedAt = new Date().toISOString();
    }
    return this.updateEvent(eventId, updates);
  }
}

// Hook for using the storage service
export function useStorage() {
  const storageRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        if (!storageRef.current) {
          storageRef.current = new StorageService();
        }

        await storageRef.current.init();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setIsReady(false);
      }
    };

    initStorage();
  }, []);

  // Create a proxy object that safely handles method calls
  const storageProxy = {
    isReady,
    // Auth methods
    setAuth: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.setAuth(...args);
    },
    getAuth: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getAuth(...args);
    },
    clearAuth: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearAuth(...args);
    },
    // Configuration methods
    setConfiguration: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.setConfiguration(...args);
    },
    getConfiguration: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getConfiguration(...args);
    },
    clearConfiguration: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearConfiguration(...args);
    },
    // Event methods
    saveEvent: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.saveEvent(...args);
    },
    updateEvent: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.updateEvent(...args);
    },
    getEvent: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getEvent(...args);
    },
    clearSyncedEvents: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearSyncedEvents(...args);
    },
    deleteEvent: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.deleteEvent(...args);
    },
    clearAllEvents: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearAllEvents(...args);
    },
    getAllEvents: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getAllEvents(...args);
    },
    getEvents: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getEvents(...args);
    },
    // Stats methods
    setStats: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.setStats(...args);
    },
    getStats: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getStats(...args);
    },
    // Legacy methods
    storeAuth: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.storeAuth(...args);
    },
    storeEvent: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.storeEvent(...args);
    },
    getEventsByStatus: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getEventsByStatus(...args);
    },
    updateEventSyncStatus: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.updateEventSyncStatus(...args);
    },
    // Metadata methods
    storeMetadata: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.storeMetadata(...args);
    },
    getMetadata: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.getMetadata(...args);
    },
    clearMetadata: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearMetadata(...args);
    },
    // Utility methods
    clearAll: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.clearAll(...args);
    },
    exportData: async (...args) => {
      if (!isReady || !storageRef.current) throw new Error('Storage not ready');
      return storageRef.current.exportData(...args);
    }
  };

  return storageProxy;
} 