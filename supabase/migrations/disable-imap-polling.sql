-- Migration: Disable IMAP Polling Schedule
-- Description: Disables the pg_cron schedule for poll-imap-emails to prevent 502 errors and resource exhaustion.
-- Author: Hostinger Horizons
-- Date: 2026-01-17

DO $$
BEGIN
    -- Check if pg_cron extension is enabled and schedule exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Attempt to unschedule. Note: job name usually matches what was set in previous migrations.
        -- Assuming job name was 'poll-imap-emails-job' or we identify by command.
        
        -- Option A: Unschedule by name if known (Common pattern)
        PERFORM cron.unschedule('poll-imap-emails-job');

        -- Option B: Delete by command content just in case name differs
        DELETE FROM cron.job WHERE command LIKE '%poll-imap-emails%';
        
        RAISE NOTICE 'IMAP Polling cron job has been disabled.';
    ELSE
        RAISE NOTICE 'pg_cron extension not found or not active. No action taken.';
    END IF;
END $$;