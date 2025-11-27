# Manual Integration Guide: Restore Progress Bar Feature

## Overview
This adds a banner that appears when loading existing events with saved departments.
When clicked, it restores the departments and updates the progress bar.

## Step 1: Add State Variable
In `FormPage.jsx`, find line ~2590 where other state variables are declared.
Add this line:

```javascript
const [showRestoreProgressButton, setShowRestoreProgressButton] = useState(false);
```

## Step 2: Add Detection Logic
Add this useEffect after the other useEffects (around line ~2900):

```javascript
// Detect if we should show restore progress button
useEffect(() => {
  const checkForSavedDepartments = async () => {
    if (eventId && formData) {
      const savedDepartments = formData['dataElement_jpcDY2i8ZDE'];
      
      if (savedDepartments && selectedServiceDepartments.length === 0) {
        // We have saved departments but they're not loaded
        setShowRestoreProgressButton(true);
      } else {
        setShowRestoreProgressButton(false);
      }
    }
  };
  
  checkForSavedDepartments();
}, [eventId, formData, selectedServiceDepartments]);
```

## Step 3: Add Restore Handler Function
Add this function near other handlers (around line ~2650):

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
        
        setShowRestoreProgressButton(false);
        showToast('Progress bar restored!', 'success');
      }
    } catch (e) {
      console.error('Failed to restore departments:', e);
      showToast('Failed to restore progress bar', 'error');
    }
  }
};
```

## Step 4: Add Banner to JSX
In the main return statement of FormPage (around line ~6800), add this right after the Header:

```javascript
{showRestoreProgressButton && (
  <div
    style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      backgroundColor: '#2196f3',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '24px' }}>📊</span>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          Progress Bar Available
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          Click to restore your progress tracking
        </div>
      </div>
    </div>
    
    <button
      onClick={handleRestoreProgress}
      style={{
        backgroundColor: 'white',
        color: '#2196f3',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      Restore Now
    </button>
  </div>
)}
```

## Testing
1. Create a new inspection and select some departments
2. Save as draft
3. Reload the page or navigate away and back
4. You should see the blue banner at the top
5. Click "Restore Now"
6. Progress bar should populate with all sections!

That's it! The feature is now integrated.
