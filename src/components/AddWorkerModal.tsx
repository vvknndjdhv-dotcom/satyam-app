import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Worker, WorkerRole } from '../types';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorker: (worker: Worker) => void;
  workerToEdit?: Worker | null;
}

const WORKER_ROLES: WorkerRole[] = [
  'Driver',
  'Operator',
  'Helper',
  'Worker',
  'Supervisor',
  'Other',
];

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  onSaveWorker,
  workerToEdit,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<WorkerRole>('Driver');
  const [salary, setSalary] = useState('');
  const [error, setError] = useState('');

  // Sync state when modal opens or workerToEdit changes
  React.useEffect(() => {
    if (workerToEdit) {
      setName(workerToEdit.name || '');
      setMobile(workerToEdit.mobile || '');
      setRole(workerToEdit.role || 'Driver');
      setSalary(workerToEdit.salary ? String(workerToEdit.salary) : '');
    } else {
      setName('');
      setMobile('');
      setRole('Driver');
      setSalary('');
    }
    setError('');
  }, [workerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter worker name');
      return;
    }

    const salaryNum = salary ? parseFloat(salary) : undefined;
    const finalSalary = isNaN(salaryNum || 0) ? undefined : salaryNum;
    const accumulated = workerToEdit?.accumulatedAdvance ?? 0;
    const adv = workerToEdit?.advance ?? 0;
    const remainingSalary = finalSalary !== undefined ? Math.max(0, finalSalary - accumulated - adv) : undefined;

    const newWorker: Worker = {
      id: workerToEdit ? workerToEdit.id : `w-${Date.now()}`,
      name: name.trim(),
      mobile: mobile.trim(),
      role,
      salary: finalSalary,
      accumulatedAdvance: accumulated,
      advance: adv,
      remainingSalary,
      status: workerToEdit?.status ?? 'Present',
    };

    onSaveWorker(newWorker);
    setName('');
    setMobile('');
    setSalary('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3>{workerToEdit ? 'Edit Worker / कामगार विवरण बदलें' : 'Add New Worker / नया कामगार जोड़ें'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Worker Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Worker Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Patil"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9822123456"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkerRole)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {WORKER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Salary / Daily Rate (Optional)
            </label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-sm text-gray-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                placeholder="e.g. 18000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-r-md px-3 py-2 text-sm font-mono text-gray-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-worker-submit"
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>SAVE WORKER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
