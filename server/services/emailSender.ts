import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  body: string;
  draftId: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

/**
 * Sends an email via Resend API with retry logic
 *
 * @param params - Email parameters including recipient, subject, and body
 * @returns Result with success status and message ID or error
 * @throws {Error} If all retry attempts fail
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, from, subject, body } = params;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: from || 'Alex from AI Email Assistant <onboarding@resend.dev>',
        to: [to],
        subject,
        html: formatEmailBody(body),
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        messageId: data?.id,
        sentAt: new Date(),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on certain errors
      if (lastError.message.includes('Invalid email')) {
        return {
          success: false,
          error: 'Invalid email address',
          sentAt: new Date(),
        };
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to send email after multiple attempts',
    sentAt: new Date(),
  };
}

/**
 * Formats plain text email body into HTML
 */
function formatEmailBody(body: string): string {
  // Convert line breaks to <br> tags
  const htmlBody = body
    .split('\n')
    .map(line => line.trim())
    .join('<br>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
    </html>
  `;
}
