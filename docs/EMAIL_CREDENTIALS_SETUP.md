# Email Credentials Setup Guide

This guide explains how to configure the email credential management system for the Amazon Seller Operation platform. This system allows the application to connect to external email accounts via IMAP to import invoices and supplier communications.

## 1. Prerequisites

### Database Extensions
The system uses `pgcrypto` for database-level encryption features (optional but recommended) and UUID generation.
Ensure the extension is enabled in your Supabase project: