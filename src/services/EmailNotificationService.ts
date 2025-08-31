import { supabase } from '../lib/supabase';

class EmailNotificationService {
  private static instance: EmailNotificationService;
  
  private constructor() {}
  
  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }
  
  async setupEmailNotifications(userId: string, email: string): Promise<boolean> {
    try {
      // Store email preference in Supabase
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          email: email,
          email_notifications: true,
          notification_frequency: 'random',
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Schedule initial email notification
      await this.scheduleEmailNotification(userId, email);
      
      return true;
    } catch (error) {
      console.error('Failed to setup email notifications:', error);
      return false;
    }
  }
  
  async scheduleEmailNotification(userId: string, email: string): Promise<void> {
    try {
      // Call Supabase Edge Function to schedule email
      const { data, error } = await supabase.functions.invoke('schedule-email', {
        body: {
          userId,
          email,
          scheduledFor: this.getNextNotificationTime()
        }
      });
      
      if (error) throw error;
      
      console.log('Email notification scheduled:', data);
    } catch (error) {
      console.error('Failed to schedule email:', error);
      // Fallback to client-side scheduling if edge function not available
      this.scheduleClientSideEmail(userId, email);
    }
  }
  
  private scheduleClientSideEmail(userId: string, email: string): void {
    // This is a fallback - ideally emails should be sent from server
    const delay = this.getRandomDelay();
    
    setTimeout(() => {
      this.triggerEmailNotification(userId, email);
    }, delay);
  }
  
  private async triggerEmailNotification(userId: string, email: string): Promise<void> {
    try {
      // Call backend API to send email
      const response = await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          appUrl: window.location.origin
        })
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      
      // Schedule next notification
      this.scheduleEmailNotification(userId, email);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
  
  private getNextNotificationTime(): string {
    const now = new Date();
    const hour = now.getHours();
    
    // If outside active hours, schedule for next morning
    if (hour >= 22 || hour < 8) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + (hour >= 22 ? 1 : 0));
      tomorrow.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      return tomorrow.toISOString();
    }
    
    // Random time in next 30 mins to 3 hours
    const minDelay = 30 * 60 * 1000;
    const maxDelay = 3 * 60 * 60 * 1000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    return new Date(now.getTime() + delay).toISOString();
  }
  
  private getRandomDelay(): number {
    const minDelay = 30 * 60 * 1000; // 30 minutes
    const maxDelay = 3 * 60 * 60 * 1000; // 3 hours
    return Math.random() * (maxDelay - minDelay) + minDelay;
  }
  
  async updateEmailPreferences(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          email_notifications: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      return false;
    }
  }
}

export default EmailNotificationService.getInstance();