import { useOutletContext } from 'react-router-dom';
import type { Ledger } from '../lib/types';

export interface LedgerOutletContext {
  ledgers: Ledger[];
  currentLedger: Ledger | null;
  setLedgerId: (id: string) => void;
  isLoadingLedgers: boolean;
  ledgerError: string | null;
  isOffline: boolean;
}

export const useLedger = (): LedgerOutletContext => {
  return useOutletContext<LedgerOutletContext>();
};
