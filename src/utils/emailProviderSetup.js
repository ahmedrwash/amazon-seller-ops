export const SENDGRID_SETUP_STEPS = [
  {
    title: "1. Create SendGrid Account",
    description: "Sign up for a SendGrid account if you haven't already."
  },
  {
    title: "2. Configure Inbound Parse",
    description: "Go to Settings > Inbound Parse in your SendGrid dashboard.",
    code: "https://app.sendgrid.com/settings/parse"
  },
  {
    title: "3. Add Host & URL",
    description: "Add your receiving domain (e.g., mail.yourdomain.com) and the Webhook URL found above.",
    note: "Ensure you add the '?secret=YOUR_SECRET' query parameter to the URL if validating via URL params, or rely on the custom header logic if supported."
  },
  {
    title: "4. MX Records",
    description: "Update your DNS MX records to point to mx.sendgrid.net for the subdomain you chose."
  }
];

export const MAILGUN_SETUP_STEPS = [
  {
    title: "1. Create Mailgun Account",
    description: "Sign up for Mailgun."
  },
  {
    title: "2. Configure Routes",
    description: "Go to Receiving > Routes.",
    code: "match_recipient('.*@yourdomain.com')"
  },
  {
    title: "3. Set Forwarding Action",
    description: "Set the action to 'store()' and 'forward()'. Enter your Webhook URL as the destination."
  }
];

export const IMAP_POLLING_STEPS = [
  {
    title: "1. Hostinger Email",
    description: "Ensure you have a Hostinger email account (e.g., invoices@yourdomain.com)."
  },
  {
    title: "2. Enable Access",
    description: "Verify that IMAP access is enabled for the account."
  },
  {
    title: "3. Configure Secrets",
    description: "You must set the IMAP_USER and IMAP_PASSWORD secrets in your Supabase Edge Function environment variables.",
    warning: "Do not store passwords in the database settings."
  }
];

export const MANUAL_IMPORT_STEPS = [
  {
    title: "Manual Upload",
    description: "You can drag and drop .eml or .msg files directly into the inbox list (coming soon)."
  },
  {
    title: "Trigger Import",
    description: "Click the 'Sync Now' button to manually trigger the IMAP polling function immediately."
  }
];