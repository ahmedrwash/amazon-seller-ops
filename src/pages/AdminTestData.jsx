import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Database, Trash2, AlertOctagon } from 'lucide-react';
import { seedTestData } from '@/services/testDataService';
import { deleteTestData } from '@/services/testDataDeletionService';
import { useToast } from '@/components/ui/use-toast';
import TestDataStatusPanel from '@/components/TestDataStatusPanel';
import DeleteTestDataModal from '@/components/DeleteTestDataModal';

export default function AdminTestData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState('idle'); // idle, seeding, deleting
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSeed = async () => {
    if (!user) return;
    setStatus('seeding');
    setProgress('Starting batch operations...');
    setResults({});
    setError(null);
    setTimestamp(null);

    try {
      const res = await seedTestData(user.id);
      
      if (res.success) {
        setResults(res.results);
        toast({ title: "Seeding Complete", description: "Test data created successfully." });
      } else {
        setError(res.error || "Unknown error during seeding");
        setResults(res.results); // Partial results
        toast({ title: "Seeding Failed", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('idle');
      setTimestamp(new Date());
      setProgress('Completed');
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    setStatus('deleting');
    setProgress('Removing records in sequence...');
    setResults({});
    setError(null);
    setTimestamp(null);

    try {
      const res = await deleteTestData();
      
      if (res.success) {
        setResults(res.deletedCounts);
        toast({ title: "Deletion Complete", description: "Test data removed." });
      } else {
        setError(res.error);
        setResults(res.deletedCounts);
        toast({ title: "Deletion Failed", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('idle');
      setTimestamp(new Date());
      setProgress('Completed');
    }
  };

  const clearStatus = () => {
    setResults({});
    setError(null);
    setTimestamp(null);
    setProgress('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Test Data Management</h1>
        <p className="text-slate-400">Manage automated seed data for testing purposes.</p>
      </div>

      <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex items-center gap-3">
        <AlertOctagon className="text-red-500 w-6 h-6 flex-shrink-0" />
        <div>
          <h4 className="text-red-400 font-semibold text-sm">Restricted Area</h4>
          <p className="text-red-300/70 text-xs">
            Use cautiously. All generated data is tagged with <code className="bg-black/30 px-1 rounded">TEST_SEED_10_202601</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 flex flex-col items-center text-center hover:bg-slate-900 transition-colors">
          <Database className="w-12 h-12 text-[hsl(var(--terracotta))] mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Seed Data</h3>
          <p className="text-slate-400 text-sm mb-6">
            Generate 10 records for each module (Products, Tasks, Inventory, etc.) linked to current user.
          </p>
          <Button 
            onClick={handleSeed} 
            disabled={status !== 'idle'}
            className="w-full bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]"
          >
            Seed 10 Records
          </Button>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 flex flex-col items-center text-center hover:bg-slate-900 transition-colors">
          <Trash2 className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Clean Up</h3>
          <p className="text-slate-400 text-sm mb-6">
            Permanently remove all records tagged with the test marker across all modules.
          </p>
          <Button 
            variant="destructive"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={status !== 'idle'}
            className="w-full"
          >
            Delete Test Data
          </Button>
        </div>
      </div>

      <TestDataStatusPanel 
        status={status} 
        progress={progress} 
        results={results} 
        error={error} 
        timestamp={timestamp}
        onClear={clearStatus}
      />

      <DeleteTestDataModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete}
        isDeleting={status === 'deleting'}
      />
    </div>
  );
}