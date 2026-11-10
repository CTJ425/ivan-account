export interface CategoryItem {
  id: string;
  name: string;
  groupName: string;
  groupColor: string;
  kind: 'expense' | 'income';
}

export interface DemoTransaction {
  id: string;
  kind: 'expense' | 'income';
  amount: number;
  categoryId: string;
  categoryName: string;
  groupName: string;
  groupColor: string;
  date: string;
  note: string;
  isNew?: boolean;
}

export interface DaySlipData {
  id: string;
  title: string;
  total: number;
  transactions: DemoTransaction[];
}

export interface BudgetGroupData {
  id: string;
  name: string;
  budget: number;
  used: number;
  color: string;
}

export interface IncomeExpenseData {
  income: number;
  expense: number;
  balance: number;
}

export interface SpendingGroupData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export const DEMO_CATEGORIES: CategoryItem[] = [
  // Expense categories
  { id: 'c-bfast', name: '早餐', groupName: '餐食', groupColor: 'var(--g1)', kind: 'expense' },
  { id: 'c-lunch', name: '午餐', groupName: '餐食', groupColor: 'var(--g1)', kind: 'expense' },
  { id: 'c-dinner', name: '晚餐', groupName: '餐食', groupColor: 'var(--g1)', kind: 'expense' },
  { id: 'c-drink', name: '飲料', groupName: '餐食', groupColor: 'var(--g1)', kind: 'expense' },
  { id: 'c-mrt', name: '捷運', groupName: '交通', groupColor: 'var(--g2)', kind: 'expense' },
  { id: 'c-bus', name: '公車', groupName: '交通', groupColor: 'var(--g2)', kind: 'expense' },
  { id: 'c-gas', name: '加油', groupName: '交通', groupColor: 'var(--g2)', kind: 'expense' },
  { id: 'c-rent', name: '房租', groupName: '居住', groupColor: 'var(--g3)', kind: 'expense' },
  { id: 'c-util', name: '水電瓦斯', groupName: '居住', groupColor: 'var(--g3)', kind: 'expense' },
  { id: 'c-home', name: '居家用品', groupName: '居住', groupColor: 'var(--g3)', kind: 'expense' },
  { id: 'c-movie', name: '娛樂', groupName: '娛樂', groupColor: 'var(--g4)', kind: 'expense' },
  { id: 'c-shop', name: '購物', groupName: '購物', groupColor: 'var(--g5)', kind: 'expense' },

  // Income categories
  { id: 'c-salary', name: '薪資', groupName: '薪資', groupColor: 'var(--income)', kind: 'income' },
  { id: 'c-bonus', name: '獎金', groupName: '薪資', groupColor: 'var(--income)', kind: 'income' },
  { id: 'c-invest', name: '投資收益', groupName: '投資', groupColor: 'var(--g7)', kind: 'income' },
  { id: 'c-other-inc', name: '其他收入', groupName: '其他', groupColor: 'var(--g8)', kind: 'income' },
];

