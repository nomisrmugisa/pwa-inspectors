# Manual Integration Guide: Restore Progress Popup

## Overview
This adds a modal popup that appears when loading existing events with saved departments.
It asks the user if they want to restore the progress bar.

## Step 1: Add State Variable
In `FormPage.jsx`, find line ~2590 where other state variables are declared.
Add this line:

```javascript
const [showRestoreDialog, setShowRestoreDialog] = useState(false);
```

## Step 2: Add Detection Logic
Add this useEffect after the other useEffects (around line ~2900):

```javascript
// Detect if we should show restore progress dialog
useEffect(() => {
  const checkForSavedDepartments = async () => {
    if (eventId && formData) {
      const savedDepartments = formData['dataElement_jpcDY2i8ZDE'];
      
      // Only show if we have saved departments but they are not currently loaded in the state
      if (savedDepartments && selectedServiceDepartments.length === 0) {
        setShowRestoreDialog(true);
      } else {
        setShowRestoreDialog(false);
      }
    }
  };
  
  checkForSavedDepartments();
}, [eventId, formData, selectedServiceDepartments]);
```

## Step 3: Add Handler Functions
Add these functions near other handlers (around line ~2650):

```javascript
const handleRestoreProgress = () => {
  const savedDepartments = formData?.['dataElement_jpcDY2i8ZDE'];
  
  if (savedDepartments) {
    try {
      const parsed = typeof savedDepartments === 'string' 
        ? JSON.parse(savedDepartments) 
        : savedDepartments;
        
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('📊 Restoring departments:', parsed);
        
        if (window.updateSelectedServiceDepartments) {
          window.updateSelectedServiceDepartments(parsed);
        }
        
        setShowRestoreDialog(false);
        showToast('Progress bar restored!', 'success');
      }
    } catch (e) {
      console.error('Failed to restore departments:', e);
      showToast('Failed to restore progress bar', 'error');
    }
  }
};

const handleDismissRestore = () => {
  setShowRestoreDialog(false);
};
```

## Step 4: Add Popup Dialog to JSX
In the main return statement of FormPage, add this code right before the final closing `</div>` (around line ~7240):

```javascript
{/* Restore Progress Popup Dialog */}
{showRestoreDialog && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>Restore Progress?</h3>
        <p style={{ color: '#666', margin: 0 }}>
          We found saved department data for this inspection. Would you like to restore the progress bar tracking?
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={handleDismissRestore}
          style={{
            padding: '10px 20px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          No, Thanks
        </button>
        <button
          onClick={handleRestoreProgress}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#1976d2',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Yes, Restore Progress
        </button>
      </div>
    </div>
  </div>
)}
```

## Testing
1. Load an existing inspection that has departments saved.
2. You should see the popup center screen.
3. Click "Yes, Restore Progress".
4. The progress bar should appear and populate!
