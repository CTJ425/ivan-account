import type { GroupColorCode } from './types';

export const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

export const GROUP_COLOR_OPTIONS: { code: GroupColorCode; label: string }[] = [
  { code: 'g1', label: '藍' },
  { code: 'g2', label: '橘' },
  { code: 'g3', label: '綠' },
  { code: 'g4', label: '紫' },
  { code: 'g5', label: '紅' },
  { code: 'g6', label: '橄欖' },
  { code: 'g7', label: '青' },
  { code: 'g8', label: '棕' },
];

export const formatAmount = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const toLocalDateStr = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (dateStr === toLocalDateStr(new Date())) return '今天';
  return formatShortDateWithDay(dateStr);
};

export const formatShortDateWithDay = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return `${Number(m)}/${Number(d)}（${DAY_NAMES[dateObj.getDay()]}）`;
  }
  return dateStr;
};

export const getMonthStartStr = (year: number, monthIndex0: number): string => {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`;
};

export const getMonthEndStr = (year: number, monthIndex0: number): string => {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

export const getGroupCssVar = (color: GroupColorCode): string => {
  return `var(--${color})`;
};
