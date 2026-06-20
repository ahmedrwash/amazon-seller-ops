import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { matchRules } from '@/utils/emailIntakeUtils';
import { CheckCircle, XCircle } from 'lucide-react';

const RuleTester = ({ rules }) => {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState(null);

  const handleTest = () => {
    const matched = matchRules(from, subject, rules);
    setResult(matched);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
       <CardHeader>
          <CardTitle className="text-lg text-white">Rule Tester</CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>From Address</Label>
                <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="sender@example.com" className="bg-slate-800 border-slate-700"/>
             </div>
             <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." className="bg-slate-800 border-slate-700"/>
             </div>
          </div>
          
          <Button onClick={handleTest} className="w-full bg-blue-600 hover:bg-blue-700">Test Rules</Button>
          
          {result !== null && (
             <div className="mt-4 p-4 rounded bg-slate-800 border border-slate-700 flex items-center gap-3">
                 <CheckCircle className="text-green-500 w-5 h-5" />
                 <div>
                    <p className="text-sm font-medium text-white">Matched Rule: <span className="text-green-400">{result.name}</span></p>
                    <p className="text-xs text-slate-400">Target: {result.default_target?.table || 'None'}</p>
                 </div>
             </div>
          )}
          {result === null && from && (
             <div className="mt-4 p-4 rounded bg-slate-800 border border-slate-700 flex items-center gap-3">
                 <XCircle className="text-slate-500 w-5 h-5" />
                 <p className="text-sm text-slate-400">No matching rule found.</p>
             </div>
          )}
       </CardContent>
    </Card>
  );
};

export default RuleTester;