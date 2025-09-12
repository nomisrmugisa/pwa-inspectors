# DHIS2 PWA Inspections App - Knowledge Base

## Overview
This is a Progressive Web App (PWA) built with React for DHIS2 facility inspections with offline support. The app enables mobile data capture for healthcare facility inspections in Botswana's QIMS (Quality Improvement Management System) program.

## Core Architecture

### Technology Stack
- **Frontend**: React 18 with Hooks
- **Build Tool**: Vite with PWA plugin
- **Routing**: React Router v6
- **Storage**: IndexedDB with custom hooks
- **Styling**: CSS with custom properties
- **Icons**: Material-UI icons
- **State Management**: React Context + useReducer

### Key Features
- ✅ **Offline-First Architecture** - Works without internet connection
- ✅ **Dynamic Form Rendering** - Auto-generated forms from DHIS2 metadata
- ✅ **Incremental Saving** - Field-by-field auto-save to IndexedDB
- ✅ **Service Worker** - Background sync and caching
- ✅ **Facility-Specific Filtering** - Different forms per facility type
- ✅ **User Assignment Management** - Inspector assignments from DataStore
- ✅ **Real-time Sync** - Automatic data synchronization when online

## File Structure & Components

### Main App Structure
```
src/
├── App.jsx                 # Main app router with authentication flow
├── main.jsx               # React entry point
├── contexts/
│   └── AppContext.jsx     # Global state management with useReducer
├── pages/
│   ├── LoginPage.jsx      # Authentication page
│   ├── HomePage.jsx       # Dashboard with inspection list
│   ├── FormPage.jsx       # Main inspection form (7400+ lines)
│   ├── CSVDemoPage.jsx    # CSV configuration demo
│   └── AltFormPage.jsx    # Alternative form implementation
├── components/
│   ├── DynamicFormRenderer.jsx  # CSV-based form renderer
│   ├── InspectionForm.jsx       # Modal inspection form
│   ├── InspectionPreview.jsx    # Form preview component
│   ├── Header.jsx               # App header with sync controls
│   ├── LoadingScreen.jsx        # Loading states
│   ├── Toast.jsx               # Notifications
│   └── CustomSignatureCanvas.jsx # Digital signature capture
├── hooks/
│   ├── useAPI.js          # DHIS2 API integration
│   ├── useStorage.js      # IndexedDB operations
│   ├── useIncrementalSave.js # Field-by-field saving
│   ├── useCSVConfig.js    # CSV configuration management
│   └── useIndexedDB.js    # IndexedDB service hook
├── services/
│   └── indexedDBService.js # Incremental form data persistence
├── config/
│   ├── sectionVisibilityConfig.js # Facility-specific section filtering
│   ├── facilityServiceFilters.js  # Service-based field filtering
│   └── [facility-type].js         # Individual facility configurations
├── utils/
│   └── csvConfigParser.js # CSV to DHIS2 mapping utilities
└── assets/
    └── logo.png           # Ministry of Health logo
```

## Core Components Deep Dive

### 1. AppContext.jsx - Global State Management
**Purpose**: Central state management using useReducer pattern
**Key State**:
- Authentication (user, serverUrl, isAuthenticated)
- Configuration (DHIS2 program/stage metadata)
- User Assignments (facility assignments from DataStore)
- Network Status (isOnline, syncInProgress)
- Statistics (totalEvents, pendingEvents, syncedEvents, errorEvents)

**Key Functions**:
- `login()` - Authenticate with DHIS2 server
- `fetchConfiguration()` - Load program stage metadata
- `fetchUserAssignments()` - Get inspector facility assignments
- `saveEvent()` - Save inspection data locally
- `syncEvents()` - Sync pending data to DHIS2
- `generateDHIS2Id()` - Generate 11-character DHIS2 event IDs

### 2. FormPage.jsx - Main Inspection Form (7400+ lines)
**Purpose**: Complex inspection form with dynamic field rendering
**Key Features**:
- **Service Field Detection**: Identifies facility service department fields
- **Section Navigation**: Multi-section form with progress tracking
- **Incremental Saving**: Auto-saves each field change to IndexedDB
- **Facility Filtering**: Shows/hides fields based on facility type
- **Service Filtering**: Dynamic field visibility based on selected services
- **Signature Capture**: Digital signature functionality
- **Offline Support**: Works without internet connection

