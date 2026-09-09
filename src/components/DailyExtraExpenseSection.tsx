import React from 'react';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatRupees } from '../utils/calculator';

interface DailyExtraExpenseSectionProps {
  amount: number | '';
  notes: string;
  onChangeAmount: (newAmount: number | '') => void;
  onChangeNotes: (newNotes: string) => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const DailyExtraExpenseSection: React.FC<DailyExtraExpenseSectionProps> = ({
  amount,
  notes,
  onChangeAmount,
  onChangeNotes,
  onSave,
  isSaved = false,
}) => {
  const numericAmount = typeof amount === 'number' ? amount : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onChangeAmount('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChangeAmount(Math.max(0, num));
    }
  };

  return (
    <div className="w-full bg-white border border-gray-300 rounded-lg shadow-2xs overflow-hidden mt-4">
      {/* Header */}
      <div className="bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-600 text-white rounded shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">
              एक्स्ट्रा खर्चा और डायरी (Daily Extra Expenses & Diary)
            </h3>
            <p className="text-[11px] text-gray-600">
              दैनिक फुटकर खर्च व डायरी नोट — यहाँ रकम दर्ज करने पर यह सीधे ऊपर ओपनिंग बैलेंस और मुनाफे/घाटे (प्रॉफिट/लॉस) में जुड़ेगी।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">कुल एक्स्ट्रा खर्चा:</span>
          <span className="bg-rose-100 text-rose-800 font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded border border-rose-300 shadow-2xs">
            ₹{formatRupees(numericAmount, false)}
          </span>
        </div>
      </div>

      {/* Main Body: Spacious Typing Space & Amount Field */}
      <div className="p-3 sm:p-4 space-y-3 bg-white">
        {/* Amount Input Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
          <label className="text-xs font-black text-gray-800 whitespace-nowrap flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
            खर्चा रकम (₹ दर्ज करें):
          </label>
          <div className="flex items-center flex-1 max-w-xs">
            <span className="bg-white border border-r-0 border-gray-300 rounded-l px-3 py-1.5 text-sm font-bold text-gray-700">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="उदा. 5000"
              value={amount === '' ? '' : amount}
              onChange={handleAmountChange}
              className="w-full bg-white border border-gray-300 rounded-r px-3 py-1.5 text-sm sm:text-base font-mono font-black text-rose-700 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div className="text-[11px] text-gray-500 italic sm:ml-2">
            (जैसे 5000 खर्चा हुआ है, तो यहाँ 5000 लिखें)
          </div>
        </div>

        {/* Free Typing Diary Space ("पूरी खाली जगह जिसमें टाइपिंग कर सको") */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            खर्चे का विवरण / डायरी नोट (यहाँ फ्री टाइपिंग करें):
          </label>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="यहाँ आज का कोई भी खर्चा या डायरी नोट टाइप करें (उदा. चाय-नाश्ता, टोल टैक्स, ग्रीसिंग, रूम किराया, पार्ट्स या कोई भी जानकारी)..."
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-xs sm:text-sm font-sans text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-200 resize-y leading-relaxed"
          />
        </div>

        {/* Footer info & live effect */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-600">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              यह खर्चा रकम ({formatRupees(numericAmount)}) ऊपर कुल खर्च में जुड़ेगी — अगर आज मुनाफा हुआ तो ओपनिंग में जुड़ेगा, घाटा हुआ तो ओपनिंग से माइनस होगा।
            </span>
          </div>

          {onSave && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="एंट्री सेव करें"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>सेव करें</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
