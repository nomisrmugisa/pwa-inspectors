# DHIS2 Inspections PWA

A Progressive Web App (PWA) built with React for DHIS2 single program stage data capture with offline support.

## Features

✅ **User Authentication**
- Secure login with DHIS2 credentials
- Session management with token storage
- Graceful handling of expired sessions

✅ **Metadata Management**
- Automatic fetching and local storage of:
  - Program metadata
  - Program stage configuration
  - Data elements with validation rules
  - Option sets for dropdown fields
  - Organisation units

✅ **Dynamic Form Rendering**
- Auto-generated forms based on DHIS2 metadata
- Support for all DHIS2 data types:
  - Text, Long Text, Numbers, Dates
  - Boolean, Email, Phone, URL
  - Option sets (dropdowns)
  - Percentage fields with validation

✅ **Offline-First Architecture**
- IndexedDB for local data storage
- Service Worker for offline functionality
- Background sync when connection restored
- Queue management for failed requests

✅ **Data Capture & Sync**
- Create and edit inspection forms
- Save as drafts or submit directly
- Automatic sync when online
- Manual sync with status indicators
- Conflict resolution

✅ **Modern UI/UX**
- Responsive design for mobile and desktop
- DHIS2-inspired color scheme
- Real-time validation feedback
- Toast notifications
- Loading states and error handling

## Technology Stack

- **Frontend**: React 18 with Hooks
- **Build Tool**: Vite for fast development
- **Routing**: React Router v6
- **Storage**: IndexedDB with custom hooks
- **PWA**: Vite PWA plugin with Workbox
- **Styling**: CSS with CSS Custom Properties
- **Icons**: Font Awesome 6
- **Fonts**: Inter font family

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Access to a DHIS2 instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dhis2-pwa-inspections
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### PWA Setup

The application includes complete PWA functionality:

- **Manifest**: Auto-generated with proper icons and metadata
- **Service Worker**: Handles caching and offline functionality
- **Install Prompt**: Users can install the app on their devices

To add custom icons, place PNG files in the `public/icons/` directory with the following sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Configuration

### DHIS2 Server Setup

1. Ensure your DHIS2 server allows CORS requests from your domain
2. The app connects to DHIS2 Web API endpoints:
   - `/api/me` - User authentication
   - `/api/programs` - Program metadata
   - `/api/organisationUnits` - Organisation units
   - `/api/events` - Event data submission

### Single Program Stage Configuration

The app is designed for single program stage data capture. It will:
1. Load the first available program from your DHIS2 instance
2. Use the first program stage from that program
3. Render form fields based on program stage data elements

To use a specific program, modify the metadata loading logic in `src/contexts/AppContext.jsx`.

## File Structure

```
src/
├── components/           # Reusable React components
│   ├── Header.jsx       # App header with sync/logout
│   ├── LoadingScreen.jsx # Loading spinner component
│   └── Toast.jsx        # Notification component
├── contexts/            # React Context providers
│   └── AppContext.jsx   # Global state management
├── hooks/               # Custom React hooks
│   ├── useAPI.js        # DHIS2 API integration
│   └── useStorage.js    # IndexedDB operations
├── pages/               # Page components
│   ├── FormPage.jsx     # Dynamic form rendering
│   ├── HomePage.jsx     # Dashboard with stats
│   └── LoginPage.jsx    # Authentication form
├── App.jsx              # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## Offline Functionality

The app works fully offline with:

### Data Storage
- **Auth data**: Credentials securely stored
- **Metadata**: Programs, data elements, option sets
- **Events**: Form submissions with sync status
- **Sync queue**: Failed requests for retry

### Sync Strategy
- **Immediate sync**: When online and form submitted
- **Background sync**: Automatic retry when connection restored
- **Manual sync**: User-triggered sync of pending data
- **Conflict resolution**: Server-side validation and error handling

### Cache Strategy
- **App shell**: Cached for instant loading
- **Static assets**: Long-term caching
- **API responses**: Network-first with cache fallback
- **Dynamic content**: Cache-first for metadata

## Customization

### Styling
Modify CSS custom properties in `src/index.css`:
```css
:root {
  --primary-color: #276696;    /* DHIS2 blue */
  --secondary-color: #4a90a4;  /* Light blue */
  --success-color: #27ae60;    /* Green */
  --warning-color: #f39c12;    /* Orange */
  --danger-color: #e74c3c;     /* Red */
}
```

### Form Validation
Add custom validation rules in the `validateValue` function in `src/hooks/useAPI.js`.

### Data Elements
The app automatically renders form fields based on DHIS2 data element types. Supported types:
- TEXT, LONG_TEXT
- INTEGER, INTEGER_POSITIVE, INTEGER_NEGATIVE, INTEGER_ZERO_OR_POSITIVE
- NUMBER, PERCENTAGE
- DATE, DATETIME
- BOOLEAN, TRUE_ONLY
- EMAIL, PHONE_NUMBER, URL
- Option sets (SELECT)

## Development

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Pages**: Add to `src/pages/` and update routing in `App.jsx`
3. **State Management**: Extend `AppContext.jsx` for global state
4. **API Integration**: Extend `useAPI.js` hook for new endpoints

### Debugging

- **Storage**: Use browser DevTools > Application > IndexedDB
- **Network**: Monitor API calls in Network tab
- **Service Worker**: Check Application > Service Workers
- **PWA**: Use Lighthouse audit for PWA compliance

## Deployment

### Build Production

```bash
npm run build
```

### Deployment Options

1. **Static Hosting**: Deploy `dist/` folder to:
   - Netlify, Vercel, GitHub Pages
   - Apache, Nginx static server

2. **DHIS2 Apps**: Package as DHIS2 web app
   - Upload `dist/` contents to DHIS2 app management

3. **Docker**: Create containerized deployment

### Environment Configuration

For production, ensure:
- HTTPS enabled for PWA features
- Proper CORS configuration on DHIS2 server
- Cache headers configured for static assets

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Include browser/device information
4. Provide DHIS2 version and configuration details 