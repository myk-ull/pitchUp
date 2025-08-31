class NotificationService {
  private static instance: NotificationService;
  private notificationSound: HTMLAudioElement | null = null;

  private constructor() {
    this.requestPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  showNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('⚡ Time to Pitch Up!', {
        body: '2 minutes to record your audio pitch',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pitch-up-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/record';
        notification.close();
      };

      this.playNotificationSound();
    } else {
      this.showInAppNotification();
    }
  }

  private showInAppNotification(): void {
    const banner = document.createElement('div');
    banner.className = 'in-app-notification';
    banner.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">⚡</span>
        <div class="notification-text">
          <strong>Time to Pitch Up!</strong>
          <p>2 minutes to record your audio pitch</p>
        </div>
        <button class="notification-action">Record Now</button>
      </div>
    `;

    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      color: #000000;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideDown 0.3s ease;
      max-width: 400px;
      width: 90%;
    `;

    document.body.appendChild(banner);

    const actionBtn = banner.querySelector('.notification-action') as HTMLElement;
    if (actionBtn) {
      actionBtn.onclick = () => {
        window.location.href = '/record';
        banner.remove();
      };
    }

    setTimeout(() => {
      banner.style.animation = 'slideUp 0.3s ease forwards';
      setTimeout(() => banner.remove(), 300);
    }, 5000);

    this.playNotificationSound();
  }

  private playNotificationSound(): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, duration: number, startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };

    playTone(523.25, 0.2, 0);
    playTone(659.25, 0.2, 0.2);
    playTone(783.99, 0.3, 0.4);
  }

  scheduleRandomNotification(): void {
    const minDelay = 5 * 60 * 1000;
    const maxDelay = 30 * 60 * 1000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    setTimeout(() => {
      this.showNotification();
    }, delay);
  }
}

const notificationService = NotificationService.getInstance();
export default notificationService;