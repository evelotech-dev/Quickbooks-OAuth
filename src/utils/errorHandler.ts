import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export default async function errorHandle<T>(
  operation: (...args: any[]) => Promise<T>,
  operationName: string,
  errorTitle: string,
  ...args: any[]
): Promise<T> {
  try {
    return await operation(...args);
  } catch (err: unknown) {
    const environment = process.env.NODE_ENV;
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorBody = `${errorTitle} at ${operationName}: ${errorMsg} : ${environment}`;

    // Send error alert email via Nodemailer
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.ALERT_EMAIL,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.ALERT_EMAIL,
        to: process.env.ALERT_EMAIL,
        subject: `QBO Auth App Error: ${errorTitle}`,
        text: errorBody,
      });
      console.log('Error alert email sent.');
    } catch (emailErr) {
      console.error('Failed to send error alert email:', emailErr);
    }

    // Log error as fallback
    console.error('ERROR HANDLER:', errorBody);
    throw new Error(`${errorTitle} at ${operationName}: ${errorMsg}`);
  }
}
