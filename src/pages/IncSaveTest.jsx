import React, { useEffect, useMemo, useState } from 'react';
import { useIncrementalSave } from '../hooks/useIncrementalSave';
import indexedDBService from '../services/indexedDBService';

export function IncSaveTest() {
  const [fieldValue, setFieldValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(null);
  const [status, setStatus] = useState('Idle');

  // Persist a stable eventId for repeated testing
  const eventId = useMemo(() => {
    const key = 'incSaveTestEventId';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const generated = `inc-test-${Date.now().toString(36)}`;
    localStorage.setItem(key, generated);
    return generated;
  }, []);

  const { saveField, saveFieldImmediate, loadFormData, flushPendingSaves } = useIncrementalSave(eventId, {
    debounceMs: 300,
    onSaveSuccess: (res) => setStatus(`Saved ${res.savedFields} field(s) at ${new Date().toLocaleTimeString()}`),
    onSaveError: (err) => setStatus(`Error: ${err?.message || 'unknown'}`),
    enableLogging: true
  });

  // Load existing data on mount
  useEffect(() => {
    const run = async () => {
      const data = await loadFormData();
      setLoaded(data);
      setFieldValue(data?.formData?.testField || '');
      setNotes(data?.formData?.notes || '');
    };
    run();
  }, [loadFormData]);

  const handleFieldChange = (e) => {
    const value = e.target.value;
    setFieldValue(value);
    saveField('testField', value);
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    saveField('notes', value);
  };

  const handleImmediateSave = async () => {
    await saveFieldImmediate('immediateKey', `now-${Date.now()}`, { note: 'manual immediate save' });
    const data = await loadFormData();
    setLoaded(data);
  };

  const handleFlush = async () => {
    await flushPendingSaves();
    const data = await loadFormData();
    setLoaded(data);
  };

  const handleReload = async () => {
    const data = await loadFormData();
    setLoaded(data);
    setStatus('Reloaded from IndexedDB');
  };

  const handleClear = async () => {
    await indexedDBService.deleteFormData(eventId);
    const data = await loadFormData();
    setLoaded(data);
    setFieldValue('');
    setNotes('');
    setStatus('Cleared');
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Incremental Save Test</h2>
      <div style={{ marginBottom: 12, color: '#555' }}>Event ID: <code>{eventId}</code></div>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Test Field (debounced incremental):</span>
          <input
            type="text"
            value={fieldValue}
            onChange={handleFieldChange}
            placeholder="Type to save incrementally"
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes (debounced incremental):</span>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            placeholder="Write some notes..."
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleImmediateSave} style={{ padding: '8px 12px' }}>Immediate Save</button>
          <button onClick={handleFlush} style={{ padding: '8px 12px' }}>Flush Pending</button>
          <button onClick={handleReload} style={{ padding: '8px 12px' }}>Reload from DB</button>
          <button onClick={handleClear} style={{ padding: '8px 12px', color: '#fff', background: '#b91c1c', border: 'none' }}>Clear Event</button>
        </div>

        <div style={{ marginTop: 8, color: '#0369a1' }}>Status: {status}</div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Loaded Record</div>
          <pre style={{ background: '#f7f7f8', padding: 12, border: '1px solid #eee', borderRadius: 4, overflowX: 'auto' }}>
{JSON.stringify(loaded, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default IncSaveTest;



