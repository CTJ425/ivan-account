import React from 'react';
import { Slip, SlipGroupShareRow } from '../components/Slip';
import { DEMO_SPENDING_BY_GROUP } from '../demo/data';

export const Charts: React.FC = () => {
  const maxGroupScale = Math.max(
    ...DEMO_SPENDING_BY_GROUP.groups.map((g) => g.amount),
  );

  return (
    <div className="page-centered-container">
      <h1 className="page-title">圖表</h1>
      <Slip
        title={DEMO_SPENDING_BY_GROUP.title}
        total={DEMO_SPENDING_BY_GROUP.totalText}
      >
        {DEMO_SPENDING_BY_GROUP.groups.map((g) => (
          <SlipGroupShareRow
            key={g.name}
            name={g.name}
            color={g.color}
            amount={g.amount}
            percentage={g.percentage}
            maxAmount={maxGroupScale}
          />
        ))}
      </Slip>
    </div>
  );
};

export default Charts;
