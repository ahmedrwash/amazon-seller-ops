import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowDownRight, ArrowUpRight, Building2, Plus, Target, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCompanyFinance } from '@/hooks/useCompanyFinance';

const CATEGORIES = ['Sales', 'Services', 'Payroll', 'Contractors', 'Software', 'Marketing', 'Office', 'Professional Fees', 'Tax', 'Bank Fees', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

const money = (value, currency) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency, maximumFractionDigits: 2
}).format(Number(value || 0));

const MetricCard = ({ title, value, icon: Icon, tone = 'text-white' }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
    <div className="flex items-center justify-between text-sm text-slate-400"><span>{title}</span><Icon className="h-4 w-4" /></div>
    <p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p>
  </div>
);

export default function FinancePage() {
  const [month, setMonth] = useState(currentMonth);
  const [currency, setCurrency] = useState('USD');
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState({ occurred_on: today, direction: 'expense', category: 'Software', description: '', counterparty: '', amount: '', status: 'paid' });
  const [budget, setBudget] = useState({ category: 'Software', amount: '' });
  const { transactions, budgets, metrics, loading, error, createTransaction, deleteTransaction, upsertBudget } = useCompanyFinance(month, currency);
  const { toast } = useToast();

  const categorySpend = useMemo(() => transactions.filter((item) => item.direction === 'expense' && item.status !== 'cancelled')
    .reduce((result, item) => ({ ...result, [item.category]: (result[item.category] || 0) + Number(item.amount) }), {}), [transactions]);

  const saveTransaction = async () => {
    if (!transaction.description.trim() || Number(transaction.amount) <= 0) return;
    setSaving(true);
    const result = await createTransaction({ ...transaction, amount: Number(transaction.amount) });
    setSaving(false);
    if (result.error) return toast({ title: 'Could not save transaction', description: result.error.message, variant: 'destructive' });
    setTransactionOpen(false);
    setTransaction({ occurred_on: today, direction: 'expense', category: 'Software', description: '', counterparty: '', amount: '', status: 'paid' });
    toast({ title: 'Transaction saved' });
  };

  const saveBudget = async () => {
    if (Number(budget.amount) < 0) return;
    setSaving(true);
    const result = await upsertBudget(budget);
    setSaving(false);
    if (result.error) return toast({ title: 'Could not save budget', description: result.error.message, variant: 'destructive' });
    setBudgetOpen(false);
    toast({ title: 'Budget saved' });
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Framelens Finance</title></Helmet>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[hsl(var(--terracotta))]"><Building2 className="h-5 w-5" /><span className="text-sm font-medium">Framelens Company</span></div>
          <h1 className="mt-1 text-3xl font-bold text-white">Finance & Profitability</h1>
          <p className="mt-1 text-slate-400">Company income, operating expenses, budgets, and monthly profit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-40 bg-slate-900" />
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white">
            {['USD', 'SAR', 'AED', 'EUR', 'GBP'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button variant="outline" onClick={() => setBudgetOpen(true)}><Target className="mr-2 h-4 w-4" />Set budget</Button>
          <Button onClick={() => setTransactionOpen(true)}><Plus className="mr-2 h-4 w-4" />Add transaction</Button>
        </div>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="border border-slate-800 bg-slate-900">
          <TabsTrigger value="company">Framelens Company</TabsTrigger>
          <TabsTrigger value="amazon">Amazon Product Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="company" className="mt-6 space-y-6">
          {error && <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">{error.message}</div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="Income" value={money(metrics.income, currency)} icon={ArrowUpRight} tone="text-emerald-400" />
            <MetricCard title="Expenses" value={money(metrics.expenses, currency)} icon={ArrowDownRight} tone="text-rose-400" />
            <MetricCard title="Net profit" value={money(metrics.netProfit, currency)} icon={Wallet} tone={metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <MetricCard title="Expense budget" value={money(metrics.budget, currency)} icon={Target} />
            <MetricCard title="Budget remaining" value={money(metrics.budgetRemaining, currency)} icon={Target} tone={metrics.budgetRemaining >= 0 ? 'text-white' : 'text-rose-400'} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-white">Transaction ledger</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400"><tr>{['Date', 'Description', 'Category', 'Status', 'Amount', ''].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((item) => <tr key={item.id} className="text-slate-300">
                      <td className="px-4 py-3">{item.occurred_on}</td><td className="px-4 py-3"><p className="font-medium text-white">{item.description}</p><p className="text-xs text-slate-500">{item.counterparty || '—'}</p></td>
                      <td className="px-4 py-3">{item.category}</td><td className="px-4 py-3 capitalize">{item.status}</td>
                      <td className={`px-4 py-3 text-right font-medium ${item.direction === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.direction === 'income' ? '+' : '−'}{money(item.amount, item.currency)}</td>
                      <td className="px-4 py-3"><Button variant="ghost" size="icon" onClick={() => deleteTransaction(item.id)}><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>)}
                    {!loading && transactions.length === 0 && <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No transactions for this month.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold text-white">Budget by category</h2>
              <div className="mt-5 space-y-4">
                {budgets.map((item) => {
                  const spent = categorySpend[item.category] || 0;
                  const percentage = Number(item.amount) ? Math.min(100, spent / Number(item.amount) * 100) : 0;
                  return <div key={item.id}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{item.category}</span><span className="text-slate-500">{money(spent, currency)} / {money(item.amount, currency)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${spent > Number(item.amount) ? 'bg-rose-500' : 'bg-[hsl(var(--terracotta))]'}`} style={{ width: `${percentage}%` }} /></div></div>;
                })}
                {!budgets.length && <p className="py-8 text-center text-sm text-slate-500">No budgets set for this month.</p>}
              </div>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="amazon" className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center"><h2 className="text-xl font-semibold text-white">Amazon Product Finance</h2><p className="mt-2 text-slate-400">Reserved for revenue, fees, COGS, and profitability per product.</p></TabsContent>
      </Tabs>

      <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}><DialogContent className="border-slate-800 bg-slate-900 text-white"><DialogHeader><DialogTitle>Add company transaction</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Date</Label><Input type="date" value={transaction.occurred_on} onChange={(e) => setTransaction({ ...transaction, occurred_on: e.target.value })} /></div>
        <div><Label>Type</Label><select value={transaction.direction} onChange={(e) => setTransaction({ ...transaction, direction: e.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3"><option value="income">Income</option><option value="expense">Expense</option></select></div>
        <div><Label>Category</Label><select value={transaction.category} onChange={(e) => setTransaction({ ...transaction, category: e.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div><Label>Amount ({currency})</Label><Input type="number" min="0.01" step="0.01" value={transaction.amount} onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Input value={transaction.description} onChange={(e) => setTransaction({ ...transaction, description: e.target.value })} placeholder="What was this transaction for?" /></div>
        <div><Label>Counterparty</Label><Input value={transaction.counterparty} onChange={(e) => setTransaction({ ...transaction, counterparty: e.target.value })} /></div>
        <div><Label>Status</Label><select value={transaction.status} onChange={(e) => setTransaction({ ...transaction, status: e.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3"><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></div>
      </div><Button disabled={saving} onClick={saveTransaction}>{saving ? 'Saving…' : 'Save transaction'}</Button></DialogContent></Dialog>

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}><DialogContent className="border-slate-800 bg-slate-900 text-white"><DialogHeader><DialogTitle>Set monthly expense budget</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Category</Label><select value={budget.category} onChange={(e) => setBudget({ ...budget, category: e.target.value })} className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3">{CATEGORIES.filter((item) => item !== 'Sales' && item !== 'Services').map((item) => <option key={item}>{item}</option>)}</select></div><div><Label>Budget ({currency})</Label><Input type="number" min="0" step="0.01" value={budget.amount} onChange={(e) => setBudget({ ...budget, amount: e.target.value })} /></div></div><Button disabled={saving} onClick={saveBudget}>{saving ? 'Saving…' : 'Save budget'}</Button></DialogContent></Dialog>
    </div>
  );
}