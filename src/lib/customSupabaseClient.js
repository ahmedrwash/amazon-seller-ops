import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ehanopftvshlbanmhrxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYW5vcGZ0dnNobGJhbm1ocnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTY4MDEsImV4cCI6MjA4Mzg3MjgwMX0.g4Mq59B-28BDQm-pDVxHcVuRjGN_A5KpYKwI3fR4wzs';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
