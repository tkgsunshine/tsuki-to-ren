import React from 'react';

// 購入ボタンの近くに出す、申し込み前の確認（特商法の最終確認画面のルール・規約への同意）。
// 料金・支払いの時期・自動更新・解約方法・返金・規約へのリンクを（特商法表記へのリンクはアプリ内では出さない: TAKASHI判断 2026-11-10）、押す前に見える場所へ出す。
// Stripe の決済画面にも同じ内容を出している（api/_lib/stripe-checkout.js の SUBSCRIPTION_TERMS / PAIR_TERMS）。文を変えるときは両方そろえる。
// compact: 画面下に固定したボタンの下など、場所が狭いところ用の1〜2行版
type Plan = 'monthly' | 'pair';

const linkStyle: React.CSSProperties = { color: '#d8c08a', textDecoration: 'underline' };

const LegalLinks: React.FC = () => (
  <>
    購入すると
    <a href="/terms" target="_blank" rel="noopener" style={linkStyle}>利用規約</a>
    ・
    <a href="/privacy" target="_blank" rel="noopener" style={linkStyle}>プライバシーポリシー</a>
    に同意したものとみなします。
  </>
);

export const PurchaseTerms: React.FC<{ plans: Plan[]; compact?: boolean; style?: React.CSSProperties }> = ({ plans, compact, style }) => {
  const monthly = plans.includes('monthly');
  const pair = plans.includes('pair');
  if (compact) {
    return (
      <p style={{ fontSize: '0.6rem', color: '#a9a49a', lineHeight: 1.5, margin: '0.5rem 0 0', textAlign: 'center', ...style }}>
        {monthly && pair ? '月額は毎月自動更新（いつでも解約可）、¥680は1回払い。' : monthly ? '月額は毎月自動更新・いつでも解約できます。' : '¥680は1回払いです。'}
        <LegalLinks />
      </p>
    );
  }
  return (
    <div style={{
      fontSize: '0.64rem',
      color: '#a9a49a',
      lineHeight: 1.6,
      textAlign: 'left',
      padding: '0.6rem 0.75rem',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(255, 255, 255, 0.03)',
      ...style
    }}>
      <ul style={{ margin: 0, paddingLeft: '1.1em' }}>
        {monthly && (
          <li>
            <strong style={{ color: '#d8d2c6' }}>月額980円（税込）</strong>：今日1回目をお支払いし、以後は毎月同じ日に自動で更新・お支払いになります。マイページからいつでも解約でき、解約後も期間の終わりまで使えます。
          </li>
        )}
        {pair && (
          <li>
            <strong style={{ color: '#d8d2c6' }}>お相手1人の深層鑑定 680円（税込）</strong>：1回払いで、自動更新はありません。お支払い後すぐに見られます。
          </li>
        )}
        <li>お支払いはカード / Apple Pay / Google Pay。お客様都合による返金はできません。</li>
      </ul>
      <div style={{ marginTop: '0.35rem' }}>
        <LegalLinks />
      </div>
    </div>
  );
};

export default PurchaseTerms;
