import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Edit2, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { formatRupees } from '../utils/calculator';

interface BalanceBarProps {
  openingBalance: number;
  onUpdateOpeningBalance: (newBalance: number) => void;
  onAddIncomeToOpening?: () => void;
  totalWorkIncome: number;
  totalFuelExpense: number;
  totalMaintenanceExpense: number;
  totalWorkerAdvance?: number;
  totalDiaryExpense?: number;
}

export const BalanceBar: React.FC<BalanceBarProps> = ({
  openingBalance,
  onUpdateOpeningBalance,
  totalWorkIncome,
  totalFuelExpense,
  totalMaintenanceExpense,
  totalWorkerAdvance = 0,
  totalDiaryExpense = 0,
}) => {
  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [tempOpening, setTempOpening] = useState(openingBalance.toString());

  // Total Expenses = Fuel + Maintenance + Worker Advance + Diary (if any)
  const totalExpenses = totalFuelExpense + totalMaintenanceExpense + totalWorkerAdvance + totalDiaryExpense;

  // Today's Net Calculation:
  // Income - Expenses = Profit (if positive) or Loss (if negative)
  const todayNet = totalWorkIncome - totalExpenses;
  const isProfit = todayNet >= 0;
  const todayProfit = isProfit ? todayNet : 0;
  const todayLoss = isProfit ? 0 : Math.abs(todayNet);

  // Available / Closing Balance:
  // Opening Balance + Profit (if profit) OR Opening Balance - Loss (if loss)
  const availableBalance = openingBalance + todayNet;

  const handleSaveOpening = () => {
    const val = parseFloat(tempOpening.replace(/[^0-9.-]/g, ''));
    if (!isNaN(val)) {
      onUpdateOpeningBalance(val);
    }
    setIsEditingOpening(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveOpening();
    } else if (e.key === 'Escape') {
      setTempOpening(openingBalance.toString());
      setIsEditingOpening(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[49px] z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 py-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
          {/* 1. Base Opening Balance (शुरुआती ओपनिंग) */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 flex flex-col justify-between transition-colors hover:border-slate-400">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <span>शुरुआती ओपनिंग (Opening)</span>
                  {!isEditingOpening && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempOpening(openingBalance.toString());
                        setIsEditingOpening(true);
                      }}
                      className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
                      title="ओपनिंग बैलेंस बदलें / Edit Opening"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">
                  Base
                </span>
              </div>

              {isEditingOpening ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    value={tempOpening}
                    onChange={(e) => setTempOpening(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveOpening}
                    autoFocus
                    className="w-28 bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs font-bold text-gray-900 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveOpening}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded cursor-pointer"
                    title="Save"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTempOpening(openingBalance.toString());
                    setIsEditingOpening(true);
                  }}
                  className="text-base sm:text-lg font-black font-mono text-slate-900 cursor-pointer hover:text-indigo-700 leading-tight mt-0.5"
                  title="Click to edit opening balance"
                >
                  ₹{formatRupees(openingBalance)}
                </div>
              )}
            </div>

            <div className="text-[10px] font-medium text-slate-500 mt-1 border-t border-slate-200 pt-1 flex items-center justify-between">
              <span>पिछला कैरी-ओवर</span>
              <span className="text-indigo-700 font-bold">शुरुआती रकम</span>
            </div>
          </div>

          {/* 2. Today's Work Income (आज का काम / कुल आमदनी) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg px-3 py-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  <span>आज का काम (Work Income)</span>
                  <ArrowUpRight className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">
                  + आमदनी
                </span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-blue-900 leading-tight mt-0.5">
                ₹{formatRupees(totalWorkIncome)}
              </div>
            </div>

            <div className="text-[10px] text-blue-700 font-medium mt-1 border-t border-blue-200/70 pt-1 flex items-center justify-between">
              <span>सभी गाड़ियों का ट्रिप काम</span>
              <span className="font-mono font-bold">+ Inflow</span>
            </div>
          </div>

          {/* 3. Today's Total Expenses (आज का कुल खर्च - डीजल + मेंटेनेंस + एडवांस) */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-lg px-3 py-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  <span>आज का कुल खर्च (Expenses)</span>
                  <ArrowDownRight className="w-3 h-3 text-rose-600" />
                </div>
                <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                  - खर्च
                </span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-rose-800 leading-tight mt-0.5">
                ₹{formatRupees(totalExpenses)}
              </div>
            </div>

            <div className="text-[10px] text-rose-800 font-mono mt-1 border-t border-rose-200/70 pt-1 truncate">
              डीजल: ₹{formatRupees(totalFuelExpense)} | काम: ₹{formatRupees(totalMaintenanceExpense)}
              {totalWorkerAdvance > 0 && ` | एडवांस: ₹${formatRupees(totalWorkerAdvance)}`}
              {totalDiaryExpense > 0 && ` | एक्स्ट्रा: ₹${formatRupees(totalDiaryExpense)}`}
            </div>
          </div>

          {/* 4. TODAY'S NET PROFIT/LOSS & AVAILABLE BALANCE */}
          {/* User requirement: "आज का प्रॉफिट हुआ तो ओपनिंग में ऐड होना चाहिए, लॉस हुआ तो ओपनिंग से माइनस होना चाहिए" */}
          <div
            className={`rounded-lg px-3 py-2 flex flex-col justify-between text-white shadow-2xs border ${
              isProfit
                ? 'bg-emerald-700 border-emerald-800'
                : 'bg-rose-700 border-rose-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                  {isProfit ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                      <span>आज का प्रॉफिट: +₹{formatRupees(todayProfit)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-200" />
                      <span>आज का लॉस: -₹{formatRupees(todayLoss)}</span>
                    </>
                  )}
                </div>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                    isProfit
                      ? 'bg-emerald-900/80 text-emerald-200'
                      : 'bg-rose-900/80 text-rose-200'
                  }`}
                >
                  {isProfit ? 'PROFIT (+)' : 'LOSS (-)'}
                </span>
              </div>

              {/* Total Available Balance */}
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <div className="text-base sm:text-xl font-black font-mono tracking-tight text-white leading-tight">
                  ₹{formatRupees(availableBalance)}
                </div>
                <span className="text-[10px] text-white/90 font-bold bg-white/20 px-1.5 py-0.2 rounded">
                  अवेलेबल बैलेंस
                </span>
              </div>
            </div>

            {/* Formula indicator showing profit added or loss subtracted */}
            <div className="text-[10px] font-mono mt-1 border-t border-white/20 pt-1 flex items-center justify-between text-white/90">
              {isProfit ? (
                <span>
                  ओपनिंग + प्रॉफिट (₹{formatRupees(openingBalance)} + ₹{formatRupees(todayProfit)})
                </span>
              ) : (
                <span>
                  ओपनिंग − लॉस (₹{formatRupees(openingBalance)} − ₹{formatRupees(todayLoss)})
                </span>
              )}
              <span className="font-bold">✓ Net</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


