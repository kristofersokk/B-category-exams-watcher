import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { GmailAuth, Metadata } from '.';
import { TEMPLATE_SETUP } from './stringTemplates';

type EmailSettings = {
  serviceGmailAuth?: GmailAuth;
  debugEmail?: string;
};

let emailSettings: EmailSettings | null = null;

let mailTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

export const initializeEmailService = (
  inputEmailSettings: EmailSettings
): void => {
  emailSettings = inputEmailSettings;
  console.log('Initializing mail server');
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '',
      pass: '',
      ...emailSettings.serviceGmailAuth,
    },
  });
};

export const sendMail = (
  client: string,
  subject: string,
  text: string
): void => {
  if (mailTransporter && emailSettings?.serviceGmailAuth?.user) {
    console.log('Sending email');
    const mailDetails = {
      from: emailSettings.serviceGmailAuth.user,
      to: client,
      subject,
      text,
    };
    mailTransporter.sendMail(mailDetails, (err) => {
      if (err) {
        console.log('Error Occurs sending mail');
      } else {
        console.log('Email sent successfully');
      }
    });
  }
};

export const sendDebugEmail = (text: string): void => {
  if (
    mailTransporter &&
    emailSettings?.debugEmail &&
    emailSettings?.serviceGmailAuth?.user
  ) {
    console.log('Sending debug email');

    const mailDetails = {
      from: emailSettings.serviceGmailAuth.user,
      to: emailSettings.debugEmail,
      subject: 'Sõidueksami rakendus crashis',
      text,
    };
    mailTransporter.sendMail(mailDetails, (err) => {
      if (err) {
        console.log('Error Occurs sending debug mail');
      } else {
        console.log('Debug Email sent successfully');
      }
    });
  }
};

export const sendSetupEmail = (clients: Metadata['clients']): void => {
  Object.entries(clients).forEach(([client, { filter }]) => {
    if (filter) {
      sendMail(
        client,
        'Algas sõidueksami aegade jälgimine',
        TEMPLATE_SETUP(filter)
      );
    }
  });
};
