import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import {
  fetchEffectiveBudgets,
  fetchPeriodSeries,
  fetchPeriodSummary,
} from '../lib/api';
import {
  formatAmount,
  getGroupCssVar,
  getMonthEndStr,
  getMonthStartStr,
  toLocalDateStr,
} from '../lib/format';
import type { GroupColorCode } from '../lib/types';

type PeriodMode = 'week' | 'month' | 'year';
type ChartMode = 'expense' | 'income' | 'compare';

interface BreakdownItem {
  id: string;
  name: string;
  color: string;
  amount: number;
  pct: number;
  canDrill: boolean;
}

const getMonday = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
};

export const Charts: React.FC = () => {
  const { currentLedger } = useLedger();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [chartMode, setChartMode] = useState<ChartMode>('expense');
  const [offset, setOffset] = useState(0);
  const [drillGroupId, setDrillGroupId] = useState<string | null>(null);

  const ledgerId = currentLedger?.id ?? '';

  const periodRange = useMemo(() => {
    const now = new Date();
    if (periodMode === 'week') {
      const baseMonday = getMonday(now);
      const start = addDays(baseMonday, offset * 7);
      const end = addDays(start, 6);
      const startStr = toLocalDateStr(start);
      const endStr = toLocalDateStr(end);
      return {
        startStr,
        endStr,
        bucket: 'day' as const,
        label: `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`,
        monthStart: getMonthStartStr(start.getFullYear(), start.getMonth()),
      };
    }
    if (periodMode === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      return {
        startStr: getMonthStartStr(y, m),
        endStr: getMonthEndStr(y, m),
        bucket: 'day' as const,
        label: `${y} 年 ${m + 1} 月`,
        monthStart: getMonthStartStr(y, m),
      };
    }
    const y = now.getFullYear() + offset;
    return {
      startStr: `${y}-01-01`,
      endStr: `${y}-12-31`,
      bucket: 'month' as const,
      label: `${y} 年`,
      monthStart: `${y}-01-01`,
    };
  }, [periodMode, offset]);

  const { data: summaryRows = [], isLoading: loadingSummary } = useQuery({
    queryKey: ['charts', 'summary', ledgerId, periodRange.startStr, periodRange.endStr],
    queryFn: () =>
      fetchPeriodSummary(ledgerId, periodRange.startStr, periodRange.endStr),
    enabled: Boolean(ledgerId),
  });

  const { data: seriesRows = [], isLoading: loadingSeries } = useQuery({
    queryKey: [
      'charts',
      'series',
      ledgerId,
      periodRange.startStr,
      periodRange.endStr,
      periodRange.bucket,
    ],
    queryFn: () =>
      fetchPeriodSeries(
        ledgerId,
        periodRange.startStr,
        periodRange.endStr,
        periodRange.bucket,
      ),
    enabled: Boolean(ledgerId),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', ledgerId, periodRange.monthStart],
    queryFn: () => fetchEffectiveBudgets(ledgerId, periodRange.monthStart),
    enabled: Boolean(ledgerId) && periodMode === 'month',
  });

  const totalBudget = useMemo(() => {
    const found = budgets.find((b) => !b.group_id && !b.category_id);
    return found?.amount ?? null;
  }, [budgets]);

  // Fill complete calendar buckets for the line chart
  const fullSeries = useMemo(() => {
    const map = new Map(seriesRows.map((r) => [r.bucket_date, r]));
    const points: { key: string; label: string; expense: number; income: number }[] = [];

    if (periodRange.bucket === 'month') {
      const y = Number(periodRange.startStr.slice(0, 4));
      for (let m = 0; m < 12; m++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const hit = map.get(key);
        points.push({
          key,
          label: `${m + 1}月`,
          expense: Number(hit?.expense_total ?? 0),
          income: Number(hit?.income_total ?? 0),
        });
      }
      return points;
    }

    const [sy, sm, sd] = periodRange.startStr.split('-').map(Number);
    const [ey, em, ed] = periodRange.endStr.split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    while (cur <= end) {
      const key = toLocalDateStr(cur);
      const hit = map.get(key);
      points.push({
        key,
        label: `${cur.getMonth() + 1}/${cur.getDate()}`,
        expense: Number(hit?.expense_total ?? 0),
        income: Number(hit?.income_total ?? 0),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return points;
  }, [seriesRows, periodRange]);

  const periodTotals = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const r of summaryRows) {
      const amt = Number(r.total_amount);
      if (r.kind === 'income') income += amt;
      else expense += amt;
    }
    return { expense, income, net: income - expense };
  }, [summaryRows]);

  const activeKind = chartMode === 'income' ? 'income' : 'expense';

  const breakdown = useMemo<{
    title: string;
    total: number;
    items: BreakdownItem[];
  }>(() => {
    const kindRows = summaryRows.filter((r) => r.kind === activeKind);
    if (drillGroupId) {
      const groupRows = kindRows.filter((r) => r.group_id === drillGroupId);
      const total = groupRows.reduce((s, r) => s + Number(r.total_amount), 0);
      const groupName = groupRows[0]?.group_name ?? '群組';
      const items: BreakdownItem[] = groupRows
        .map((r) => {
          const amt = Number(r.total_amount);
          return {
            id: r.category_id,
            name: r.category_name,
            color: getGroupCssVar(r.group_color as GroupColorCode),
            amount: amt,
            pct: total > 0 ? (amt / total) * 100 : 0,
            canDrill: false,
          };
        })
        .sort((a, b) => b.amount - a.amount);
      return { title: `${groupName} 明細`, total, items };
    }

    const groupMap = new Map<
      string,
      { id: string; name: string; color: string; amount: number }
    >();
    let total = 0;
    for (const r of kindRows) {
      const amt = Number(r.total_amount);
      total += amt;
      const prev = groupMap.get(r.group_id);
      if (prev) {
        prev.amount += amt;
      } else {
        groupMap.set(r.group_id, {
          id: r.group_id,
          name: r.group_name,
          color: getGroupCssVar(r.group_color as GroupColorCode),
          amount: amt,
        });
      }
    }

    const items: BreakdownItem[] = Array.from(groupMap.values())
      .map((g) => ({
        ...g,
        pct: total > 0 ? (g.amount / total) * 100 : 0,
        canDrill: true,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      title: activeKind === 'expense' ? '各群組支出占比' : '各群組收入占比',
      total,
      items,
    };
  }, [summaryRows, activeKind, drillGroupId]);

  return (
    <div className="page-centered-container">
      <div className="page-header-row">
        <h1 className="page-title">圖表</h1>

        <div className="month-pager" role="group" aria-label="切換期間">
          <button
            type="button"
            className="pager-btn"
            onClick={() => setOffset((v) => v - 1)}
            aria-label="上一期"
          >
            ‹
          </button>
          <span className="pager-label">{periodRange.label}</span>
          <button
            type="button"
            className="pager-btn"
            onClick={() => setOffset((v) => v + 1)}
            aria-label="下一期"
          >
            ›
          </button>
        </div>
      </div>

      {/* Period & Kind Controls */}
      <div className="charts-controls-row">
        <div className="filter-kind-group" role="group" aria-label="時間粒度">
          {(
            [
              ['week', '週'],
              ['month', '月'],
              ['year', '年'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`filter-chip ${periodMode === val ? 'active' : ''}`}
              aria-pressed={periodMode === val}
              onClick={() => {
                setPeriodMode(val);
                setOffset(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filter-kind-group" role="group" aria-label="分析模式">
          {(
            [
              ['expense', '支出'],
              ['income', '收入'],
              ['compare', '收支對照'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`filter-chip ${chartMode === val ? 'active' : ''}`}
              aria-pressed={chartMode === val}
              onClick={() => {
                setChartMode(val);
                setDrillGroupId(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Totals */}
      <div className="summary-strip" aria-label="期間收支總覽">
        <div className="summary-cell">
          <span className="summary-label">支出</span>
          <span className="summary-val">{formatAmount(periodTotals.expense)}</span>
        </div>
        <div className="summary-cell">
          <span className="summary-label">收入</span>
          <span className="summary-val summary-income">
            +{formatAmount(periodTotals.income)}
          </span>
        </div>
        <div className="summary-cell">
          <span className="summary-label">結餘</span>
          <span
            className={`summary-val ${
              periodTotals.net < 0 ? 'summary-over' : ''
            }`}
          >
            {periodTotals.net >= 0 ? '' : '-'}
            {formatAmount(Math.abs(periodTotals.net))}
          </span>
        </div>
      </div>

      {/* Pie / Donut Breakdown (for expense or income) */}
      {chartMode !== 'compare' && (
        <Slip
          title={breakdown.title}
          total={formatAmount(breakdown.total)}
          headerRight={
            drillGroupId ? (
              <button
                type="button"
                className="mini-action-btn"
                onClick={() => setDrillGroupId(null)}
              >
                ← 返回全部群組
              </button>
            ) : undefined
          }
          emptyText={loadingSummary ? '載入圖表中...' : '此期間尚無資料'}
        >
          {breakdown.items.length > 0 && (
            <div className="chart-section-body">
              <DonutChart
                items={breakdown.items}
                total={breakdown.total}
                onSliceClick={(item) => {
                  if (item.canDrill) setDrillGroupId(item.id);
                }}
              />

              <table className="chart-data-table">
                <caption className="visually-hidden">{breakdown.title}明細表</caption>
                <thead>
                  <tr>
                    <th scope="col">項目</th>
                    <th scope="col" className="num-col">
                      金額
                    </th>
                    <th scope="col" className="num-col">
                      占比
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.items.map((item) => (
                    <tr
                      key={item.id}
                      className={item.canDrill ? 'table-row-clickable' : ''}
                    >
                      <td>
                        {item.canDrill ? (
                          <button
                            type="button"
                            className="table-drill-btn"
                            onClick={() => setDrillGroupId(item.id)}
                          >
                            <span
                              className="slip-chip"
                              style={{ backgroundColor: item.color }}
                              aria-hidden="true"
                            />
                            <span>{item.name}</span>
                            <span className="drill-arrow" aria-hidden="true">
                              ›
                            </span>
                          </button>
                        ) : (
                          <span className="table-label-cell">
                            <span
                              className="slip-chip"
                              style={{ backgroundColor: item.color }}
                              aria-hidden="true"
                            />
                            <span>{item.name}</span>
                          </span>
                        )}
                      </td>
                      <td className="num-col">{formatAmount(item.amount)}</td>
                      <td className="num-col">{item.pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Slip>
      )}

      {/* Line Chart Trend */}
      <Slip
        title={
          chartMode === 'compare'
            ? '收支趨勢對照'
            : periodMode === 'year'
              ? `每月${chartMode === 'income' ? '收入' : '支出'}趨勢`
              : `每日${chartMode === 'income' ? '收入' : '支出'}趨勢`
        }
        emptyText={loadingSeries ? '載入趨勢中...' : '此期間尚無趨勢資料'}
      >
        {fullSeries.length > 0 && (
          <div className="chart-section-body">
            <LineTrendChart
              points={fullSeries}
              mode={chartMode}
              budgetLine={
                chartMode === 'expense' && periodMode === 'month'
                  ? totalBudget
                  : null
              }
            />

            {chartMode === 'compare' && (
              <table className="chart-data-table">
                <caption className="visually-hidden">收支對照明細表</caption>
                <thead>
                  <tr>
                    <th scope="col">期間</th>
                    <th scope="col" className="num-col">
                      收入
                    </th>
                    <th scope="col" className="num-col">
                      支出
                    </th>
                    <th scope="col" className="num-col">
                      結餘
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fullSeries
                    .filter((p) => p.income > 0 || p.expense > 0)
                    .map((p) => {
                      const net = p.income - p.expense;
                      return (
                        <tr key={p.key}>
                          <td>{p.label}</td>
                          <td className="num-col summary-income">
                            +{formatAmount(p.income)}
                          </td>
                          <td className="num-col">{formatAmount(p.expense)}</td>
                          <td
                            className={`num-col ${net < 0 ? 'summary-over' : ''}`}
                          >
                            {net >= 0 ? '' : '-'}
                            {formatAmount(Math.abs(net))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Slip>
    </div>
  );
};

interface DonutChartProps {
  items: BreakdownItem[];
  total: number;
  onSliceClick: (item: BreakdownItem) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ items, total, onSliceClick }) => {
  const size = 200;
  const cx = 100;
  const cy = 100;
  const r = 72;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * r;

  let cumulativeOffset = 0;

  return (
    <div className="donut-chart-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="donut-svg"
        role="img"
        aria-label={`占比圓餅圖，總計 ${formatAmount(total)} 元`}
      >
        {items.map((item) => {
          const frac = total > 0 ? item.amount / total : 0;
          const segLen = frac * circumference;
          const dashOffset = -cumulativeOffset;
          cumulativeOffset += segLen;

          return (
            <circle
              key={item.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className={item.canDrill ? 'donut-slice-clickable' : undefined}
              onClick={() => onSliceClick(item)}
            >
              <title>
                {item.name}: {formatAmount(item.amount)} ({item.pct.toFixed(1)}%)
              </title>
            </circle>
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-center-label">
          總計
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="donut-center-val">
          {formatAmount(total)}
        </text>
      </svg>
    </div>
  );
};

interface LineTrendChartProps {
  points: { key: string; label: string; expense: number; income: number }[];
  mode: ChartMode;
  budgetLine: number | null;
}

const LineTrendChart: React.FC<LineTrendChartProps> = ({
  points,
  mode,
  budgetLine,
}) => {
  const width = 560;
  const height = 210;
  const padL = 52;
  const padR = 16;
  const padT = 18;
  const padB = 32;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxVal = useMemo(() => {
    let m = budgetLine ?? 0;
    for (const p of points) {
      if (mode === 'expense') m = Math.max(m, p.expense);
      else if (mode === 'income') m = Math.max(m, p.income);
      else m = Math.max(m, p.expense, p.income);
    }
    return Math.max(m, 100);
  }, [points, mode, budgetLine]);

  const toX = (i: number) =>
    points.length <= 1
      ? padL + plotW / 2
      : padL + (i / (points.length - 1)) * plotW;

  const toY = (val: number) => padT + plotH - (val / maxVal) * plotH;

  const buildPath = (pick: (p: (typeof points)[number]) => number) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pick(p)).toFixed(1)}`)
      .join(' ');

  const labelStep = points.length <= 12 ? 1 : Math.ceil(points.length / 6);

  return (
    <div className="line-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="line-svg"
        role="img"
        aria-label="收支趨勢折線圖"
      >
        {/* Horizontal Gridlines (0%, 50%, 100%) */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padT + plotH * (1 - ratio);
          const v = Math.round(maxVal * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                className="chart-grid-line"
              />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="chart-axis-text">
                {v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : formatAmount(v)}
              </text>
            </g>
          );
        })}

        {/* Monthly Budget Dashed Line */}
        {budgetLine !== null && budgetLine > 0 && (
          <g>
            <line
              x1={padL}
              y1={toY(budgetLine)}
              x2={width - padR}
              y2={toY(budgetLine)}
              className="chart-budget-line"
            />
            <text
              x={width - padR}
              y={Math.max(12, toY(budgetLine) - 4)}
              textAnchor="end"
              className="chart-budget-label"
            >
              預算 {formatAmount(budgetLine)}
            </text>
          </g>
        )}

        {/* Expense Line */}
        {(mode === 'expense' || mode === 'compare') && (
          <path
            d={buildPath((p) => p.expense)}
            fill="none"
            className="chart-line-expense"
          />
        )}

        {/* Income Line */}
        {(mode === 'income' || mode === 'compare') && (
          <path
            d={buildPath((p) => p.income)}
            fill="none"
            className="chart-line-income"
          />
        )}

        {/* Data Dots & X Axis Labels */}
        {points.map((p, i) => {
          const showLabel = i % labelStep === 0 || i === points.length - 1;
          return (
            <g key={p.key}>
              {(mode === 'expense' || mode === 'compare') && p.expense > 0 && (
                <circle
                  cx={toX(i)}
                  cy={toY(p.expense)}
                  r={3}
                  className="chart-dot-expense"
                >
                  <title>
                    {p.label} 支出 {formatAmount(p.expense)}
                  </title>
                </circle>
              )}
              {(mode === 'income' || mode === 'compare') && p.income > 0 && (
                <circle
                  cx={toX(i)}
                  cy={toY(p.income)}
                  r={3}
                  className="chart-dot-income"
                >
                  <title>
                    {p.label} 收入 {formatAmount(p.income)}
                  </title>
                </circle>
              )}
              {showLabel && (
                <text
                  x={toX(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className="chart-axis-text"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {mode === 'compare' && (
        <div className="chart-legend-row">
          <span className="chart-legend-item">
            <span className="slip-chip legend-expense" aria-hidden="true" />
            <span>支出</span>
          </span>
          <span className="chart-legend-item">
            <span className="slip-chip legend-income" aria-hidden="true" />
            <span>收入</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Charts;
