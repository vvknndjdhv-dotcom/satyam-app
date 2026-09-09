import React from 'react';
import { Calendar, FileSpreadsheet, Printer, RotateCcw, Table, Truck, Save, Plus, ListOrdered, Eraser, LogOut, UserCheck } from 'lucide-react';
import { formatDisplayDate } from '../utils/calculator';

interface HeaderProps {
  currentTab: 'daily' | 'statement';
  onSelectTab: (tab: 'daily' | 'statement') => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onOpenPrint: () => void;
  onResetToDemo: () => void;
  onOpenAddVehicle: () => void;
  onOpenVehicleList: () => void;
  vehicleCount?: number;
  onSaveEntry: () => void;
  onClearSheet?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  onOpenSavedEntries?: () => void;
  savedCount?: number;
  isEditingSavedEntry?: boolean;
  onEditCurrentSavedEntry?: () => void;
  onLogout?: () => void;
  loggedInUser?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  selectedDate,
  onChangeDate,
  onOpenPrint,
  onResetToDemo,
  onOpenAddVehicle,
  onOpenVehicleList,
  vehicleCount = 0,
  onSaveEntry,
  onClearSheet,
  isSaving,
  isSaved,
  onOpenSavedEntries,
  savedCount = 0,
  isEditingSavedEntry,
  onEditCurrentSavedEntry,
  onLogout,
  loggedInUser,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 py-1.5 sm:py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Logo & Application Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center font-black text-lg shadow-2xs border border-gray-800 tracking-wider">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 font-sans">
                  SATYAM
                </h1>
                <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  Fleet Accounts
                </span>
                {isEditingSavedEntry ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white animate-pulse">
                    Editing ✏️
                  </span>
                ) : isSaved ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Saved ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    New (0)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Center: + Add Vehicle, Vehicle List, Saved Entries, Save Entry */}
          <div className="flex items-center gap-1.5">
            {/* 1. Top + Add Vehicle Button */}
            <button
              id="top-btn-add-vehicle"
              type="button"
              onClick={onOpenAddVehicle}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Add New Vehicle (Tipper, JCB, etc.)"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Add Vehicle</span>
            </button>

            {/* 2. Vehicle List */}
            <button
              id="top-btn-vehicle-list"
              type="button"
              onClick={onOpenVehicleList}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="View & manage all saved vehicles (व्हीकल लिस्ट)"
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
              <span>Vehicle List</span>
              {vehicleCount > 0 && (
                <span className="bg-slate-300/80 text-slate-900 text-[10px] px-1.5 py-0.1 rounded-full font-mono font-bold">
                  {vehicleCount}
                </span>
              )}
            </button>

            {/* 4. Top Quick Save Button */}
            <button
              id="top-btn-save-entry"
              type="button"
              onClick={onSaveEntry}
              disabled={isSaving}
              className="flex items-center gap-1 bg-gray-900 hover:bg-black text-white px-3 py-1 rounded text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Save Entry & Update Statements (Ctrl+S) - Clears sheet after saving"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
            </button>

            {/* 6. Top Clear Sheet Button */}
            {onClearSheet && !isSaved && (
              <button
                id="top-btn-clear-sheet"
                type="button"
                onClick={onClearSheet}
                className="flex items-center gap-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 px-2 py-1 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Clear all rows and expenses on sheet (पूरी शीट खाली करें)"
              >
                <Eraser className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Date Display (Read-Only) & Primary View Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Static Date Display - No Editing */}
            <div className="flex items-center gap-1.5 bg-gray-100/90 border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 shadow-2xs select-none">
              <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span className="font-bold text-gray-900 tracking-tight">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded border border-gray-200 text-xs font-medium">
              <button
                id="tab-daily-entry"
                type="button"
                onClick={() => onSelectTab('daily')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                  currentTab === 'daily'
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Daily Entry</span>
              </button>
              <button
                id="tab-statement"
                type="button"
                onClick={() => onSelectTab('statement')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                  currentTab === 'statement'
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Statement</span>
              </button>
            </div>

            {/* Quick Print Button */}
            <button
              id="btn-print-statement-nav"
              type="button"
              onClick={onOpenPrint}
              className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-2 py-1 rounded text-xs font-medium shadow-2xs transition-colors"
              title="Print Account Statement"
            >
              <Printer className="w-3 h-3 text-gray-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Reset / Demo sample */}
            <button
              id="btn-reset-data"
              type="button"
              onClick={onResetToDemo}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Reset with Default Demo Data"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* User Session & Logout */}
            {onLogout && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-200">
                {loggedInUser && (
                  <span
                    className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200"
                    title={`सत्यापित यूजर: ${loggedInUser}`}
                  >
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>{loggedInUser}</span>
                  </span>
                )}
                <button
                  id="btn-logout"
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors shadow-2xs cursor-pointer"
                  title="लॉगआउट करें (लॉगिन पेज पर वापस जाएं)"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">लॉगआउट</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

