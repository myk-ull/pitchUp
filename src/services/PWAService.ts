class PWAService {
  private static instance: PWAService;
  
  private constructor() {
    this.setupPWA();
  }
  
  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }
  
  private setupPWA(): void {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('SW registered:', registration);
            this.setupBackgroundSync(registration);
          })
          .catch(err => console.log('SW registration failed:', err));
      });
    }
    
    // Detect if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as PWA');
      this.enablePWAFeatures();
    }
    
    // iOS specific: Detect if running in standalone mode
    if ((window.navigator as any).standalone) {
      console.log('Running as iOS PWA');
      this.enableIOSFeatures();
    }
  }
  
  private setupBackgroundSync(registration: ServiceWorkerRegistration): void {
    // Background sync for notification scheduling
    if ('sync' in registration) {
      // This will work when iOS eventually supports it
      (registration.sync as any).register('notification-sync')
        .catch((err: any) => console.log('Background sync not supported:', err));
    }
  }
  
  private enablePWAFeatures(): void {
    // Enable PWA-specific features
    localStorage.setItem('isPWA', 'true');
    
    // Set up periodic check when app is open
    this.setupPeriodicCheck();
  }
  
  private enableIOSFeatures(): void {
    // iOS-specific PWA enhancements
    this.preventScrollBounce();
    this.setupIOSBadge();
  }
  
  private preventScrollBounce(): void {
    // Prevent iOS rubber-band scrolling in PWA
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) return;
      e.preventDefault();
    }, { passive: false });
  }
  
  private setupIOSBadge(): void {
    // iOS 16.4+ supports badge API
    if ('setAppBadge' in navigator) {
      // Can set badge count for notifications
      (navigator as any).setAppBadge(1);
    }
  }
  
  private setupPeriodicCheck(): void {
    // Check for notification time every minute when app is open
    setInterval(() => {
      const lastNotification = localStorage.getItem('lastNotificationTime');
      const now = Date.now();
      
      if (lastNotification) {
        const timeSinceLastNotification = now - parseInt(lastNotification);
        const minInterval = 30 * 60 * 1000; // 30 minutes
        
        if (timeSinceLastNotification > minInterval && this.isInActiveHours()) {
          // Trigger in-app notification
          this.triggerLocalNotification();
        }
      }
    }, 60000); // Check every minute
  }
  
  private isInActiveHours(): boolean {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 22;
  }
  
  private triggerLocalNotification(): void {
    // Trigger the app's notification system
    const event = new CustomEvent('localNotification');
    window.dispatchEvent(event);
    localStorage.setItem('lastNotificationTime', Date.now().toString());
  }
  
  // Method to prompt iOS users to add to home screen
  promptInstallPWA(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // Show install prompt for iOS
      const installPrompt = document.createElement('div');
      installPrompt.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <button onclick="this.parentElement.parentElement.remove()" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
          ">×</button>
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">📲 Install Pitch Up</h3>
          <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.95;">
            Add to Home Screen for the best experience with notifications!
          </p>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 14px;">
            <span>Tap</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 16l-6-6h12l-6 6z"/>
              <rect x="11" y="4" width="2" height="10"/>
            </svg>
            <span>then "Add to Home Screen"</span>
          </div>
        </div>
      `;
      
      // Only show if not shown recently
      const lastPrompt = localStorage.getItem('lastInstallPrompt');
      const daysSincePrompt = lastPrompt ? 
        (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24) : 999;
      
      if (daysSincePrompt > 7) {
        document.body.appendChild(installPrompt);
        localStorage.setItem('lastInstallPrompt', Date.now().toString());
        
        // Auto-hide after 10 seconds
        setTimeout(() => installPrompt.remove(), 10000);
      }
    }
  }
}

export default PWAService.getInstance();