## Fix: Allow Creating Multiple New Inspections

### Problem
Users are stuck with only 1 event - clicking "New Inspection" keeps restoring the same draft instead of creating a fresh form.

### Solution
Edit `src/pages/FormPage.jsx` around **line 2503-2530**

**FIND THIS CODE** (lines 2503-2530):
```javascript
    useEffect(() => {
      const initializeEventId = async () => {
        if (!eventId) {
          try {
            // Check for most recent draft form data
            const mostRecent = await indexedDBService.getMostRecentFormData();
            
            if (mostRecent && mostRecent.eventId) {
              console.log('📋 Found most recent draft, restoring eventId:', mostRecent.eventId);
              // Navigate to existing draft instead of creating new one
              navigate(`/form/${mostRecent.eventId}`, { replace: true });
            } else {
              // No existing draft found, generate new eventId
              const generatedId = generateDHIS2Id();
              console.log('🆕 No existing draft found, generating new eventId:', generatedId);
              navigate(`/form/${generatedId}`, { replace: true });
            }
          } catch (error) {
            console.error('❌ Error checking for existing drafts:', error);
            // On error, generate new eventId as fallback
            const generatedId = generateDHIS2Id();
            navigate(`/form/${generatedId}`, { replace: true });
          }
        }
      };

      initializeEventId();
    }, [eventId, navigate]);
```

**REPLACE WITH THIS**:
```javascript
    useEffect(() => {
      const initializeEventId = async () => {
        if (!eventId) {
          // Always generate a new eventId for new forms
          // Users can continue old drafts by selecting them from the dashboard
          const generatedId = generateDHIS2Id();
          console.log('🆕 Generating new eventId for new form:', generatedId);
          navigate(`/form/${generatedId}`, { replace: true });
        }
      };

      initializeEventId();
    }, [eventId, navigate]);
```

### What This Does
- **Before**: Clicking "New Inspection" would restore the most recent draft
- **After**: Clicking "New Inspection" ALWAYS creates a fresh new form with a brand new ID
- Users can still access old drafts from the dashboard by clicking on them

### Test
1. Click "New Inspection" - should get a fresh empty form
2. Fill in some data, click "New Inspection" again - should get ANOTHER fresh empty form
3. Go to dashboard - should see both draft inspections listed
4. Click on an old inspection from the dashboard - should open that specific draft
