# IMAP Polling Alternatives & Limitations

## Why IMAP Polling is Difficult in Edge Environments

Supabase Edge Functions run on Deno, a modern runtime for JavaScript/TypeScript. While powerful, Deno's security model and standard library differ significantly from Node.js, specifically regarding the `net` and `tls` modules used by traditional IMAP libraries.

### Key Issues:
1.  **Library Compatibility:** Most mature IMAP libraries (`node-imap`, `imap-simple`) rely heavily on Node.js internal streams and buffer handling which can be unstable when polyfilled in Edge environments.
2.  **Execution Time Limits:** Edge functions have strict timeout limits (often 10-60 seconds). Downloading large email attachments or syncing a large inbox over IMAP often exceeds these limits, leading to `504 Gateway Timeout` or `502 Bad Gateway` errors.
3.  **Memory Constraints:** Processing MIME multipart emails with large attachments can exceed the memory allocation of a lightweight Edge Function.

## Recommended Alternatives

For a production-grade Email Intake system, we strongly recommend using **Push** (Webhooks) over **Pull** (Polling).

### 1. Email Forwarding (Recommended)
Configure your email provider (Gmail, Outlook, Hostinger, GoDaddy) to forward emails to a dedicated address managed by a transactional email service (like SendGrid or Mailgun) that parses the email and sends a JSON payload to your webhook.

**Pros:** Real-time, reliable, handles attachments well.
**Cons:** Requires external service setup.

### 2. Mailgun / SendGrid Inbound Parse
These services act as the "Receiver". You set your MX records or forwarding to point to them. They parse the raw email into clean JSON and POST it to your Supabase Edge Function (`inbound-email-webhook`).

**Pros:** Industrial strength, excellent parsing, retry logic.
**Cons:** Usage costs (though free tiers often suffice).

### 3. Manual Import
For ad-hoc cases or historical data, use the "Manual Import" tool in the dashboard to upload `.eml` files or paste content directly.

**Pros:** Simple, no setup required.
**Cons:** Not automated.

## Comparison Table

| Feature | IMAP Polling (Edge) | Email Forwarding (Webhook) | Manual Import |
| :--- | :--- | :--- | :--- |
| **Reliability** | Low (Timeouts) | High | High |
| **Speed** | Slow (Interval based) | Instant (Real-time) | N/A |
| **Complexity** | High (Parsing logic) | Medium (DNS/Service setup) | Low |
| **Attachments** | Difficult | Handled by Provider | Supported |
| **Maintenance** | High | Low | None |

## Migration Path

If you are currently experiencing issues with the `poll-imap-emails` function:

1.  **Stop the Polling:** Run the `disable-imap-polling.sql` migration script.
2.  **Choose a Provider:** Sign up for a free Mailgun or SendGrid account.
3.  **Configure Forwarding:** Set up a rule in your current email host to forward `admin@yourdomain.com` -> `inbound@your-mailgun-domain.com`.
4.  **Update Webhook:** Ensure your `inbound-email-webhook` edge function is active and URL is set in the provider's dashboard.