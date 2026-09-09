import { DailySheetState, DiaryExpense, StatementTransaction, Vehicle, Worker } from '../types';
import { calculateWorkTotalFromText, getTodayDateString } from './calculator';

const STORAGE_KEYS = {
  VEHICLES: 'satyam_vehicles_v1',
  WORKERS: 'satyam_workers_v1',
  SHEETS: 'satyam_sheets_v1',
  STATEMENTS: 'satyam_statements_v1',
  OPENING_BALANCE: 'satyam_opening_balance_v1',
  WORKER_ADVANCES: 'satyam_worker_advances_v2',
  AUTH_CREDENTIALS: 'satyam_auth_credentials_v1',
  AUTH_SESSION: 'satyam_auth_session_v1',
};

export interface AuthCredentials {
  phone: string;
  password: string;
}

export const DEFAULT_AUTH_CREDENTIALS: AuthCredentials = {
  phone: '8379874187',
  password: 'satyam@123',
};

// Initial vehicles: completely empty as requested by user (user adds real fleet)
export const DEFAULT_VEHICLES: Vehicle[] = [];

// Initial workers: completely empty as requested by user (user adds real workers)
export const DEFAULT_WORKERS: Worker[] = [];

export function getStoredVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load vehicles from localStorage', e);
  }
  return [];
}

export function saveStoredVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Failed to save vehicles', e);
  }
}

export function getStoredWorkers(): Worker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((w: Worker) => {
          const salary = typeof w.salary === 'number' ? w.salary : 0;
          let accumulatedAdvance = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
          if (typeof w.accumulatedAdvance !== 'number') {
            if (typeof w.pastAdvance === 'number' && w.pastAdvance > 0) {
              accumulatedAdvance = w.pastAdvance;
            } else if (typeof w.remainingSalary === 'number' && w.remainingSalary < salary) {
              accumulatedAdvance = salary - w.remainingSalary;
            }
          }
          const advance = typeof w.advance === 'number' ? w.advance : 0;
          const remainingSalary = typeof w.remainingSalary === 'number'
            ? w.remainingSalary
            : Math.max(0, salary - accumulatedAdvance - advance);

          return {
            ...w,
            salary,
            accumulatedAdvance,
            advance,
            remainingSalary,
            status: w.status || 'Present',
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to load workers from localStorage', e);
  }
  return [];
}

export function saveStoredWorkers(workers: Worker[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  } catch (e) {
    console.error('Failed to save workers', e);
  }
}

export function getStoredOpeningBalance(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPENING_BALANCE);
    if (raw !== null) {
      const num = parseFloat(raw);
      if (!isNaN(num)) return num;
    }
  } catch (e) {
    console.error('Failed to get opening balance', e);
  }
  return 100000; // Default ₹1,00,000 as in prompt
}

export function saveStoredOpeningBalance(amount: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPENING_BALANCE, String(amount));
  } catch (e) {
    console.error('Failed to save opening balance', e);
  }
}

// Generate a completely clean empty sheet for a specific date
export function createEmptyDailySheet(
  date: string = getTodayDateString(),
  openingBalance: number = getStoredOpeningBalance(),
  vehicles: Vehicle[] = getStoredVehicles()
): DailySheetState {
  const emptyRows =
    vehicles.length > 0
      ? vehicles.map((v, index) => ({
          id: `row-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
          vehicleId: v.id,
          vehicleLabel: v.name || `${v.type} ${v.number}`,
          fuelExpense: '' as const,
          maintenanceExpense: '' as const,
          workDetails: '',
          workTotal: 0,
          net: 0,
        }))
      : Array.from({ length: 3 }).map((_, index) => ({
          id: `row-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
          vehicleId: '',
          vehicleLabel: '',
          fuelExpense: '' as const,
          maintenanceExpense: '' as const,
          workDetails: '',
          workTotal: 0,
          net: 0,
        }));

  return {
    date,
    openingBalance,
    rows: emptyRows,
    diaryExpenses: [],
    extraExpenseAmount: '',
    extraExpenseNotes: '',
    workerEntries: {}, // All workers have 0 advance and are Present on a clean sheet
    isSaved: false,
  };
}

// Generate or fetch daily sheet for a specific date
export function getOrCreateDailySheet(date: string = getTodayDateString(), vehicles: Vehicle[] = getStoredVehicles()): DailySheetState {
  try {
    const rawAll = localStorage.getItem(STORAGE_KEYS.SHEETS);
    if (rawAll) {
      const allSheets: Record<string, DailySheetState> = JSON.parse(rawAll);
      if (allSheets[date]) {
        // If it's the old hardcoded demo containing Tuljapur Solapur, replace it with clean empty sheet
        const hasStaleDemo = allSheets[date].rows?.some(
          (r) => typeof r.workDetails === 'string' && r.workDetails.includes('Tuljapur')
        );
        if (hasStaleDemo) {
          const clean = createEmptyDailySheet(date, getStoredOpeningBalance(), vehicles);
          allSheets[date] = clean;
          localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(allSheets));
          return clean;
        }
        return allSheets[date];
      }
    }
  } catch (e) {
    console.error('Failed to read daily sheets', e);
  }

  // If no saved sheet exists for this date, start completely fresh and clean
  return createEmptyDailySheet(date, getStoredOpeningBalance(), vehicles);
}

export function getAllSavedSheets(): Record<string, DailySheetState> {
  try {
    const rawAll = localStorage.getItem(STORAGE_KEYS.SHEETS);
    if (rawAll) {
      return JSON.parse(rawAll);
    }
  } catch (e) {
    console.error('Failed to read all daily sheets', e);
  }
  return {};
}

export function getSavedDailySheet(date: string): DailySheetState | null {
  try {
    const all = getAllSavedSheets();
    if (all[date] && all[date].isSaved) {
      return all[date];
    }
  } catch (e) {
    console.error('Failed to get saved sheet for date', e);
  }
  return null;
}

/**
 * Worker Advance Ledger Record
 * Permanently tracks each advance given to a worker by date.
 */
export interface WorkerAdvanceRecord {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  timestamp: number;
}

export function getAllWorkerAdvanceRecords(): WorkerAdvanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKER_ADVANCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load worker advance records', e);
  }
  return [];
}

/**
 * Permanently record or update an advance given to a worker on a specific date.
 * If amount <= 0, the record for this date is cleared.
 */
export function recordWorkerAdvance(
  workerId: string,
  date: string,
  amount: number,
  note?: string
): WorkerAdvanceRecord[] {
  try {
    const records = getAllWorkerAdvanceRecords();
    const existingIndex = records.findIndex((r) => r.workerId === workerId && r.date === date);

    if (amount > 0) {
      const updatedRecord: WorkerAdvanceRecord = {
        id: existingIndex >= 0 ? records[existingIndex].id : `wadv-${workerId}-${date}`,
        workerId,
        date,
        amount,
        note: note || `Advance on ${date}`,
        timestamp: Date.now(),
      };
      if (existingIndex >= 0) {
        records[existingIndex] = updatedRecord;
      } else {
        records.push(updatedRecord);
      }
    } else {
      if (existingIndex >= 0) {
        records.splice(existingIndex, 1);
      }
    }

    localStorage.setItem(STORAGE_KEYS.WORKER_ADVANCES, JSON.stringify(records));
    return records;
  } catch (e) {
    console.error('Failed to record worker advance', e);
    return [];
  }
}

/**
 * Clear all accumulated advances for a worker (e.g., month-end salary settlement).
 */
export function clearWorkerAdvances(workerId: string): void {
  try {
    const records = getAllWorkerAdvanceRecords();
    const filtered = records.filter((r) => r.workerId !== workerId);
    localStorage.setItem(STORAGE_KEYS.WORKER_ADVANCES, JSON.stringify(filtered));

    // Also reset worker profile openingAdvance, advance, accumulatedAdvance, and remainingSalary in registry
    const storedWorkers = getStoredWorkers();
    const updated = storedWorkers.map((w) =>
      w.id === workerId
        ? {
            ...w,
            advance: 0,
            accumulatedAdvance: 0,
            openingAdvance: 0,
            pastAdvance: 0,
            totalAdvance: 0,
            remainingSalary: w.salary || 0,
          }
        : w
    );
    saveStoredWorkers(updated);
  } catch (e) {
    console.error('Failed to clear worker advances', e);
  }
}

/**
 * Calculate total advances paid to a worker strictly PRIOR to the given target date (date < targetDate).
 * Reads from both the permanent Worker Advance Ledger and saved daily sheets.
 * Deduplicates by date.
 */
export function getWorkerPastAdvances(
  workerId: string,
  targetDate: string,
  openingAdvance: number = 0
): number {
  let pastSum = openingAdvance || 0;
  try {
    const dateAdvanceMap = new Map<string, number>();

    // 1. From permanent advance ledger
    const records = getAllWorkerAdvanceRecords();
    for (const r of records) {
      if (r.workerId === workerId && r.date < targetDate && typeof r.amount === 'number' && r.amount > 0) {
        dateAdvanceMap.set(r.date, r.amount);
      }
    }

    // 2. From saved daily sheets (ensures legacy/sheet entries are included)
    const allSheets = getAllSavedSheets();
    for (const dateKey of Object.keys(allSheets)) {
      if (dateKey < targetDate) {
        const sheet = allSheets[dateKey];
        if (sheet && sheet.workerEntries) {
          const entry = sheet.workerEntries[workerId];
          if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
            const current = dateAdvanceMap.get(dateKey) || 0;
            dateAdvanceMap.set(dateKey, Math.max(current, entry.advance));
          }
        }
      }
    }

    // Sum all unique prior date advances
    for (const amt of dateAdvanceMap.values()) {
      pastSum += amt;
    }
  } catch (e) {
    console.error('Failed to compute worker past advances', e);
  }
  return pastSum;
}

/**
 * Check if there is already a recorded/saved advance for this worker on the target date.
 */
export function getWorkerTodaySavedAdvance(workerId: string, targetDate: string): number {
  try {
    const records = getAllWorkerAdvanceRecords();
    const match = records.find((r) => r.workerId === workerId && r.date === targetDate);
    if (match && typeof match.amount === 'number' && match.amount > 0) {
      return match.amount;
    }

    const allSheets = getAllSavedSheets();
    const sheet = allSheets[targetDate];
    if (sheet && sheet.workerEntries) {
      const entry = sheet.workerEntries[workerId];
      if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
        return entry.advance;
      }
    }
  } catch (e) {
    console.error('Failed to get worker today saved advance', e);
  }
  return 0;
}

/**
 * History item for worker advances
 */
export interface WorkerAdvanceHistoryItem {
  date: string;
  advance: number;
  type: 'opening' | 'daily_sheet';
  note?: string;
}

export function getWorkerAdvanceHistory(workerId: string): WorkerAdvanceHistoryItem[] {
  const historyMap = new Map<string, WorkerAdvanceHistoryItem>();
  try {
    const records = getAllWorkerAdvanceRecords();
    for (const r of records) {
      if (r.workerId === workerId && r.amount > 0) {
        historyMap.set(r.date, {
          date: r.date,
          advance: r.amount,
          type: 'daily_sheet',
          note: r.note,
        });
      }
    }

    const allSheets = getAllSavedSheets();
    for (const dateKey of Object.keys(allSheets)) {
      const sheet = allSheets[dateKey];
      if (sheet && sheet.workerEntries) {
        const entry = sheet.workerEntries[workerId];
        if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
          const prev = historyMap.get(dateKey);
          historyMap.set(dateKey, {
            date: dateKey,
            advance: Math.max(prev?.advance || 0, entry.advance),
            type: 'daily_sheet',
            note: prev?.note || `Saved on ${dateKey}`,
          });
        }
      }
    }
  } catch (e) {
    console.error('Failed to get worker advance history', e);
  }

  return Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function saveDailySheet(sheet: DailySheetState): void {
  try {
    const rawAll = localStorage.getItem(STORAGE_KEYS.SHEETS);
    const allSheets: Record<string, DailySheetState> = rawAll ? JSON.parse(rawAll) : {};
    allSheets[sheet.date] = {
      ...sheet,
      isSaved: true,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(allSheets));

    // Permanently record all worker advances into the Worker Advance Ledger and update stored workers
    if (sheet.workerEntries) {
      const storedWorkers = getStoredWorkers();
      let workersChanged = false;
      const updatedWorkers = storedWorkers.map((w) => {
        const entry = sheet.workerEntries?.[w.id];
        if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
          workersChanged = true;
          const sal = typeof w.salary === 'number' ? w.salary : 0;
          const prevAccum = typeof w.accumulatedAdvance === 'number' ? w.accumulatedAdvance : 0;
          const newAccum = prevAccum + entry.advance;
          return {
            ...w,
            accumulatedAdvance: newAccum,
            advance: 0, // Advance input field becomes 0 / empty after entry save!
            remainingSalary: sal - newAccum,
            status: entry.status || w.status || 'Present',
          };
        }
        return w;
      });

      if (workersChanged) {
        saveStoredWorkers(updatedWorkers);
      }

      for (const [workerId, entry] of Object.entries(sheet.workerEntries)) {
        if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
          recordWorkerAdvance(workerId, sheet.date, entry.advance, `Sheet Entry ${sheet.date}`);
        }
      }
    }
  } catch (e) {
    console.error('Failed to save daily sheet', e);
  }
}

export function getCleanOpeningStatement(amount: number = 100000): StatementTransaction[] {
  const today = getTodayDateString();
  return [
    {
      id: 'tx-0',
      date: today,
      time: '08:00 AM',
      timestamp: Date.now(),
      category: 'Opening Balance',
      description: 'Starting Balance / प्रारंभिक शेष',
      debit: null,
      credit: amount,
      balance: amount,
      type: 'OPENING',
    },
  ];
}

// Statement / Ledger Transactions
export function getStoredStatements(): StatementTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATEMENTS);
    if (raw) {
      const list: StatementTransaction[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (e) {
    console.error('Failed to load statement transactions', e);
  }

  // Pure starting statement with only ₹1,00,000 opening balance, 0 income, 0 fuel, 0 maintenance
  return getCleanOpeningStatement(getStoredOpeningBalance());
}

export function saveStoredStatements(statements: StatementTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(statements));
  } catch (e) {
    console.error('Failed to save statements', e);
  }
}

/**
 * Appends transactions generated from a Saved Daily Sheet into the Ledger.
 * Recalculates running balance accurately.
 */
export function recordDailySheetToStatement(sheet: DailySheetState): StatementTransaction[] {
  const currentStatements = getStoredStatements();
  const today = sheet.date;

  // Filter out existing transactions from today's saved sheet run if re-saving
  const filtered = currentStatements.filter((s) => !s.id.startsWith(`sheet-${today}`));

  const newTxList: StatementTransaction[] = [];
  const baseTime = new Date();

  // 1. Vehicle Work Incomes & Expenses
  sheet.rows.forEach((row, idx) => {
    const timeStr = new Date(baseTime.getTime() + idx * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Fuel Expense
    if (typeof row.fuelExpense === 'number' && row.fuelExpense > 0) {
      newTxList.push({
        id: `sheet-${today}-fuel-${row.id}`,
        date: today,
        time: timeStr,
        timestamp: Date.now() + idx * 10,
        category: row.vehicleLabel || 'Vehicle',
        description: 'Fuel / Diesel Expense',
        debit: row.fuelExpense,
        credit: null,
        balance: 0, // will compute below
        vehicleId: row.vehicleId,
        type: 'FUEL',
      });
    }

    // Maintenance Expense
    if (typeof row.maintenanceExpense === 'number' && row.maintenanceExpense > 0) {
      newTxList.push({
        id: `sheet-${today}-maint-${row.id}`,
        date: today,
        time: timeStr,
        timestamp: Date.now() + idx * 10 + 1,
        category: row.vehicleLabel || 'Vehicle',
        description: 'Vehicle Maintenance / Repairs',
        debit: row.maintenanceExpense,
        credit: null,
        balance: 0,
        vehicleId: row.vehicleId,
        type: 'MAINTENANCE',
      });
    }

    // Work Income
    if (row.workTotal > 0) {
      newTxList.push({
        id: `sheet-${today}-work-${row.id}`,
        date: today,
        time: timeStr,
        timestamp: Date.now() + idx * 10 + 2,
        category: row.vehicleLabel || 'Vehicle',
        description: row.workDetails.split('\n')[0] || 'Work Trips Income',
        debit: null,
        credit: row.workTotal,
        balance: 0,
        vehicleId: row.vehicleId,
        type: 'WORK_INCOME',
      });
    }
  });

  // 2. Diary / Extra Expenses
  if (sheet.diaryExpenses && sheet.diaryExpenses.length > 0) {
    sheet.diaryExpenses.forEach((d, idx) => {
      newTxList.push({
        id: `sheet-${today}-diary-${d.id}`,
        date: d.date || today,
        time: d.time || '12:00 PM',
        timestamp: Date.now() + 500 + idx,
        category: 'एक्स्ट्रा खर्चा',
        description: `${d.name} - ${d.description}`,
        debit: d.amount,
        credit: null,
        balance: 0,
        type: 'DIARY',
      });
    });
  } else if (typeof sheet.extraExpenseAmount === 'number' && sheet.extraExpenseAmount > 0) {
    newTxList.push({
      id: `sheet-${today}-extra-exp`,
      date: today,
      time: '12:00 PM',
      timestamp: Date.now() + 500,
      category: 'एक्स्ट्रा खर्चा',
      description: sheet.extraExpenseNotes?.trim() || 'दैनिक एक्स्ट्रा खर्चा व डायरी',
      debit: sheet.extraExpenseAmount,
      credit: null,
      balance: 0,
      type: 'DIARY',
    });
  }

  // 3. Worker Advances (Recorded as cash debits)
  if (sheet.workerEntries) {
    const storedWorkers = getStoredWorkers();
    Object.entries(sheet.workerEntries).forEach(([workerId, entry], idx) => {
      if (entry && typeof entry.advance === 'number' && entry.advance > 0) {
        const worker = storedWorkers.find((w) => w.id === workerId);
        const workerName = worker?.name || 'कामगार';
        newTxList.push({
          id: `sheet-${today}-worker-adv-${workerId}`,
          date: today,
          time: '04:30 PM',
          timestamp: Date.now() + 600 + idx,
          category: 'Worker Advance',
          description: `Worker Advance - ${workerName} (अग्रिम भुगतान)`,
          debit: entry.advance,
          credit: null,
          balance: 0,
          type: 'OTHER',
        });
      }
    });
  }

  const combined = [...filtered, ...newTxList];

  // Sort chronologically and calculate running balance
  combined.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timestamp - b.timestamp;
  });

  let running = 0;
  // If first item is not opening balance, check starting balance
  const updatedWithBalance = combined.map((tx) => {
    if (tx.credit) running += tx.credit;
    if (tx.debit) running -= tx.debit;
    return {
      ...tx,
      balance: running,
    };
  });

  saveStoredStatements(updatedWithBalance);
  return updatedWithBalance;
}

