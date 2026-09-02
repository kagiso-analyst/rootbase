// supabase/functions/send-invitation/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

interface InvitationRequest {
  email: string
  inviteUrl: string
  farmName: string
  role: string
  senderName: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json() as Partial<InvitationRequest>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const inviteUrl = typeof body.inviteUrl === 'string' ? body.inviteUrl : ''
    const farmName = typeof body.farmName === 'string' ? body.farmName.trim() : ''
    const role = typeof body.role === 'string' ? body.role.trim() : ''
    const senderName = typeof body.senderName === 'string' ? body.senderName.trim() : ''

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return jsonResponse({ error: 'Invalid email address' }, 400)
    }
    if (!farmName || farmName.length > 100 || !senderName || senderName.length > 200) {
      return jsonResponse({ error: 'Invalid invitation details' }, 400)
    }
    if (!['admin', 'manager', 'viewer'].includes(role)) {
      return jsonResponse({ error: 'Invalid invitation role' }, 400)
    }

    let parsedInviteUrl: URL
    try {
      parsedInviteUrl = new URL(inviteUrl)
    } catch {
      return jsonResponse({ error: 'Invalid invitation URL' }, 400)
    }
    if (!['http:', 'https:'].includes(parsedInviteUrl.protocol)) {
      return jsonResponse({ error: 'Invalid invitation URL' }, 400)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured')
      return jsonResponse({ error: 'Email service is not configured' }, 503)
    }

    const fromAddress = Deno.env.get('INVITATION_FROM_ADDRESS')
    if (!fromAddress) {
      console.error('INVITATION_FROM_ADDRESS is not configured')
      return jsonResponse({ error: 'Email sender is not configured' }, 503)
    }

    const safeFarmName = escapeHtml(farmName)
    const safeRole = escapeHtml(role)
    const safeSenderName = escapeHtml(senderName)
    const safeInviteUrl = escapeHtml(parsedInviteUrl.toString())

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `You've been invited to join ${farmName} on RootBase`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #1B4332; }
                .container { max-width: 500px; margin: 0 auto; padding: 20px; }
                .header { background: #2D6A4F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #2D6A4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .button:hover { background: #1B4332; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
                .role-badge { background: #D8F3DC; color: #2D6A4F; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🌱 RootBase</h1>
                  <p>You've been invited!</p>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p><strong>${safeSenderName}</strong> has invited you to join <strong>${safeFarmName}</strong> on RootBase.</p>
                  <div style="margin: 20px 0;">
                    <span class="role-badge">Role: ${safeRole}</span>
                  </div>
                  <div style="text-align: center;">
                    <a href="${safeInviteUrl}" class="button">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    This invitation will expire in 7 days.
                  </p>
                  <p style="font-size: 12px; color: #999;">
                    If you didn't expect this invitation, you can ignore this email.
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} RootBase. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.error('Resend error:', res.status, await res.text())
      return jsonResponse({ error: 'Email delivery failed' }, 502)
    }

    return jsonResponse({ success: true }, 200)
  } catch (error) {
    console.error('Error sending invitation:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})