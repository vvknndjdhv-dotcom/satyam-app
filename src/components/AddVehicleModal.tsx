import React, { useState } from 'react';
import { X, Truck, Check } from 'lucide-react';
import { Vehicle, VehicleType } from '../types';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVehicle: (vehicle: Vehicle) => void;
}

const VEHICLE_TYPES: VehicleType[] = [
  'Tipper',
  'JCB',
  'Excavator',
  'Tractor',
  'Four Wheeler',
  'Two Wheeler',
  'Other',
];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onSaveVehicle,
}) => {
  const [type, setType] = useState<VehicleType>('Tipper');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      setError('Please enter a vehicle registration number (e.g., MH-25-2037)');
      return;
    }

    const cleanNumber = number.trim().toUpperCase();
    const displayName = name.trim() || `${type} ${cleanNumber}`;

    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      type,
      number: cleanNumber,
      name: displayName,
    };

    onSaveVehicle(newVehicle);
    setNumber('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3>Add New Vehicle</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
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

          {/* Vehicle Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Vehicle Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleType)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Vehicle Number *
            </label>
            <input
              type="text"
              placeholder="e.g. MH-25-2037"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase text-gray-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">Registration or fleet plate number</p>
          </div>

          {/* Optional Vehicle Name / Nickname */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Optional Vehicle Name / Label
            </label>
            <input
              type="text"
              placeholder="e.g. Tipper M5, JCB Site A..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            />
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
              id="btn-save-vehicle-submit"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>SAVE VEHICLE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