**Key Functions**:
- `enhancedServiceFieldDetection()` - Identifies service-related fields
- `handleFieldChange()` - Updates form data and triggers auto-save
- `handleServiceChange()` - Updates service selection and field visibility
- `handleSubmit()` - Submits form data to DHIS2

### 3. DynamicFormRenderer.jsx - CSV-Based Form Generator
**Purpose**: Renders forms based on CSV configuration with DHIS2 Data Elements
**Key Features**:
- **CSV Parsing**: Parses facility checklist CSV configuration
- **DHIS2 Mapping**: Maps CSV questions to DHIS2 Data Elements
- **Field Pair Rendering**: Renders main + comment field pairs
- **Debug Panel**: Comprehensive debugging information
- **Section Navigation**: Multi-section form navigation

**Key Functions**:
- `renderDHIS2Field()` - Renders fields based on DHIS2 valueType
- `renderFieldPair()` - Renders main + comment field pairs
- `generateDebugInfo()` - Creates detailed debugging information

### 4. useAPI.js - DHIS2 Integration
**Purpose**: Handles all DHIS2 API communication
**Key Endpoints**:
- `/api/me` - User authentication
- `/api/programs` - Program metadata
- `/api/programStages/{id}` - Program stage configuration
- `/api/dataElements` - Data element definitions
- `/api/events` - Event submission
- `/api/dataStore/inspection/{year}` - Inspector assignments

**Key Functions**:
- `testAuth()` - Validate credentials
- `getDataCollectionConfiguration()` - Load complete form metadata
- `submitEvent()` - Submit inspection data
- `getInspectionAssignments()` - Get user facility assignments
- `getServiceSectionsForInspector()` - Get service sections for facility

### 5. useStorage.js - IndexedDB Operations
**Purpose**: Local data persistence with IndexedDB
**Database Schema**:
- `auth` - User credentials
- `events` - Inspection data with sync status
- `configuration` - DHIS2 metadata
- `metadata` - Legacy metadata storage
- `stats` - Application statistics

**Key Functions**:
- `saveEvent()` - Store inspection data
- `getEvents()` - Retrieve events with filtering
- `updateEvent()` - Update event status
- `setConfiguration()` - Store DHIS2 metadata

### 6. useIncrementalSave.js - Field-by-Field Saving
**Purpose**: Real-time form data persistence
**Key Features**:
- **Debounced Saving**: 300ms delay to batch field updates
- **Immediate Save**: Critical fields saved instantly
- **Metadata Tracking**: Tracks section completion and update counts
- **Error Handling**: Comprehensive error management

**Key Functions**:
- `saveField()` - Save individual field with debouncing
- `saveFieldImmediate()` - Save critical fields immediately
- `updateSectionMetadata()` - Track section completion
- `flushPendingSaves()` - Force save all pending changes

## Configuration System

### 1. Section Visibility Configuration
**File**: `src/config/sectionVisibilityConfig.js`
**Purpose**: Controls which sections are shown for each facility type
**Structure**:
```javascript
export const sectionVisibilityConfig = {
  'Gynae Clinics': {
    'Document Review': true,
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true
  },
  // ... other facility types
};
```

### 2. Facility Service Filters
**File**: `src/config/facilityServiceFilters.js`
**Purpose**: Controls which fields are shown for specific services
**Structure**: Auto-generated from CSV, maps service names to field visibility rules

### 3. CSV Configuration Parser
**File**: `src/utils/csvConfigParser.js`
**Purpose**: Parses CSV checklist and maps to DHIS2 Data Elements
**Key Classes**:
- `CSVConfigParser` - Parses CSV structure
- `DHIS2DataElementMapper` - Maps CSV to DHIS2 elements

## Data Flow

### 1. Authentication Flow
1. User enters credentials on LoginPage
2. AppContext.login() validates with DHIS2
3. Credentials stored in IndexedDB
4. Configuration and user assignments loaded
5. User redirected to FormPage

### 2. Form Data Flow
1. FormPage loads with facility assignments
2. User selects facility and service type
3. DynamicFormRenderer shows relevant fields
4. Field changes trigger useIncrementalSave
5. Data saved to IndexedDB with debouncing
6. Form submission creates DHIS2 event
7. Event queued for sync when online

