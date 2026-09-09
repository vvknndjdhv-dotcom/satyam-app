import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Banknote,
  Search,
  Trash2,
  Edit2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { Worker } from '../types';
import { formatRupees } from '../utils/calculator';

interface WorkerSectionProps {
  workers: Worker[];
  onOpenAddWorker: () => void;
  onEditWorker: (worker: Worker) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onPayAdvance: (worker: Worker) => void;
  onClearWorkerAdvances?: (workerId: string) => void;
  onQuickAddWorker?: (name: string, mobile: string, salary: number) => void;
}

export const WorkerSection: React.FC<WorkerSectionProps> = ({
  workers,
  onOpenAddWorker,
  onEditWorker,
  onUpdateWorker,
  onDeleteWorker,
  onPayAdvance,
  onClearWorkerAdvances,
  onQuickAddWorker,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'Present' | 'Absent'>('ALL');
  // State for inline deletion confirmation (iframe-safe!)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // State for inline settle/clear advance confirmation
  const [confirmClearAdvanceId, setConfirmClearAdvanceId] = useState<string | null>(null);

  // Quick Inline Add Worker States
  const [quickName, setQuickName] = useState('');
  const [quickMobile, setQuickMobile] = useState('');
  const [quickSalary, setQuickSalary] = useState('');

  const handleQuickAddSubmit = () => {
    if (!quickName.trim() || !onQuickAddWorker) return;
    const salaryNum = quickSalary ? parseFloat(quickSalary) : 0;
    onQuickAddWorker(quickName.trim(), quickMobile.trim(), isNaN(salaryNum) ? 0 : salaryNum);
    setQuickName('');
    setQuickMobile('');
    setQuickSalary('');
  };

  // Filter workers based on search term & attendance filter
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const status = w.status || 'Present';
      const matchesSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.mobile.includes(searchTerm);

      const matchesAttendance =
        attendanceFilter === 'ALL' || status === attendanceFilter;

      return matchesSearch && matchesAttendance;
    });
  }, [workers, searchTerm, attendanceFilter]);

  // Aggregate stats
  const presentCount = useMemo(
    () => workers.filter((w) => (w.status || 'Present') === 'Present').length,
    [workers]
  );
  const absentCount = useMemo(
    () => workers.filter((w) => w.status === 'Absent').length,
    [workers]
  );
  const totalSalary = useMemo(
    () => workers.reduce((sum, w) => sum + (w.salary || 0), 0),
    [workers]
  );
  const totalAdvance = useMemo(
    () => workers.reduce((sum, w) => sum + (w.advance || 0), 0),
    [workers]
  );
  const totalAvailableBalance = useMemo(
    () =>
      workers.reduce((sum, w) => {
        const salary = typeof w.salary === 'number' ? w.salary : 0;
        const accumulated = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
        const adv = typeof w.advance === 'number' ? w.advance : 0;
        const rem = typeof w.remainingSalary === 'number' ? w.remainingSalary : salary - accumulated - adv;
        return sum + rem;
      }, 0),
    [workers]
  );

  // Toggle Attendance
  const handleToggleAttendance = (worker: Worker) => {
    const currentStatus = worker.status || 'Present';
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    onUpdateWorker({
      ...worker,
      status: nextStatus,
    });
  };

  // Update Advance directly
  const handleAdvanceChange = (worker: Worker, valStr: string) => {
    const num = valStr === '' ? 0 : parseFloat(valStr);
    const adv = isNaN(num) ? 0 : Math.max(0, num);
    const sal = typeof worker.salary === 'number' ? worker.salary : 0;
    const accumulated = typeof worker.accumulatedAdvance === 'number' ? worker.accumulatedAdvance : 0;
    onUpdateWorker({
      ...worker,
      advance: adv,
      remainingSalary: sal - accumulated - adv,
    });
  };

  // Update Salary directly
  const handleSalaryChange = (worker: Worker, valStr: string) => {
    const num = valStr === '' ? 0 : parseFloat(valStr);
    const sal = isNaN(num) ? 0 : Math.max(0, num);
    const adv = typeof worker.advance === 'number' ? worker.advance : 0;
    const accumulated = typeof worker.accumulatedAdvance === 'number' ? worker.accumulatedAdvance : 0;
    onUpdateWorker({
      ...worker,
      salary: sal,
      remainingSalary: sal - accumulated - adv,
    });
  };

  return (
    <div
      id="worker-section"
      className="w-full bg-white border border-gray-300 rounded-lg shadow-2xs overflow-hidden mt-4"
    >
      {/* Section Header */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Worker Section / कामगार व चालक
              </h3>
              <span className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {workers.length} Workers
              </span>
            </div>
            <p className="text-[11px] text-gray-300">
              हाज़िरी (P/A), सैलरी, एडवांस व बची हुई सैलरी (Available Balance)
            </p>
          </div>
        </div>

        {/* Top Actions: Search + Add Worker */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search worker name / phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-slate-800 border border-slate-700 text-xs text-white placeholder-gray-400 rounded-md focus:outline-hidden focus:border-indigo-400 w-36 sm:w-48"
            />
          </div>

          <button
            id="btn-add-worker-section"
            type="button"
            onClick={onOpenAddWorker}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Add New Worker (नया कामगार जोड़ें)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Worker / नया कामगार</span>
          </button>
        </div>
      </div>

      {/* Attendance Filter & Quick Summary Strip */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-500 mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setAttendanceFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              attendanceFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            All ({workers.length})
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('Present')}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              attendanceFilter === 'Present'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Present ({presentCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('Absent')}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              attendanceFilter === 'Absent'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Absent ({absentCount})</span>
          </button>
        </div>

        {/* Financial Summary Preview */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
          <span className="text-gray-600">
            कुल सैलरी: <b className="font-mono text-gray-900">₹{formatRupees(totalSalary)}</b>
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-amber-800">
            कुल एडवांस: <b className="font-mono">₹{formatRupees(totalAdvance)}</b>
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">
            कुल बची सैलरी: <b className="font-mono">₹{formatRupees(totalAvailableBalance)}</b>
          </span>
        </div>
      </div>

      {/* Worker List Table */}
      {filteredWorkers.length === 0 ? (
        <div className="p-8 text-center bg-white">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">
            {searchTerm || attendanceFilter !== 'ALL'
              ? 'कोई कामगार नहीं मिला (No workers match search)'
              : 'कोई कामगार दर्ज नहीं है (No workers registered yet)'}
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-3">
            {searchTerm || attendanceFilter !== 'ALL'
              ? 'कृपया सर्च टर्म बदलें या फ़िल्टर हटाएँ।'
              : 'यहाँ नए कामगार जोड़ें। उनकी सैलरी, एडवांस और हाज़िरी यहाँ से सीधे मैनेज करें।'}
          </p>
          <button
            type="button"
            onClick={onOpenAddWorker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Worker / नया कामगार जोड़ें</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-100/90 text-gray-700 font-bold border-b border-gray-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-2 border-r border-gray-200 w-10 text-center">#</th>
                {/* Name column */}
                <th className="py-2.5 px-3 border-r border-gray-200 w-44">
                  कामगार का नाम (Name)
                </th>
                {/* Mobile column */}
                <th className="py-2.5 px-3 border-r border-gray-200 w-32">
                  Mobile / फोन
                </th>
                {/* Absent / Present Option */}
                <th className="py-2.5 px-2 border-r border-gray-200 w-32 text-center">
                  हाज़िरी (P / A)
                </th>
                {/* Salary column */}
                <th className="py-2.5 px-2 border-r border-gray-200 w-28 text-right">
                  मासिक सैलरी (Salary)
                </th>
                {/* Advance Box */}
                <th className="py-2.5 px-2 border-r border-gray-200 w-28 text-right">
                  <div className="flex flex-col items-end">
                    <span>एडवांस</span>
                    <span className="text-[9px] font-normal text-amber-700 capitalize">Advance</span>
                  </div>
                </th>
                {/* Available Balance (Remaining Salary) */}
                <th className="py-2.5 px-3 border-r border-gray-200 w-32 text-right bg-emerald-50/50">
                  <div className="flex flex-col items-end">
                    <span>बची सैलरी</span>
                    <span className="text-[9px] font-normal text-emerald-700 capitalize">Net Balance</span>
                  </div>
                </th>
                {/* Action column with working delete */}
                <th className="py-2.5 px-3 w-36 text-center">
                  Action / कार्य
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredWorkers.map((w, idx) => {
                const isPresent = (w.status || 'Present') === 'Present';
                const salary = typeof w.salary === 'number' ? w.salary : 0;
                const accumulated = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
                const advance = typeof w.advance === 'number' ? w.advance : 0;
                const availableBalance = typeof w.remainingSalary === 'number' ? w.remainingSalary : salary - accumulated - advance;
                const isDeletingThis = confirmDeleteId === w.id;

                const initials = w.name
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr
                    key={w.id}
                    className={`hover:bg-indigo-50/20 transition-colors ${
                      !isPresent ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-2 border-r border-gray-200 text-center font-mono text-gray-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Compact Name Box */}
                    <td className="py-2 px-3 border-r border-gray-200 w-44">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {initials || 'W'}
                        </div>
                        <div className="truncate font-bold text-gray-900 text-xs" title={w.name}>
                          {w.name}
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="py-2 px-3 border-r border-gray-200 font-mono text-gray-700">
                      {w.mobile ? (
                        <a
                          href={`tel:${w.mobile}`}
                          className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 hover:underline"
                          title="Click to call"
                        >
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{w.mobile}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Absent / Present Toggle Option */}
                    <td className="py-2 px-2 border-r border-gray-200 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(w)}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                          isPresent
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                        }`}
                        title="Click to toggle Present / Absent (हाज़िर / गैरहाज़िर बदलें)"
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Absent</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Salary Box (Editable) */}
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right">
                      <div className="relative inline-block w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={w.salary !== undefined ? w.salary : ''}
                          onChange={(e) => handleSalaryChange(w, e.target.value)}
                          placeholder="0"
                          className="w-full pl-5 pr-2 py-1 text-right font-mono font-bold text-gray-800 bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded focus:border-indigo-500 focus:outline-hidden text-xs"
                          title="Monthly Salary (मासिक मानधन)"
                        />
                      </div>
                    </td>

                    {/* Advance Box (Sheet Entry) */}
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right">
                      <div className="relative inline-block w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-600 font-mono text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={advance > 0 ? advance : ''}
                          onChange={(e) => handleAdvanceChange(w, e.target.value)}
                          placeholder="0"
                          className="w-full pl-5 pr-2 py-1 text-right font-mono font-bold text-amber-800 bg-amber-50/50 hover:bg-white focus:bg-white border border-amber-300 rounded focus:border-amber-500 focus:outline-hidden text-xs"
                          title="आज का नया एडवांस (एंट्री सेव होने पर यह खाली हो जाएगा और सैलरी में एडजस्ट रहेगा)"
                        />
                      </div>
                    </td>

                    {/* Available Balance (Salary - Advance) */}
                    <td className="py-2 px-3 border-r border-gray-200 text-right bg-emerald-50/30">
                      <div className="font-mono font-bold text-xs">
                        {availableBalance >= 0 ? (
                          <span
                            className="text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded shadow-2xs"
                            title={`मासिक वेतन ₹${salary.toLocaleString('en-IN')}${
                              accumulated > 0 ? ` | पहले कटा एडवांस ₹${accumulated.toLocaleString('en-IN')}` : ''
                            }${advance > 0 ? ` | आज का नया एडवांस ₹${advance.toLocaleString('en-IN')}` : ''} = बची सैलरी ₹${availableBalance.toLocaleString('en-IN')}`}
                          >
                            ₹{formatRupees(availableBalance)}
                          </span>
                        ) : (
                          <span
                            className="text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded"
                            title="एडवांस सैलरी से अधिक हो गया है!"
                          >
                            -₹{formatRupees(Math.abs(availableBalance))}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Column: Working Delete, Edit, Settle Advance, + Advance */}
                    <td className="py-2 px-2 text-center">
                      {isDeletingThis ? (
                        /* Inline deletion confirmation: 100% active and works in iframe without alert blockers */
                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 animate-in fade-in duration-150">
                          <span className="text-[10px] font-bold text-rose-700">हटाएँ?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteWorker(w.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Confirm Delete"
                          >
                            हाँ
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold cursor-pointer"
                            title="Cancel"
                          >
                            रद्द
                          </button>
                        </div>
                      ) : confirmClearAdvanceId === w.id ? (
                        /* Inline settle advance confirmation */
                        <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 animate-in fade-in duration-150">
                          <span className="text-[10px] font-bold text-emerald-800">चुकता?</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onClearWorkerAdvances) {
                                onClearWorkerAdvances(w.id);
                              }
                              setConfirmClearAdvanceId(null);
                            }}
                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Confirm Settle"
                          >
                            हाँ
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearAdvanceId(null)}
                            className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold cursor-pointer"
                            title="Cancel"
                          >
                            रद्द
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {/* Settle / Clear Advance Button (when worker has taken advance) */}
                          {advance > 0 && onClearWorkerAdvances && (
                            <button
                              type="button"
                              onClick={() => setConfirmClearAdvanceId(w.id)}
                              className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title={`हिसाब चुकता करें (Clear ₹${advance.toLocaleString('en-IN')} advance)`}
                            >
                              चुकता
                            </button>
                          )}

                          {/* Quick + Advance Button */}
                          <button
                            type="button"
                            onClick={() => onPayAdvance(w)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                            title={`Add advance for ${w.name}`}
                          >
                            <Banknote className="w-3 h-3 text-amber-600" />
                            <span>+ Adv</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEditWorker(w)}
                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title={`Edit ${w.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Activated Delete Button */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(w.id)}
                            className="p-1 text-rose-500 hover:text-white hover:bg-rose-600 rounded transition-colors cursor-pointer"
                            title={`Delete ${w.name} (कामगार को हटाएं)`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Inline Quick Add Worker Row - directly below workers table */}
              {onQuickAddWorker && (
                <tr className="bg-indigo-50/40 border-t-2 border-indigo-200 hover:bg-indigo-50/70 transition-colors">
                  <td className="py-2 px-2 border-r border-gray-200 text-center text-indigo-600 font-bold">
                    +
                  </td>
                  {/* Name Input */}
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="+ नया कामगार नाम (Name)..."
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit();
                      }}
                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-indigo-500 placeholder:text-gray-400"
                    />
                  </td>
                  {/* Mobile Input */}
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="tel"
                      placeholder="मोबाइल नंबर..."
                      value={quickMobile}
                      onChange={(e) => setQuickMobile(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit();
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono text-gray-900 focus:outline-hidden focus:border-indigo-500 placeholder:text-gray-400"
                    />
                  </td>
                  {/* Attendance */}
                  <td className="py-2 px-2 border-r border-gray-200 text-center">
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold">
                      Present
                    </span>
                  </td>
                  {/* Salary Input */}
                  <td className="py-2 px-2 border-r border-gray-200 text-right">
                    <div className="relative inline-block w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="उदा. 18000"
                        value={quickSalary}
                        onChange={(e) => setQuickSalary(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAddSubmit();
                        }}
                        className="w-full pl-5 pr-2 py-1 text-right font-mono font-bold text-gray-800 bg-white border border-gray-300 rounded focus:border-indigo-500 focus:outline-hidden text-xs"
                      />
                    </div>
                  </td>
                  {/* Advance */}
                  <td className="py-2 px-2 border-r border-gray-200 text-right text-gray-400 font-mono text-xs">
                    ₹0
                  </td>
                  {/* Available Balance Preview */}
                  <td className="py-2 px-3 border-r border-gray-200 text-right font-mono text-xs text-emerald-800 font-bold bg-emerald-50/50">
                    {quickSalary ? `₹${parseFloat(quickSalary || '0').toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  {/* Submit Button */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={handleQuickAddSubmit}
                      className="w-full px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      title="Add this worker to list"
                    >
                      + जोड़ें
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Total Summary Footer Row */}
            <tfoot>
              <tr className="bg-slate-100 text-gray-800 font-bold border-t-2 border-gray-300 text-xs">
                <td colSpan={4} className="py-2 px-3 border-r border-gray-200 text-right uppercase tracking-wider text-[11px] text-gray-600">
                  Total / कुल जोड़ ({filteredWorkers.length} Workers):
                </td>
                {/* 5. Total Salary */}
                <td className="py-2 px-2 border-r border-gray-200 text-right font-mono text-gray-900">
                  ₹{formatRupees(totalSalary)}
                </td>
                {/* 6. Total Advance */}
                <td className="py-2 px-2 border-r border-gray-200 text-right font-mono text-amber-800">
                  ₹{formatRupees(totalAdvance)}
                </td>
                {/* 7. Total Available Balance */}
                <td className="py-2 px-3 border-r border-gray-200 text-right font-mono text-emerald-800 bg-emerald-100/70">
                  ₹{formatRupees(totalAvailableBalance)}
                </td>
                {/* 8. Label */}
                <td className="py-2 px-2 text-center text-[11px] text-gray-500 font-medium">
                  कुल बाकी सैलरी
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Section Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between text-xs text-gray-500">
        <span className="text-[11px]">
          Showing <b>{filteredWorkers.length}</b> of <b>{workers.length}</b> workers • Present:{' '}
          <b className="text-emerald-700">{presentCount}</b> | Absent:{' '}
          <b className="text-rose-700">{absentCount}</b>
        </span>
        <button
          type="button"
          onClick={onOpenAddWorker}
          className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold text-xs cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add another worker (और कामगार जोड़ें)</span>
        </button>
      </div>
    </div>
  );
};
