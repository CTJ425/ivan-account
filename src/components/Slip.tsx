import React from 'react';
import { formatAmount } from '../lib/format';

export interface SlipProps {
  title: string;
  total?: string | number;
  children?: React.ReactNode;
  emptyText?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

export const Slip: React.FC<SlipProps> = ({
  title,
  total,
  children,
  emptyText = '今天還沒有記錄',
  className = '',
  headerRight,
}) => {
  const hasContent = React.Children.count(children) > 0;

  return (
    <article className={`slip-card ${className}`}>
      <header className="slip-header">
        <h2 className="slip-title">{title}</h2>
        {headerRight ? (
          headerRight
        ) : total !== undefined && total !== null ? (
          <span className="slip-total">
            {typeof total === 'number' ? formatAmount(total) : total}
          </span>
        ) : null}
      </header>

      <div className="slip-body">
        {hasContent ? (
          children
        ) : (
          <div className="slip-empty">{emptyText}</div>
        )}
      </div>
    </article>
  );
};

export interface SlipRowProps {
  category: string;
  note?: string;
  meta?: string;
  amount: number | string;
  groupColor?: string;
  isIncome?: boolean;
  isNew?: boolean;
  onClick?: () => void;
}

export const SlipRow: React.FC<SlipRowProps> = ({
  category,
  note,
  meta,
  amount,
  groupColor,
  isIncome = false,
  isNew = false,
  onClick,
}) => {
  const formattedAmount =
    typeof amount === 'number'
      ? `${isIncome ? '+' : ''}${formatAmount(amount)}`
      : amount;

  const content = (
    <>
      <div className="slip-row-left">
        {groupColor && (
          <span
            className="slip-chip"
            style={{ backgroundColor: groupColor }}
            aria-hidden="true"
          />
        )}
        <span className="slip-category">{category}</span>
        {meta && <span className="slip-meta-tag">{meta}</span>}
        {note && <span className="slip-note">{note}</span>}
      </div>

      <div className={`slip-amount ${isIncome ? 'slip-amount-income' : ''}`}>
        {formattedAmount}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`slip-row slip-row-interactive ${isNew ? 'slip-row-animate' : ''}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`slip-row ${isNew ? 'slip-row-animate' : ''}`}>
      {content}
    </div>
  );
};

export interface SlipBudgetRowProps {
  name: string;
  used: number;
  budget: number;
  maxScale: number;
  color: string;
}

export const SlipBudgetRow: React.FC<SlipBudgetRowProps> = ({
  name,
  used,
  budget,
  maxScale,
  color,
}) => {
  const isOver = used > budget;
  const isWarn = !isOver && budget > 0 && used / budget >= 0.8;
  const overAmount = used - budget;
  const remaining = Math.max(0, budget - used);

  const safeMax = Math.max(maxScale, budget, used, 1);
  const budgetPct = Math.min(100, Math.max(0, (budget / safeMax) * 100));
  const usedPct = Math.min(100, Math.max(0, (Math.min(used, budget) / safeMax) * 100));
  const overPct = isOver
    ? Math.min(100 - budgetPct, Math.max(0, (overAmount / safeMax) * 100))
    : 0;

  const totalPct = Math.max(0.5, budgetPct + overPct);

  return (
    <div className={`slip-budget-row ${isOver ? 'is-over' : isWarn ? 'is-warn' : ''}`}>
      <div className="slip-budget-header">
        <span className="slip-budget-name">{name}</span>
        <span
          className={`slip-budget-val ${
            isOver ? 'slip-val-over' : isWarn ? 'slip-val-warn' : ''
          }`}
        >
          {isOver
            ? `超支 ${formatAmount(overAmount)}（已用 ${formatAmount(used)} / ${formatAmount(budget)}）`
            : `剩餘 ${formatAmount(remaining)} · 已用 ${formatAmount(used)} / ${formatAmount(budget)}`}
        </span>
      </div>

      <div className="slip-bar-container" style={{ width: `${totalPct}%` }}>
        <div
          className="slip-bar-used"
          style={{
            width: isOver
              ? `${(budgetPct / totalPct) * 100}%`
              : `${(usedPct / totalPct) * 100}%`,
            backgroundColor: isWarn ? 'var(--warn)' : color,
          }}
        />
        {!isOver && (
          <div
            className="slip-bar-remaining"
            style={{
              width: `${((budgetPct - usedPct) / totalPct) * 100}%`,
            }}
          />
        )}
        {isOver && (
          <div
            className="slip-bar-over"
            style={{
              width: `${(overPct / totalPct) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export interface SlipCompareRowProps {
  label: string;
  amount: number;
  maxScale: number;
  color: string;
  prefix?: string;
}

export const SlipCompareRow: React.FC<SlipCompareRowProps> = ({
  label,
  amount,
  maxScale,
  color,
  prefix = '',
}) => {
  const pct = maxScale > 0 ? Math.min(100, Math.max(0, (amount / maxScale) * 100)) : 0;

  return (
    <div className="slip-compare-row">
      <div className="slip-compare-header">
        <span className="slip-compare-label">{label}</span>
        <span className="slip-compare-amount" style={{ color }}>
          {prefix}
          {formatAmount(amount)}
        </span>
      </div>
      <div className="slip-bar-track">
        <div
          className="slip-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export interface SlipGroupShareRowProps {
  name: string;
  color: string;
  amount: number;
  percentage: number;
  maxAmount?: number;
}

export const SlipGroupShareRow: React.FC<SlipGroupShareRowProps> = ({
  name,
  color,
  amount,
  percentage,
  maxAmount,
}) => {
  const barWidth =
    maxAmount && maxAmount > 0
      ? Math.min(100, Math.max(0, (amount / maxAmount) * 100))
      : percentage;

  return (
    <div className="slip-share-row">
      <div className="slip-share-left">
        <span
          className="slip-chip"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="slip-category">{name}</span>
      </div>

      <div className="slip-share-bar-cell">
        <div className="slip-bar-track">
          <div
            className="slip-bar-fill"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="slip-share-pct">{percentage.toFixed(1)}%</div>
      <div className="slip-share-amount">{formatAmount(amount)}</div>
    </div>
  );
};
