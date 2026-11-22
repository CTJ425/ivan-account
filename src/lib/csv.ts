import type { TransactionWithDetails } from './types';

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  // Neutralize spreadsheet formula injection while preserving plain negative numbers if any
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildTransactionsCsv(rows: TransactionWithDetails[]): string {
  const header = ['日期', '類型', '群組', '分類', '金額', '備註', '記錄者', '週期性'];
  const lines = [header.map(escapeCsvCell).join(',')];

  for (const tx of rows) {
    lines.push(
      [
        tx.occurred_on,
        tx.kind === 'income' ? '收入' : '支出',
        tx.group_name,
        tx.category_name,
        tx.amount,
        tx.note ?? '',
        tx.creator_name ?? '',
        tx.recurring_rule_id ? '是' : '否',
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }

  // UTF-8 with BOM so Excel on Windows/macOS opens Traditional Chinese cleanly
  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
