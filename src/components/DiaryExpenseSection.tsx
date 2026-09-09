import React from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { DiaryExpense } from '../types';
import { formatDisplayDate, formatRupees } from '../utils/calculator';

interface DiaryExpenseSectionProps {
  expenses: DiaryExpense[];
  onDeleteExpense: (id: string) => void;
  onOpenAddDiary: () => void;
}

export const DiaryExpenseSection: React.FC<DiaryExpenseSectionProps> = ({
  expenses,
  onDeleteExpense,
  onOpenAddDiary,
}) => {
  const diaryTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="w-full bg-white border border-gray-300 rounded shadow-2xs overflow-hidden mt-4">
      {/* Header */}
      <div className="bg-gray-100/90 border-b border-gray-300 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-gray-700" />
          <h3 className="text-xs font-bold text-gray-900">
            Diary / Daily Cash Expenses (खर्चा)
          </h3>
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            (Worker advances, site food, repairs, office & cash purchases)
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenAddDiary}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded text-[11px] font-semibold shadow-2xs transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>+ Add Diary / खर्चा</span>
        </button>
      </div>

      {/* Spreadsheet List */}
      {expenses.length === 0 ? (
        <div className="p-3 text-center text-xs text-gray-500 bg-gray-50/50">
          No separate diary expenses logged for today yet.
          <button
            type="button"
            onClick={onOpenAddDiary}
            className="text-amber-700 font-semibold ml-1 hover:underline"
          >
            Click to add cash expense
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300 text-[11px] uppercase tracking-wider">
                <th className="py-1 px-2.5 border-r border-gray-300 w-24">Date</th>
                <th className="py-1 px-2.5 border-r border-gray-300 w-36">Expense Name</th>
                <th className="py-1 px-2.5 border-r border-gray-300">Description / Details</th>
                <th className="py-1 px-2.5 border-r border-gray-300 w-28 text-right">Amount</th>
                <th className="py-1 px-1.5 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-1 px-2.5 border-r border-gray-200 text-gray-600 font-mono text-[11px]">
                    {formatDisplayDate(item.date)}
                    {item.time && <span className="text-[9px] text-gray-400 block">{item.time}</span>}
                  </td>
                  <td className="py-1 px-2.5 border-r border-gray-200 font-semibold text-gray-800">
                    {item.name}
                  </td>
                  <td className="py-1 px-2.5 border-r border-gray-200 text-gray-700 font-sans">
                    {item.description || '—'}
                  </td>
                  <td className="py-1 px-2.5 border-r border-gray-200 text-right font-mono font-bold text-rose-700">
                    {formatRupees(item.amount)}
                  </td>
                  <td className="py-1 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(item.id)}
                      className="p-0.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/70 border-t-2 border-amber-200 text-amber-900 font-bold text-xs">
                <td colSpan={3} className="py-1.5 px-2.5 text-right uppercase tracking-wider text-[10px]">
                  Daily Diary Total:
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono text-sm font-bold text-rose-700">
                  {formatRupees(diaryTotal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