### 3. Sync Flow
1. AppContext detects online status
2. Pending events retrieved from IndexedDB
3. Events submitted to DHIS2 API
4. Success/failure status updated
5. Statistics updated and UI refreshed

## Key Features Deep Dive

### 1. Offline-First Architecture
- **Service Worker**: Caches app shell and API responses
- **IndexedDB**: Stores all data locally
- **Background Sync**: Automatic sync when connection restored
- **Conflict Resolution**: Server-side validation and error handling

### 2. Dynamic Form Generation
- **CSV-Driven**: Forms generated from CSV configuration
- **DHIS2 Integration**: Real Data Elements from DHIS2 API
- **Facility Filtering**: Different forms per facility type
- **Service Filtering**: Field visibility based on selected services

### 3. Incremental Saving
- **Field-Level**: Each field change saved individually
- **Debounced**: Batches rapid changes to avoid excessive writes
- **Metadata Tracking**: Tracks section completion and progress
- **Error Recovery**: Handles storage failures gracefully

### 4. User Assignment System
- **DataStore Integration**: Loads assignments from DHIS2 DataStore
- **Inspector Matching**: Uses username priority for inspector lookup
- **Facility Filtering**: Shows only assigned facilities
- **Service Sections**: Dynamic service dropdown based on assignments

## API Integration

### DHIS2 Endpoints Used
- **Authentication**: `/api/me`
- **Metadata**: `/api/programs`, `/api/programStages/{id}`, `/api/dataElements`
- **Data Submission**: `/api/events`
- **User Data**: `/api/dataStore/inspection/{year}`

### Data Structures
- **Events**: DHIS2 event format with dataValues array
- **Data Elements**: Full DHIS2 Data Element objects with optionSets
- **User Assignments**: Custom structure from DataStore
- **Configuration**: Complete program stage metadata

## Development & Deployment

### Build Configuration
- **Vite**: Fast development and building
- **PWA Plugin**: Service worker and manifest generation
- **Proxy**: Development proxy to DHIS2 server
- **Source Maps**: Enabled for debugging

### Environment Setup
- **Development**: `npm run dev` (port 3000)
- **Production**: `npm run build` → `dist/` folder
- **Preview**: `npm run preview`

### PWA Features
- **Manifest**: Complete PWA manifest with icons
- **Service Worker**: Caching and background sync
- **Offline Support**: Full offline functionality
- **Install Prompt**: Users can install as native app

## Key Files for Common Tasks

### Adding New Facility Types
1. Update `src/config/sectionVisibilityConfig.js`
2. Create new facility config file in `src/config/`
3. Update `src/config/facilityServiceFilters.js`
4. Test with CSV configuration

### Modifying Form Fields
1. Update DHIS2 program stage in DHIS2
2. App will automatically load new fields
3. Update CSV configuration if needed
4. Test field visibility rules

### Adding New Form Sections
1. Update CSV configuration file
2. Modify section visibility rules
3. Update facility-specific filters
4. Test with different facility types

### Debugging Form Issues
1. Use DynamicFormRenderer debug panel
2. Check browser IndexedDB in DevTools
3. Monitor network requests in DevTools
4. Check console logs for detailed information

## Common Issues & Solutions

### Form Not Loading
- Check DHIS2 server connectivity
- Verify user has proper permissions
- Check browser console for errors
- Ensure configuration is loaded

### Data Not Syncing
- Check online status indicator
- Verify DHIS2 server is accessible
- Check event status in IndexedDB
- Review sync error messages

### Fields Not Showing
- Check facility type selection
- Verify service selection
- Review section visibility config
- Check field filtering rules

### Performance Issues
- Check IndexedDB storage usage
- Monitor network requests
- Review incremental save frequency
- Check for memory leaks

## Security Considerations

- **Credentials**: Stored encrypted in IndexedDB
- **API Calls**: All requests use HTTPS
- **Data Validation**: Server-side validation in DHIS2
- **CORS**: Properly configured for DHIS2 server
- **Session Management**: Automatic logout on credential expiry

## Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Debounced Saving**: Reduces IndexedDB writes
- **Caching**: Service worker caches static assets
- **Batch Operations**: Groups related API calls
- **Memory Management**: Proper cleanup on unmount

This knowledge base provides a comprehensive understanding of the DHIS2 PWA Inspections app architecture, components, and functionality. Use this as a reference for development, debugging, and maintenance tasks.
