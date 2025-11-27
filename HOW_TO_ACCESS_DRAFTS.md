# How to Access Draft Inspections

## 📋 Overview

Your PWA Inspections application stores draft inspections in **two different databases**, and they can be accessed in different ways depending on their status.

---

## 🗄️ Understanding the Two Storage Systems

### 1. **DHIS2PWA Database** (Main Storage)
- **Location:** IndexedDB → `DHIS2PWA` → `events` store
- **What it stores:** Inspections that have been submitted or saved
- **Statuses:** `pending`, `synced`, `error`
- **Access:** Via the **Home Page** (Dashboard)

### 2. **InspectionFormDB Database** (Draft Storage)
- **Location:** IndexedDB → `InspectionFormDB` → `formData` store
- **What it stores:** Incremental auto-saves while filling out forms
- **Status:** Draft (not yet submitted)
- **Access:** Via the **Form Page** when editing an existing event

---

## ✅ How to Access Saved Inspections (Including Drafts)

### **Method 1: From the Home Page (Dashboard)**

This is the main way to access ALL your inspections:

1. **Navigate to Home Page:**
   - After logging in, you'll see the dashboard
   - Or click the app logo/home button

2. **View Your Inspections:**
   - Scroll down to the "Recent Inspections" section
   - You'll see a list of all inspections sorted by most recent

3. **Inspection Status Indicators:**
   - ✓ **Synced** - Successfully uploaded to DHIS2 server
   - ⏱ **Pending** - Saved locally, waiting to sync
   - ✗ **Error** - Failed to sync (can retry)
   - 📄 **Draft** - Saved but not submitted (if implemented)

4. **Click to Edit:**
   - Click on any inspection card to open and continue editing
   - The form will load with all previously saved data

### **Current Status Display:**
```
┌─────────────────────────────────────────┐
│ Inspection - 11/27/2025                │
│ ✓ Synced                                │
│                                         │
│ Building: Gaborone Primary Hospital     │
│ Created: 11/27/2025, 10:30 AM          │
│ Updated: 11/27/2025, 11:45 AM          │
│ Data: 45 field(s) completed            │
│                                         │
│ [📋 Preview] [Delete]                   │
└─────────────────────────────────────────┘
```

---

## 🔍 Filtering and Finding Inspections

### **Search Functionality:**
- Use the search box at the top of "Recent Inspections"
- Search by:
  - Date (e.g., "11/27")
  - Facility name (e.g., "Gaborone")
  - Status (e.g., "pending", "synced")

### **Filter by Facility:**
- Use the dropdown: "Filter by facility: All Facilities"
- Select a specific facility to see only its inspections
- Click the × button to clear the filter

### **URL Parameters:**
- You can bookmark: `/home?facility=FACILITY_ID`
- This will automatically filter to that facility

---

## 📊 Understanding Inspection States

### **1. Active Draft (Being Edited)**
- **Storage:** `InspectionFormDB`
- **Auto-saved:** Every time you fill a field
- **Access:** Continue editing from where you left off
- **Status:** Not visible in main list until submitted

### **2. Submitted Draft (Pending Sync)**
- **Storage:** `DHIS2PWA` database
- **Status:** `pending` or `error`
- **Visible:** Yes, in Recent Inspections list
- **Can Edit:** Yes, click to reopen

### **3. Synced Inspection**
- **Storage:** `DHIS2PWA` database + DHIS2 server
- **Status:** `synced`
- **Visible:** Yes, in Recent Inspections list
- **Can Edit:** Yes, but changes create a new version

---

## 🛠️ Accessing Draft Data Directly (Developer Tools)

If you need to see raw draft data in the browser:

### **Option 1: Browser DevTools**

1. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or right-click → "Inspect"

2. **Navigate to Application Tab:**
   - Click "Application" tab (Chrome/Edge)
   - Or "Storage" tab (Firefox)

3. **View IndexedDB:**
   ```
   Application
   └── Storage
       └── IndexedDB
           ├── DHIS2PWA
           │   └── events (submitted inspections)
           └── InspectionFormDB
               └── formData (active drafts)
   ```

4. **Inspect Data:**
   - Click on `events` or `formData`
   - You'll see all stored records
   - Click on a record to view its contents

### **Option 2: Console Commands**

Open browser console (`F12` → Console tab) and run:

```javascript
// Get all submitted inspections from DHIS2PWA
const getAllInspections = async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('DHIS2PWA', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['events'], 'readonly');
  const store = transaction.objectStore('events');
  const allEvents = await new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
  
  console.table(allEvents);
  return allEvents;
};

getAllInspections();
```

```javascript
// Get all draft forms from InspectionFormDB
const getAllDrafts = async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('InspectionFormDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['formData'], 'readonly');
  const store = transaction.objectStore('formData');
  const allDrafts = await new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
  
  console.table(allDrafts);
  return allDrafts;
};

getAllDrafts();
```

