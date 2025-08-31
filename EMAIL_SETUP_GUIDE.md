# Email Notifications Setup Guide

## Overview
Email notifications solve the iOS limitation where web apps cannot send push notifications. Users receive emails at random times prompting them to open the app and record.

## Quick Setup (Choose One)

### Option 1: Gmail SMTP (Easiest for Testing)

1. **Enable 2-factor authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and generate password
   - Copy the 16-character password

3. **Set Environment Variables**:
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password
```

4. **Deploy to Vercel**:
```bash
npm i -g vercel
vercel --prod
```

### Option 2: SendGrid (Production Ready)

1. **Sign up** at https://sendgrid.com (free tier: 100 emails/day)
2. **Create API Key**: Settings → API Keys → Create API Key
3. **Verify sender**: Settings → Sender Authentication

4. **Install SendGrid**:
```bash
npm install @sendgrid/mail
```

5. **Set Environment Variable**:
```bash
SENDGRID_API_KEY=your-api-key
```

### Option 3: Resend (Modern Alternative)

1. **Sign up** at https://resend.com (free tier: 100 emails/day)
2. **Get API Key** from dashboard
3. **Add domain** or use their subdomain

4. **Set Environment Variable**:
```bash
RESEND_API_KEY=your-api-key
```

## Implementation Steps

### 1. Database Setup (Supabase)

Run the migration:
```sql
-- In Supabase SQL Editor
-- Copy contents of supabase/migrations/20240831_email_notifications.sql
```

### 2. Deploy Email API

**For Vercel:**
```bash
# The api/send-email.js file is already configured
vercel --prod
```

**For Netlify Functions:**
Create `netlify/functions/send-email.js` with same content

**For Express Server:**
```javascript
app.post('/api/send-email', async (req, res) => {
  // Use code from api/send-email.js
});
```

### 3. Update Email Service URL

Edit `src/services/EmailNotificationService.ts`:
```javascript
// Line 71 - Update with your API endpoint
const response = await fetch('YOUR_API_URL/api/send-email', {
```

### 4. Configure Supabase Edge Function (Optional)

If using Supabase Edge Functions:
```bash
supabase functions deploy schedule-email
supabase secrets set RESEND_API_KEY=your-key
supabase secrets set APP_URL=https://your-app.com
```

## Testing

1. **Test Email Sending**:
```bash
curl -X POST YOUR_API_URL/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","appUrl":"http://localhost:3000"}'
```

2. **Test in App**:
- Sign in with your email
- iOS: Will automatically prompt for email notifications
- Desktop: Deny browser notifications to trigger email prompt
- Check email for notification

## Production Checklist

- [ ] Email service API key set in environment
- [ ] Database tables created in Supabase
- [ ] API endpoint deployed and accessible
- [ ] Email service URL updated in frontend
- [ ] Sender email verified (SendGrid/Resend)
- [ ] Email templates tested
- [ ] Rate limiting configured
- [ ] Error logging set up

## Email Notification Flow

1. User signs in → Email collected from auth
2. iOS detected → Email prompt shown
3. User accepts → Email scheduled randomly
4. Backend sends email at scheduled time
5. User clicks link → Opens app to record
6. Next email scheduled after recording

## Customization

### Email Template
Edit the HTML in `api/send-email.js` to customize:
- Colors and branding
- Message content
- Call-to-action button
- Footer links

### Scheduling Logic
Modify in `EmailNotificationService.ts`:
- `getNextNotificationTime()`: Change timing logic
- `getRandomDelay()`: Adjust random intervals
- Add quiet hours or timezone support

## Troubleshooting

**Emails not sending:**
- Check API endpoint is accessible
- Verify environment variables are set
- Check email service dashboard for errors
- Look at Vercel/Netlify function logs

**Gmail SMTP issues:**
- Must use App Password, not regular password
- Enable "Less secure app access" if needed
- Check spam folder

**Rate limiting:**
- Free tiers have daily limits
- Implement queuing for scale
- Consider upgrading email service

## Cost Estimates

- **Gmail SMTP**: Free (limited by Gmail sending limits)
- **SendGrid**: Free up to 100 emails/day, then $15/month
- **Resend**: Free up to 100 emails/day, then $20/month
- **AWS SES**: $0.10 per 1,000 emails (cheapest at scale)

## Next Steps

1. Choose email service based on scale needs
2. Deploy API endpoint
3. Test with real users
4. Monitor email delivery rates
5. Consider adding SMS as backup (Twilio)