import { useOutletContext } from 'react-router-dom';

export type LedgerId = 'personal' | 'shared';

export interface LedgerInfo {
  id: LedgerId;
  name: string;
  scopeLabel: string;
}

export const LEDGERS: Record<LedgerId, LedgerInfo> = {
  personal: {
    id: 'personal',
    name: '個人帳本',
    scopeLabel: '個人私密',
  },
  shared: {
    id: 'shared',
    name: '家庭',
    scopeLabel: '家庭共用',
  },
};

export interface LedgerOutletContext {
  currentLedger: LedgerInfo;
  setLedgerId: (id: LedgerId) => void;
}

export const useLedger = (): LedgerOutletContext => {
  return useOutletContext<LedgerOutletContext>();
};