---

## 🎯 Common Scenarios

### **Scenario 1: "I was filling a form and closed the browser"**
✅ **Solution:**
1. Go to Home Page
2. Look for the inspection in "Recent Inspections"
3. If you submitted it (clicked Save/Submit), it will be there
4. If you didn't submit, the data is in `InspectionFormDB` but not visible in the list
5. To recover: Create a new inspection for the same facility - it may auto-restore

### **Scenario 2: "I saved a draft but can't see it"**
✅ **Solution:**
1. Check if you clicked "Save as Draft" or just filled fields
2. Only submitted drafts appear in the list
3. Auto-saved data (incremental saves) stays in `InspectionFormDB`
4. Go to Form Page and it should auto-load recent draft

### **Scenario 3: "I want to see only pending inspections"**
✅ **Solution:**
1. Use the search box
2. Type "pending"
3. Only pending inspections will show

### **Scenario 4: "I want to continue an inspection from yesterday"**
✅ **Solution:**
1. Go to Home Page
2. Scroll through "Recent Inspections"
3. Find the inspection by date or facility name
4. Click on it to continue editing

---

## 📱 Mobile Access

The same methods work on mobile:

1. **Open the PWA** on your mobile device
2. **Navigate to Home** (tap logo or home icon)
3. **Scroll to Recent Inspections**
4. **Tap an inspection** to open and edit
5. **Use search** to find specific inspections

---

## 🔄 Sync Status Explained

### **Pending (⏱)**
- Saved locally on your device
- Waiting for internet connection
- Will auto-sync when online
- **Safe to edit**

### **Synced (✓)**
- Successfully uploaded to DHIS2 server
- Backed up in the cloud
- **Safe to edit** (creates new version)

### **Error (✗)**
- Failed to sync to server
- Still saved locally
- Click "Retry" button to try again
- **Safe to edit**

---

## 💡 Pro Tips

### **Tip 1: Use Facility Filter**
If you're inspecting multiple facilities, use the facility filter dropdown to focus on one at a time.

### **Tip 2: Preview Before Editing**
Click the "📋 Preview" button to see all filled data organized by sections before opening the full form.

### **Tip 3: Check Stats Dashboard**
The stats cards at the top show:
- Total inspections
- Pending sync count
- Synced count
- Error count

### **Tip 4: Bookmark Facility Views**
Save URLs like `/home?facility=ABC123` to quickly access specific facility inspections.

### **Tip 5: Regular Syncing**
Click "Sync Now" regularly when online to ensure all data is backed up to the server.

---

## 🚨 Troubleshooting

### **Problem: "I don't see my draft"**
**Possible causes:**
1. Draft was never submitted (only auto-saved)
2. Looking at wrong facility filter
3. Search term is filtering it out
4. Draft was deleted

**Solutions:**
1. Clear search box
2. Set facility filter to "All Facilities"
3. Check browser DevTools → IndexedDB
4. Create new inspection - may auto-restore

### **Problem: "Inspection shows as Error"**
**Possible causes:**
1. No internet connection when submitting
2. DHIS2 server validation error
3. Authentication expired

**Solutions:**
1. Check internet connection
2. Click "Retry" button
3. If still failing, check error message in console
4. Re-login if needed

### **Problem: "Can't edit a synced inspection"**
**This is normal behavior:**
- Synced inspections are on the server
- Editing creates a new version
- Original is preserved

---

## 📋 Quick Reference

| What You Want | Where to Go | What to Do |
|---------------|-------------|------------|
| See all inspections | Home Page | Scroll to "Recent Inspections" |
| Continue a draft | Home Page | Click on the inspection card |
| Find specific inspection | Home Page | Use search box or facility filter |
| See only pending | Home Page | Search "pending" |
| Preview data | Home Page | Click "📋 Preview" button |
| Delete inspection | Home Page | Click "Delete" button |
| Sync pending | Home Page | Click "↻ Sync Now" |
| Create new | Home Page | Click "New Inspection" |

---

## 🔗 Related Features

- **Auto-save:** Forms auto-save every field change
- **Offline mode:** All features work offline
- **Sync:** Auto-syncs when connection restored
- **Preview:** View data organized by sections
- **Search:** Find inspections quickly
- **Filter:** Focus on specific facilities

---

## 📞 Need Help?

If you still can't find your draft inspections:

1. **Check both databases** using DevTools
2. **Look at console logs** for errors
3. **Try creating a new inspection** for the same facility
4. **Check if you're logged in** as the correct user
5. **Verify facility assignments** are correct

---

**Summary:** All saved inspections (including drafts that were submitted) are accessible from the **Home Page** in the "Recent Inspections" section. Click on any inspection to continue editing it!
