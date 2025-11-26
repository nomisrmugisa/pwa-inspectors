# 🔍 How to Retrieve Your Records After Refresh

This guide explains **all the ways** you can retrieve your saved inspection records after refreshing the page.

---

## ✅ **Method 1: Automatic Restoration (If URL Has EventId)**

### **When This Works:**
- You started a form and it has an `eventId` in the URL
- Example: URL is `/form/ABC123XYZ45`
- Data was saved incrementally while typing

### **What Happens:**
1. **Refresh the page** (F5 or browser refresh)
2. The URL stays the same: `/form/ABC123XYZ45`
3. The app **automatically loads** your saved data
4. You'll see a toast: **"Loaded saved form data"**
5. All your fields are restored instantly ✅

### **If This Doesn't Work:**
- Check if the URL still has the eventId
- Check browser console for errors
- See Method 4 below for manual retrieval

---

## 📋 **Method 2: Dashboard (Home Page) - View All Records**

### **How to Access:**
1. Navigate to **`/home`** or click "Home" in the navigation
2. You'll see a list of **all your saved inspections**

### **What You'll See:**
- ✅ All submitted events (final saves)
- ✅ Draft inspections (if saved as draft)
- ✅ Pending synced inspections
- ✅ Error status inspections

### **Features:**
- **Search** by date, facility name, or status
- **Filter** by facility
- **Click any record** to open and edit it
- **Preview** inspection data
- **Retry** failed syncs
- **Delete** records

### **Navigation:**
```
Navigate to: /home

You'll see:
┌─────────────────────────────────────┐
│  Recent Inspections                 │
├─────────────────────────────────────┤
│  [Search Box]                       │
│  [Filter by Facility ▼]             │
├─────────────────────────────────────┤
│  📄 Inspection - 2025-01-15        │
│     Building: SK-Home              │
│     Status: Draft                  │
│     [📋 Preview] [Delete]          │
│                                     │
│  ⏱ Inspection - 2025-01-14        │
│     Building: Facility 2           │
│     Status: Pending Sync           │
│     [📋 Preview] [Delete]          │
└─────────────────────────────────────┘
```

### **To Edit a Record:**
- **Click on any inspection** in the list
- It will navigate to `/form/{eventId}`
- Your data automatically loads
- You can continue editing

---

## 🔗 **Method 3: Direct URL Navigation**

### **If You Know the EventId:**
1. Navigate directly to: **`/form/{your-eventId}`**
2. Example: `/form/ABC123XYZ45`
3. The form will automatically load your saved data

### **Where to Find EventId:**
- **In the URL** when you're on the form page
- **From the dashboard** - click on a record to see its eventId in URL
- **Browser DevTools** - See Method 4 below

---

## 🛠️ **Method 4: Browser DevTools (Manual Retrieval)**

### **For Developers/Troubleshooting:**

#### **Step 1: Open DevTools**
- Press **F12** (or Right-click → Inspect)
- Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

#### **Step 2: Check Incremental Saves**
```
1. Expand "IndexedDB" in left sidebar
2. Click on "InspectionFormDB"
3. Click on "formData" store
4. You'll see all your saved form data records
5. Each record is keyed by eventId
6. Click on a record to view its data
```

#### **Step 3: Check Final Events**
```
1. Expand "IndexedDB" in left sidebar
2. Click on "DHIS2PWA"
3. Click on "events" store
4. You'll see all your submitted events
5. Each event has its eventId as the key
6. Click on an event to view complete data
```

#### **Step 4: Copy EventId**
- Copy the `eventId` from the record
- Navigate to `/form/{eventId}` to open that form

### **Console Commands (Advanced):**

Open the browser console (F12 → Console tab) and run:

```javascript
// Get all draft form data
async function getAllDrafts() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('InspectionFormDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['formData'], 'readonly');
  const store = transaction.objectStore('formData');
  const request = store.getAll();
  
  request.onsuccess = () => {
    console.log('All saved drafts:', request.result);
    request.result.forEach(draft => {
      console.log(`EventId: ${draft.eventId}`);
      console.log(`Fields: ${Object.keys(draft.formData).length}`);
      console.log(`Last Updated: ${draft.lastUpdated}`);
    });
  };
}

// Call it
getAllDrafts();
```

```javascript
// Get all submitted events
async function getAllEvents() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('DHIS2PWA', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['events'], 'readonly');
  const store = transaction.objectStore('events');
  const request = store.getAll();
  
  request.onsuccess = () => {
    console.log('All events:', request.result);
    request.result.forEach(event => {
      console.log(`EventId: ${event.event}`);
      console.log(`Status: ${event.status || event.syncStatus}`);
      console.log(`Date: ${event.eventDate}`);
    });
  };
}

// Call it
getAllEvents();
```

