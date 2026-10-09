import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from '../api/transactions';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import {
  Plus,
  Trash2,
  Search,
  Filter,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
];

export default function Transactions() {
  const { userId, currentPeriod, formatCurrency } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  // Deleting item state
  const [deletingId, setDeletingId] = useState(null);

  const fetchTransactionsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactions(userId, currentPeriod);
      const list = Array.isArray(res) ? res : res?.transactions || [];
      setTransactions(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPeriod]);

  useEffect(() => {
    fetchTransactionsList();
  }, [fetchTransactionsList]);

  // Handle Add Transaction Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        user_id: String(userId),
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        type: formData.type,
      };

      await addTransaction(payload);
      setIsAddModalOpen(false);
      setFormData({
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
      });
      // Refresh list
      fetchTransactionsList();
    } catch (err) {
      setFormError(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    setDeletingId(id);
    try {
      await deleteTransaction(id, userId);
      // Remove locally or re-fetch
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(`Error deleting transaction: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      const descMatch = (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (searchQuery && !descMatch && !catMatch) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      // Type filter
      if (selectedType !== 'ALL') {
        const tType = t.type || (Number(t.amount) > 0 ? 'income' : 'expense');
        if (tType !== selectedType) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedCategory, selectedType]);

  // Compute stats on filtered list
  const filteredIncome = useMemo(() => {
    return filteredList
      .filter((t) => t.type === 'income' || (Number(t.amount) > 0 && t.type !== 'expense'))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [filteredList]);

  const filteredExpenses = useMemo(() => {
    return filteredList
      .filter((t) => t.type === 'expense' || Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [filteredList]);

  // Unique categories in current data
  const existingCategories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and categorize your income and expenditures
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Summary Pills on Filtered Data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="fintech-card p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Inflow</span>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">+{formatCurrency(filteredIncome)}</p>
        </div>
        <div className="fintech-card p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Outflow</span>
          <p className="text-lg font-bold text-rose-400 mt-0.5">-{formatCurrency(filteredExpenses)}</p>
        </div>
        <div className="fintech-card p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Records Found</span>
          <p className="text-lg font-bold text-white mt-0.5">{filteredList.length} of {transactions.length}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="fintech-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description or category..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchTransactionsList} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No transactions found"
          subtitle={
            transactions.length === 0
              ? 'No transactions recorded for this period yet.'
              : 'No transactions match your current search/filters.'
          }
          actionText={transactions.length === 0 ? 'Create First Transaction' : 'Clear Filters'}
          onAction={() => {
            if (transactions.length === 0) {
              setIsAddModalOpen(true);
            } else {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedType('ALL');
            }
          }}
        />
      ) : (
        <div className="fintech-card overflow-hidden">
          {/* Desktop / Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((tx) => {
                  const isIncome =
                    tx.type === 'income' || (Number(tx.amount) > 0 && tx.type !== 'expense');
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          <span className="capitalize">{tx.type || (isIncome ? 'income' : 'expense')}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-100 max-w-xs truncate">
                        {tx.description || <span className="text-slate-500 italic">No description</span>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700/60 font-medium">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {tx.date || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-70 group-hover:opacity-100 disabled:opacity-30"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (optimized for touch targets & zero horizontal overflow) */}
          <div className="sm:hidden divide-y divide-slate-800">
            {filteredList.map((tx) => {
              const isIncome =
                tx.type === 'income' || (Number(tx.amount) > 0 && tx.type !== 'expense');
              return (
                <div key={tx.id} className="p-4 space-y-2 hover:bg-slate-800/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-100 text-sm">
                        {tx.description || 'Transaction'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-medium">{tx.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="text-xs text-slate-500 hover:text-rose-400 mt-1 inline-flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Transaction
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              {/* Type selector tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'expense'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'income'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount (₸)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₸</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Supermarket shopping, Gas station"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
