import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { emailIntegrationService } from '@/services/emailIntegrationService';

export function useWebhookConfig() {
  const [config, setConfig] = useState({
    url: '',
    secret: '',
    lastSync: null
  });
  const [stats, setStats] = useState({
    count24h: 0,
    health: 'unknown'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derive webhook URL from Supabase URL structure
  const projectUrl = supabase.supabaseUrl;
  const functionUrl = `${projectUrl}/functions/v1/inbound-email-webhook`;

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Secret - Use maybeSingle() to handle empty results gracefully (avoids PGRST116)
      const { data: settingData, error: settingError } = await supabase
        .from('integration_settings')
        .select('setting_value, updated_at')
        .eq('setting_key', 'inbound_email_secret')
        .maybeSingle();

      if (settingError) throw settingError;

      // 2. Get Last Email Timestamp - Use maybeSingle()
      const { data: lastEmail, error: lastEmailError } = await supabase
        .from('inbound_emails')
        .select('received_at')
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEmailError) throw lastEmailError;

      // 3. Get Count 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count, error: countError } = await supabase
        .from('inbound_emails')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', yesterday.toISOString());

      if (countError) throw countError;

      const lastReceived = lastEmail?.received_at || null;
      
      setConfig({
        url: functionUrl,
        secret: settingData?.setting_value || 'Not Configured',
        lastSync: lastReceived
      });

      setStats({
        count24h: count || 0,
        health: (count || 0) > 0 ? 'healthy' : (lastReceived ? 'inactive' : 'new')
      });

    } catch (err) {
      console.error('Error fetching webhook config:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [functionUrl]);

  const regenerateSecret = async () => {
    setLoading(true);
    const res = await emailIntegrationService.regenerateSecret();
    setLoading(false);
    if (res.success) {
      setConfig(prev => ({ ...prev, secret: res.secret }));
      return res.secret;
    } else {
      setError(res.error);
      return null;
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    const res = await emailIntegrationService.sendTestWebhook(config.url, config.secret);
    setLoading(false);
    return res;
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { 
    config, 
    stats, 
    loading, 
    error, 
    fetchConfig, 
    regenerateSecret,
    testWebhook
  };
}