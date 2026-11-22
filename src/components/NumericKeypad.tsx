import React from 'react';

export interface NumericKeypadProps {
  hasOperator: boolean;
  hasValue: boolean;
  onDigit: (digit: string) => void;
  onOperator: (op: '+' | '-') => void;
  onBackspace: () => void;
  onClear: () => void;
  onEvaluate: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  hasOperator,
  hasValue,
  onDigit,
  onOperator,
  onBackspace,
  onClear,
  onEvaluate,
}) => {
  return (
    <div className="numpad-grid" role="group" aria-label="數字鍵盤">
      {/* Row 1 */}
      <button type="button" className="numpad-key" onClick={() => onDigit('7')}>
        7
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('8')}>
        8
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('9')}>
        9
      </button>
      <button
        type="button"
        className="numpad-key numpad-key-util"
        onClick={onBackspace}
        disabled={!hasValue}
        aria-label="退格"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <line x1="18" y1="9" x2="12" y2="15" />
          <line x1="12" y1="9" x2="18" y2="15" />
        </svg>
      </button>

      {/* Row 2 */}
      <button type="button" className="numpad-key" onClick={() => onDigit('4')}>
        4
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('5')}>
        5
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('6')}>
        6
      </button>
      <button
        type="button"
        className="numpad-key numpad-key-util"
        onClick={() => onOperator('+')}
        disabled={!hasValue}
        aria-label="加"
      >
        +
      </button>

      {/* Row 3 */}
      <button type="button" className="numpad-key" onClick={() => onDigit('1')}>
        1
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('2')}>
        2
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('3')}>
        3
      </button>
      <button
        type="button"
        className="numpad-key numpad-key-util"
        onClick={() => onOperator('-')}
        disabled={!hasValue}
        aria-label="減"
      >
        −
      </button>

      {/* Row 4 */}
      <button
        type="button"
        className="numpad-key numpad-key-util"
        onClick={onClear}
        disabled={!hasValue}
        aria-label="清除金額"
      >
        C
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" className="numpad-key" onClick={() => onDigit('00')}>
        00
      </button>
      <button
        type="button"
        className={`numpad-key ${hasOperator ? 'numpad-key-eval' : 'numpad-key-util'}`}
        onClick={onEvaluate}
        disabled={!hasOperator}
        aria-label="計算結果"
      >
        =
      </button>
    </div>
  );
};

export default NumericKeypad;
