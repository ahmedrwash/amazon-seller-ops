import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mail, Settings, Globe, Save } from 'lucide-react';

const EmailForwardingSetupGuide = ({ webhookUrl }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          Setup Guide: Hostinger Email Forwarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800"></div>
            
            {/* Step 1 */}
            <div className="relative flex gap-4 mb-8">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 text-blue-400 flex items-center justify-center font-bold z-10">
                    1
                </div>
                <div className="space-y-2 pt-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        Log in to Hostinger
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        Emails
                    </h4>
                    <p className="text-slate-400 text-sm">
                        Navigate to your Hostinger dashboard, click on "Emails" in the top navigation bar, and select your domain (framelens.com).
                    </p>
                </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-4 mb-8">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 text-blue-400 flex items-center justify-center font-bold z-10">
                    2
                </div>
                <div className="space-y-2 pt-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        Select Account & Find Forwarders
                        <Settings className="w-4 h-4 text-slate-500" />
                    </h4>
                    <p className="text-slate-400 text-sm">
                        Click "Manage" next to the email account you want to use (e.g., admin@framelens.com). In the left sidebar or settings menu, look for "Forwarders" or "Email Forwarding".
                    </p>
                </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-4 mb-8">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 text-blue-400 flex items-center justify-center font-bold z-10">
                    3
                </div>
                <div className="space-y-2 pt-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        Add New Forwarder
                        <Globe className="w-4 h-4 text-slate-500" />
                    </h4>
                    <p className="text-slate-400 text-sm">
                        Create a new forwarder. 
                        <br/>
                        <strong>Important:</strong> Hostinger may not support direct HTTP POST forwarding natively in all plans. If "Webhook" isn't an option, you must forward to a service like <strong>Cloudmailin</strong>, <strong>SendGrid Inbound Parse</strong>, or <strong>Mailgun Routes</strong> first.
                    </p>
                    <div className="p-3 bg-amber-900/20 border border-amber-800 rounded text-amber-200 text-sm">
                        If Hostinger only supports email-to-email forwarding, please set up a Mailgun or SendGrid account, get their inbound email address, and forward to THAT address. Then configure the Webhook URL in Mailgun/SendGrid.
                    </div>
                </div>
            </div>

             {/* Step 4 */}
             <div className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 text-blue-400 flex items-center justify-center font-bold z-10">
                    4
                </div>
                <div className="space-y-2 pt-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        Save & Verify
                        <Save className="w-4 h-4 text-slate-500" />
                    </h4>
                    <p className="text-slate-400 text-sm">
                        Save the configuration. Send a test email to <strong>admin@framelens.com</strong>. Wait ~5 minutes and check the "Webhook Logs" on this page.
                    </p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailForwardingSetupGuide;