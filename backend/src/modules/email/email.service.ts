import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${this.configService.get<string>('SMTP_FROM_NAME')} <${this.configService.get<string>('SMTP_FROM')}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendAttendeeConfirmation(
    email: string,
    fullName: string,
    eventTitle: string,
    qrCode: string,
  ): Promise<void> {
    const html = `
      <h2>Registration Confirmed!</h2>
      <p>Hi ${fullName},</p>
      <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
      <p>Your QR code for check-in is:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px;">
        <code style="font-size: 14px; font-family: monospace; word-break: break-all;">${qrCode}</code>
      </div>
      <p>Please show this code at check-in. You can take a screenshot or print this email.</p>
      <p>If you have any questions, please contact the event organizer.</p>
      <p>Best regards,<br/>Eventide Team</p>
    `;

    await this.sendEmail(email, `Registration Confirmed: ${eventTitle}`, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>Eventide Team</p>
    `;

    await this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const html = `
      <h2>Welcome to Eventide!</h2>
      <p>Hi ${firstName},</p>
      <p>Welcome to Eventide - your ultimate event management platform.</p>
      <p>You can now:</p>
      <ul>
        <li>Create and manage your events</li>
        <li>Track attendee registrations</li>
        <li>Check in attendees with QR codes</li>
        <li>View detailed analytics</li>
      </ul>
      <p><a href="${frontendUrl}/dashboard" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
      <p>Best regards,<br/>Eventide Team</p>
    `;

    await this.sendEmail(email, 'Welcome to Eventide!', html);
  }
}
