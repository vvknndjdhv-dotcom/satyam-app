import { StatementTransaction } from '../types';
import { formatDisplayDate, formatRupees, getTodayDateString } from './calculator';

export interface ExportWordOptions {
  fileName?: string;
  openingBalance?: number;
  fromDate?: string;
  toDate?: string;
}

/**
 * Generates and downloads a Microsoft Word Document (.doc)
 * containing the formatted statement, executive summary, and transactions ledger.
 * This opens directly in Microsoft Word.
 */
export function exportStatementToWord(
  statements: StatementTransaction[],
  options: ExportWordOptions = {}
): void {
  const today = getTodayDateString();
  const fileName = options.fileName || `SATYAM_Statement_${today}.doc`;

  // Calculate totals
  let totalWorkIncome = 0;
  let totalFuelExpense = 0;
  let totalMaintenance = 0;
  let totalDiaryExpense = 0;

  statements.forEach((tx) => {
    if (tx.credit && tx.type === 'WORK_INCOME') {
      totalWorkIncome += tx.credit;
    }
    if (tx.debit) {
      if (tx.type === 'FUEL') totalFuelExpense += tx.debit;
      else if (tx.type === 'MAINTENANCE') totalMaintenance += tx.debit;
      else if (tx.type === 'DIARY') totalDiaryExpense += tx.debit;
      else totalDiaryExpense += tx.debit;
    }
  });

  const totalExpenses = totalFuelExpense + totalMaintenance + totalDiaryExpense;
  const openingBalance =
    options.openingBalance !== undefined
      ? options.openingBalance
      : statements.find((s) => s.type === 'OPENING')?.credit || 100000;

  const closingBalance =
    statements.length > 0
      ? statements[statements.length - 1].balance
      : openingBalance + totalWorkIncome - totalExpenses;

  const dates = statements.map((s) => s.date).filter(Boolean).sort();
  const fromDate = options.fromDate || dates[0] || today;
  const toDate = options.toDate || dates[dates.length - 1] || today;

  const generatedTime = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Table rows HTML
  const rowsHtml = statements
    .map((tx, idx) => {
      const debitFormatted = tx.debit ? formatRupees(tx.debit) : '—';
      const creditFormatted = tx.credit ? formatRupees(tx.credit) : '—';
      const balanceFormatted = formatRupees(tx.balance);
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 10pt;">
            ${formatDisplayDate(tx.date)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 9pt; color: #64748b;">
            ${tx.time || '—'}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold; color: #1e293b; font-size: 10pt;">
            ${escapeHtml(tx.category)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; color: #334155;">
            ${escapeHtml(tx.description || '—')}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #b91c1c; font-size: 10pt;">
            ${debitFormatted}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #15803d; font-size: 10pt;">
            ${creditFormatted}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #0f172a; font-size: 10pt; background-color: #f1f5f9;">
            ${balanceFormatted}
          </td>
        </tr>
      `;
    })
    .join('');

  const wordDocumentHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>SATYAM Statement</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #0f172a;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 26pt;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 2px 0;
      letter-spacing: -0.5px;
    }
    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 6px 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5pt solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .summary-card {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1pt solid #cbd5e1;
      margin-bottom: 20px;
    }
    .summary-card td {
      padding: 8px 12px;
      border: 0.5pt solid #e2e8f0;
      vertical-align: top;
    }
    .summary-label {
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .summary-value {
      font-size: 13pt;
      font-weight: bold;
      color: #0f172a;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .data-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      border: 1pt solid #0f172a;
      padding: 8px 6px;
      text-align: left;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 25px;
      border-top: 1pt solid #cbd5e1;
      padding-top: 10px;
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <h1>SATYAM</h1>
        <h2>Account Statement & Ledger (खाता विवरण)</h2>
        <p style="font-size: 9pt; color: #64748b; margin: 0;">
          Daily Vehicle Work, Fuel, Maintenance & Cash Expense Ledger
        </p>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <div style="font-size: 9pt; font-weight: bold; color: #64748b; text-transform: uppercase;">अवधि / Statement Period</div>
        <div style="font-size: 11pt; font-weight: bold; color: #0f172a;">
          ${formatDisplayDate(fromDate)} &ndash; ${formatDisplayDate(toDate)}
        </div>
        <div style="font-size: 8.5pt; color: #94a3b8; margin-top: 4px;">
          Report Generated: ${generatedTime}
        </div>
      </td>
    </tr>
  </table>

  <!-- Executive Summary Box -->
  <table class="summary-card">
    <tr style="background-color: #f1f5f9;">
      <td colspan="4" style="font-weight: bold; font-size: 10pt; color: #1e293b; padding: 6px 10px; border-bottom: 1pt solid #cbd5e1;">
        STATMENT SUMMARY (विवरण सारांश)
      </td>
    </tr>
    <tr>
      <td style="width: 25%;">
        <span class="summary-label">प्रारंभिक शिल्लक (Opening)</span>
        <span class="summary-value">${formatRupees(openingBalance)}</span>
      </td>
      <td style="width: 25%;">
        <span class="summary-label">एकूण कामाचे उत्पन्न (Income +)</span>
        <span class="summary-value" style="color: #15803d;">${formatRupees(totalWorkIncome)}</span>
      </td>
      <td style="width: 25%;">
        <span class="summary-label">एकूण खर्च (All Expenses &minus;)</span>
        <span class="summary-value" style="color: #b91c1c;">${formatRupees(totalExpenses)}</span>
      </td>
      <td style="width: 25%; background-color: #e2e8f0;">
        <span class="summary-label" style="color: #0f172a;">शिल्लक बाकी (Closing Balance)</span>
        <span class="summary-value" style="color: #0f172a; font-size: 14pt;">${formatRupees(closingBalance)}</span>
      </td>
    </tr>
    <tr>
      <td>
        <span class="summary-label">डिझेल / Fuel Expense</span>
        <span style="font-size: 10.5pt; font-weight: bold; color: #b91c1c;">${formatRupees(totalFuelExpense)}</span>
      </td>
      <td>
        <span class="summary-label">मेंटेनन्स / Maintenance</span>
        <span style="font-size: 10.5pt; font-weight: bold; color: #b91c1c;">${formatRupees(totalMaintenance)}</span>
      </td>
      <td>
        <span class="summary-label">इतर / डायरी खर्च (Diary)</span>
        <span style="font-size: 10.5pt; font-weight: bold; color: #b91c1c;">${formatRupees(totalDiaryExpense)}</span>
      </td>
      <td style="background-color: #f1f5f9;">
        <span class="summary-label">एकूण नोंदी (Transactions)</span>
        <span style="font-size: 10.5pt; font-weight: bold; color: #334155;">${statements.length} Entries</span>
      </td>
    </tr>
  </table>

  <!-- Detailed Ledger Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 12%; text-align: center;">तारीख (Date)</th>
        <th style="width: 10%; text-align: center;">वेळ (Time)</th>
        <th style="width: 20%;">वाहन / प्रकार (Category)</th>
        <th style="width: 26%;">तपशील / काम (Description)</th>
        <th style="width: 11%; text-align: right;">नावे (Debit &minus;)</th>
        <th style="width: 11%; text-align: right;">जमा (Credit +)</th>
        <th style="width: 10%; text-align: right;">शिल्लक (Balance)</th>
      </tr>
    </thead>
    <tbody>
      ${
        rowsHtml ||
        `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">कोणतीही नोंद उपलब्ध नाही (No entries recorded)</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr style="background-color: #e2e8f0; font-weight: bold;">
        <td colspan="4" style="border: 1pt solid #94a3b8; padding: 8px 10px; text-align: right; text-transform: uppercase; font-size: 10pt;">
          एकूण बेरीज (Total Summary):
        </td>
        <td style="border: 1pt solid #94a3b8; padding: 8px 10px; text-align: right; font-weight: bold; color: #b91c1c; font-size: 10.5pt;">
          ${formatRupees(totalExpenses)}
        </td>
        <td style="border: 1pt solid #94a3b8; padding: 8px 10px; text-align: right; font-weight: bold; color: #15803d; font-size: 10.5pt;">
          ${formatRupees(totalWorkIncome + (statements.find((s) => s.type === 'OPENING')?.credit || 0))}
        </td>
        <td style="border: 1pt solid #94a3b8; padding: 8px 10px; text-align: right; font-weight: 900; color: #0f172a; font-size: 11pt; background-color: #cbd5e1;">
          ${formatRupees(closingBalance)}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Document Sign-off Footer -->
  <table class="footer-table">
    <tr>
      <td style="font-size: 8.5pt; color: #64748b; vertical-align: top;">
        SATYAM Fleet Management & Daily Entry System<br>
        This is a computer-generated Word Document statement.
      </td>
      <td style="text-align: right; font-size: 9pt; color: #334155; vertical-align: top;">
        अधिकृत स्वाक्षरी / शिक्का (Authorized Signature & Stamp):<br><br><br>
        __________________________________________
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  // Create Word document blob with Word MIME type and UTF-8 Byte Order Mark (\ufeff)
  const blob = new Blob(['\ufeff' + wordDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
