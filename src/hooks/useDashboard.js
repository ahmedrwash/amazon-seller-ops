import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

// -- 1. Filter State Hook --
export const useDashboardFilters = () => {
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('dashboard_filters');
    return saved ? JSON.parse(saved) : { marketplaces: [], owners: [] };
  });

  useEffect(() => {
    localStorage.setItem('dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return { filters, updateFilters };
};

// -- 2. Refresh Control Hook --
export const useDashboardRefresh = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refresh = () => setRefreshTrigger(prev => prev + 1);
  return { refreshTrigger, refresh };
};

// -- 3. Auto Refresh Hook --
export const useAutoRefresh = (enabled, interval = 300000, onRefresh) => {
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      onRefresh();
    }, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, onRefresh]);
};

// -- 4. Data Hooks --

export const usePipelineSummary = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPipeline = async () => {
      setLoading(true);
      try {
        // Fetch product marketplaces and join with marketplace details
        const { data: pmData, error: pmError } = await supabase
          .from('product_marketplaces')
          .select(`
            id,
            stage,
            marketplace_id,
            marketplaces (
              name,
              code
            )
          `);

        if (pmError) throw pmError;

        // Aggregate data
        const aggregated = {};
        pmData.forEach(item => {
          const mName = item.marketplaces?.name || 'Unknown';
          if (!aggregated[mName]) {
            aggregated[mName] = {
              marketplace: mName,
              total: 0,
              Draft: 0,
              'In Progress': 0,
              'Ready to Launch': 0,
              'Live': 0,
              'Archived': 0
            };
          }
          aggregated[mName].total += 1;
          const stage = item.stage || 'Draft';
          if (aggregated[mName][stage] !== undefined) {
            aggregated[mName][stage] += 1;
          }
        });

        setData(Object.values(aggregated));
      } catch (err) {
        console.error('Error fetching pipeline summary:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, [refreshTrigger]);

  return { data, loading, error };
};

export const useHighPriorityProducts = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch items with blockers defined in product_marketplaces
        const { data: result, error: err } = await supabase
          .from('product_marketplaces')
          .select(`
            id,
            stage,
            blockers,
            priority,
            updated_at,
            owner,
            products (product_name),
            marketplaces (name)
          `)
          .not('blockers', 'is', null)
          .neq('blockers', '');

        if (err) throw err;

        // Transform to widget format
        const formatted = result.map(item => ({
          id: item.id,
          product_name: item.products?.product_name || 'Unknown Product',
          marketplace: item.marketplaces?.name || 'Unknown',
          blocker_type: 'Issue', // Generic for now as 'blockers' is text
          blocker_desc: item.blockers,
          created_at: item.updated_at, // Using updated as proxy
          owner: item.owner,
          priority: item.priority || 'Medium',
          status: 'Open'
        }));

        setData(formatted);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return { data, loading, error };
};

export const useTasksDue = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const { data: tasks, error: err } = await supabase
          .from('tasks')
          .select('*')
          .gte('due_date', today.toISOString())
          .lte('due_date', nextWeek.toISOString())
          .order('due_date', { ascending: true })
          .limit(20);

        if (err) throw err;
        setData(tasks);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return { data, loading, error };
};

export const useComplianceIssues = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: items, error: err } = await supabase
          .from('compliance_items')
          .select(`
            id,
            requirement,
            status,
            created_at,
            owner,
            product_marketplaces (
              products (product_name),
              marketplaces (name)
            )
          `)
          .neq('status', 'Compliant') // Assuming 'Compliant' means resolved
          .limit(20);

        if (err) throw err;
        
        const formatted = items.map(i => ({
          id: i.id,
          issue_type: 'Requirement',
          product_name: i.product_marketplaces?.products?.product_name,
          marketplace: i.product_marketplaces?.marketplaces?.name,
          description: i.requirement,
          created_at: i.created_at,
          severity: 'High', // Default
          status: i.status,
          owner: i.owner
        }));

        setData(formatted);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return { data, loading, error };
};

export const useLowInventoryAlerts = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch reorder alerts or raw inventory logic
        const { data: inventory, error: err } = await supabase
          .from('inventory')
          .select(`
            id,
            on_hand,
            reorder_point,
            product_marketplaces (
              products (product_name),
              marketplaces (name)
            ),
            warehouses (name)
          `)
          .not('reorder_point', 'is', null);

        if (err) throw err;

        // Filter in JS for simplicity or use complex RPC
        const alerts = inventory
          .filter(i => i.on_hand <= i.reorder_point)
          .map(i => ({
            id: i.id,
            product_name: i.product_marketplaces?.products?.product_name,
            marketplace: i.product_marketplaces?.marketplaces?.name,
            warehouse: i.warehouses?.name,
            on_hand: i.on_hand,
            reorder_point: i.reorder_point,
            status: i.on_hand === 0 ? 'Out of Stock' : 'Low Stock',
            days_until_stockout: 5 // Mock calculation, need sales velocity
          }));

        setData(alerts);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return { data, loading, error };
};

export const useProviderCommunications = (refreshTrigger) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: msgs, error: err } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (err) throw err;
        setData(msgs);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return { data, loading, error };
};