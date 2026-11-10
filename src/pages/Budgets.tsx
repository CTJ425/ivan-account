import React from 'react';
import { Slip, SlipBudgetRow } from '../components/Slip';
import { DEMO_BUDGET_DATA } from '../demo/data';

export const Budgets: React.FC = () => {
  const maxScale = Math.max(
    ...DEMO_BUDGET_DATA.groups.map((g) => Math.max(g.budget, g.used)),
  );

  return (
    <div className="page-centered-container">
      <h1 className="page-title">預算</h1>
      <Slip
        title={DEMO_BUDGET_DATA.title}
        headerRight={
          <span className="slip-total">{DEMO_BUDGET_DATA.remainingText}</span>
        }
      >
        {DEMO_BUDGET_DATA.groups.map((g) => (
          <SlipBudgetRow
            key={g.id}
            name={g.name}
            used={g.used}
            budget={g.budget}
            maxScale={maxScale}
            color={g.color}
          />
        ))}
      </Slip>
    </div>
  );
};

export default Budgets;
