// Simple Node.js/Express backend for email notifications
// Deploy this to Vercel, Netlify Functions, or your own server

import nodemailer from 'nodemailer';

// For Vercel deployment
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, userId, appUrl } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Option 1: Using Gmail SMTP (easiest for testing)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // your-email@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD // App-specific password
      }
    });

    // Option 2: Using SendGrid (better for production)
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const mailOptions = {
      from: `"Pitch Up ⚡" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '⚡ Time to Pitch Up! - 2 minutes to record',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 36px;">⚡ Pitch Up!</h1>
              </div>
              <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px;">
                <h2 style="color: #333; margin-top: 0;">It's time to record!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  You have <strong>2 minutes</strong> to record your voice pitch.
                  Share what's on your mind right now!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appUrl || 'https://pitch-up.vercel.app'}/record" 
                     style="display: inline-block; background: #007AFF; color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 18px;">
                    Record Now
                  </a>
                </div>
                <p style="color: #999; font-size: 14px; text-align: center;">
                  ⏰ This notification expires in 2 minutes!
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    // For SendGrid:
    // await sgMail.send(mailOptions);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}