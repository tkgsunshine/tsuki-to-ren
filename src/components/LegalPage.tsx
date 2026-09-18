import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalPageProps {
  onClose: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ onClose }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(15, 12, 28, 0.99) 0%, rgba(8, 8, 18, 1) 100%)',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      overflowY: 'auto',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        padding: 'calc(1rem + env(safe-area-inset-top, 28px)) 1rem calc(6.5rem + max(1rem, env(safe-area-inset-bottom, 16px)))',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          position: 'sticky',
          top: 0,
          background: 'rgba(15, 12, 28, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '0.75rem 0',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} style={{ color: 'var(--color-gold)' }} />
            <h1 className="font-serif gold-text" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 'bold' }}>
              利用規約・プライバシーポリシー
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#cbd5e1',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 利用規約 Section */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(226, 192, 116, 0.25)'
          }}>
            <FileText size={16} style={{ color: '#fbbf24' }} />
            <h2 className="font-serif" style={{ fontSize: '1.05rem', color: '#fef08a', margin: 0, fontWeight: 'bold' }}>
              利用規約
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.82rem', color: '#d1d5db', lineHeight: '1.7' }}>
            <Article title="第1条（サービスの概要）">
              本サービス「月と蓮（つきとれん）」（以下「本サービス」）は、四柱推命をベースとした恋愛相性鑑定、運勢予測、およびAIチャットによるアドバイス機能を提供するウェブアプリケーションです。本サービスの利用をもって、本利用規約に同意したものとみなします。
            </Article>

            <Article title="第2条（利用資格）">
              本サービスは、年齢・国籍を問わずどなたでもご利用いただけます。
            </Article>

            <Article title="第3条（アカウント登録）">
              本サービスでは、Google アカウントまたは X（旧Twitter）アカウントを利用したソーシャルログイン機能を提供しています。アカウント登録により、鑑定データのクラウド保存・端末間同期が可能になります。ユーザーは自身のアカウント情報の管理について責任を負います。
            </Article>

            <Article title="第4条（サービス内容と免責事項）">
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}>本サービスが提供する鑑定結果・運勢予測・AIによるアドバイスは、エンターテインメント目的のコンテンツであり、科学的根拠に基づく保証をするものではありません。</li>
                <li style={{ marginBottom: '0.35rem' }}>鑑定結果に基づく判断・行動はユーザー自身の責任において行ってください。</li>
                <li style={{ marginBottom: '0.35rem' }}>本サービスの利用により生じた直接的・間接的な損害について、運営者は一切の責任を負いません。</li>
              </ul>
            </Article>

            <Article title="第5条（有料サブスクリプションサービス）">
              本サービスでは、月額利用プラン等の有料サブスクリプション機能（以下「有料プラン」）を提供しています。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}><strong>契約期間と更新</strong>：有料プランは購入日を起算日とする30日間の自動継続型サブスクリプションサービスです。契約期間満了までに解約手続きが行われない場合、自動的に同期間延長更新されます。</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>返金・キャンセルポリシー</strong>：デジタルコンテンツの特性上、決済完了後のお客様都合によるキャンセル・返金・日割り計算による払戻しには応じかねます。ただし、当社システムに明らかな瑕疵（サービスが利用できない重大な不具合等）が認められた場合、または当社に帰責性がある過剰課金が発生した場合は、事実確認のうえ速やかに返金または決済取消対応を行います。</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>解約手続き</strong>：ユーザーはアプリ内の設定画面等からいつでも自動更新の停止（解約）手続きが可能です。解約手続き完了後も、現在の有効期間満了日までは有料機能を引き続きご利用いただけます。</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>料金の変更</strong>：運営者は有料プランの価格を変更することがあります。価格変更を行う場合は、あらかじめサービス内にてユーザーに通知します。</li>
              </ul>
            </Article>

            <Article title="第6条（禁止事項）">
              ユーザーは以下の行為を行ってはなりません。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}>本サービスの不正利用、リバースエンジニアリング、またはスクレイピング</li>
                <li style={{ marginBottom: '0.35rem' }}>他のユーザーまたは第三者の権利を侵害する行為</li>
                <li style={{ marginBottom: '0.35rem' }}>本サービスの運営を妨害する行為</li>
                <li style={{ marginBottom: '0.35rem' }}>虚偽の情報を入力する行為</li>
              </ul>
            </Article>

            <Article title="第7条（知的財産権）">
              本サービスに関するすべてのコンテンツ（テキスト、画像、デザイン、プログラム等）の著作権その他の知的財産権は、運営者または正当な権利者に帰属します。
            </Article>

            <Article title="第8条（サービスの変更・終了）">
              運営者は、事前の通知なく本サービスの内容を変更、または提供を終了することがあります。サービスの変更・終了によりユーザーに生じた損害について、運営者は責任を負いません。
            </Article>

            <Article title="第9条（規約の変更）">
              運営者は、必要と判断した場合に本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点で効力を生じます。
            </Article>

            <Article title="第10条（準拠法と管轄）">
              本規約は日本法に準拠し、本サービスに関連する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </Article>
          </div>
        </section>

        {/* プライバシーポリシー Section */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(226, 192, 116, 0.25)'
          }}>
            <Shield size={16} style={{ color: '#4ade80' }} />
            <h2 className="font-serif" style={{ fontSize: '1.05rem', color: '#86efac', margin: 0, fontWeight: 'bold' }}>
              プライバシーポリシー
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.82rem', color: '#d1d5db', lineHeight: '1.7' }}>
            <Article title="1. 収集する情報">
              本サービスでは、以下の情報を収集する場合があります。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}><strong>アカウント情報</strong>：Google または X（旧Twitter）のソーシャルログインを通じて取得するユーザー名、メールアドレス、プロフィール画像</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>鑑定入力データ</strong>：生年月日、性別、MBTI タイプ等、鑑定機能の利用に必要なデータ</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>利用データ</strong>：サービスの利用状況に関する匿名化されたデータ</li>
              </ul>
            </Article>

            <Article title="2. 情報の利用目的">
              収集した情報は、以下の目的に限定して利用します。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}>鑑定結果の算出・表示およびAIチャット機能の提供</li>
                <li style={{ marginBottom: '0.35rem' }}>ユーザーデータのクラウド保存・端末間同期</li>
                <li style={{ marginBottom: '0.35rem' }}>メール通知機能（ユーザーが有効化した場合のみ）</li>
                <li style={{ marginBottom: '0.35rem' }}>サービスの改善・新機能の開発</li>
              </ul>
            </Article>

            <Article title="3. 情報の第三者提供">
              運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}>ユーザー本人の同意がある場合</li>
                <li style={{ marginBottom: '0.35rem' }}>法令に基づく開示要求がある場合</li>
                <li style={{ marginBottom: '0.35rem' }}>サービス提供に必要な業務委託先（Firebase 等のクラウドサービス）への提供。この場合、適切な管理・監督を行います。</li>
              </ul>
            </Article>

            <Article title="4. SNS への無断投稿について">
              本サービスは、ユーザーの Google アカウントまたは X アカウントに対して、<strong>無断で投稿・共有を行うことは一切ありません</strong>。ソーシャルログインはアカウント認証のみに使用されます。
            </Article>

            <Article title="5. データの保管と安全管理">
              ユーザーデータは、Google Firebase のセキュアなクラウド環境に保管され、不正アクセス・漏洩・紛失を防止するための適切な安全管理措置を講じています。
            </Article>

            <Article title="6. ローカルストレージの使用">
              本サービスでは、ユーザー体験の向上および快適な機能提供（ログイン状態の保持、入力データの一時保存、通知設定の記憶等）のために、ブラウザのローカルストレージ（localStorage）およびWebストレージ機能を使用しています。追跡目的の不要なCookie等は使用しておりません。
            </Article>

            <Article title="7. ユーザーの権利">
              ユーザーは、以下の権利を有します。
              <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, listStyle: 'disc' }}>
                <li style={{ marginBottom: '0.35rem' }}>アカウントのログアウトおよびデータの削除をいつでも要求できます</li>
                <li style={{ marginBottom: '0.35rem' }}>収集されたデータの内容について問い合わせることができます</li>
                <li style={{ marginBottom: '0.35rem' }}>メール通知の受信をいつでも停止できます</li>
              </ul>
            </Article>

            <Article title="8. ポリシーの変更">
              本プライバシーポリシーは、必要に応じて変更されることがあります。重要な変更がある場合は、サービス内で通知します。
            </Article>

            <Article title="9. お問い合わせ">
              本ポリシーに関するお問い合わせは、下記の運営会社までご連絡ください。
            </Article>
          </div>
        </section>

        {/* 運営会社情報 Section */}
        <section style={{ marginTop: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(226, 192, 116, 0.25)'
          }}>
            <FileText size={16} style={{ color: '#a78bfa' }} />
            <h2 className="font-serif" style={{ fontSize: '1.05rem', color: '#c4b5fd', margin: 0, fontWeight: 'bold' }}>
              運営会社情報
            </h2>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1.25rem 1.15rem',
            fontSize: '0.82rem',
            color: '#d1d5db',
            lineHeight: '2'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#9ca3af', whiteSpace: 'nowrap', paddingRight: '1.5rem', verticalAlign: 'top', fontWeight: '500' }}>会社名</td>
                  <td style={{ fontWeight: '600', color: '#e2e8f0' }}>Ill株式会社</td>
                </tr>
                <tr>
                  <td style={{ color: '#9ca3af', whiteSpace: 'nowrap', paddingRight: '1.5rem', verticalAlign: 'top', fontWeight: '500' }}>お問合せ</td>
                  <td style={{ color: '#e2e8f0' }}>support@tsuki-to-ren.com</td>
                </tr>
                <tr>
                  <td style={{ color: '#9ca3af', whiteSpace: 'nowrap', paddingRight: '1.5rem', verticalAlign: 'top', fontWeight: '500' }}>電話番号</td>
                  <td style={{ color: '#e2e8f0' }}>08053565283</td>
                </tr>
                <tr>
                  <td style={{ color: '#9ca3af', whiteSpace: 'nowrap', paddingRight: '1.5rem', verticalAlign: 'top', fontWeight: '500' }}>制定日</td>
                  <td style={{ color: '#e2e8f0' }}>2026年9月1日</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

// Reusable article component
const Article: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 style={{
      fontSize: '0.85rem',
      color: '#e2e8f0',
      fontWeight: '600',
      margin: '0 0 0.4rem',
      letterSpacing: '0.02em'
    }}>
      {title}
    </h3>
    <div>{children}</div>
  </div>
);
