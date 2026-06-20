# Hostinger Email Intake Setup Guide

This document outlines the steps to configure inbound email processing for the Amazon Seller Operation platform, specifically targeting Hostinger email services via IMAP or forwarding.

## 1. Prerequisites
- **Supabase Project**: Ensure you have admin access.
- **Hostinger Email Account**: You need a valid email account (e.g., `invoices@yourdomain.com`).
- **Domain DNS Access**: If using SendGrid/Mailgun forwarding.

## 2. Database & Storage Setup
The system automatically creates the necessary tables and buckets when you run the migrations provided.
- **Tables**: `inbound_emails`, `inbound_email_attachments`, `integration_settings`.
- **Bucket**: `inbound-email` (Private).

## 3. Deployment Steps

### A. Deploy Edge Functions
You must deploy the provided edge functions to your Supabase project.

1. **Install Supabase CLI** (if not installed).
2. **Login**: `supabase login`
3. **Deploy**: