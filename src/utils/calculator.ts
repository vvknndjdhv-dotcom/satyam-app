/**
 * Utility functions for currency formatting, date manipulation,
 * and smart mathematical evaluation for SATYAM daily entry sheet.
 */

// Format numbers in Indian numbering system (Lakhs, Crores, Thousands)
export function formatRupees(amount: number | string | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || amount === '') {
    return includeSymbol ? '₹0' : '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(num)) {
    return includeSymbol ? '₹0' : '0';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Use standard en-IN locale formatter with no decimal places by default for integer rupees
  const formatted = absNum.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formatted}`;
}

/**
 * Parses raw text from Column D (Work / Trip Details & Calculation)
 * and extracts the calculated total.
 *
 * Supports:
 * 1. Plain math expressions: "2000 + 2000 + 2500 + 1000 + 1800" => 9300
 * 2. Multi-line trip logs:
 *    Trip 1 - Tuljapur -> Solapur - 40 KM - 2000
 *    Trip 2 - Solapur -> Site A - 25 KM - 2000
 *    => 4000
 * 3. Hours x Rate: "Site A - 5 Hours @ 1400 = 7000" or "Site A - 5 Hours - 7000" => 7000
 * 4. Free text mixed with numbers or plus separated amounts.
 */
export function calculateWorkTotalFromText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Case 1: Pure math expression check (digits, +, -, *, /, spaces, parentheses, dots)
  // Example: "2000 + 2000 + 2500 + 1000 + 1800" or "500+500+250"
  const cleanMathRegex = /^[\d\s+\-*/.()=₹,]+$/;
  if (cleanMathRegex.test(trimmed)) {
    try {
      // Remove ₹ and commas
      let sanitized = trimmed.replace(/₹/g, '').replace(/,/g, '');
      // If ends with = or has =, take either the expression or parts
      if (sanitized.includes('=')) {
        const parts = sanitized.split('=');
        // Check if right side is a number or evaluate left side
        sanitized = parts[0].trim();
      }

      // Safe arithmetic evaluator without arbitrary eval
      const result = safeMathEval(sanitized);
      if (result > 0) return result;
    } catch {
      // fallback to line parsing
    }
  }

  // Case 2: Line-by-line parsing for multi-line trips/work details
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let grandTotal = 0;
  let parsedAnyLine = false;

  for (const line of lines) {
    // If the single line is an expression like "2000 + 2500 + 1800"
    if (/^[\d\s+\-*/.()=₹,]+$/.test(line)) {
      const sanitized = line.replace(/₹/g, '').replace(/,/g, '');
      const subTotal = safeMathEval(sanitized);
      if (subTotal > 0) {
        grandTotal += subTotal;
        parsedAnyLine = true;
        continue;
      }
    }

    // Check if line contains an explicit = amount, e.g. "5 hrs * 1400 = 7000" or "... = ₹7,000"
    const equalsMatch = line.match(/=\s*₹?\s*([\d,]+(?:\.\d+)?)/);
    if (equalsMatch && equalsMatch[1]) {
      const val = parseFloat(equalsMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        grandTotal += val;
        parsedAnyLine = true;
        continue;
      }
    }

    // Check for explicit ₹ amount in line, e.g. "Trip 1 - Tuljapur - ₹2500" or "Farm Work - ₹5000"
    const rupeeMatches = Array.from(line.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g));
    if (rupeeMatches.length > 0) {
      let lineSum = 0;
      for (const m of rupeeMatches) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val)) lineSum += val;
      }
      if (lineSum > 0) {
        grandTotal += lineSum;
        parsedAnyLine = true;
        continue;
      }
    }

    // Check for trailing number in trip log:
    // e.g. "Trip 1 - Tuljapur → Solapur - 40 KM - 2000"
    // e.g. "Trip 4 - Quarry → Site B - 1000"
    // e.g. "Trip to site: 3500"
    const trailingNumberMatch = line.match(/(?:[-:–—\s])\s*([\d,]+(?:\.\d+)?)\s*(?:rs|inr|₹)?\s*$/i);
    if (trailingNumberMatch && trailingNumberMatch[1]) {
      // Ensure it's not a KM specification like "40 KM"
      const matchedStr = trailingNumberMatch[1].replace(/,/g, '');
      const val = parseFloat(matchedStr);
      // Ignore if line ends with "KM" or "Hours"
      if (!isNaN(val) && val > 0 && !line.toLowerCase().endsWith('km') && !line.toLowerCase().endsWith('hrs') && !line.toLowerCase().endsWith('hours')) {
        grandTotal += val;
        parsedAnyLine = true;
        continue;
      }
    }

    // Check for sums of multiple standalone amounts in the line: e.g. "2000 + 1500"
    const plusParts = line.split('+');
    if (plusParts.length > 1) {
      let lineMath = 0;
      let matchedCount = 0;
      for (const p of plusParts) {
        const numMatch = p.match(/[\d,]+(?:\.\d+)?/);
        if (numMatch) {
          const val = parseFloat(numMatch[0].replace(/,/g, ''));
          if (!isNaN(val)) {
            lineMath += val;
            matchedCount++;
          }
        }
      }
      if (matchedCount > 1 && lineMath > 0) {
        grandTotal += lineMath;
        parsedAnyLine = true;
        continue;
      }
    }

    // Fallback for single line: extract the last meaningful number (likely the rupee rate)
    const allNumbers = line.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g);
    if (allNumbers && allNumbers.length > 0) {
      // Find the best candidate (usually the last number, especially if > 50)
      for (let i = allNumbers.length - 1; i >= 0; i--) {
        const rawNum = allNumbers[i].replace(/,/g, '');
        const val = parseFloat(rawNum);
        // Avoid picking up small numbers like trip numbers "1", "2" or small hours "5" if there's an amount like "2000"
        if (!isNaN(val) && (val >= 100 || (allNumbers.length === 1 && val > 0))) {
          grandTotal += val;
          parsedAnyLine = true;
          break;
        }
      }
    }
  }

  return parsedAnyLine ? Math.round(grandTotal) : 0;
}

/**
 * Safe evaluator for math string expressions containing +, -, *, /
 */
function safeMathEval(expr: string): number {
  // Strip dangerous characters
  const clean = expr.replace(/[^0-9+\-*/.() ]/g, '').trim();
  if (!clean) return 0;

  // Split by + and sum up components
  // Handle basic terms
  const terms = clean.split('+');
  let sum = 0;

  for (const term of terms) {
    const t = term.trim();
    if (!t) continue;

    // Check if term contains multiplication
    if (t.includes('*')) {
      const factors = t.split('*').map((f) => parseFloat(f.trim())).filter((n) => !isNaN(n));
      if (factors.length > 0) {
        sum += factors.reduce((a, b) => a * b, 1);
      }
    } else if (t.includes('-')) {
      // Handle subtraction inside term
      const subtractions = t.split('-').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      if (subtractions.length > 0) {
        const first = subtractions[0];
        const rest = subtractions.slice(1).reduce((a, b) => a + b, 0);
        sum += (first - rest);
      }
    } else {
      const num = parseFloat(t);
      if (!isNaN(num)) {
        sum += num;
      }
    }
  }

  return isNaN(sum) ? 0 : Math.round(sum);
}

// Format Date to friendly string like "01 Sep 2026"
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

// Format current date as YYYY-MM-DD (Defaults to Indian Standard Time Asia/Kolkata)
export function getTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as "YYYY-MM-DD"
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
