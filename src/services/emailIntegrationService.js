import { supabase } from '@/lib/customSupabaseClient';

export const emailIntegrationService = {
  /**
   * Triggers the edge function to poll IMAP server for new emails
   */
  async importEmailsViaImap() {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase.functions.invoke('poll-imap-emails', {
        method: 'POST',
        body: JSON.stringify({}) 
      });
      
      if (error) throw error;
      return { success: true, count: data?.count || 0, message: data?.message };
    } catch (err) {
      console.error('IMAP Import Error:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Sends a test payload to the webhook to verify connectivity
   */
  async sendTestWebhook(webhookUrl, secret) {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const testPayload = {
        sender: "test@example.com",
        subject: "Test Webhook Event",
        body_text: "This is a test email sent from the configuration panel.",
        secret: secret
      };

      const { data, error } = await supabase.functions.invoke('inbound-email-webhook', {
        method: 'POST',
        body: JSON.stringify(testPayload)
      });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /**
   * Regenerates the shared secret used for webhook validation
   */
  async regenerateSecret() {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data, error } = await supabase
        .from('integration_settings')
        .upsert({ 
            setting_key: 'inbound_email_secret',
            setting_value: newSecret, 
            updated_at: new Date() 
        }, { onConflict: 'setting_key' })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error('Failed to retrieve updated secret setting');
      }

      return { success: true, secret: data.setting_value };
    } catch (err) {
      console.error('Error regenerating secret:', err);
      return { success: false, error: err };
    }
  },

  formatEmailForDisplay(email) {
    if (!email) return null;
    return {
      id: email.id,
      from: email.inbound_from,
      subject: email.subject,
      received: new Date(email.received_at).toLocaleString(),
      status: email.status
    };
  }
};