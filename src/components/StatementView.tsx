import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { StatementTransaction, TransactionType, Vehicle } from '../types';
import { formatDisplayDate, formatRupees, getTodayDateString } from '../utils/calculator';
import { exportStatementToWord } from '../utils/exportWord';

interface StatementViewProps {
  statements: StatementTransaction[];
  vehicles: Vehicle[];
  onOpenPrint: () => void;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export const StatementView: React.FC<StatementViewProps> = ({
  statements,
  vehicles,
  onOpenPrint,
}) => {
  const today = getTodayDateString();
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Preset change
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const firstStr = firstDay.toISOString().split('T')[0];
      setFromDate(firstStr);
      setToDate(today);
    } else if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setFromDate(`${year}-${month}-01`);
      setToDate(today);
    }
  };

  // Filter statements
  const filteredStatements = useMemo(() => {
    return statements.filter((tx) => {
      // Date filter
      if (datePreset !== 'all') {
        if (fromDate && tx.date < fromDate) return false;
        if (toDate && tx.date > toDate) return false;
      }

      // Vehicle filter
      if (selectedVehicle !== 'all') {
        if (tx.vehicleId !== selectedVehicle && !tx.category.toLowerCase().includes(selectedVehicle.toLowerCase())) {
          return false;
        }
      }

      // Transaction Type filter
      if (selectedType !== 'all') {
        if (tx.type !== selectedType) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${tx.category} ${tx.description} ${tx.date} ${tx.debit || ''} ${tx.credit || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [statements, datePreset, fromDate, toDate, selectedVehicle, selectedType, searchQuery]);

  // Aggregate totals
  const aggregates = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let fuelTotal = 0;
    let maintTotal = 0;
    let diaryTotal = 0;
    let workIncomeTotal = 0;

    filteredStatements.forEach((tx) => {
      if (tx.credit) {
        totalCredit += tx.credit;
        if (tx.type === 'WORK_INCOME') workIncomeTotal += tx.credit;
      }
      if (tx.debit) {
        totalDebit += tx.debit;
        if (tx.type === 'FUEL') fuelTotal += tx.debit;
        if (tx.type === 'MAINTENANCE') maintTotal += tx.debit;
        if (tx.type === 'DIARY') diaryTotal += tx.debit;
      }
    });

    const closingBalance = filteredStatements.length > 0
      ? filteredStatements[filteredStatements.length - 1].balance
      : 0;

    return {
      totalCredit,
      totalDebit,
      fuelTotal,
      maintTotal,
      diaryTotal,
      workIncomeTotal,
      closingBalance,
    };
  }, [filteredStatements]);

  // Word Export (.doc) - Opens directly in Microsoft Word
  const handleExportWord = () => {
    exportStatementToWord(filteredStatements, {
      fileName: `SATYAM_Statement_${fromDate || today}_to_${toDate || today}.doc`,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  // CSV Export (Excel)
  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Category', 'Description', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'];
    const rows = filteredStatements.map((tx) => [
      tx.date,
      tx.time || '',
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.debit || '',
      tx.credit || '',
      tx.balance,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SATYAM_Statement_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Statement Filter Toolbar */}
      <div className="bg-white border border-gray-300 rounded-lg p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Account Statement & Running Ledger</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
              {filteredStatements.length} Transactions
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-export-word"
              type="button"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-md text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Download Microsoft Word Document (.doc) - Word में ओपन होगा"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>Export Word (वर्ड में खोलें)</span>
            </button>
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 rounded-md text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              title="Download Excel / CSV spreadsheet file"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>CSV (Excel)</span>
            </button>
            <button
              id="btn-export-pdf"
              type="button"
              onClick={onOpenPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="View, Print & Save as PDF statement report"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export PDF / Print (पीडीएफ)</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Preset / Range */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Date Range</label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
              className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* From / To Date */}
          {datePreset === 'custom' ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
            </>
          ) : null}

          {/* Vehicle Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.name || `${v.type} ${v.number}`}>
                  {v.name || `${v.type} ${v.number}`}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="WORK_INCOME">Work Income Only</option>
              <option value="FUEL">Fuel Only</option>
              <option value="MAINTENANCE">Maintenance Only</option>
              <option value="DIARY">Diary Expense Only</option>
              <option value="OPENING">Opening Balance Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div className={datePreset === 'custom' ? 'col-span-full' : 'sm:col-span-2 lg:col-span-2'}>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Search Statement</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trip, driver, bill description, voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Total Work Income</span>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {formatRupees(aggregates.workIncomeTotal)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Fuel Expense</span>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-700 mt-0.5">
            {formatRupees(aggregates.fuelTotal)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Maint. & Diary Expense</span>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-700 mt-0.5">
            {formatRupees(aggregates.maintTotal + aggregates.diaryTotal)}
          </div>
          <span className="text-[10px] text-gray-400">
            Maint: {formatRupees(aggregates.maintTotal)} | Diary: {formatRupees(aggregates.diaryTotal)}
          </span>
        </div>

        <div className="bg-blue-600 text-white rounded-lg p-2.5 sm:p-3 shadow-xs">
          <span className="text-[11px] font-bold text-blue-100 uppercase">Closing Available Balance</span>
          <div className="text-base sm:text-lg font-black font-mono mt-0.5">
            {formatRupees(aggregates.closingBalance)}
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-xs">
                <th className="py-2.5 px-3 border-r border-gray-300 w-28">Date</th>
                <th className="py-2.5 px-3 border-r border-gray-300 w-44">Vehicle / Category</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Description</th>
                <th className="py-2.5 px-3 border-r border-gray-300 w-32 text-right text-rose-800">Debit (−)</th>
                <th className="py-2.5 px-3 border-r border-gray-300 w-32 text-right text-emerald-800">Credit (+)</th>
                <th className="py-2.5 px-3 w-36 text-right text-gray-900 bg-gray-200/60">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    No ledger transactions matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStatements.map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-2 px-3 border-r border-gray-200 font-mono text-gray-600">
                      {formatDisplayDate(tx.date)}
                      {tx.time && <span className="text-[10px] text-gray-400 block">{tx.time}</span>}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.credit ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{tx.category}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 text-gray-700">
                      {tx.description}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 text-right font-mono font-semibold text-rose-700">
                      {tx.debit ? formatRupees(tx.debit) : '—'}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 text-right font-mono font-semibold text-emerald-700">
                      {tx.credit ? formatRupees(tx.credit) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 bg-gray-50/50">
                      {formatRupees(tx.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredStatements.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold text-xs sm:text-sm text-gray-900">
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-gray-600">
                    Filter Period Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                    {formatRupees(aggregates.totalDebit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    {formatRupees(aggregates.totalCredit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-base font-black text-blue-900 bg-blue-50/60">
                    {formatRupees(aggregates.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
