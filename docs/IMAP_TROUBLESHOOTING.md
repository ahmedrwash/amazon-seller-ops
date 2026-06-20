# IMAP Troubleshooting Guide

## Common Issues

### 1. 502 Bad Gateway / Execution Timeout
**Symptoms:** The "Test Connection" button spins for 10+ seconds and returns a 502 error, or the logs show "Execution time limit exceeded".
**Cause:** Node.js IMAP libraries are not fully compatible with Supabase Edge Runtime (Deno). The connection hangs or parsing takes too long.
**Solution:**
1.  Use the `checkImapConnection` utility (built-in to the new Edge Function) which only verifies login, not full download.
2.  Switch to **Email Forwarding** (SendGrid/Mailgun) for reliable email ingestion.
3.  Disable the polling cron job using `disable-imap-polling.sql`.

### 2. Login Failed (NO / BAD Response)
**Symptoms:** Status updates to "Failed" with "Invalid credentials".
**Checklist:**
- [ ] Verify username is full email address.
- [ ] Verify password is correct.
- [ ] **App Passwords:** If using Gmail/Outlook with 2FA, you MUST use an App Password, not your regular login password.
- [ ] **IMAP Enabled:** Ensure IMAP access is enabled in your email provider's settings.

### 3. Connection Refused
**Symptoms:** "Connection refused" or "Unreachable".
**Check:**
- [ ] Port is correct (usually 993 for SSL/TLS).
- [ ] Server address is correct (e.g., `imap.gmail.com`, `imap.hostinger.com`).
- [ ] Firewall rules (rare, but Supabase Edge functions have outgoing access).

## Verification Steps

### Verifying Credential Status
Run this SQL query in Supabase SQL Editor: