import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const monthBounds = (month) => {
  const start = `${month}-01`;
  const date = new Date(`${start}T00:00:00`);
  date.setMonth(date.getMonth() + 1);
  return { start, end: date.toISOString().slice(0, 10) };
};

export function useCompanyFinance(month, currency) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end } = monthBounds(month);
    const [transactionsResult, budgetsResult, accountsResult] = await Promise.all([
      supabase.from('company_finance_transactions').select('*')
        .gte('occurred_on', start).lt('occurred_on', end)
        .eq('currency', currency).order('occurred_on', { ascending: false }),
      supabase.from('company_finance_budgets').select('*')
        .eq('month', start).eq('currency', currency).order('category'),
      supabase.from('company_finance_accounts').select('*').eq('active', true).order('account_code')
    ]);
    const nextError = transactionsResult.error || budgetsResult.error || accountsResult.error;
    if (nextError) setError(nextError);
    setTransactions(transactionsResult.data || []);
    setBudgets(budgetsResult.data || []);
    setAccounts(accountsResult.data || []);
    setLoading(false);
  }, [month, currency]);

  useEffect(() => { refresh(); }, [refresh]);

  const createTransaction = async (values) => {
    const { data: { user } } = await supabase.auth.getUser();
    const result = await supabase.from('company_finance_transactions')
      .insert({ ...values, currency, created_by: user.id }).select().single();
    if (!result.error) await refresh();
    return result;
  };

  const deleteTransaction = async (id) => {
    const result = await supabase.from('company_finance_transactions').delete().eq('id', id);
    if (!result.error) await refresh();
    return result;
  };

  const upsertBudget = async ({ category, amount }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const result = await supabase.from('company_finance_budgets').upsert({
      month: `${month}-01`, category, amount: Number(amount), currency, created_by: user.id
    }, { onConflict: 'month,category,currency' }).select().single();
    if (!result.error) await refresh();
    return result;
  };

  const metrics = useMemo(() => {
    const active = transactions.filter((item) => item.status !== 'cancelled');
    const income = active.filter((item) => item.direction === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = active.filter((item) => item.direction === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const budget = budgets.reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, expenses, netProfit: income - expenses, budget, budgetRemaining: budget - expenses };
  }, [transactions, budgets]);

  return { transactions, budgets, accounts, metrics, loading, error, refresh, createTransaction, deleteTransaction, upsertBudget };
}