---

## 🎯 **Quick Decision Tree**

```
Did you refresh the page?
│
├─ YES, and URL is /form/ABC123
│  └─ ✅ Data should auto-load (Method 1)
│
├─ YES, but URL is just /form (no eventId)
│  └─ → Go to /home dashboard (Method 2)
│
└─ NO, I want to find my saved records
   └─ → Go to /home dashboard (Method 2)
   
   
Can't find your record?
│
├─ Check /home dashboard first
│  └─ All submitted events are listed here
│
├─ Check DevTools → IndexedDB
│  └─ See Method 4 for manual inspection
│
└─ If still not found
   └─ Data might have been cleared
      → Check browser storage settings
```

---

## 📊 **Data Storage Locations**

### **Incremental Saves (While Typing)**
- **Database:** `InspectionFormDB`
- **Store:** `formData`
- **Key:** `eventId`
- **When:** Every field change (debounced)
- **Retrieve:** Auto-loads when opening `/form/{eventId}`

### **Final Events (After Submit)**
- **Database:** `DHIS2PWA`
- **Store:** `events`
- **Key:** `event` (eventId)
- **When:** On form submission
- **Retrieve:** Listed on `/home` dashboard

---

## ⚠️ **Common Issues & Solutions**

### **Issue: Data not loading after refresh**

**Symptoms:**
- Form appears empty
- No "Loaded saved form data" toast
- Console shows errors

**Solutions:**
1. Check URL has eventId: `/form/{eventId}`
2. Open DevTools → Application → IndexedDB
3. Verify data exists in `InspectionFormDB.formData`
4. Check console for errors
5. Try navigating to `/home` and clicking on the record

### **Issue: Can't find my record in dashboard**

**Symptoms:**
- `/home` shows empty or doesn't list your record
- Record not in events list

**Possible Causes:**
1. **Only saved incrementally (not submitted)**
   - Solution: Data is in `InspectionFormDB`, not `DHIS2PWA`
   - Use DevTools to find eventId, then navigate to `/form/{eventId}`

2. **Record was deleted**
   - Solution: Check if you accidentally deleted it
   - Check DevTools for any remaining data

3. **Different browser/device**
   - Solution: IndexedDB is browser-specific
   - Records only exist in the browser where they were saved

### **Issue: Multiple drafts, can't remember which one**

**Solution:**
1. Go to `/home` dashboard
2. All submitted events are listed with dates
3. For unsaved drafts, use DevTools (Method 4)
4. Check `lastUpdated` timestamp in each record

---

## 🎨 **Visual Guide: Finding Your Records**

### **Scenario 1: You're on a form and refresh**
```
Before Refresh: /form/ABC123XYZ45
After Refresh:  /form/ABC123XYZ45  ← Same URL
Result: ✅ Data auto-loads
```

### **Scenario 2: You closed the tab and want to continue**
```
1. Go to: /home
2. Find your inspection in the list
3. Click on it
4. Opens: /form/ABC123XYZ45
5. ✅ Data loads automatically
```

### **Scenario 3: You forgot which form you were working on**
```
1. Go to: /home
2. Look at "Recent Inspections"
3. Records sorted by most recent first
4. Check "Updated" timestamp
5. Click on the most recent one
```

---

## 💡 **Pro Tips**

### **Tip 1: Bookmark Important Forms**
- While on a form, bookmark the page
- The URL contains the eventId
- Easy to return later

### **Tip 2: Use Dashboard Regularly**
- `/home` shows all your work
- Easy to see what's pending, synced, or has errors
- One-click access to any record

### **Tip 3: Check Last Updated**
- Dashboard shows creation and update times
- Helps identify which record you were last working on

### **Tip 4: Keep EventId in Notes**
- If working on critical forms, note down the eventId
- Can navigate directly: `/form/{eventId}`

---

## 🔄 **Complete Retrieval Workflow**

```
Step 1: Navigate to /home
   ↓
Step 2: Check "Recent Inspections" list
   ↓
Step 3: Find your record (search/filter if needed)
   ↓
Step 4: Click on the record
   ↓
Step 5: Form opens at /form/{eventId}
   ↓
Step 6: Data automatically loads ✅
   ↓
Step 7: Continue working on your inspection
```

---

## 📝 **Summary**

**Easiest Way:** Go to `/home` dashboard and click on your inspection

**If URL has eventId:** Just refresh - data loads automatically

**If lost:** Use DevTools to find eventId, then navigate to `/form/{eventId}`

**All records persist** in IndexedDB until you explicitly delete them!

