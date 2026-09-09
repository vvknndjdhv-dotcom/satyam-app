import React, { useRef } from 'react';
import { X, Printer, Download, Check, FileText } from 'lucide-react';
import { StatementTransaction } from '../types';
import { formatDisplayDate, formatRupees, getTodayDateString } from '../utils/calculator';
import { exportStatementToWord } from '../utils/exportWord';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statements: StatementTransaction[];
  openingBalance: number;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  statements,
  openingBalance,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Calculate summary metrics
  let totalWorkIncome = 0;
  let totalFuelExpense = 0;
  let totalMaintenance = 0;
  let totalDiaryExpense = 0;

  statements.forEach((tx) => {
    if (tx.credit && tx.type === 'WORK_INCOME') {
      totalWorkIncome += tx.credit;
    }
    if (tx.debit) {
      if (tx.type === 'FUEL') totalFuelExpense += tx.debit;
      else if (tx.type === 'MAINTENANCE') totalMaintenance += tx.debit;
      else if (tx.type === 'DIARY') totalDiaryExpense += tx.debit;
    }
  });

  const totalExpenses = totalFuelExpense + totalMaintenance + totalDiaryExpense;
  const closingBalance = statements.length > 0
    ? statements[statements.length - 1].balance
    : openingBalance + totalWorkIncome - totalExpenses;

  const dates = statements.map((s) => s.date).sort();
  const fromDate = dates[0] || getTodayDateString();
  const toDate = dates[dates.length - 1] || getTodayDateString();

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportStatementToWord(statements, {
      openingBalance,
      fromDate,
      toDate,
      fileName: `SATYAM_Statement_${fromDate}_to_${toDate}.doc`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-gray-800" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Account Statement & PDF Print Preview
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Microsoft Word Document (.doc) डाउनलोड करें - सीधे Word में खुलेगा"
            >
              <FileText className="w-4 h-4" />
              <span>Word (.doc) डाउनलोड</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-md text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 overflow-y-auto print:overflow-visible print:p-0 text-gray-900 font-sans"
        >
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">
                SATYAM
              </h1>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-600">
                Account Statement
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Daily Vehicle Work, Fuel, Maintenance & Cash Expense Ledger
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-semibold uppercase text-gray-500">Date Range</div>
              <div className="text-sm font-bold font-mono text-gray-900">
                {formatDisplayDate(fromDate)} – {formatDisplayDate(toDate)}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Statement Summary Box */}
          <div className="my-6 bg-gray-50 border border-gray-300 rounded-md p-4 print:bg-white print:border-gray-400">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 border-b border-gray-200 pb-1.5">
              Executive Statement Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 text-xs block">Base Opening Balance</span>
                <span className="font-bold font-mono text-gray-900 text-sm sm:text-base">
                  {formatRupees(openingBalance)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Total Work Income (+)</span>
                <span className="font-bold font-mono text-emerald-700 text-sm sm:text-base">
                  {formatRupees(totalWorkIncome)}
                </span>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-300 rounded p-1.5 print:border-gray-400">
                <span className="text-emerald-800 text-xs font-bold block">Opening + Work Income</span>
                <span className="font-black font-mono text-emerald-900 text-sm sm:text-base">
                  {formatRupees(openingBalance + totalWorkIncome)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Total All Expenses (−)</span>
                <span className="font-bold font-mono text-rose-700 text-sm sm:text-base">
                  {formatRupees(totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Fuel Expense</span>
                <span className="font-medium font-mono text-rose-600 text-xs sm:text-sm">
                  {formatRupees(totalFuelExpense)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Maint. + Diary Expense</span>
                <span className="font-medium font-mono text-rose-600 text-xs sm:text-sm">
                  {formatRupees(totalMaintenance + totalDiaryExpense)}
                </span>
              </div>
              <div className="sm:col-span-2 bg-gray-900 text-white p-2.5 rounded print:bg-gray-200 print:text-gray-900 print:border print:border-gray-400">
                <span className="text-gray-300 print:text-gray-600 text-xs font-semibold block">
                  Closing / Available Balance
                </span>
                <span className="font-black font-mono text-lg sm:text-xl">
                  {formatRupees(closingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300 uppercase text-[11px]">
                  <th className="py-2 px-2.5 border-r border-gray-300 w-24">Date</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 w-36">Vehicle / Category</th>
                  <th className="py-2 px-2.5 border-r border-gray-300">Description</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 w-28 text-right">Debit (−)</th>
                  <th className="py-2 px-2.5 border-r border-gray-300 w-28 text-right">Credit (+)</th>
                  <th className="py-2 px-2.5 w-32 text-right bg-gray-200/60">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statements.map((tx, idx) => (
                  <tr key={tx.id || idx} className="divide-x divide-gray-200">
                    <td className="py-1.5 px-2.5 font-mono text-gray-700">
                      {formatDisplayDate(tx.date)}
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-gray-900">
                      {tx.category}
                    </td>
                    <td className="py-1.5 px-2.5 text-gray-700">
                      {tx.description}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono text-rose-700 font-semibold">
                      {tx.debit ? formatRupees(tx.debit) : '—'}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700 font-semibold">
                      {tx.credit ? formatRupees(tx.credit) : '—'}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-gray-900 bg-gray-50/50">
                      {formatRupees(tx.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold text-xs">
                  <td colSpan={3} className="py-2 px-2.5 text-right uppercase tracking-wider">
                    Total Transactions:
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-rose-700">
                    {formatRupees(totalExpenses)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-emerald-700">
                    {formatRupees(totalWorkIncome + (statements.find((s) => s.type === 'OPENING')?.credit || 0))}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-sm font-black text-gray-900 bg-gray-200">
                    {formatRupees(closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
            <span>SATYAM Daily Entry & Fleet Management System</span>
            <span>Authorized Signature / Stamp ____________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
