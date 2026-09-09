import React, { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  Calculator,
  PlusCircle,
  Truck,
  ListOrdered,
  Eraser,
} from 'lucide-react';
import { Vehicle, VehicleRowEntry } from '../types';
import { calculateWorkTotalFromText, formatRupees } from '../utils/calculator';

interface SpreadsheetGridProps {
  rows: VehicleRowEntry[];
  onChangeRows: (rows: VehicleRowEntry[]) => void;
  vehicles: Vehicle[];
  onOpenAddVehicle: () => void;
  onOpenVehicleList?: () => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows,
  onChangeRows,
  vehicles,
  onOpenAddVehicle,
  onOpenVehicleList,
}) => {
  // Active focused cell: { rowIdx, colKey }
  const [focusedCell, setFocusedCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [openVehicleDropdownRow, setOpenVehicleDropdownRow] = useState<number | null>(null);

  // References for direct focus
  const cellRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  const setCellRef = (rowIdx: number, colKey: string, el: HTMLInputElement | HTMLTextAreaElement | null) => {
    cellRefs.current[`${rowIdx}-${colKey}`] = el;
  };

  const focusCell = useCallback((rowIdx: number, colKey: string) => {
    if (rowIdx < 0 || rowIdx >= rows.length) return;
    setFocusedCell({ rowIdx, colKey });
    setOpenVehicleDropdownRow(colKey === 'vehicle' ? rowIdx : null);

    setTimeout(() => {
      const el = cellRefs.current[`${rowIdx}-${colKey}`];
      if (el) {
        el.focus();
        if ('select' in el && typeof el.select === 'function') {
          if (colKey === 'fuel' || colKey === 'maintenance') {
            el.select();
          }
        }
      }
    }, 10);
  }, [rows.length]);

  // Update a specific cell in a row
  const handleUpdateRow = (rowIdx: number, field: keyof VehicleRowEntry, value: any) => {
    const updated = [...rows];
    const currentRow = { ...updated[rowIdx], [field]: value };

    // Re-evaluate Work Total if workDetails changed
    if (field === 'workDetails') {
      currentRow.workTotal = calculateWorkTotalFromText(value as string);
    }

    // Re-evaluate Net
    const fuel = typeof currentRow.fuelExpense === 'number' ? currentRow.fuelExpense : 0;
    const maint = typeof currentRow.maintenanceExpense === 'number' ? currentRow.maintenanceExpense : 0;
    currentRow.net = currentRow.workTotal - fuel - maint;

    updated[rowIdx] = currentRow;
    onChangeRows(updated);
  };

  // Keyboard navigation handler for full spreadsheet feel
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowIdx: number,
    colKey: 'vehicle' | 'fuel' | 'maintenance' | 'work'
  ) => {
    const cols: ('vehicle' | 'fuel' | 'maintenance' | 'work')[] = ['vehicle', 'fuel', 'maintenance', 'work'];
    const colIndex = cols.indexOf(colKey);

    // Tab & Shift+Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (colIndex > 0) {
          focusCell(rowIdx, cols[colIndex - 1]);
        } else if (rowIdx > 0) {
          focusCell(rowIdx - 1, cols[cols.length - 1]);
        }
      } else {
        if (colIndex < cols.length - 1) {
          focusCell(rowIdx, cols[colIndex + 1]);
        } else if (rowIdx < rows.length - 1) {
          focusCell(rowIdx + 1, cols[0]);
        } else {
          handleAddRow();
          setTimeout(() => focusCell(rows.length, 'vehicle'), 20);
        }
      }
      return;
    }

    // Enter & Shift+Enter
    if (e.key === 'Enter') {
      if (colKey === 'work') {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const text = (e.target as HTMLTextAreaElement).value;
          if (!text.includes('\n') && /^[\d\s+\-*/.=₹,]+$/.test(text.trim())) {
            e.preventDefault();
            if (rowIdx < rows.length - 1) {
              focusCell(rowIdx + 1, 'work');
            } else {
              handleAddRow();
              setTimeout(() => focusCell(rows.length, 'vehicle'), 20);
            }
            return;
          }
          return;
        }
      }

      e.preventDefault();
      if (e.shiftKey) {
        if (rowIdx > 0) {
          focusCell(rowIdx - 1, colKey);
        }
      } else {
        if (rowIdx < rows.length - 1) {
          focusCell(rowIdx + 1, colKey);
        } else {
          handleAddRow();
          setTimeout(() => focusCell(rows.length, colKey), 20);
        }
      }
      return;
    }

    // Arrow Up / Down for single line inputs
    if (colKey !== 'work') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rowIdx < rows.length - 1) {
          focusCell(rowIdx + 1, colKey);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIdx > 0) {
          focusCell(rowIdx - 1, colKey);
        }
      }
    }

    if (e.key === 'Escape') {
      setOpenVehicleDropdownRow(null);
    }
  };

  // Add row
  const handleAddRow = (vehicleId?: string) => {
    let selectedVeh: Vehicle | undefined;
    if (vehicleId) {
      selectedVeh = vehicles.find((v) => v.id === vehicleId);
    } else {
      const usedIds = new Set(rows.map((r) => r.vehicleId));
      selectedVeh = vehicles.find((v) => !usedIds.has(v.id)) || vehicles[0];
    }

    const newRow: VehicleRowEntry = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      vehicleId: selectedVeh ? selectedVeh.id : '',
      vehicleLabel: selectedVeh ? selectedVeh.name || `${selectedVeh.type} ${selectedVeh.number}` : '',
      fuelExpense: '',
      maintenanceExpense: '',
      workDetails: '',
      workTotal: 0,
      net: 0,
    };

    onChangeRows([...rows, newRow]);
  };

  const handleAddMultipleRows = (count: number = 5) => {
    const newRows: VehicleRowEntry[] = [];
    const usedIds = new Set(rows.map((r) => r.vehicleId));
    const available = vehicles.filter((v) => !usedIds.has(v.id));

    for (let i = 0; i < count; i++) {
      const v = available[i] || vehicles[i % vehicles.length];
      newRows.push({
        id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        vehicleId: v ? v.id : '',
        vehicleLabel: v ? v.name || `${v.type} ${v.number}` : '',
        fuelExpense: '',
        maintenanceExpense: '',
        workDetails: '',
        workTotal: 0,
        net: 0,
      });
    }
    onChangeRows([...rows, ...newRows]);
  };

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) {
      handleClearRow(rowIdx);
      return;
    }
    const updated = rows.filter((_, idx) => idx !== rowIdx);
    onChangeRows(updated);
  };

  // Clear row content
  const handleClearRow = (rowIdx: number) => {
    const updated = [...rows];
    updated[rowIdx] = {
      ...updated[rowIdx],
      fuelExpense: '',
      maintenanceExpense: '',
      workDetails: '',
      workTotal: 0,
      net: 0,
    };
    onChangeRows(updated);
  };

  // Clear all rows content (पूरी टेबल खाली करें)
  const handleClearAllInputs = () => {
    if (window.confirm('क्या आप टेबल के सभी इनपुट (डीज़ल, काम, मेंटेनेंस) खाली करना चाहते हैं?')) {
      const updated = rows.map((r) => ({
        ...r,
        fuelExpense: '' as const,
        maintenanceExpense: '' as const,
        workDetails: '',
        workTotal: 0,
        net: 0,
      }));
      onChangeRows(updated);
    }
  };

  // Select vehicle from dropdown
  const handleSelectVehicle = (rowIdx: number, v: Vehicle) => {
    const updated = [...rows];
    updated[rowIdx] = {
      ...updated[rowIdx],
      vehicleId: v.id,
      vehicleLabel: v.name || `${v.type} ${v.number}`,
    };
    onChangeRows(updated);
    setOpenVehicleDropdownRow(null);
    focusCell(rowIdx, 'fuel');
  };

  // Filter vehicles for dropdown
  const filteredVehicles = vehicles.filter((v) => {
    const label = `${v.name || ''} ${v.type} ${v.number}`.toLowerCase();
    return label.includes(vehicleSearchQuery.toLowerCase());
  });

  return (
    <div className="w-full bg-white border border-gray-300 rounded shadow-2xs overflow-hidden">
      {/* 1. SINGLE COMPACT HORIZONTAL LINE: ALL TIPPERS & VEHICLES QUICK SELECT BAR */}
      <div className="bg-gray-100/90 border-b border-gray-300 px-2.5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-gray-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Vehicles:</span>
          </span>

          {/* Quick Vehicle Chips in a single clean row */}
          <div className="flex items-center gap-1">
            {vehicles.map((v) => {
              const isAlreadyInSheet = rows.some((r) => r.vehicleId === v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    const existingIdx = rows.findIndex((r) => r.vehicleId === v.id);
                    if (existingIdx >= 0) {
                      focusCell(existingIdx, 'work');
                    } else {
                      handleAddRow(v.id);
                      setTimeout(() => focusCell(rows.length, 'work'), 30);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                    isAlreadyInSheet
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title={`Click to add/edit ${v.name || v.number} in sheet`}
                >
                  <span className="font-mono text-[10px] text-gray-400">{v.type === 'Tipper' ? '🚛' : '🚜'}</span>
                  <span>{v.name || `${v.type} ${v.number}`}</span>
                  {isAlreadyInSheet && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>
              );
            })}

            {/* Quick + Add Vehicle Button in line */}
            <button
              type="button"
              onClick={onOpenAddVehicle}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-dashed border-blue-300 shrink-0 cursor-pointer flex items-center gap-0.5"
              title="Add New Tipper or Vehicle"
            >
              <Plus className="w-3 h-3" />
              <span>Add Vehicle</span>
            </button>

            {/* Quick Vehicle List / Manage Button */}
            {onOpenVehicleList && (
              <button
                type="button"
                onClick={onOpenVehicleList}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 shrink-0 cursor-pointer flex items-center gap-1"
                title="View & manage all saved vehicles (गाड़ियां देखें व डिलीट करें)"
              >
                <ListOrdered className="w-3 h-3 text-gray-500" />
                <span>List / हटाएं ({vehicles.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleAddRow()}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-2 py-0.5 rounded text-[11px] font-bold shadow-2xs transition-colors"
          >
            <Plus className="w-3 h-3 text-blue-600" />
            <span>+ Row</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMultipleRows(5)}
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors"
            title="Add 5 Rows"
          >
            <PlusCircle className="w-3 h-3 text-gray-400" />
            <span>+5</span>
          </button>
          <button
            type="button"
            onClick={handleClearAllInputs}
            className="flex items-center gap-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
            title="Clear all vehicle inputs in the table (पूरी टेबल खाली करें)"
          >
            <Eraser className="w-3 h-3 text-rose-500" />
            <span>Clear Table</span>
          </button>
        </div>
      </div>

      {/* Main Spreadsheet Table Container */}
      <div className="overflow-x-auto overflow-y-visible max-w-full">
        <table className="w-full border-collapse text-left text-xs table-fixed min-w-[840px]">
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '39%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '32px' }} />
          </colgroup>

          {/* Sticky Column Headers */}
          <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-300 sticky top-0 z-10 select-none">
            {/* Main Header Labels */}
            <tr className="divide-x divide-gray-300 text-[11px] uppercase tracking-wider bg-gray-100">
              <th className="py-1.5 px-1 text-center text-gray-400 font-mono">#</th>
              <th className="py-1.5 px-2 bg-gray-100 font-bold text-gray-800">
                Vehicle (Tipper/JCB)
              </th>
              <th className="py-1.5 px-2 bg-gray-100 font-bold text-gray-800">
                Fuel Expense
              </th>
              <th className="py-1.5 px-2 bg-gray-100 font-bold text-gray-800">
                Maintenance
              </th>
              <th className="py-1.5 px-2 bg-blue-50/70 font-bold text-blue-900 border-b-2 border-b-blue-600">
                <div className="flex items-center justify-between">
                  <span>Work Details & Trips / काम व फेरे</span>
                  <span className="text-[9px] font-normal text-blue-700 normal-case bg-blue-100 px-1 rounded">
                    Auto-sum (+ - * /)
                  </span>
                </div>
              </th>
              <th className="py-1.5 px-2 bg-emerald-50/60 font-bold text-emerald-900 text-right">
                Work Total
              </th>
              <th className="py-1.5 px-2 bg-gray-100 font-bold text-gray-900 text-right">
                Net
              </th>
              <th className="py-1.5 px-1 text-center bg-gray-100 text-gray-400"></th>
            </tr>
          </thead>

          {/* Spreadsheet Rows */}
          <tbody className="divide-y divide-gray-200 font-sans">
            {rows.map((row, rowIdx) => {
              const isRowActive = focusedCell?.rowIdx === rowIdx;

              return (
                <tr
                  key={row.id}
                  className={`group transition-colors divide-x divide-gray-200 ${
                    isRowActive ? 'bg-blue-50/30' : rowIdx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                  } hover:bg-blue-50/20`}
                >
                  {/* Row Number */}
                  <td className="py-0.5 px-1 text-center text-[11px] font-mono font-medium text-gray-400 bg-gray-100/60 select-none group-hover:text-gray-700">
                    {rowIdx + 1}
                  </td>

                  {/* COLUMN A: VEHICLE */}
                  <td
                    className={`p-0 relative align-middle transition-shadow ${
                      focusedCell?.rowIdx === rowIdx && focusedCell?.colKey === 'vehicle'
                        ? 'ring-2 ring-blue-600 ring-inset z-10 bg-white'
                        : ''
                    }`}
                  >
                    <div className="flex items-center h-8 px-2 relative">
                      <input
                        ref={(el) => setCellRef(rowIdx, 'vehicle', el)}
                        type="text"
                        value={row.vehicleLabel}
                        placeholder="Select Tipper / Vehicle..."
                        onFocus={() => {
                          setFocusedCell({ rowIdx, colKey: 'vehicle' });
                          setOpenVehicleDropdownRow(rowIdx);
                        }}
                        onChange={(e) => {
                          handleUpdateRow(rowIdx, 'vehicleLabel', e.target.value);
                          setVehicleSearchQuery(e.target.value);
                          setOpenVehicleDropdownRow(rowIdx);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'vehicle')}
                        className="w-full bg-transparent text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-hidden"
                      />

                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                          setOpenVehicleDropdownRow(openVehicleDropdownRow === rowIdx ? null : rowIdx);
                          focusCell(rowIdx, 'vehicle');
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Autocomplete Vehicle Popover */}
                      {openVehicleDropdownRow === rowIdx && (
                        <div className="absolute top-full left-0 mt-0.5 w-60 bg-white border border-gray-300 rounded shadow-xl z-50 p-1 max-h-56 overflow-y-auto">
                          <div className="px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                            <span>Fleet Vehicles</span>
                            <button
                              type="button"
                              onClick={onOpenAddVehicle}
                              className="text-blue-600 hover:underline capitalize"
                            >
                              + Add New
                            </button>
                          </div>
                          {filteredVehicles.length === 0 ? (
                            <div className="p-2 text-center text-xs text-gray-500">
                              No vehicle matching "{vehicleSearchQuery}".
                              <button
                                type="button"
                                onClick={onOpenAddVehicle}
                                className="mt-1 block mx-auto text-blue-600 font-semibold text-xs"
                              >
                                + Add this vehicle
                              </button>
                            </div>
                          ) : (
                            filteredVehicles.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleSelectVehicle(rowIdx, v)}
                                className={`w-full text-left px-2 py-1 text-xs rounded flex items-center justify-between transition-colors ${
                                  row.vehicleId === v.id
                                    ? 'bg-blue-50 text-blue-900 font-semibold'
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div>
                                  <div className="font-semibold">{v.name || `${v.type} ${v.number}`}</div>
                                  <div className="text-[10px] text-gray-500 font-mono">{v.number}</div>
                                </div>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                  {v.type}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMN B: FUEL EXPENSE */}
                  <td
                    className={`p-0 align-middle transition-shadow ${
                      focusedCell?.rowIdx === rowIdx && focusedCell?.colKey === 'fuel'
                        ? 'ring-2 ring-blue-600 ring-inset z-10 bg-white'
                        : ''
                    }`}
                  >
                    <div className="flex items-center h-8 px-2">
                      <span className="text-[11px] text-gray-400 font-semibold mr-0.5 select-none">₹</span>
                      <input
                        ref={(el) => setCellRef(rowIdx, 'fuel', el)}
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={row.fuelExpense}
                        onFocus={() => {
                          setFocusedCell({ rowIdx, colKey: 'fuel' });
                          setOpenVehicleDropdownRow(null);
                        }}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          handleUpdateRow(rowIdx, 'fuelExpense', val);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'fuel')}
                        className="w-full bg-transparent text-xs font-mono font-medium text-gray-900 focus:outline-hidden placeholder:text-gray-300"
                      />
                    </div>
                  </td>

                  {/* COLUMN C: MAINTENANCE */}
                  <td
                    className={`p-0 align-middle transition-shadow ${
                      focusedCell?.rowIdx === rowIdx && focusedCell?.colKey === 'maintenance'
                        ? 'ring-2 ring-blue-600 ring-inset z-10 bg-white'
                        : ''
                    }`}
                  >
                    <div className="flex items-center h-8 px-2">
                      <span className="text-[11px] text-gray-400 font-semibold mr-0.5 select-none">₹</span>
                      <input
                        ref={(el) => setCellRef(rowIdx, 'maintenance', el)}
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={row.maintenanceExpense}
                        onFocus={() => {
                          setFocusedCell({ rowIdx, colKey: 'maintenance' });
                          setOpenVehicleDropdownRow(null);
                        }}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          handleUpdateRow(rowIdx, 'maintenanceExpense', val);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'maintenance')}
                        className="w-full bg-transparent text-xs font-mono font-medium text-gray-900 focus:outline-hidden placeholder:text-gray-300"
                      />
                    </div>
                  </td>

                  {/* COLUMN D: WORK / TRIP DETAILS & CALCULATION (DOMINANT) */}
                  <td
                    className={`p-0 align-top transition-shadow relative bg-white ${
                      focusedCell?.rowIdx === rowIdx && focusedCell?.colKey === 'work'
                        ? 'ring-2 ring-blue-600 ring-inset z-10 shadow-xs'
                        : ''
                    }`}
                  >
                    <div className="px-2 py-1 relative flex flex-col justify-between min-h-[36px]">
                      <textarea
                        ref={(el) => setCellRef(rowIdx, 'work', el)}
                        value={row.workDetails}
                        rows={row.workDetails.split('\n').length > 1 ? Math.min(4, row.workDetails.split('\n').length) : 1}
                        placeholder="ट्रिप, किमी या गणित: 2000 + 2500..."
                        onFocus={() => {
                          setFocusedCell({ rowIdx, colKey: 'work' });
                          setOpenVehicleDropdownRow(null);
                        }}
                        onChange={(e) => {
                          handleUpdateRow(rowIdx, 'workDetails', e.target.value);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'work')}
                        className="w-full bg-transparent text-xs font-sans text-gray-900 placeholder:text-gray-400 focus:outline-hidden resize-y leading-tight py-0.5"
                      />

                      {/* Compact Live Auto-Calc Preview Badge */}
                      {row.workDetails.trim().length > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5 select-none">
                          <span className="flex items-center gap-0.5 text-gray-400 font-mono">
                            <Calculator className="w-2.5 h-2.5 text-blue-500" />
                            Sum:
                          </span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                            {formatRupees(row.workTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMN E: WORK TOTAL (AUTO-CALCULATED) */}
                  <td className="px-2 py-1 align-middle text-right bg-emerald-50/30">
                    <div className="font-mono font-bold text-xs sm:text-sm text-emerald-800">
                      {formatRupees(row.workTotal)}
                    </div>
                  </td>

                  {/* COLUMN F: NET (WORK TOTAL - FUEL - MAINTENANCE) */}
                  <td className="px-2 py-1 align-middle text-right bg-gray-50/40">
                    <div
                      className={`font-mono font-bold text-xs sm:text-sm ${
                        row.net > 0 ? 'text-gray-900' : row.net < 0 ? 'text-rose-600' : 'text-gray-400'
                      }`}
                    >
                      {formatRupees(row.net)}
                    </div>
                  </td>

                  {/* ROW ACTIONS (DELETE) */}
                  <td className="p-0.5 text-center align-middle">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="p-1 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grid Summary Footer Row */}
          <tfoot className="bg-gray-100 border-t-2 border-gray-300 text-gray-900 font-bold text-xs">
            <tr className="divide-x divide-gray-300">
              <td colSpan={2} className="py-1.5 px-2 text-right text-gray-600 uppercase tracking-wider text-[10px]">
                Totals:
              </td>
              <td className="py-1.5 px-2 font-mono text-rose-700">
                {formatRupees(
                  rows.reduce((acc, r) => acc + (typeof r.fuelExpense === 'number' ? r.fuelExpense : 0), 0)
                )}
              </td>
              <td className="py-1.5 px-2 font-mono text-rose-700">
                {formatRupees(
                  rows.reduce((acc, r) => acc + (typeof r.maintenanceExpense === 'number' ? r.maintenanceExpense : 0), 0)
                )}
              </td>
              <td className="py-1.5 px-2 text-gray-500 font-normal text-[11px] italic">
                Fleet Trips Total
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-emerald-800 bg-emerald-100/60 font-bold">
                {formatRupees(rows.reduce((acc, r) => acc + r.workTotal, 0))}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-gray-900 bg-gray-200/70 font-bold">
                {formatRupees(rows.reduce((acc, r) => acc + r.net, 0))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