export function getStoredAuthCredentials(): AuthCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_CREDENTIALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.phone === 'string' && typeof parsed.password === 'string') {
        // Automatically migrate previous temporary placeholder credentials to user's desired phone and password
        if (parsed.phone === '9876543210' || parsed.password === 'satyam123') {
          saveStoredAuthCredentials(DEFAULT_AUTH_CREDENTIALS);
          return DEFAULT_AUTH_CREDENTIALS;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load auth credentials from localStorage', e);
  }
  return DEFAULT_AUTH_CREDENTIALS;
}

export function saveStoredAuthCredentials(creds: AuthCredentials): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_CREDENTIALS, JSON.stringify(creds));
  } catch (e) {
    console.error('Failed to save auth credentials to localStorage', e);
  }
}

export function getAuthSession(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
  } catch (e) {
    return false;
  }
}

export function setAuthSession(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  } catch (e) {
    console.error('Failed to update auth session in localStorage', e);
  }
}

export function clearAuthSession(): void {
  setAuthSession(false);
}

/**
 * Completely resets and clears all application data:
 * - Opening balance: ₹1,00,000
 * - Statements: Only Opening balance ₹1,00,000 (all income, fuel, maintenance at 0)
 * - Workers: empty []
 * - Vehicles: empty []
 * - Daily sheets & advances: cleared
 * - Preserves user's login credentials
 */
export function clearAllAppDataAndResetClean(): void {
  try {
    const keysToRemove = [
      'satyam_vehicles_v1',
      'satyam_workers_v1',
      'satyam_sheets_v1',
      'satyam_statements_v1',
      'satyam_opening_balance_v1',
      'satyam_worker_advances_v2',
      'satyam_worker_advances_v1',
      STORAGE_KEYS.SHEETS,
      STORAGE_KEYS.WORKER_ADVANCES,
    ];
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });

    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.OPENING_BALANCE, '100000');
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(getCleanOpeningStatement(100000)));
  } catch (e) {
    console.error('Failed to clear all app data', e);
  }
}

// Automatically wipe existing browser cache on startup so all test entries (91,000, 31,000, 51,500, old workers) are cleared
const WIPE_VERSION_KEY = 'satyam_fresh_wipe_zero_all_2026';
(function runAutoCleanCheck() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const alreadyWiped = localStorage.getItem(WIPE_VERSION_KEY);
      if (!alreadyWiped) {
        clearAllAppDataAndResetClean();
        localStorage.setItem(WIPE_VERSION_KEY, 'true');
      }
    }
  } catch (e) {
    console.error('Auto clean error', e);
  }
})();

