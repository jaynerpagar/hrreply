import { Resend } from 'resend'

const FROM = 'HRReply.in <hello@hrreply.in>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

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
                Your account is ready. You have <strong style="color:#111827;">25 free AI replies</strong> every month — no credit card needed.
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

export async function sendLowReplyWarning(email: string, name: string, used: number, limit: number) {
  if (!process.env.RESEND_API_KEY) return

  const displayName = name?.trim() ? name.split(' ')[0] : 'there'
  const remaining = limit - used

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `You've used ${used} of ${limit} free replies this month`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Running low on replies</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:#1F2937;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;">HRReply.in</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">
              Only ${remaining} ${remaining === 1 ? 'reply' : 'replies'} left, ${displayName}
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              You&apos;ve used <strong style="color:#111827;">${used} of ${limit}</strong> free replies this month.
              Upgrade to Pro for unlimited replies and never hit a limit again.
            </p>

            <div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #E5E7EB;">
              <div style="background:#E5E7EB;border-radius:999px;height:8px;margin-bottom:8px;">
                <div style="background:#A3E635;border-radius:999px;height:8px;width:${Math.round((used / limit) * 100)}%;"></div>
              </div>
              <p style="margin:0;font-size:13px;color:#6B7280;">${used} / ${limit} replies used this month</p>
            </div>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1F2937;border-radius:8px;">
                  <a href="https://www.hrreply.in/upgrade" style="display:inline-block;padding:13px 26px;color:#A3E635;font-size:14px;font-weight:600;text-decoration:none;">
                    Upgrade to Pro — ₹799/mo →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;">
              Pro gives you unlimited replies, candidate tracker, custom templates, and full reply history.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #F3F4F6;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 HRReply.in</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendTeamInvite({
  to, inviterName, workspaceName, role, joinUrl,
}: {
  to: string; inviterName: string; workspaceName: string; role: string; joinUrl: string
}) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to join ${workspaceName} on HRReply.in`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Team Invite</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:#1F2937;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;">HRReply.in</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">You&apos;re invited!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              <strong style="color:#111827;">${inviterName}</strong> has invited you to join
              <strong style="color:#111827;">${workspaceName}</strong> on HRReply.in as a
              <strong style="color:#111827;">${role}</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1F2937;border-radius:8px;">
                  <a href="${joinUrl}" style="display:inline-block;padding:13px 28px;color:#A3E635;font-size:15px;font-weight:600;text-decoration:none;">
                    Join ${workspaceName} →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;">
              This invite link expires in 7 days. If you didn&apos;t expect this, you can ignore it.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #F3F4F6;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 HRReply.in</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to HRReply.in — your first 25 replies are ready',
    html: welcomeHtml(name),
  })
}
