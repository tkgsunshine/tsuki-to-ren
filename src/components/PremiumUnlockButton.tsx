import React from 'react';
import { Lock } from 'lucide-react';

interface PremiumUnlockButtonProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// 「プレミアム登録で全解放（月額980円）」の金色ボタン。見た目をそろえるため、鍵つきの登録ボタンはこれを使う
export const PremiumUnlockButton: React.FC<PremiumUnlockButtonProps> = ({ onClick, className, style }) => (
  <button
    type="button"
    onClick={onClick}
    className={`consult-btn font-serif${className ? ` ${className}` : ''}`}
    style={{
      fontSize: '0.85rem',
      padding: '0.75rem',
      fontWeight: 'bold',
      width: '100%',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(226,192,116,0.5), 0 0 10px rgba(242, 226, 179,0.3)',
      letterSpacing: '0.02em',
      ...style
    }}
  >
    <span><Lock size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />プレミアム登録で全解放 (月額980円)</span>
  </button>
);
