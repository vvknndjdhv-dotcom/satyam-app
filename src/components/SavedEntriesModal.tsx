import React, { useMemo } from 'react';
import { X, Calendar, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { getAllSavedSheets } from '../utils/storage';
import { formatDisplayDate, formatRupees } from '../utils/calculator';
import { DailySheetState } from '../types';

interface SavedEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEditEntry?: (date: string) => void;
  onViewStatement: () => void;
}

export const SavedEntriesModal: React.FC<SavedEntriesModalProps> = ({
  isOpen,
  onClose,
  onSelectEditEntry,
  onViewStatement,
}) => {
  const savedSheetsList = useMemo(() => {
    if (!isOpen) return [];
    const all = getAllSavedSheets();
    const list: { date: string; sheet: DailySheetState }[] = [];

    for (const [date, sheet] of Object.entries(all)) {
      if (sheet && sheet.isSaved) {
        list.push({ date, sheet });
      }
    }

    // Sort descending by date
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Saved Entries / सेव की गई तारीखें
              </h3>
              <p className="text-[11px] text-gray-300">
                पहले सेव की गई तारीखों का सारांश और लेज़र स्टेटमेंट देखें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100">
          {savedSheetsList.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">अभी कोई सेव की गई एंट्री नहीं है</h4>
              <p className="text-xs text-gray-500 mt-1">
                दैनिक एंट्री पूरी करने के बाद 'Save Entry' बटन दबाएँ।
              </p>
            </div>
          ) : (
            savedSheetsList.map(({ date, sheet }) => {
              const workIncome = sheet.rows.reduce((sum, r) => sum + (r.workTotal || 0), 0);
              const fuelExpense = sheet.rows.reduce(
                (sum, r) => sum + (typeof r.fuelExpense === 'number' ? r.fuelExpense : 0),
                0
              );
              const maintExpense = sheet.rows.reduce(
                (sum, r) => sum + (typeof r.maintenanceExpense === 'number' ? r.maintenanceExpense : 0),
                0
              );
              const diaryExpense = (sheet.diaryExpenses || []).reduce(
                (sum, d) => sum + (d.amount || 0),
                0
              );
              const totalExpenses = fuelExpense + maintExpense + diaryExpense;
              const net = workIncome - totalExpenses;
              const activeRowsCount = sheet.rows.filter(
                (r) => r.workTotal > 0 || r.fuelExpense !== '' || r.maintenanceExpense !== ''
              ).length;

              return (
                <div
                  key={date}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatDisplayDate(date)}
                      </span>
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                        {date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Saved</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span>
                        गाड़ियाँ सक्रिय: <b>{activeRowsCount}</b>
                      </span>
                      <span>•</span>
                      <span>
                        काम आमदनी: <b className="text-emerald-700 font-mono">{formatRupees(workIncome)}</b>
                      </span>
                      <span>•</span>
                      <span>
                        कुल खर्चे: <b className="text-rose-700 font-mono">{formatRupees(totalExpenses)}</b>
                      </span>
                      <span>•</span>
                      <span>
                        नेट: <b className="font-mono font-bold">{formatRupees(net)}</b>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onViewStatement();
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="View in Ledger statement"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-300" />
                      <span>स्टेटमेंट देखें</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between text-xs text-gray-600">
          <span>कुल <b>{savedSheetsList.length}</b> तारीखों का डेटा सेव है</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold text-xs transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
