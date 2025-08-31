# Pitch Up - Production Deployment Guide

## Changes Made for Production

### Removed Dev/Admin Tools
- **Debug Panel**: Removed the debug panel component and all references
- **Manual Notification Trigger**: Removed the ability to manually trigger notifications
- **Debug Hints**: Removed "Press Ctrl+Shift+D" hint from the UI
- **React.StrictMode**: Removed to prevent double renders in production

### Added Production Features
- **Automatic Notification Scheduling**: Notifications now schedule automatically between 8am-10pm
- **Recursive Scheduling**: After each notification, the next one is automatically scheduled
- **Time-Based Restrictions**: No notifications during night hours (10pm-8am)
- **Production Environment Config**: Added .env.production with sourcemap generation disabled

## Build and Deploy

### Local Build
```bash
npm run build:prod
```

### Environment Variables
Ensure these are set in your production environment:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

### Deployment Options

#### Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
1. Build command: `npm run build:prod`
2. Publish directory: `build`

#### Manual Server
```bash
npm run build:prod
npx serve -s build -l 3000
```

## iOS Notification Support

The app uses:
- Web Notifications API for desktop/Android
- In-app notifications as fallback for iOS
- Audio cues for all platforms

## Production Behavior

1. **First Load**: Schedules first notification within 30min-3hrs
2. **Active Hours**: Notifications only between 8am-10pm
3. **Frequency**: Random intervals of 30min-3hrs between notifications
4. **Timer**: 2-minute countdown for recording after notification

## Security Notes

- Environment variables are properly secured
- No debug tools accessible in production
- Source maps disabled for production builds
- All dev dependencies excluded from production bundle