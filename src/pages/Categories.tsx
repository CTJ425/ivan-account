import React from 'react';
import { Slip, SlipRow } from '../components/Slip';

export const Categories: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">分類管理</h1>

      <Slip title="支出分類" total="12 個分類">
        <SlipRow category="餐食" note="早餐、午餐、晚餐、飲料" amount="4 個" groupColor="var(--g1)" />
        <SlipRow category="交通" note="捷運、公車、加油" amount="3 個" groupColor="var(--g2)" />
        <SlipRow category="居住" note="房租、水電瓦斯、居家用品" amount="3 個" groupColor="var(--g3)" />
        <SlipRow category="娛樂" note="休閒娛樂" amount="1 個" groupColor="var(--g4)" />
        <SlipRow category="購物" note="日常購物" amount="1 個" groupColor="var(--g5)" />
      </Slip>

      <div style={{ height: '16px' }} />

      <Slip title="收入分類" total="4 個分類">
        <SlipRow category="薪資" note="本薪、獎金" amount="2 個" groupColor="var(--income)" isIncome />
        <SlipRow category="投資" note="投資收益" amount="1 個" groupColor="var(--g7)" isIncome />
        <SlipRow category="其他" note="其他收入" amount="1 個" groupColor="var(--g8)" isIncome />
      </Slip>
    </div>
  );
};

export default Categories;
