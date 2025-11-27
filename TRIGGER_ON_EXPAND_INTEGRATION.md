# Manual Integration: Trigger Restore on Progress Bar Expand

## Overview
This change modifies the Floating Progress Bar so that when you click to expand it, it checks if there are saved departments that need to be restored. If so, it restores them automatically.

## Steps

1.  Open `src/pages/FormPage.jsx`.
2.  Search for the `FloatingProgress` component definition (around line ~5880).
3.  Inside `FloatingProgress`, look for the `onClick` handler on the header `div`. It currently looks like this:

```javascript
onClick={() => setIsProgressCollapsed(prev => !prev)}
```

4.  **Replace** that entire `onClick` line with the following code:

```javascript
            onClick={() => {
              // Auto-restore departments if expanding and they are missing
              if (isProgressCollapsed && formData?.['dataElement_jpcDY2i8ZDE'] && selectedServiceDepartments.length === 0) {
                try {
                  const saved = formData['dataElement_jpcDY2i8ZDE'];
                  const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    if (window.updateSelectedServiceDepartments) {
                      window.updateSelectedServiceDepartments(parsed);
                      showToast('Progress restored', 'success');
                    }
                  }
                } catch (e) {
                  console.error('Failed to restore departments on expand', e);
                }
              }
              setIsProgressCollapsed(prev => !prev);
            }}
```

## Result
Now, when a user loads an existing inspection:
1. The progress bar will appear (likely collapsed or small).
2. When they click the progress bar to expand it, the app will automatically restore their saved departments and update the progress bar instantly.
