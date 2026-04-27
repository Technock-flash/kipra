'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

interface FinancialSummary {
  totalIncome: number | string;
  totalExpenses: number | string;
  netAmount: number | string;
}

interface Offering {
  id: string;
  category: string;
  amount: number | string;
  date: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number | string;
  date: string;
}

const toMoney = (value: number | string | undefined): string => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number.isFinite(num) ? num : 0
  );
};

export default function FinancePage() {
  const { hasPermission } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    amount: '',
    serviceType: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    vendor: '',
  });

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        const [summaryRes, offeringsRes, expensesRes] = await Promise.all([
          api.get('/finance/reports/summary'),
          api.get('/finance/offerings?limit=10&page=1'),
          api.get('/finance/expenses?limit=10&page=1'),
        ]);
        setSummary(summaryRes.data.data);
        setOfferings(offeringsRes.data.data ?? []);
        setExpenses(expensesRes.data.data ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load finance data');
      } finally {
        setIsLoading(false);
      }
    };

    loadFinanceData();
  }, []);

  const reloadFinanceData = async () => {
    const [summaryRes, offeringsRes, expensesRes] = await Promise.all([
      api.get('/finance/reports/summary'),
      api.get('/finance/offerings?limit=10&page=1'),
      api.get('/finance/expenses?limit=10&page=1'),
    ]);
    setSummary(summaryRes.data.data);
    setOfferings(offeringsRes.data.data ?? []);
    setExpenses(expensesRes.data.data ?? []);
  };

  const submitOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('finance:create')) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/finance/offerings', {
        date: new Date(`${form.date}T00:00:00.000Z`).toISOString(),
        category: form.category || undefined,
        amount: form.amount,
        serviceType: form.serviceType || undefined,
      });
      setForm({
        date: new Date().toISOString().slice(0, 10),
        category: '',
        amount: '',
        serviceType: '',
      });
      await reloadFinanceData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record offering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('finance:create')) return;
    setIsExpenseSubmitting(true);
    setError('');
    try {
      await api.post('/finance/expenses', {
        date: new Date(`${expenseForm.date}T00:00:00.000Z`).toISOString(),
        category: expenseForm.category,
        description: expenseForm.description,
        amount: expenseForm.amount,
        paymentMethod: expenseForm.paymentMethod,
        vendor: expenseForm.vendor || undefined,
      });
      setExpenseForm({
        date: new Date().toISOString().slice(0, 10),
        category: '',
        description: '',
        amount: '',
        paymentMethod: 'CASH',
        vendor: '',
      });
      await reloadFinanceData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setIsExpenseSubmitting(false);
    }
  };

  const cards = useMemo(
    () => [
      { label: 'Total Income', value: toMoney(summary?.totalIncome) },
      { label: 'Total Expenses', value: toMoney(summary?.totalExpenses) },
      { label: 'Net Balance', value: toMoney(summary?.netAmount) },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">Track giving, expenses, and financial health.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading finance data...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!isLoading && !error && (
        <>
          {hasPermission('finance:create') ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Record Offering</CardTitle>
                  <CardDescription>Create a new offering entry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={submitOffering}>
                  <div className="space-y-2">
                    <Label htmlFor="offeringDate">Date</Label>
                    <Input
                      id="offeringDate"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offeringAmount">Amount</Label>
                    <Input
                      id="offeringAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offeringCategory">Category</Label>
                    <Input
                      id="offeringCategory"
                      placeholder="Thanksgiving, Seed, etc."
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Input
                      id="serviceType"
                      placeholder="Sunday Service"
                      value={form.serviceType}
                      onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))}
                    />
                  </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Record Offering'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Record Expense</CardTitle>
                  <CardDescription>Create a new expense entry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={submitExpense}>
                    <div className="space-y-2">
                      <Label htmlFor="expenseDate">Date</Label>
                      <Input
                        id="expenseDate"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenseAmount">Amount</Label>
                      <Input
                        id="expenseAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenseCategory">Category</Label>
                      <Input
                        id="expenseCategory"
                        placeholder="Utilities, Outreach, etc."
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenseVendor">Vendor</Label>
                      <Input
                        id="expenseVendor"
                        placeholder="Optional vendor"
                        value={expenseForm.vendor}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendor: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="expenseDescription">Description</Label>
                      <Input
                        id="expenseDescription"
                        placeholder="What was this expense for?"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="expensePaymentMethod">Payment Method</Label>
                      <select
                        id="expensePaymentMethod"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={expenseForm.paymentMethod}
                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="CASH">Cash</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CARD">Card</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={isExpenseSubmitting}>
                        {isExpenseSubmitting ? 'Saving...' : 'Record Expense'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Finance</CardTitle>
                <CardDescription>You have report and view-only access for finance.</CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-2xl">{card.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Offerings</CardTitle>
              <CardDescription>Latest offering records captured in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerings.map((offering) => (
                      <tr key={offering.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{new Date(offering.date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{offering.category}</td>
                        <td className="py-2 pr-4">{toMoney(offering.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {offerings.length === 0 && (
                  <p className="text-sm text-muted-foreground py-3">No offerings found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Latest expense records captured in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{expense.category}</td>
                        <td className="py-2 pr-4">{expense.description}</td>
                        <td className="py-2 pr-4">{toMoney(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expenses.length === 0 && (
                  <p className="text-sm text-muted-foreground py-3">No expenses found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