export const INITIAL_DAY_SLIPS: DaySlipData[] = [
  {
    id: 'day-today',
    title: '11/10（一）',
    total: 370,
    transactions: [
      {
        id: 'tx-1',
        kind: 'expense',
        amount: 120,
        categoryId: 'c-lunch',
        categoryName: '午餐',
        groupName: '餐食',
        groupColor: 'var(--g1)',
        date: '2026-11-10',
        note: '便當',
      },
      {
        id: 'tx-2',
        kind: 'expense',
        amount: 35,
        categoryId: 'c-drink',
        categoryName: '飲料',
        groupName: '餐食',
        groupColor: 'var(--g1)',
        date: '2026-11-10',
        note: '紅茶',
      },
      {
        id: 'tx-3',
        kind: 'expense',
        amount: 30,
        categoryId: 'c-mrt',
        categoryName: '捷運',
        groupName: '交通',
        groupColor: 'var(--g2)',
        date: '2026-11-10',
        note: '',
      },
      {
        id: 'tx-4',
        kind: 'expense',
        amount: 185,
        categoryId: 'c-dinner',
        categoryName: '晚餐',
        groupName: '餐食',
        groupColor: 'var(--g1)',
        date: '2026-11-10',
        note: '牛肉麵',
      },
    ],
  },
  {
    id: 'day-yesterday',
    title: '11/09（日）',
    total: 930,
    transactions: [
      {
        id: 'tx-5',
        kind: 'expense',
        amount: 450,
        categoryId: 'c-dinner',
        categoryName: '晚餐',
        groupName: '餐食',
        groupColor: 'var(--g1)',
        date: '2026-11-09',
        note: '熱炒',
      },
      {
        id: 'tx-6',
        kind: 'expense',
        amount: 320,
        categoryId: 'c-movie',
        categoryName: '娛樂',
        groupName: '娛樂',
        groupColor: 'var(--g4)',
        date: '2026-11-09',
        note: '電影票',
      },
      {
        id: 'tx-7',
        kind: 'expense',
        amount: 160,
        categoryId: 'c-home',
        categoryName: '居家用品',
        groupName: '居住',
        groupColor: 'var(--g3)',
        date: '2026-11-09',
        note: '衛生紙',
      },
    ],
  },
  {
    id: 'day-before',
    title: '11/08（六）',
    total: 2040,
    transactions: [
      {
        id: 'tx-8',
        kind: 'expense',
        amount: 500,
        categoryId: 'c-gas',
        categoryName: '加油',
        groupName: '交通',
        groupColor: 'var(--g2)',
        date: '2026-11-08',
        note: '',
      },
      {
        id: 'tx-9',
        kind: 'expense',
        amount: 1280,
        categoryId: 'c-shop',
        categoryName: '購物',
        groupName: '購物',
        groupColor: 'var(--g5)',
        date: '2026-11-08',
        note: '外套',
      },
      {
        id: 'tx-10',
        kind: 'expense',
        amount: 260,
        categoryId: 'c-lunch',
        categoryName: '午餐',
        groupName: '餐食',
        groupColor: 'var(--g1)',
        date: '2026-11-08',
        note: '義大利麵',
      },
    ],
  },
];

export const DEMO_BUDGET_DATA: {
  title: string;
  remainingText: string;
  groups: BudgetGroupData[];
} = {
  title: '11 月預算',
  remainingText: '剩餘 12,350',
  groups: [
    { id: 'b-live', name: '居住', budget: 18000, used: 13800, color: 'var(--g3)' },
    { id: 'b-food', name: '餐食', budget: 15000, used: 11200, color: 'var(--g1)' },
    { id: 'b-fun', name: '娛樂', budget: 2000, used: 3200, color: 'var(--g4)' },
    { id: 'b-traffic', name: '交通', budget: 5000, used: 2650, color: 'var(--g2)' },
    { id: 'b-shop', name: '購物', budget: 5000, used: 1800, color: 'var(--g5)' },
  ],
};

export const DEMO_INCOME_EXPENSE: {
  title: string;
  balanceText: string;
  income: number;
  expense: number;
} = {
  title: '11 月收支',
  balanceText: '結餘 +20,520',
  income: 53170,
  expense: 32650,
};

export const DEMO_SPENDING_BY_GROUP: {
  title: string;
  totalText: string;
  groups: SpendingGroupData[];
} = {
  title: '11 月支出分布',
  totalText: '32,650',
  groups: [
    { name: '居住', amount: 13800, percentage: 42.3, color: 'var(--g3)' },
    { name: '餐食', amount: 11200, percentage: 34.3, color: 'var(--g1)' },
    { name: '娛樂', amount: 3200, percentage: 9.8, color: 'var(--g4)' },
    { name: '交通', amount: 2650, percentage: 8.1, color: 'var(--g2)' },
    { name: '購物', amount: 1800, percentage: 5.5, color: 'var(--g5)' },
  ],
};

export const formatAmount = (num: number): string => {
  return num.toLocaleString('en-US');
};
