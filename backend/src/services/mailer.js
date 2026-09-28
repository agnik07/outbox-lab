import nodemailer from 'nodemailer';

let transporter = null;
let etherealAccount = null;

export async function initMailer() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log(`[Mailer] Using configured SMTP user: ${process.env.SMTP_USER}`);
  } else {
    // Generate test account on Ethereal Email with fallback
    console.log('[Mailer] No custom SMTP credentials found. Creating dynamic Ethereal Email test account...');
    try {
      etherealAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: etherealAccount.smtp.host,
        port: etherealAccount.smtp.port,
        secure: etherealAccount.smtp.secure,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      });
      console.log(`[Mailer] Dynamic Ethereal test account created: ${etherealAccount.user}`);
      console.log(`[Mailer] Ethereal web login: https://ethereal.email/login`);
    } catch (err) {
      console.warn(`[Mailer] Warning: Could not contact Ethereal API (${err.message}). Using local JSON log mailer fallback.`);
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }
}

export async function sendMail({ to, subject, body }) {
  if (!transporter) {
    await initMailer();
  }

  const from = process.env.SENDER_EMAIL || '"Outbox System" <no-reply@outbox-lab.internal>';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6366f1;">${subject}</h2>
      <p style="font-size: 16px; line-height: 1.5;">${body}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <footer style="font-size: 12px; color: #888;">
        Sent via <strong>Outbox Lab Email Scheduler</strong> &bull; Ethereal Test Email
      </footer>
    </div>`
  });

  const testUrl = nodemailer.getTestMessageUrl(info) || null;
  console.log(`[Mailer] Email sent to ${to}. MessageId: ${info.messageId}`);
  if (testUrl) {
    console.log(`[Mailer] View Ethereal preview: ${testUrl}`);
  }

  return {
    messageId: info.messageId,
    testUrl
  };
}

export function getEtherealAccountInfo() {
  return etherealAccount;
}
