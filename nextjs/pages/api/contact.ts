import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return true;
  }

  if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  record.lastRequest = now;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.lastRequest > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

interface ContactFormData {
  email: string;
  isArtist: boolean;
  message: string;
  timestamp: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP for rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const { email, isArtist, message, timestamp } = req.body as ContactFormData;

    // Validate required fields
    if (!email || message === undefined || isArtist === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message is too short' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    // Check timestamp to prevent old/replayed requests (within last 5 minutes)
    if (timestamp && (Date.now() - timestamp > 5 * 60 * 1000)) {
      return res.status(400).json({ error: 'Request expired. Please refresh and try again.' });
    }

    // Create email content
    const emailContent = `
New Contact Form Submission
============================

From: ${email}
Is Artist: ${isArtist ? 'Yes' : 'No'}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from the InkedIn contact form.
IP: ${ip}
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: #c9a962; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #666; }
    .value { margin-top: 5px; }
    .message { background: white; padding: 15px; border-left: 4px solid #c9a962; margin-top: 15px; }
    .footer { font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From:</div>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Is Tattoo Artist:</div>
        <div class="value">${isArtist ? 'Yes' : 'No'}</div>
      </div>
      <div class="field">
        <div class="label">Submitted:</div>
        <div class="value">${new Date().toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="message">${message.replace(/\n/g, '<br>')}</div>
      </div>
      <div class="footer">
        This message was sent from the InkedIn contact form.<br>
        IP: ${ip}
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Configure email transport
    // Uses environment variables for SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'info@getinked.in',
      replyTo: email,
      subject: `InkedIn Contact: ${isArtist ? 'Artist' : 'User'} Inquiry`,
      text: emailContent,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
}
