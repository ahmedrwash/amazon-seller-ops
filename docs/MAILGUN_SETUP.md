# Mailgun Integration Setup Guide

This guide details how to set up Mailgun to receive emails and forward them to your Supabase application.

## Prerequisites
- A Supabase Project
- A Mailgun Account (Free Flex plan is sufficient for testing)
- Access to your Domain's DNS records (optional, but recommended)

## Step 1: Configure Mailgun Domain
1.  Log in to Mailgun Dashboard.
2.  Go to **Sending** -> **Domains**.
3.  Click **Add New Domain**.
4.  Recommend using a subdomain like `parse.yourdomain.com` or `mg.yourdomain.com`.
5.  Follow the instructions to add the required TXT, MX, and CNAME records to your DNS provider (Cloudflare, GoDaddy, Hostinger, etc.).

## Step 2: Create a Route
1.  In Mailgun, go to **Receiving** -> **Routes**.
2.  Click **Create Route**.
3.  **Expression Type:** `Match Recipient`
4.  **Recipient:** `*@parse.yourdomain.com` (or your configured domain).
5.  **Actions:** `Store and Notify`.
6.  **Store and Notify URL:** Enter your Supabase Edge Function URL: