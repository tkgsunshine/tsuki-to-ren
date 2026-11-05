import React from 'react';
import { Lock } from 'lucide-react';

interface PremiumUnlockButtonProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  /** 鍵アイコンを出さない（「続きを見る」ボタン） */
  hideIcon?: boolean;
}

// 「プレミアム登録で全解放（月額980円）」の金色ボタン。見た目をそろえるため、鍵つきの登録ボタンはこれを使う
export const PremiumUnlockButton: React.FC<PremiumUnlockButtonProps> = ({ onClick, className, style, label = 'プレミアム登録で全解放 (月額980円)', hideIcon }) => (
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
    <span>{!hideIcon && <Lock size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />}{label}</span>
  </button>
);
