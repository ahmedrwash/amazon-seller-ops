# Email Forwarding Setup Guide

If you don't want to change your MX records completely, you can use **Forwarding**.

## Concept
1.  Keep your current email provider (e.g., Hostinger, Gmail, Outlook 365).
2.  Create a "Forwarding Rule" to send a copy of all incoming mail to your processing address (Mailgun/SendGrid).
3.  The processing service converts the email to JSON and hits your webhook.

## Setup Instructions (Hostinger Example)

1.  **Log in to Hostinger hPanel.**
2.  Go to **Emails** -> Select your domain.
3.  Select the email account you want to monitor (e.g., `orders@yourdomain.com`).
4.  Look for **Forwarders** in the sidebar or settings menu.
5.  Click **Create Forwarder**.
6.  **Forward to:** Enter the email address provided by your parsing service (e.g., `inbound@mg.yourdomain.com`).
7.  Click **Create**.

## Setup Instructions (Gmail/Google Workspace)

1.  **Log in to Gmail.**
2.  Go to **Settings (Gear Icon)** -> **See all settings**.
3.  Click **Forwarding and POP/IMAP** tab.
4.  Click **Add a forwarding address**.
5.  Enter your processing address (e.g., `inbound@mg.yourdomain.com`).
6.  Google will send a verification code to that address. You will need to check your Application Logs or Database to find the email body containing the code, as the webhook will receive it!
7.  Once verified, select "Forward a copy of incoming mail to..." and save changes.

## Troubleshooting

- **Verification Codes:** When setting up forwarding, the provider often sends a verification email. Since your webhook is the receiver, check the `inbound_emails` table in Supabase to find this verification email and extract the code.
- **Spam Filters:** Ensure your forwarding rule doesn't mark forwarded emails as spam.