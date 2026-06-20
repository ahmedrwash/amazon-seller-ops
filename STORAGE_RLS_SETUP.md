# Storage RLS Configuration Guide

## Overview
Row Level Security (RLS) policies on Supabase Storage (`storage.objects`) control who can upload, read, update, or delete files. Without correct policies, users will encounter "Access Denied" or "new row violates row-level security policy" errors.

## Common Issues
- **Missing Policies**: No policies defined for a new bucket.
- **Wrong Role Check**: Checking `auth.role() = 'authenticated'` gives all logged-in users access, but sometimes you need role-specific access (e.g., only Admin).
- **Conflict**: Multiple overlapping policies can sometimes cause confusion, though PostgreSQL usually applies them as `OR` (permissive).

## Setup Instructions

### Option 1: Automatic Migration (Recommended)
This project includes a built-in migration that automatically sets up the correct policies for:
- **Admin**: Full Access
- **Ops/Finance**: Read/Write on `inbound-email` bucket
- **Others**: Read Only on `inbound-email` bucket

### Option 2: Manual SQL Setup
If you need to re-apply the policies manually, run the following SQL in your Supabase SQL Editor: