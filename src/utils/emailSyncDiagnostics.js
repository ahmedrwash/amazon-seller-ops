import { supabase } from '@/lib/customSupabaseClient';

export const runEmailDiagnostics = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    status: 'running',
    checks: [],
    errors: [],
    warnings: [],
    system_info: {}
  };

  try {
    // 1. Check Auth / Connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    report.checks.push({
      name: 'Supabase Connection',
      status: authError ? 'failed' : 'passed',
      details: authError ? authError.message : `Connected as ${user?.email}`
    });

    if (authError) throw new Error('Authentication failed');

    // 2. Check Credentials Table
    const { data: credentials, error: credError } = await supabase
      .from('email_credentials')
      .select('*');
    
    report.checks.push({
      name: 'Credentials Table Access',
      status: credError ? 'failed' : 'passed',
      details: credError ? credError.message : `Found ${credentials?.length || 0} credential records`
    });

    if (credentials) {
      const activeCreds = credentials.filter(c => c.is_active);
      report.system_info.total_credentials = credentials.length;
      report.system_info.active_credentials = activeCreds.length;

      if (activeCreds.length === 0) {
        report.warnings.push('No active email credentials found. Sync will not run.');
      } else {
        const untested = activeCreds.filter(c => !c.last_tested_at);
        if (untested.length > 0) report.warnings.push(`${untested.length} active credentials have never been tested.`);
        
        const failed = activeCreds.filter(c => c.test_status === 'Failed');
        if (failed.length > 0) report.errors.push(`${failed.length} active credentials are failing connection tests.`);
      }
    }

    // 3. Check Intake Table (New Table)
    const { count: intakeCount, error: intakeError } = await supabase
      .from('email_intake')
      .select('*', { count: 'exact', head: true });

    report.checks.push({
      name: 'Email Intake Table Access',
      status: intakeError ? 'failed' : 'passed',
      details: intakeError ? intakeError.message : `Table accessible. Row count: ${intakeCount}`
    });

    if (intakeError && intakeError.code === '42P01') {
      report.errors.push('Table "email_intake" does not exist. Please run the migration.');
    }

    // 4. Check Attachments Table
    const { error: attachError } = await supabase
      .from('email_intake_attachments')
      .select('id')
      .limit(1);

    report.checks.push({
      name: 'Attachments Table Access',
      status: attachError ? 'failed' : 'passed',
      details: attachError ? attachError.message : 'Table accessible'
    });

    // 5. Check Edge Functions (via a simple ping or check if they are registered in a log table if available)
    // We can't directly check if an edge function "exists" via JS client without invoking it.
    // We will skip direct invocation here to avoid side effects, but we can check logs if we had access to a logs table.
    
    report.status = report.errors.length > 0 ? 'failed' : 'healthy';

  } catch (err) {
    report.status = 'crashed';
    report.errors.push(`Diagnostic crash: ${err.message}`);
  }

  return report;
};