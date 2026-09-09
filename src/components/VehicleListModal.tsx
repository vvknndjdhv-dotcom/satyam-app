import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Trash2,
  Plus,
  Search,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Vehicle, VehicleType } from '../types';

interface VehicleListModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onDeleteVehicle: (vehicleId: string) => void;
  onOpenAddVehicle: () => void;
  todayVehicleIds: string[];
  onAddVehicleToTodaySheet?: (vehicleId: string) => void;
}

export const VehicleListModal: React.FC<VehicleListModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onDeleteVehicle,
  onOpenAddVehicle,
  todayVehicleIds,
  onAddVehicleToTodaySheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || v.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Unique vehicle types in fleet
  const vehicleTypes: { type: string; count: number }[] = [
    { type: 'ALL', count: vehicles.length },
    ...['Tipper', 'JCB', 'Excavator', 'Tractor', 'Four Wheeler', 'Two Wheeler', 'Other'].map((t) => ({
      type: t,
      count: vehicles.filter((v) => v.type === t).length,
    })).filter((item) => item.count > 0 || item.type === 'ALL'),
  ];

  const handleDelete = (id: string) => {
    onDeleteVehicle(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Vehicle List / व्हीकल लिस्ट
                </h3>
                <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {vehicles.length} Saved
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Manage all registered tippers & vehicles (रखें या डिलीट करें)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddVehicle();
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Vehicle</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by number (MH-25...), name, or type..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {selectedType !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className="text-[11px] text-blue-600 hover:underline shrink-0"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
            {vehicleTypes.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                  selectedType === item.type
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {item.type === 'ALL' ? 'All Vehicles' : item.type} ({item.count})
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle List Items */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-gray-100 space-y-1.5">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-500">
              <Truck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-sm text-gray-700">No vehicles found</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {searchQuery
                  ? `No vehicle matches "${searchQuery}"`
                  : 'No vehicles added in this category.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddVehicle();
                }}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Vehicle Now</span>
              </button>
            </div>
          ) : (
            filteredVehicles.map((vehicle, idx) => {
              const isInTodaySheet = todayVehicleIds.includes(vehicle.id);
              const isConfirming = confirmDeleteId === vehicle.id;

              return (
                <div
                  key={vehicle.id}
                  className={`p-2.5 rounded-md border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isConfirming
                      ? 'bg-rose-50 border-rose-300'
                      : isInTodaySheet
                      ? 'bg-blue-50/40 border-blue-200/80 hover:border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Vehicle Details */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 text-center font-mono text-[11px] font-bold text-gray-400 shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-base shrink-0">
                      {vehicle.type === 'Tipper' ? '🚛' : vehicle.type === 'JCB' ? '🚜' : '🚗'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 font-sans">
                          {vehicle.name || `${vehicle.type} ${vehicle.number}`}
                        </span>

                        <span className="font-mono text-[11px] font-bold bg-gray-100 text-gray-800 px-1.5 py-0.2 rounded border border-gray-300">
                          {vehicle.number}
                        </span>

                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                          {vehicle.type}
                        </span>

                        {isInTodaySheet && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>In Today's Sheet</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>Status: <strong className="text-emerald-700">Active (रखा हुआ है)</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Keep / Add / Delete) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Add to Today's sheet button if not already in sheet */}
                    {!isInTodaySheet && onAddVehicleToTodaySheet && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddVehicleToTodaySheet(vehicle.id);
                        }}
                        className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Add this vehicle row to today's spreadsheet"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Add to Today</span>
                      </button>
                    )}

                    {/* Delete / Remove Vehicle Button with Inline Confirm */}
                    {isConfirming ? (
                      <div className="flex items-center gap-1 animate-in fade-in duration-150">
                        <span className="text-[11px] font-bold text-rose-700 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          डिलीट करें?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(vehicle.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(vehicle.id)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete vehicle from fleet list"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete / हटाएं</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="text-gray-600 font-medium">
            Total <strong>{vehicles.length}</strong> vehicles in fleet list.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddVehicle();
              }}
              className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded font-semibold text-xs transition-colors"
            >
              + Add Another Vehicle
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-gray-900 hover:bg-black text-white rounded font-bold text-xs transition-colors"
            >
              Done / बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
