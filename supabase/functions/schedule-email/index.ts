import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { userId, email, scheduledFor } = await req.json()

    // Store the scheduled email in database
    const { data: schedule, error: scheduleError } = await supabaseClient
      .from('email_notifications')
      .insert({
        user_id: userId,
        email: email,
        scheduled_for: scheduledFor,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (scheduleError) throw scheduleError

    // Calculate delay until scheduled time
    const delay = new Date(scheduledFor).getTime() - Date.now()

    // For immediate testing, send right away if delay is negative
    if (delay <= 0) {
      await sendEmailNotification(email, supabaseClient, schedule.id)
    } else {
      // In production, you'd use a job queue like Supabase Realtime or external service
      // For now, we'll document that this needs a cron job
      console.log(`Email scheduled for ${scheduledFor} (${delay}ms from now)`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduleId: schedule.id,
        scheduledFor 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function sendEmailNotification(
  email: string, 
  supabaseClient: any,
  scheduleId?: string
) {
  const appUrl = Deno.env.get('APP_URL') || 'https://pitch-up.vercel.app'
  
  // Using Resend API (recommended) or SendGrid
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  
  if (RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pitch Up <notifications@pitch-up.com>',
        to: email,
        subject: '⚡ Time to Pitch Up!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Time to Pitch Up!</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 36px;">⚡ Pitch Up!</h1>
                </div>
                <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin-top: 0;">It's time to record your pitch!</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    You have <strong>2 minutes</strong> to record your authentic voice moment. 
                    Share what's on your mind, what you're working on, or just how your day is going!
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/record" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 18px;">
                      Record Your Pitch Now
                    </a>
                  </div>
                  <p style="color: #999; font-size: 14px; text-align: center;">
                    This notification expires in 2 minutes. Don't miss it!
                  </p>
                </div>
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                  <p>
                    You're receiving this because you enabled email notifications for Pitch Up.
                    <br>
                    <a href="${appUrl}/settings" style="color: #667eea;">Manage preferences</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (response.ok && scheduleId) {
      // Mark email as sent
      await supabaseClient
        .from('email_notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', scheduleId)
    }

    return response.ok
  }
  
  // Fallback: log that email would be sent
  console.log(`Email notification would be sent to ${email}`)
  return true
}