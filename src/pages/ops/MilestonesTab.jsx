import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function MilestonesTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    milestone_name: '',
    milestone_status: 'pending',
    target_date: '',
    completion_date: '',
    milestone_notes: ''
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        milestone_name: weeklyData.milestone_name || '',
        milestone_status: weeklyData.milestone_status || 'pending',
        target_date: weeklyData.target_date || '',
        completion_date: weeklyData.completion_date || '',
        milestone_notes: weeklyData.milestone_notes || ''
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('milestones_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const handleSave = () => { onSaveWeekly('milestones', data); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Current Week Milestone</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Weekly
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Milestone Name</Label>
            <Input type="text" name="milestone_name" value={data.milestone_name} onChange={handleChange} className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Status</Label>
            <select name="milestone_status" value={data.milestone_status} onChange={handleChange} className="w-full mt-1 border border-[hsl(var(--border))] rounded-md p-2 text-sm bg-white h-8">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Target Date</Label>
            <Input type="date" name="target_date" value={data.target_date} onChange={handleChange} className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Completion Date</Label>
            <Input type="date" name="completion_date" value={data.completion_date} onChange={handleChange} className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Notes</Label>
            <Input type="text" name="milestone_notes" value={data.milestone_notes} onChange={handleChange} className="mt-1 h-8" />
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="bg-white p-6 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Change History (Week {selectedWeek})</h3>
          {history.length === 0 ? (
            <p className="text-sm opacity-60">No changes recorded yet.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {history.map(record => (
                <div key={record.id} className="border-b pb-4 last:border-0">
                  <div className="text-xs text-[hsl(var(--cinder))] opacity-60 mb-2">
                    Changed at: {new Date(record.changed_at).toLocaleString()}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium border-b pb-1">Field</div>
                    <div className="font-medium border-b pb-1">Old Value</div>
                    <div className="font-medium border-b pb-1">New Value</div>
                    {record.changed_fields?.map(field => (
                      <React.Fragment key={field}>
                        <div className="opacity-80">{field}</div>
                        <div className="text-red-600 line-through">{record.old_values?.[field] ?? 'N/A'}</div>
                        <div className="text-green-600">{record.new_values?.[field] ?? 'N/A'}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}