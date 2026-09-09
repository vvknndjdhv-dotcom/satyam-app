import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Info, AlertCircle, Edit2, Calendar, FileText, X, Save, Eraser } from 'lucide-react';
import { Header } from './components/Header';
import { BalanceBar } from './components/BalanceBar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { ActionFooter } from './components/ActionFooter';
import { AddVehicleModal } from './components/AddVehicleModal';
import { VehicleListModal } from './components/VehicleListModal';
import { StatementView } from './components/StatementView';
import { PrintStatementModal } from './components/PrintStatementModal';
import { SavedEntriesModal } from './components/SavedEntriesModal';
import { WorkerSection } from './components/WorkerSection';
import { AddWorkerModal } from './components/AddWorkerModal';
import { DailyExtraExpenseSection } from './components/DailyExtraExpenseSection';
import {
  DailySheetState,
  DiaryExpense,
  StatementTransaction,
  Vehicle,
  VehicleRowEntry,
  Worker,
} from './types';
import { getTodayDateString, formatDisplayDate } from './utils/calculator';
import {
  DEFAULT_VEHICLES,
  DEFAULT_WORKERS,
  createEmptyDailySheet,
  getOrCreateDailySheet,
  getSavedDailySheet,
  getAllSavedSheets,
  getWorkerPastAdvances,
  getWorkerTodaySavedAdvance,
  recordWorkerAdvance,
  clearWorkerAdvances,
  getStoredOpeningBalance,
  getStoredStatements,
  getStoredVehicles,
  getStoredWorkers,
  recordDailySheetToStatement,
  saveDailySheet,
  saveStoredOpeningBalance,
  saveStoredStatements,
  saveStoredVehicles,
  saveStoredWorkers,
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  getStoredAuthCredentials,
  clearAllAppDataAndResetClean,
} from './utils/storage';
import { LoginPage } from './components/LoginPage';
 import { uploadLocalDataToCloud, downloadCloudDataToLocal, hasCloudData } from './utils/cloudSync';
export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getAuthSession());
  const [loggedInUserPhone, setLoggedInUserPhone] = useState<string>(() => getStoredAuthCredentials().phone);

  const [currentTab, setCurrentTab] = useState<'daily' | 'statement'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [advanceVersion, setAdvanceVersion] = useState<number>(0);

  // Core Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStoredVehicles());
  const [workers, setWorkers] = useState<Worker[]>(() => getStoredWorkers());
  const [openingBalance, setOpeningBalance] = useState<number>(() => getStoredOpeningBalance());
  const [dailySheet, setDailySheet] = useState<DailySheetState>(() =>
    createEmptyDailySheet(selectedDate, getStoredOpeningBalance(), getStoredVehicles())
  );
  const [statements, setStatements] = useState<StatementTransaction[]>(() => getStoredStatements());
 
  // Saved Entry & Edit State
  const [isEditingSavedEntry, setIsEditingSavedEntry] = useState(false);
  const [isSavedEntriesOpen, setIsSavedEntriesOpen] = useState(false);

  // Date-specific active workers list:
  // Base profile (name, mobile, salary) comes from registry.
  // Accumulated advance stays deducted permanently across the month.
  // Daily advance input starts at 0/empty, and while typing, dynamically deducts from remaining salary.
  const activeWorkers = useMemo(() => {
    const dailyEntries = dailySheet.workerEntries || {};
    return workers.map((w) => {
      const daily = dailyEntries[w.id];
      let todayAdv = 0;
      if (daily !== undefined && typeof daily.advance === 'number') {
        todayAdv = daily.advance;
      } else if (isEditingSavedEntry) {
        todayAdv = getWorkerTodaySavedAdvance(w.id, selectedDate);
      }

      const salary = typeof w.salary === 'number' ? w.salary : 0;
      const accumulated = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
      const remaining = salary - accumulated - todayAdv;
      return {
        ...w,
        accumulatedAdvance: accumulated,
        pastAdvance: accumulated,
        advance: todayAdv,
        totalAdvance: accumulated + todayAdv,
        remainingSalary: remaining,
        status: daily !== undefined ? daily.status : (w.status || 'Present'),
      };
    });
  }, [workers, dailySheet.workerEntries, isEditingSavedEntry, selectedDate, advanceVersion]);

  // Check if current selectedDate has a saved sheet
  const currentSavedSheet = useMemo(() => {
    return getSavedDailySheet(selectedDate);
  }, [selectedDate, statements]);

  // Total saved daily sheets count
  const savedCount = useMemo(() => {
    return Object.values(getAllSavedSheets()).filter((s) => s.isSaved).length;
  }, [statements]);

  // Modal States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isVehicleListOpen, setIsVehicleListOpen] = useState(false);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };
useEffect(() => {
  const loadCloudData = async () => {
    const cloudExists = await hasCloudData();

    if (cloudExists) {
      const downloaded = await downloadCloudDataToLocal();

      if (downloaded) {
        setVehicles(getStoredVehicles());
        setWorkers(getStoredWorkers());
        setOpeningBalance(getStoredOpeningBalance());
        setStatements(getStoredStatements());

        const freshSheet = getOrCreateDailySheet(
          selectedDate,
          getStoredVehicles()
        );

        setDailySheet(freshSheet);
        showToast('Cloud data loaded successfully', 'success');
      }
    }
  };

  loadCloudData();
}, []);
  const handleLoginSuccess = (userPhone: string) => {
    setAuthSession(true);
    setIsAuthenticated(true);
    setLoggedInUserPhone(userPhone);
    showToast('सत्यम पोर्टल में आपका स्वागत है! लॉगिन सफल रहा।', 'success');
  };

  const handleLogout = () => {
    setAuthSession(false);
    setIsAuthenticated(false);
    showToast('आप सफलतापूर्वक लॉगआउट हो गए हैं।', 'info');
  };

  // Date Change Handler: Keep dashboard clean (0) and ready for fresh input,
  // while preserving any entered worker advances and displaying saved indicator banner if this date was saved
  const handleDateChange = useCallback(
    (newDate: string) => {
      // Ensure any worker advances in current active sheet are safely recorded in ledger
      if (dailySheet.workerEntries) {
        const entries = dailySheet.workerEntries as Record<string, { status?: string; advance?: number }>;
        for (const [wId, entry] of Object.entries(entries)) {
          if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
            recordWorkerAdvance(wId, selectedDate, entry.advance, `Advance on ${selectedDate}`);
          }
        }
      }
      setSelectedDate(newDate);
      setIsEditingSavedEntry(false);
      const cleanSheet = createEmptyDailySheet(newDate, openingBalance, vehicles);
      setDailySheet(cleanSheet);
      setAdvanceVersion((v) => v + 1);
    },
    [dailySheet.workerEntries, selectedDate, openingBalance, vehicles]
  );

  // Load Saved Entry into spreadsheet for user editing
  const handleLoadSavedEntryForEdit = useCallback(
    (dateToLoad: string) => {
      const saved = getSavedDailySheet(dateToLoad);
      if (saved) {
        setSelectedDate(dateToLoad);
        setDailySheet(saved);
        setIsEditingSavedEntry(true);
        showToast(
          `तारीख ${formatDisplayDate(dateToLoad)} की एंट्री एडिट करने के लिए लोड हो गई है।`,
          'info'
        );
      } else {
        showToast(`तारीख ${formatDisplayDate(dateToLoad)} की कोई सेव की गई एंट्री नहीं मिली।`, 'info');
      }
    },
    []
  );

  // Cancel Edit and return dashboard to 0/empty
  const handleCancelEdit = useCallback(() => {
    const cleanSheet = createEmptyDailySheet(selectedDate, openingBalance, vehicles);
    setDailySheet(cleanSheet);
    setIsEditingSavedEntry(false);
    showToast('एडिटिंग रद्द की गई। डैशबोर्ड खाली (0) है।', 'info');
  }, [selectedDate, openingBalance, vehicles]);

  // Advance to next day
  const handleNextDay = useCallback(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 1);
      const nextY = d.getFullYear();
      const nextM = String(d.getMonth() + 1).padStart(2, '0');
      const nextD = String(d.getDate()).padStart(2, '0');
      const nextDateStr = `${nextY}-${nextM}-${nextD}`;

      handleDateChange(nextDateStr);
      showToast(`अगली तारीख ${nextDateStr} सेट कर दी गई है।`, 'info');
    } catch (e) {
      console.error('Error advancing date', e);
    }
  }, [selectedDate, handleDateChange]);

  // Aggregate daily metrics
  const totalWorkIncome = useMemo(() => {
    return dailySheet.rows.reduce((sum, r) => sum + r.workTotal, 0);
  }, [dailySheet.rows]);

  const totalFuelExpense = useMemo(() => {
    return dailySheet.rows.reduce(
      (sum, r) => sum + (typeof r.fuelExpense === 'number' ? r.fuelExpense : 0),
      0
    );
  }, [dailySheet.rows]);

  const totalMaintenanceExpense = useMemo(() => {
    return dailySheet.rows.reduce(
      (sum, r) => sum + (typeof r.maintenanceExpense === 'number' ? r.maintenanceExpense : 0),
      0
    );
  }, [dailySheet.rows]);

  const totalDiaryExpense = useMemo(() => {
    const directExtra = typeof dailySheet.extraExpenseAmount === 'number' ? dailySheet.extraExpenseAmount : 0;
    if (directExtra > 0) return directExtra;
    return dailySheet.diaryExpenses?.reduce((sum, d) => sum + d.amount, 0) || 0;
  }, [dailySheet.diaryExpenses, dailySheet.extraExpenseAmount]);

  // Total Worker Advance paid today (out of company cash)
  const totalWorkerAdvance = useMemo(() => {
    const entries = dailySheet.workerEntries || {};
    return Object.values(entries).reduce(
      (sum: number, e: { status?: string; advance?: number }) =>
        sum + (typeof e?.advance === 'number' ? e.advance : 0),
      0
    );
  }, [dailySheet.workerEntries]);

  // Handle updates to rows
  const handleUpdateRows = (newRows: VehicleRowEntry[]) => {
    setDailySheet((prev) => ({
      ...prev,
      rows: newRows,
      isSaved: false,
    }));
  };

  // Handle update to opening balance
  const handleUpdateOpeningBalance = (newAmount: number) => {
    setOpeningBalance(newAmount);
    saveStoredOpeningBalance(newAmount);
    setDailySheet((prev) => ({
      ...prev,
      openingBalance: newAmount,
    }));
    showToast(`Opening balance updated to ₹${newAmount.toLocaleString('en-IN')}`, 'info');
  };

  // Permanently add today's work income into base opening balance
  const handleAddIncomeToOpening = () => {
    if (totalWorkIncome <= 0) {
      showToast('No work income to add yet', 'info');
      return;
    }
    const updatedOpening = openingBalance + totalWorkIncome;
    setOpeningBalance(updatedOpening);
    saveStoredOpeningBalance(updatedOpening);
    setDailySheet((prev) => ({
      ...prev,
      openingBalance: updatedOpening,
    }));
    showToast(
      `Added ₹${totalWorkIncome.toLocaleString('en-IN')} work income to Base Opening (New: ₹${updatedOpening.toLocaleString('en-IN')})`,
      'success'
    );
  };

  // Handle Save Entry (Main Action)
  // Saves the entry permanently in storage & ledger, then clears dashboard to 0, with 1-click option to Edit anytime!
  const handleSaveEntry = useCallback(() => {
    setIsSaving(true);

    const sheetToSave: DailySheetState = {
      ...dailySheet,
      openingBalance,
      isSaved: true,
      lastSavedAt: new Date().toISOString(),
    };

    // 1. Permanently save the user's entered data into daily sheets storage!
    saveDailySheet(sheetToSave);

    // Update workers registry with current advances and remaining salaries:
    // Any newly entered advance is accumulated into worker's permanent balance,
    // and worker's active advance is zeroed out so the input box becomes completely empty (0)!
    const updatedWorkersList = workers.map((w) => {
      const entryAdv = sheetToSave.workerEntries?.[w.id]?.advance || 0;
      const sal = typeof w.salary === 'number' ? w.salary : 0;
      const priorAccum = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
      const newAccum = priorAccum + entryAdv;
      const newRemaining = sal - newAccum;
      return {
        ...w,
        accumulatedAdvance: newAccum,
        advance: 0, // Advance box is cleared to 0 / empty!
        remainingSalary: newRemaining,
      };
    });
    setWorkers(updatedWorkersList);
    saveStoredWorkers(updatedWorkersList);

    // Also ensure all worker advances in this sheet are written to permanent advance ledger
    if (sheetToSave.workerEntries) {
      const entries = sheetToSave.workerEntries as Record<string, { status?: string; advance?: number }>;
      for (const [wId, entry] of Object.entries(entries)) {
        if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
          recordWorkerAdvance(wId, selectedDate, entry.advance, `Sheet Entry ${selectedDate}`);
        }
      }
    }
    setAdvanceVersion((v) => v + 1);

    // 2. Permanently record transactions into Statement/Ledger
    const updatedStatements = recordDailySheetToStatement(sheetToSave);
    setStatements(updatedStatements);

    // 3. Compute new closing balance (Available Balance)
    // Formula: Work Income - Total Expenses = Today's Net (Profit or Loss)
    // Opening Balance + Profit (or Opening Balance - Loss) = New Closing Balance
    const workIncomeSum = sheetToSave.rows.reduce((sum, r) => sum + r.workTotal, 0);
    const fuelSum = sheetToSave.rows.reduce(
      (sum, r) => sum + (typeof r.fuelExpense === 'number' ? r.fuelExpense : 0),
      0
    );
    const maintSum = sheetToSave.rows.reduce(
      (sum, r) => sum + (typeof r.maintenanceExpense === 'number' ? r.maintenanceExpense : 0),
      0
    );
    const extraDirect = typeof sheetToSave.extraExpenseAmount === 'number' ? sheetToSave.extraExpenseAmount : 0;
    const diarySum = extraDirect > 0 ? extraDirect : (sheetToSave.diaryExpenses?.reduce((sum, d) => sum + d.amount, 0) || 0);
    const workerAdvSum = Object.values(sheetToSave.workerEntries || {}).reduce(
      (sum: number, e: { status?: string; advance?: number }) =>
        sum + (typeof e?.advance === 'number' ? e.advance : 0),
      0
    );
    const totalExpenses = fuelSum + maintSum + diarySum + workerAdvSum;
    const todayNet = workIncomeSum - totalExpenses;
    const isProfit = todayNet >= 0;
    const netAmount = Math.abs(todayNet);
    const closingBalance = openingBalance + todayNet;

    // Advance Opening Balance to the newly computed Closing Balance
    // (If profit: XYZ is added to Opening; if loss: XYZ is deducted from Opening)
    setOpeningBalance(closingBalance);
    saveStoredOpeningBalance(closingBalance);
void uploadLocalDataToCloud();
    // 4. CRITICAL USER REQUIREMENT:
    // "जब मेरी एंट्री सेव हो जाए, तो जो एडवांस लिया हुआ है, वह पूरी तरह से ज़ीरो होना चाहिए। एक ही बार एंट्री सेव होने के बाद, एडवांस लिया हुआ पूरी तरह से ज़ीरो हो जाना चाहिए और वह जगह खाली हो जानी चाहिए। उसकी जगह पर जो लिया हुआ एडवांस एक्सपायर्ड अमाउंट है, वह एडजस्ट होना चाहिए।"
    const freshCleanSheet = createEmptyDailySheet(selectedDate, closingBalance, vehicles);
    const cleanWorkerEntries: Record<string, { status: 'Present' | 'Absent'; advance: number }> = {};
    workers.forEach((w) => {
      const prevStatus = (sheetToSave.workerEntries?.[w.id]?.status as 'Present' | 'Absent') || (w.status as 'Present' | 'Absent') || 'Present';
      cleanWorkerEntries[w.id] = {
        status: prevStatus,
        advance: 0, // Advance box is completely empty / zero!
      };
    });
    freshCleanSheet.workerEntries = cleanWorkerEntries;
    setDailySheet(freshCleanSheet);
    setIsEditingSavedEntry(false);

    setIsSaving(false);
    showToast(
      isProfit
        ? `✓ तारीख ${selectedDate} की एंट्री सुरक्षित सेव हो गई! आज का मुनाफा (प्रॉफिट) +₹${netAmount.toLocaleString('en-IN')} ओपनिंग में जुड़ गया है। (नया ओपनिंग बैलेंस: ₹${closingBalance.toLocaleString('en-IN')})`
        : `✓ तारीख ${selectedDate} की एंट्री सुरक्षित सेव हो गई! आज का घाटा (लॉस) -₹${netAmount.toLocaleString('en-IN')} ओपनिंग से कट गया है। (नया ओपनिंग बैलेंस: ₹${closingBalance.toLocaleString('en-IN')})`,
      'success'
    );
  }, [dailySheet, openingBalance, selectedDate, vehicles, workers]);

  // Manually Clear Sheet (पूरी शीट खाली करें)
  const handleClearSheet = useCallback(() => {
    const cleanSheet = createEmptyDailySheet(selectedDate, openingBalance, vehicles);
    const cleanWorkerEntries: Record<string, { status: 'Present' | 'Absent'; advance: number }> = {};
    workers.forEach((w) => {
      cleanWorkerEntries[w.id] = {
        status: (w.status as 'Present' | 'Absent') || 'Present',
        advance: 0,
      };
    });
    cleanSheet.workerEntries = cleanWorkerEntries;
    setDailySheet(cleanSheet);
    setIsEditingSavedEntry(false);
    showToast('गाड़ियों की ट्रिप और खर्चे खाली (0) कर दिए गए हैं। कामगारों की सैलरी सुरक्षित है।', 'info');
  }, [selectedDate, openingBalance, vehicles, workers]);

  // Keyboard shortcut: Ctrl+S or Cmd+S to Save Entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveEntry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveEntry]);

  // Add Vehicle Handler
  const handleSaveVehicle = (newVeh: Vehicle) => {
    const updatedVehicles = [...vehicles, newVeh];
    setVehicles(updatedVehicles);
    saveStoredVehicles(updatedVehicles);

    // Also append an empty row for this newly added vehicle in today's sheet
    const newRow: VehicleRowEntry = {
      id: `row-${Date.now()}`,
      vehicleId: newVeh.id,
      vehicleLabel: newVeh.name || `${newVeh.type} ${newVeh.number}`,
      fuelExpense: '',
      maintenanceExpense: '',
      workDetails: '',
      workTotal: 0,
      net: 0,
    };
    setDailySheet((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));

    showToast(`Vehicle ${newVeh.name || newVeh.number} added to sheet`, 'success');
  };

  // Delete/Remove Vehicle from fleet list
  const handleDeleteVehicle = (vehicleId: string) => {
    const vehToDelete = vehicles.find((v) => v.id === vehicleId);
    const updatedVehicles = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(updatedVehicles);
    saveStoredVehicles(updatedVehicles);

    showToast(
      `Vehicle ${vehToDelete?.name || vehToDelete?.number || ''} removed from fleet`,
      'info'
    );
  };

  // Add an existing fleet vehicle directly into today's daily sheet
  const handleAddVehicleToTodaySheet = (vehicleId: string) => {
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) return;

    const alreadyInSheet = dailySheet.rows.some((r) => r.vehicleId === vehicleId);
    if (alreadyInSheet) {
      showToast(`${veh.name || veh.number} is already in today's sheet`, 'info');
      return;
    }

    const newRow: VehicleRowEntry = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      vehicleId: veh.id,
      vehicleLabel: veh.name || `${veh.type} ${veh.number}`,
      fuelExpense: '',
      maintenanceExpense: '',
      workDetails: '',
      workTotal: 0,
      net: 0,
    };

    setDailySheet((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));

    showToast(`${veh.name || veh.number} added to today's sheet`, 'success');
  };

  // Add / Edit Worker Handler
  const handleSaveWorker = (workerData: Worker) => {
    const existingIndex = workers.findIndex((w) => w.id === workerData.id);
    let updatedWorkers: Worker[];
    if (existingIndex >= 0) {
      updatedWorkers = [...workers];
      updatedWorkers[existingIndex] = workerData;
      showToast(`Worker "${workerData.name}" (${workerData.role}) updated successfully`, 'success');
    } else {
      updatedWorkers = [...workers, workerData];
      showToast(`New worker "${workerData.name}" (${workerData.role}) registered`, 'success');
    }
    setWorkers(updatedWorkers);
    saveStoredWorkers(updatedWorkers);
    setWorkerToEdit(null);
  };

  // Delete Worker Handler (Iframe-safe: direct deletion, confirmation handled inline in UI)
  const handleDeleteWorker = (workerId: string) => {
    const workerToDelete = workers.find((w) => w.id === workerId);
    if (!workerToDelete) return;
    const updated = workers.filter((w) => w.id !== workerId);
    setWorkers(updated);
    saveStoredWorkers(updated);
    showToast(`कामगार "${workerToDelete.name}" को सफलतापूर्वक हटा दिया गया है।`, 'info');
  };

  // Update Worker directly:
  // Base fields (name, mobile, salary, role) update permanent worker profile.
  // Daily fields (advance, attendance status) update the active selectedDate's dailySheet and workers registry!
  const handleUpdateWorker = (updatedWorker: Worker) => {
    const newAdv = typeof updatedWorker.advance === 'number' ? updatedWorker.advance : 0;
    const newStatus = updatedWorker.status || 'Present';
    const salary = typeof updatedWorker.salary === 'number' ? updatedWorker.salary : 0;
    const accumulated = typeof updatedWorker.accumulatedAdvance === 'number' ? updatedWorker.accumulatedAdvance : 0;
    const remainingSalary = salary - accumulated - newAdv;

    // 1. Update permanent registry with current advance & remaining balance
    const updatedRegistry = workers.map((w) =>
      w.id === updatedWorker.id
        ? {
            ...w,
            name: updatedWorker.name,
            mobile: updatedWorker.mobile,
            salary: updatedWorker.salary,
            role: updatedWorker.role,
            accumulatedAdvance: accumulated,
            advance: newAdv,
            remainingSalary,
            status: newStatus,
          }
        : w
    );
    setWorkers(updatedRegistry);
    saveStoredWorkers(updatedRegistry);

    // 2. Permanently record in worker advance ledger
    recordWorkerAdvance(updatedWorker.id, selectedDate, newAdv, `Advance on ${selectedDate}`);
    setAdvanceVersion((v) => v + 1);

    // 3. Update date-specific daily attendance & advance for active sheet
    setDailySheet((prev) => ({
      ...prev,
      workerEntries: {
        ...(prev.workerEntries || {}),
        [updatedWorker.id]: {
          status: newStatus,
          advance: newAdv,
        },
      },
    }));
  };

  // Settle / Clear Worker Advance (महीने का हिसाब चुकता करना)
  const handleClearWorkerAdvances = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    clearWorkerAdvances(workerId);
    setAdvanceVersion((v) => v + 1);

    const updatedWorkers = workers.map((w) =>
      w.id === workerId
        ? {
            ...w,
            advance: 0,
            accumulatedAdvance: 0,
            pastAdvance: 0,
            totalAdvance: 0,
            remainingSalary: w.salary || 0,
          }
        : w
    );
    setWorkers(updatedWorkers);
    saveStoredWorkers(updatedWorkers);

    setDailySheet((prev) => {
      const updatedEntries = { ...(prev.workerEntries || {}) };
      if (updatedEntries[workerId]) {
        updatedEntries[workerId] = {
          ...updatedEntries[workerId],
          advance: 0,
        };
      }
      return {
        ...prev,
        workerEntries: updatedEntries,
      };
    });
    showToast(`✓ ${worker?.name || 'कामगार'} का एडवांस चुकता कर दिया गया है। पूरी सैलरी (₹${(worker?.salary || 0).toLocaleString('en-IN')}) उपलब्ध है।`, 'success');
  };

  // Pay Advance to Worker
  const handlePayWorkerAdvance = (worker: Worker) => {
    setWorkerToEdit(worker);
    setIsAddWorkerOpen(true);
  };

  // Direct Extra Expense / Diary Handlers (पूरी खाली जगह टाइपिंग व खर्चा रकम)
  const handleUpdateExtraExpenseAmount = (newAmount: number | '') => {
    setDailySheet((prev) => {
      const num = typeof newAmount === 'number' ? newAmount : 0;
      const updatedDiaryExpenses: DiaryExpense[] =
        num > 0
          ? [
              {
                id: `extra-${selectedDate}`,
                date: selectedDate,
                time: '12:00 PM',
                name: 'एक्स्ट्रा खर्चा',
                amount: num,
                description: prev.extraExpenseNotes?.trim() || 'दैनिक एक्स्ट्रा खर्चा व डायरी नोट',
              },
            ]
          : [];

      return {
        ...prev,
        extraExpenseAmount: newAmount,
        diaryExpenses: updatedDiaryExpenses,
        isSaved: false,
      };
    });
  };

  const handleUpdateExtraExpenseNotes = (newNotes: string) => {
    setDailySheet((prev) => {
      const num = typeof prev.extraExpenseAmount === 'number' ? prev.extraExpenseAmount : 0;
      const updatedDiaryExpenses: DiaryExpense[] =
        num > 0
          ? [
              {
                id: `extra-${selectedDate}`,
                date: selectedDate,
                time: '12:00 PM',
                name: 'एक्स्ट्रा खर्चा',
                amount: num,
                description: newNotes.trim() || 'दैनिक एक्स्ट्रा खर्चा व डायरी नोट',
              },
            ]
          : [];

      return {
        ...prev,
        extraExpenseNotes: newNotes,
        diaryExpenses: updatedDiaryExpenses,
        isSaved: false,
      };
    });
  };

  // Reset and Clear all data to fresh clean state
  const handleResetToDemo = () => {
    if (window.confirm('क्या आप सारा डेटा पूरी तरह खाली करके फ्रेश शुरू करना चाहते हैं? (बैलेंस ₹1,00,000 रहेगा और सभी एंट्री 0 हो जाएंगी)')) {
      clearAllAppDataAndResetClean();
      setVehicles([]);
      setWorkers([]);
      setOpeningBalance(100000);
      const freshSheet = createEmptyDailySheet(selectedDate, 100000, []);
      setDailySheet(freshSheet);
      setStatements(getStoredStatements());
      showToast('एप्लिकेशन का सारा डेटा साफ कर दिया गया है (₹1,00,000 बैलेंस)', 'info');
    }
  };

  // If user is not authenticated, render Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(phone) => {
          setIsAuthenticated(true);
          setLoggedInUserPhone(phone);
          showToast(`सफलतापूर्वक लॉगिन हुआ (${phone})`, 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-gray-900 text-white border-emerald-500'
                : 'bg-white text-gray-800 border-gray-300'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedDate={selectedDate}
        onChangeDate={handleDateChange}
        onOpenPrint={() => setIsPrintOpen(true)}
        onResetToDemo={handleResetToDemo}
        onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
        onOpenVehicleList={() => setIsVehicleListOpen(true)}
        vehicleCount={vehicles.length}
        onSaveEntry={handleSaveEntry}
        onClearSheet={handleClearSheet}
        isSaving={isSaving}
        isSaved={!!currentSavedSheet}
        onOpenSavedEntries={() => setIsSavedEntriesOpen(true)}
        savedCount={savedCount}
        isEditingSavedEntry={isEditingSavedEntry}
        onEditCurrentSavedEntry={() => handleLoadSavedEntryForEdit(selectedDate)}
        loggedInUser={loggedInUserPhone}
        onLogout={() => {
          clearAuthSession();
          setIsAuthenticated(false);
          showToast('सफलतापूर्वक लॉगआउट हो गया', 'info');
        }}
      />

      {/* Sticky Top Balance Bar */}
      <BalanceBar
        openingBalance={openingBalance}
        onUpdateOpeningBalance={handleUpdateOpeningBalance}
        onAddIncomeToOpening={handleAddIncomeToOpening}
        totalWorkIncome={totalWorkIncome}
        totalFuelExpense={totalFuelExpense}
        totalMaintenanceExpense={totalMaintenanceExpense}
        totalWorkerAdvance={totalWorkerAdvance}
        totalDiaryExpense={totalDiaryExpense}
      />

      {/* Main Working Sheet Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4">
        {currentTab === 'daily' ? (
          <div>
            {/* Spreadsheet Section (Vehicle Entry Section) */}
            <SpreadsheetGrid
              rows={dailySheet.rows}
              onChangeRows={handleUpdateRows}
              vehicles={vehicles}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onOpenVehicleList={() => setIsVehicleListOpen(true)}
            />

            {/* Worker Section (व्हीकल एंट्री के ठीक नीचे) */}
            <WorkerSection
              workers={activeWorkers}
              onOpenAddWorker={() => {
                setWorkerToEdit(null);
                setIsAddWorkerOpen(true);
              }}
              onEditWorker={(w) => {
                setWorkerToEdit(w);
                setIsAddWorkerOpen(true);
              }}
              onUpdateWorker={handleUpdateWorker}
              onDeleteWorker={handleDeleteWorker}
              onPayAdvance={handlePayWorkerAdvance}
              onClearWorkerAdvances={handleClearWorkerAdvances}
              onQuickAddWorker={(name, mobile, salary) => {
                const newW: Worker = {
                  id: `w-${Date.now()}`,
                  name,
                  mobile,
                  salary,
                  role: 'Worker',
                  advance: 0,
                  status: 'Present',
                };
                handleSaveWorker(newW);
              }}
            />

            {/* Daily Extra Expense Section (कामगार सेक्शन के ठीक नीचे - पूरी खाली जगह टाइपिंग व खर्चा रकम) */}
            <DailyExtraExpenseSection
              amount={
                dailySheet.extraExpenseAmount !== undefined
                  ? dailySheet.extraExpenseAmount
                  : (dailySheet.diaryExpenses?.[0]?.amount ?? '')
              }
              notes={
                dailySheet.extraExpenseNotes !== undefined
                  ? dailySheet.extraExpenseNotes
                  : (dailySheet.diaryExpenses?.[0]?.description ?? '')
              }
              onChangeAmount={handleUpdateExtraExpenseAmount}
              onChangeNotes={handleUpdateExtraExpenseNotes}
              onSave={handleSaveEntry}
              isSaved={dailySheet.isSaved}
            />

            {/* Bottom Action Footer */}
            <ActionFooter
              onSaveEntry={handleSaveEntry}
              onClearSheet={handleClearSheet}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onOpenVehicleList={() => setIsVehicleListOpen(true)}
              onOpenAddWorker={() => {
                setWorkerToEdit(null);
                setIsAddWorkerOpen(true);
              }}
              isSaving={isSaving}
              isEditing={isEditingSavedEntry}
            />
          </div>
        ) : (
          /* Statement & Ledger View */
          <StatementView
            statements={statements}
            vehicles={vehicles}
            onOpenPrint={() => setIsPrintOpen(true)}
          />
        )}
      </main>

      {/* Popups & Modals */}
      <VehicleListModal
        isOpen={isVehicleListOpen}
        onClose={() => setIsVehicleListOpen(false)}
        vehicles={vehicles}
        onDeleteVehicle={handleDeleteVehicle}
        onOpenAddVehicle={() => {
          setIsVehicleListOpen(false);
          setIsAddVehicleOpen(true);
        }}
        todayVehicleIds={dailySheet.rows.map((r) => r.vehicleId).filter(Boolean)}
        onAddVehicleToTodaySheet={handleAddVehicleToTodaySheet}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onSaveVehicle={handleSaveVehicle}
      />

      <AddWorkerModal
        isOpen={isAddWorkerOpen}
        onClose={() => {
          setIsAddWorkerOpen(false);
          setWorkerToEdit(null);
        }}
        onSaveWorker={handleSaveWorker}
        workerToEdit={workerToEdit}
      />

      <SavedEntriesModal
        isOpen={isSavedEntriesOpen}
        onClose={() => setIsSavedEntriesOpen(false)}
        onSelectEditEntry={(date) => handleLoadSavedEntryForEdit(date)}
        onViewStatement={() => setCurrentTab('statement')}
      />

      <PrintStatementModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        statements={statements}
        openingBalance={openingBalance}
      />
    </div>
  );
}
