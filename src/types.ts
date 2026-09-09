export type VehicleType =
  | 'Tipper'
  | 'JCB'
  | 'Excavator'
  | 'Tractor'
  | 'Four Wheeler'
  | 'Two Wheeler'
  | 'Other';

export interface Vehicle {
  id: string;
  type: VehicleType;
  number: string;
  name?: string;
}

export type WorkerRole =
  | 'Driver'
  | 'Operator'
  | 'Helper'
  | 'Worker'
  | 'Supervisor'
  | 'Other';

export interface Worker {
  id: string;
  name: string;
  mobile: string;
  role?: WorkerRole;
  salary?: number; // Monthly salary / मासिक वेतन (e.g. 18,000)
  accumulatedAdvance?: number; // Total advance deducted in saved entries / अब तक का कटा कुल एडवांस
  openingAdvance?: number; // Starting prior advance / शुरुआती पिछला एडवांस
  pastAdvance?: number; // Total advance deducted from prior saved entries / पिछली तारीखों का कुल एडवांस
  advance?: number; // Today's active advance input / आज की एंट्री का नया एडवांस (सेव होने पर 0 हो जाता है)
  totalAdvance?: number; // Total advance taken / कुल एडवांस
  remainingSalary?: number; // Net available salary / बची हुई सैलरी (मासिक वेतन - कुल एडवांस)
  status?: 'Present' | 'Absent'; // Attendance / एब्सेंट या प्रेजेंट
}

export interface VehicleRowEntry {
  id: string;
  vehicleId: string;
  vehicleLabel: string; // e.g. "Tipper MH-25-2037"
  fuelExpense: number | '';
  maintenanceExpense: number | '';
  workDetails: string;
  workTotal: number;
  net: number;
}

export interface DiaryExpense {
  id: string;
  date: string;
  time: string;
  name: string;
  amount: number;
  description: string;
  paymentMode?: 'Cash' | 'Online' | 'Other';
  category?: string;
}

export type TransactionType =
  | 'OPENING'
  | 'WORK_INCOME'
  | 'FUEL'
  | 'MAINTENANCE'
  | 'DIARY'
  | 'OTHER';

export interface StatementTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  timestamp: number;
  category: string; // e.g. "Tipper M5", "Diary Expense", "Opening Balance"
  description: string;
  debit: number | null; // Expense / Minus
  credit: number | null; // Income / Plus
  balance: number; // Running balance after transaction
  vehicleId?: string;
  type: TransactionType;
}

export interface DailySheetState {
  date: string; // YYYY-MM-DD
  openingBalance: number;
  rows: VehicleRowEntry[];
  diaryExpenses: DiaryExpense[];
  extraExpenseAmount?: number | ''; // Direct extra expense amount (उदा. 5000)
  extraExpenseNotes?: string; // Free typing space / डायरी नोट
  workerEntries?: Record<string, { status: 'Present' | 'Absent'; advance: number }>; // Daily attendance & advance per worker for this date
  isSaved?: boolean;
  lastSavedAt?: string;
}
