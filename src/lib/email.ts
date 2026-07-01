import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'HRReply.in <hello@hrreply.in>'

function welcomeHtml(name: string) {
  const displayName = name?.trim() ? name.split(' ')[0] : 'there'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to HRReply.in</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

          <!-- Header -->
          <tr>
            <td style="background:#1F2937;padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:#1F2937;border-radius:8px;border:1.5px solid #374151;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:36px;">✓</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">HRReply.in</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">
                Welcome, ${displayName}! 🎉
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                Your account is ready. You have <strong style="color:#111827;">50 free AI replies</strong> every month — no credit card needed.
              </p>

              <!-- What you can do -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:28px;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">What you can do right now</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    ${[
                      ['✦', 'Generate rejection, offer, and follow-up messages instantly'],
                      ['✦', 'Choose between Formal English, Friendly English, and Hinglish'],
                      ['✦', 'Pick from 20+ HR templates for every situation'],
                      ['✦', 'Track your candidate pipeline in one place'],
                    ].map(([icon, text]) => `
                    <tr>
                      <td style="padding:5px 0;vertical-align:top;width:20px;">
                        <span style="color:#65A30D;font-size:13px;">${icon}</span>
                      </td>
                      <td style="padding:5px 0 5px 8px;font-size:14px;color:#374151;line-height:1.5;">${text}</td>
                    </tr>`).join('')}
                  </table>
                </td></tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1F2937;border-radius:8px;">
                    <a href="https://www.hrreply.in/generator" style="display:inline-block;padding:14px 28px;color:#A3E635;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      Generate your first reply →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;line-height:1.6;">
                Questions? Just reply to this email — we read everything.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #F3F4F6;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © 2026 HRReply.in · Built for Indian recruiters ·
                <a href="https://www.hrreply.in" style="color:#9CA3AF;">hrreply.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to HRReply.in — your first 50 replies are ready',
    html: welcomeHtml(name),
  })
}
