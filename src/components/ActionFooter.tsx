import React from 'react';
import { CheckCircle2, Plus, Truck, UserPlus, BookOpen, Save, ListOrdered, Eraser } from 'lucide-react';

interface ActionFooterProps {
  onSaveEntry: () => void;
  onClearSheet?: () => void;
  onOpenAddVehicle: () => void;
  onOpenVehicleList?: () => void;
  onOpenAddWorker?: () => void;
  onOpenAddDiary?: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
  onSaveEntry,
  onClearSheet,
  onOpenAddVehicle,
  onOpenVehicleList,
  onOpenAddWorker,
  onOpenAddDiary,
  isSaving,
  isEditing,
}) => {
  return (
    <div className="mt-6 mb-12 space-y-5">
      {/* 1. Main SAVE ENTRY Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-gray-900">
            {isEditing ? 'सेव की गई एंट्री में बदलाव सुरक्षित करें' : "Ready to record today's daily operations?"}
          </h4>
          <p className="text-xs text-gray-500">
            {isEditing
              ? 'बदलाव लेज़र और डेली शीट में अपडेट हो जाएंगे और डैशबोर्ड दोबारा 0 (खाली) हो जाएगा।'
              : 'Saves all vehicle trips, fuel, maintenance, diary expenses into the Account Statement ledger, and clears the sheet completely fresh for the next entries.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClearSheet && !isEditing && (
            <button
              id="btn-clear-sheet-footer"
              type="button"
              onClick={onClearSheet}
              className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs sm:text-sm rounded-md shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all rows on today's sheet (शीट खाली करें)"
            >
              <Eraser className="w-4 h-4 text-rose-500" />
              <span>CLEAR / खाली करें</span>
            </button>
          )}

          <button
            id="btn-save-entry"
            type="button"
            onClick={onSaveEntry}
            disabled={isSaving}
            className={`w-full sm:w-auto px-8 py-3 ${
              isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900 hover:bg-black'
            } text-white font-bold text-sm sm:text-base rounded-md shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50`}
          >
            <Save className="w-5 h-5 text-emerald-400" />
            <span>{isSaving ? 'SAVING...' : isEditing ? 'SAVE CHANGES (बदलाव सेव करें)' : 'SAVE ENTRY (एंट्री सेव करें)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Bottom Actions (+ Add Vehicle, Vehicle List, + Add Worker, + DIARY / खर्चा) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* + ADD VEHICLE */}
          <button
            id="btn-add-vehicle"
            type="button"
            onClick={onOpenAddVehicle}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>+ ADD VEHICLE</span>
          </button>

          {/* VEHICLE LIST (MANAGE & DELETE) */}
          {onOpenVehicleList && (
            <button
              id="btn-vehicle-list-bottom"
              type="button"
              onClick={onOpenVehicleList}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
              title="View all saved vehicles and choose which to keep or delete"
            >
              <ListOrdered className="w-4 h-4 text-slate-700" />
              <span>VEHICLE LIST / लिस्ट</span>
            </button>
          )}

          {/* + ADD WORKER */}
          {onOpenAddWorker && (
            <button
              id="btn-add-worker"
              type="button"
              onClick={onOpenAddWorker}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>+ ADD WORKER</span>
            </button>
          )}
        </div>

        {/* + DIARY / खर्चा */}
        {onOpenAddDiary && (
          <div>
            <button
              id="btn-add-diary-bottom"
              type="button"
              onClick={onOpenAddDiary}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ DIARY / खर्चा</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
