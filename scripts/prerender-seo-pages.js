import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateDayPillar, MBTI_COMPAT_TYPES, MBTI_COMPAT_100 } from '../api/_lib/fortuneEngine.js';
import { SERVICE, ABOUT_FAQS, loadColumns } from './site-facts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.tsuki-to-ren.com';
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

function escapeAttr(str) {
  return str ? str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}

function writePage(subDir, title, description, keywords, canonicalUrl, noscriptContent, customSchemas = []) {
  const targetDir = path.join(distDir, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanBaseHtml = baseHtml.replace(/<script type="application\/ld\+json">[\s\S]*?"@type":\s*"FAQPage"[\s\S]*?<\/script>/, '');

  let pageHtml = cleanBaseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`)
    .replace(/<meta name="description" content="[\s\S]*?" \/>/i, `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace(/<link rel="canonical" href="[\s\S]*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[\s\S]*?" \/>/i, `<meta property="og:title" content="${escapeAttr(title)}" />`)
    .replace(/<meta property="og:description" content="[\s\S]*?" \/>/i, `<meta property="og:description" content="${escapeAttr(description)}" />`)
    .replace(/<meta property="og:url" content="[\s\S]*?" \/>/i, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/i, `<meta name="twitter:title" content="${escapeAttr(title)}" />`)
    .replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/i, `<meta name="twitter:description" content="${escapeAttr(description)}" />`);

  if (keywords) {
    if (pageHtml.includes('<meta name="keywords"')) {
      pageHtml = pageHtml.replace(/<meta name="keywords" content="[\s\S]*?" \/>/i, `<meta name="keywords" content="${escapeAttr(keywords)}" />`);
    } else {
      pageHtml = pageHtml.replace('</head>', `<meta name="keywords" content="${escapeAttr(keywords)}" />\n</head>`);
    }
  }

  if (customSchemas.length > 0) {
    const schemaTags = customSchemas
      .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
      .join('\n');
    pageHtml = pageHtml.replace('</head>', `${schemaTags}\n</head>`);
  }

  pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${noscriptContent}</div>`);

  fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8');
}

console.log('🚀 Pre-rendering Legal & Institutional Pages...');

// 1. /terms
writePage(
  'terms',
  '利用規約 | 月と蓮 - 本格四柱推命×16タイプ恋愛相性占い',
  '月と蓮（つきとれん）のサービス利用規約です。当サービスの利用資格、アカウント管理、有料プラン（サブスクリプション）、免責事項、禁止事項について定めています。',
  '月と蓮, 利用規約, サービス規約, 占いサービス',
  `${BASE_URL}/terms`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>利用規約</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #fef08a; border-bottom: 1px solid rgba(226,192,116,0.3); padding-bottom: 0.5rem;">利用規約</h1>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.1rem; color: #e2c074;">第1条（サービスの概要）</h2>
          <p>本サービス「月と蓮（つきとれん）」（以下「本サービス」）は、四柱推命をベースとした恋愛相性鑑定、運勢予測、およびAIチャットによるアドバイス機能を提供するウェブアプリケーションです。本サービスの利用をもって、本利用規約に同意したものとみなします。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第2条（利用資格）</h2>
          <p>本サービスは、年齢・国籍を問わずどなたでもご利用いただけます。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第3条（アカウント登録）</h2>
          <p>本サービスでは、Google アカウントまたは X（旧Twitter）アカウントを利用したソーシャルログイン機能を提供しています。アカウント登録により、鑑定データのクラウド保存・端末間同期が可能になります。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第4条（サービス内容と免責事項）</h2>
          <p>本サービスが提供する相性鑑定結果、運勢予測、バイオリズム、およびAIキャラクターによるアドバイス等は、東洋占術および性格類型論に基づく参考情報・エンターテインメント目的のコンテンツであり、<strong>将来の出来事、恋愛・婚姻の成就、特定の成果や効果を確実に保証・実証するものではありません</strong>。鑑定結果に基づく判断・意思決定・行動はユーザー自身の責任において行ってください。本サービスの利用により生じた損害について、運営者に故意または重大な過失がある場合を除き、一切の責任を負いません。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第5条（有料サブスクリプションサービス）</h2>
          <p>本サービスでは、月額980円（税込）等の有料サブスクリプション機能を提供しています。お申し込み日を起算日として1か月ごとに自動更新され、更新日に決済が行われます（無料お試し期間はありません）。更新日までに解約手続き（自動更新停止）を行えば、次回以降の課金は発生しません。デジタルコンテンツの特性上、決済完了後のお客様都合によるキャンセル・返金・日割り計算による払戻しには応じかねます。ただし、当社システムに明らかな瑕疵が認められた場合、または当社に帰責性がある過剰課金が発生した場合は、事実確認のうえ速やかに返金または決済取消対応を行います。プラン解約は設定画面よりいつでも即時可能です。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第6条（運営会社）</h2>
          <p>運営会社：Ill株式会社 / お問合せ：support@tsuki-to-ren.com</p>
        </section>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">← 恋愛診断トップへ戻る</a></p>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '利用規約', 'item': `${BASE_URL}/terms` }
      ]
    }
  ]
);

// 2. /privacy
writePage(
  'privacy',
  'プライバシーポリシー | 月と蓮 - 個人情報保護方針',
  '月と蓮（つきとれん）における個人情報の取扱い方針です。Google/Xソーシャルログイン情報、生年月日、性格診断データの適切な安全管理とプライバシー保護について定めています。',
  '月と蓮, プライバシーポリシー, 個人情報保護方針, セキュリティ',
  `${BASE_URL}/privacy`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>プライバシーポリシー</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #86efac; border-bottom: 1px solid rgba(74,222,128,0.3); padding-bottom: 0.5rem;">プライバシーポリシー</h1>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.1rem; color: #86efac;">1. 収集する情報</h2>
          <p>ソーシャルログインで取得するユーザー名、メールアドレス、鑑定利用に必要な生年月日や16タイプデータ等を収集します。</p>
          <h2 style="font-size: 1.1rem; color: #86efac;">2. 情報の利用目的</h2>
          <p>四柱推命・気学・心理相性の正確な算出、AIチャットのパーソナライズ、データ同期、メール通知提供に限定して利用します。</p>
          <h2 style="font-size: 1.1rem; color: #86efac;">3. SNSへの無断投稿について</h2>
          <p>本サービスがユーザーのGoogleまたはXアカウントに対して無断で投稿・共有を行うことは一切ありません。</p>
          <h2 style="font-size: 1.1rem; color: #86efac;">4. 個人データの保存期間と削除方法</h2>
          <p>個人データはアカウント保有中およびサービス提供に必要な期間に限り保管します。ユーザーは設定画面またはサポート窓口（support@tsuki-to-ren.com）への連絡により、いつでも個人データの開示・訂正・完全削除を請求可能です。端末内のローカルデータはブラウザのキャッシュ消去により即時に削除されます。</p>
          <h2 style="font-size: 1.1rem; color: #86efac;">5. データの安全管理</h2>
          <p>Google Firebaseの暗号化セキュアクラウド環境にて厳重に管理されます。有料プランの決済は決済代行会社 Stripe を通じて行い、クレジットカード情報は当社のサーバーに保存されません。</p>
          <h2 style="font-size: 1.1rem; color: #86efac;">6. 苦情・相談対応体制</h2>
          <p>個人情報の取扱いに関する苦情・相談は、下記窓口までお申し出ください。<br/>
          運営会社：Ill株式会社（個人情報管理責任者：須藤 涼弥）<br/>
          所在地：東京都渋谷区代々木２丁目２４−８<br/>
          連絡先：support@tsuki-to-ren.com</p>
        </section>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">← 恋愛診断トップへ戻る</a></p>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'プライバシーポリシー', 'item': `${BASE_URL}/privacy` }
      ]
    }
  ]
);

// 3. /tokushoho
writePage(
  'tokushoho',
  '特定商取引法に基づく表記 | 月と蓮',
  '月と蓮（つきとれん）の特定商取引法に基づく表記です。運営事業者（Ill株式会社）、販売価格、支払方法、提供時期、返品・キャンセルポリシー等を明記しています。',
  '特定商取引法に基づく表記, 月と蓮, サブスクリプション, Ill株式会社',
  `${BASE_URL}/tokushoho`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>特定商取引法に基づく表記</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #93c5fd; border-bottom: 1px solid rgba(147,197,253,0.3); padding-bottom: 0.5rem;">特定商取引法に基づく表記</h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.9rem;">
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af; width: 140px;">販売事業者</th><td style="padding: 0.75rem 0;">Ill株式会社</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">運営責任者</th><td style="padding: 0.75rem 0;">須藤 涼弥</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">所在地</th><td style="padding: 0.75rem 0;">東京都渋谷区代々木２丁目２４−８</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">電話番号</th><td style="padding: 0.75rem 0;">請求があった場合は遅滞なく開示します</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">お問い合わせ</th><td style="padding: 0.75rem 0;">support@tsuki-to-ren.com</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">販売価格</th><td style="padding: 0.75rem 0;">プレミアムプラン: 月額980円（税込）</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">契約期間・自動更新</th><td style="padding: 0.75rem 0;">1か月ごとの自動更新のサブスクリプション（初回はお申し込み時、2回目以降は毎月の更新日に決済）。更新日までに解約手続き（自動更新の停止）を行わない限り、同一条件で1か月ごとに自動的に契約が更新され、継続課金が発生します。無料お試し期間はありません。</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">支払方法</th><td style="padding: 0.75rem 0;">クレジットカード（Visa / Mastercard / JCB / AMEX）、Apple Pay、Google Pay</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">商品の引き渡し</th><td style="padding: 0.75rem 0;">決済完了後、ただちにご利用可能</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">解約方法（自動更新の停止）</th><td style="padding: 0.75rem 0;">マイページ（設定画面）内の「プレミアム会員の解約手続き」より、いつでも即座に定期課金の自動更新停止・解約手続きが可能です。解約を行わない限り契約は自動更新されます。解約完了後も次回更新日（有効期限満了日）までは有料機能を引き続きご利用いただけます。</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">動作環境</th><td style="padding: 0.75rem 0;">【スマートフォン・タブレット・PC】<br/>・iOS: 最新バージョンのSafari<br/>・Android: 最新バージョンのGoogle Chrome<br/>・PC (Windows / Mac): 最新バージョンのGoogle Chrome, Safari, Microsoft Edge<br/>※インターネット接続環境が必要です。</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">返品・返金について</th><td style="padding: 0.75rem 0;">デジタルコンテンツの特性上、決済完了後のお客様都合によるキャンセル・返金・日割り計算による払戻しには応じかねます。ただし、当社システムに明らかな瑕疵（サービスが利用できない重大な不具合等）が認められた場合、または当社に帰責性がある過剰課金が発生した場合は、事実確認のうえ速やかに返金または決済取消対応を行います。プラン解約は設定画面よりいつでも即時可能です。</td></tr>
          </tbody>
        </table>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">← 恋愛診断トップへ戻る</a></p>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '特定商取引法に基づく表記', 'item': `${BASE_URL}/tokushoho` }
      ]
    }
  ]
);

// 4. /company
writePage(
  'company',
  '運営会社情報 | 月と蓮 - Ill株式会社',
  '本格四柱推命×16タイプ恋愛相性アプリ『月と蓮』を運営するIll株式会社の会社概要、所在地、代表者、事業内容を掲載しています。',
  'Ill株式会社, 運営会社, 月と蓮, 会社概要',
  `${BASE_URL}/company`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>運営会社</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #c4b5fd; border-bottom: 1px solid rgba(196,181,253,0.3); padding-bottom: 0.5rem;">運営会社情報</h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.9rem;">
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af; width: 140px;">社名</th><td style="padding: 0.75rem 0; font-weight: bold;">Ill株式会社</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">代表取締役</th><td style="padding: 0.75rem 0;">須藤 涼弥</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">設立</th><td style="padding: 0.75rem 0;">2022年6月1日</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">所在地</th><td style="padding: 0.75rem 0;">東京都渋谷区代々木２丁目２４−８</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">事業内容</th><td style="padding: 0.75rem 0;">AI占いコンテンツ開発、次世代マッチングプラットフォーム『月と蓮』の企画運営・システム提供。</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">お問い合わせ</th><td style="padding: 0.75rem 0;">support@tsuki-to-ren.com</td></tr>
          </tbody>
        </table>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">← 恋愛診断トップへ戻る</a></p>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '運営会社情報', 'item': `${BASE_URL}/company` }
      ]
    }
  ]
);

// 5. /result
writePage(
  'result',
  '【鑑定結果】四柱推命×16タイプ恋愛相性診断 | 月と蓮',
  '四柱推命と16タイプで鑑定した二人の魂の相性スコア、深層心理、返信率MAXのLINE吉時間、お相手の攻略トリセツ結果画面です。',
  '月と蓮, 鑑定結果, 四柱推命 相性, 16タイプ 相性, LINE吉時間',
  `${BASE_URL}/result`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>鑑定結果</span>
      </nav>
      <article style="text-align: center;">
        <h1 style="font-size: 1.6rem; color: #fef08a; margin-bottom: 1rem;">二人の精密恋愛相性・鑑定結果</h1>
        <p style="font-size: 0.9rem; color: #d1d5db; margin-bottom: 2rem;">生年月日から導く四柱推命の魂の結びつき、日盤バイオリズム、16タイプの心理傾向を統合した鑑定結果が表示されます。</p>
        <a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold;">今すぐ無料で相性を占う</a>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '鑑定結果', 'item': `${BASE_URL}/result` }
      ]
    }
  ]
);

// 6. /chat
writePage(
  'chat',
  '【AI恋愛チャット相談】守護キャラクター月・蓮が寄り添う相性対話 | 月と蓮',
  '四柱推命の命式とお相手の16タイプ傾向を熟知した守護AIキャラクター「月（直感と優しさ）」と「蓮（理性と導き）」による24時間リアルタイム恋愛チャット相談。',
  'AI占いチャット, 恋愛相談, 月と蓮, チャット占い',
  `${BASE_URL}/chat`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>AIチャット相談</span>
      </nav>
      <article style="text-align: center;">
        <h1 style="font-size: 1.6rem; color: #fef08a; margin-bottom: 1rem;">守護キャラクター（月・蓮）とAI恋愛相談</h1>
        <p style="font-size: 0.9rem; color: #d1d5db; margin-bottom: 2rem;">お相手の気持ちやLINEの返信内容に迷ったとき、命式と心理タイプを踏まえた的確なアドバイスをいつでも受けられます。</p>
        <a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold;">恋愛診断・チャットを始める</a>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'チャット相談', 'item': `${BASE_URL}/chat` }
      ]
    }
  ]
);

// 7. /mypage
writePage(
  'mypage',
  '【マイページ】お相手データ管理・会員プラン設定 | 月と蓮',
  '月と蓮（つきとれん）のマイページ。保存したお相手のデータ一覧、会員ステータス（無料・プレミアム）、各種設定の確認・変更が行えます。',
  '月と蓮, マイページ, アプリ設定, お相手保存',
  `${BASE_URL}/mypage`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>マイページ</span>
      </nav>
      <article style="text-align: center;">
        <h1 style="font-size: 1.6rem; color: #fef08a; margin-bottom: 1rem;">マイページ・設定</h1>
        <p style="font-size: 0.9rem; color: #d1d5db; margin-bottom: 2rem;">Google / X ログイン、保存したお相手の管理、特定商取引法表記や規約の確認はこちらから行えます。</p>
        <a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold;">ホームへ戻る</a>
      </article>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'マイページ', 'item': `${BASE_URL}/mypage` }
      ]
    }
  ]
);

// 8. /about 月と蓮とは（公式情報。AIの検索・Google向けに、仕組み・料金・運営者を事実だけで書く。文は scripts/site-facts.js）
{
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const h2 = 'font-size: 1.15rem; color: #e2c074; margin: 2rem 0 0.5rem;';
  const li = (items) => `<ul style="padding-left: 1.2rem;">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const td = 'padding: 0.6rem 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.1); vertical-align: top;';
  const aboutHtml = `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>月と蓮とは</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #fef08a; border-bottom: 1px solid rgba(226,192,116,0.3); padding-bottom: 0.5rem;">月と蓮とは｜仕組みと料金</h1>
        <p><strong>${esc(SERVICE.summary)}</strong></p>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 1rem;">
          <tbody>
            <tr><th style="${td} text-align: left; color: #9ca3af; width: 120px;">サービス名</th><td style="${td}">${esc(SERVICE.name)}（${esc(SERVICE.nameEn)}）</td></tr>
            <tr><th style="${td} text-align: left; color: #9ca3af;">運営</th><td style="${td}"><a href="/company" style="color: #e2c074;">${esc(SERVICE.operator)}</a></td></tr>
            <tr><th style="${td} text-align: left; color: #9ca3af;">URL</th><td style="${td}">${BASE_URL}/</td></tr>
            <tr><th style="${td} text-align: left; color: #9ca3af;">使い方</th><td style="${td}">ブラウザで開くだけ（スマホのホーム画面にも追加できます）</td></tr>
            <tr><th style="${td} text-align: left; color: #9ca3af;">料金</th><td style="${td}">鑑定は無料。プレミアムプラン 月額980円／お相手1人の買い切り 680円</td></tr>
          </tbody>
        </table>

        <h2 style="${h2}">入力するもの</h2>
        ${li(SERVICE.inputs)}

        <h2 style="${h2}">占いの仕組み</h2>
        ${SERVICE.methods.map((m) => `<h3 style="font-size: 1rem; color: #fef08a; margin: 1rem 0 0.25rem;">${esc(m.title)}</h3><p style="margin: 0;">${esc(m.body)}</p>`).join('')}

        <h2 style="${h2}">相性の点数の出し方</h2>
        ${li(SERVICE.scoring)}

        <h2 style="${h2}">無料でできること</h2>
        ${li(SERVICE.freeFeatures)}

        <h2 style="${h2}">料金</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead><tr><th style="${td} text-align: left; color: #9ca3af;">プラン</th><th style="${td} text-align: left; color: #9ca3af;">料金</th><th style="${td} text-align: left; color: #9ca3af;">内容</th></tr></thead>
          <tbody>${SERVICE.plans.map((p) => `<tr><td style="${td}">${esc(p.name)}</td><td style="${td} white-space: nowrap;">${esc(p.price)}</td><td style="${td}">${esc(p.body)}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size: 0.85rem; color: #cbd5e1;">お支払い方法: ${esc(SERVICE.payment)}</p>

        <h2 style="${h2}">ご利用にあたって</h2>
        ${li(SERVICE.notes)}

        <h2 style="${h2}">よくある質問</h2>
        ${ABOUT_FAQS.map((f) => `<h3 style="font-size: 0.95rem; color: #fef08a; margin: 1rem 0 0.25rem;">${esc(f.q)}</h3><p style="margin: 0;">${esc(f.a)}</p>`).join('')}

        <h2 style="${h2}">関連ページ</h2>
        <ul style="padding-left: 1.2rem;">${SERVICE.links.filter((l) => l.path !== '/about').map((l) => `<li><a href="${l.path}" style="color: #e2c074;">${esc(l.title)}</a>${l.desc ? `：${esc(l.desc)}` : ''}</li>`).join('')}</ul>

        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: #e2c074; color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">無料で相性を占う</a></p>
      </article>
    </div>
  `;

  writePage(
    'about',
    '月と蓮とは｜四柱推命・九星気学・16タイプで占う恋愛相性診断の仕組みと料金',
    '月と蓮は、生年月日から見る四柱推命・九星気学と16タイプ性格診断（MBTI）を組み合わせた恋愛相性診断です。占いの仕組み、点数の出し方、無料でできること、料金（月額980円・買い切り680円）、運営会社をまとめています。',
    '月と蓮, 恋愛相性診断, 四柱推命, 九星気学, 16タイプ, MBTI 相性, 生年月日 相性',
    `${BASE_URL}/about`,
    aboutHtml,
    [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': '月と蓮とは',
        'url': `${BASE_URL}/about`,
        'description': SERVICE.summary,
        'inLanguage': 'ja',
        'about': {
          '@type': 'WebApplication',
          'name': SERVICE.name,
          'alternateName': SERVICE.nameEn,
          'url': `${BASE_URL}/`,
          'applicationCategory': 'LifestyleApplication',
          'operatingSystem': 'Web',
          'publisher': { '@type': 'Organization', 'name': SERVICE.operator, 'url': `${BASE_URL}/company` },
          'offers': [
            { '@type': 'Offer', 'name': '鑑定（無料）', 'price': '0', 'priceCurrency': 'JPY' },
            { '@type': 'Offer', 'name': 'プレミアムプラン（月額）', 'price': '980', 'priceCurrency': 'JPY' },
            { '@type': 'Offer', 'name': 'お相手1人の買い切り', 'price': '680', 'priceCurrency': 'JPY' }
          ]
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': ABOUT_FAQS.map((f) => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
        }))
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
          { '@type': 'ListItem', 'position': 2, 'name': '月と蓮とは', 'item': `${BASE_URL}/about` }
        ]
      }
    ]
  );
}

console.log('✅ Pre-rendered Legal, Company, Result, Chat, Mypage & About pages successfully.');

// 9. /tools/nicchu 日柱の調べ方（入力欄を使わなくても、調べ方・計算例・60通りの一覧が読めるように丸ごと出す）
// 文面は src/data/nicchu-tool.json（画面 ToolNicchuView と共通）。計算は鑑定と同じエンジン（api/_lib/fortuneEngine.js）
{
  const tool = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/nicchu-tool.json'), 'utf-8'));
  const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const url = `${BASE_URL}/tools/nicchu`;
  const pillarOf = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    const { stem, branch } = calculateDayPillar(new Date(y, m - 1, d));
    return tool.pillars.find((p) => p.pillar === stem + branch);
  };
  const ja = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${y}年${m}月${d}日`; };
  const h2 = 'font-size: 1.15rem; color: #e2c074; margin-top: 2rem;';
  const kaigou = tool.pillars.filter((p) => p.kaigou);
  const html = `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>日柱の調べ方</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #fef08a; border-bottom: 1px solid rgba(226,192,116,0.3); padding-bottom: 0.5rem;">${esc(tool.h1)}</h1>
        ${tool.conclusion.map((t) => `<p>${esc(t)}</p>`).join('\n        ')}
        <p style="font-size: 0.85rem; color: #9ca3af;">このページを開くと、生年月日を入れるだけで日柱が分かる入力欄が表示されます（無料・登録不要）。</p>

        <h2 id="kaigou" style="${h2}">魁罡（かいごう）かどうかの調べ方</h2>
        <p>${esc(tool.kaigouIntro)}</p>
        <ul>
          ${kaigou.map((p) => `<li>${esc(p.pillar)}（${esc(p.reading)}）</li>`).join('\n          ')}
        </ul>
        <p><a href="${tool.kaigouColumn}" style="color: #e2c074;">魁罡の特徴・恋愛傾向はこちら</a></p>

        <h2 style="${h2}">日柱の調べ方（計算の考え方）</h2>
        ${tool.howTo.map((t) => `<p>${esc(t)}</p>`).join('\n        ')}
        <h3 style="font-size: 1rem; color: #fef08a;">計算例</h3>
        <ul>
          ${tool.examples.map((iso) => { const p = pillarOf(iso); return `<li>${ja(iso)}生まれ → <strong>${esc(p.pillar)}</strong>（${esc(p.reading)}・五行：${esc(p.element)}）</li>`; }).join('\n          ')}
        </ul>

        <h2 id="list" style="${h2}">60通りの日柱一覧</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead><tr><th style="text-align: left; padding: 0.4rem 0;">日柱</th><th style="text-align: left; padding: 0.4rem 0;">五行</th><th style="text-align: left; padding: 0.4rem 0;">特徴</th></tr></thead>
          <tbody>
            ${tool.pillars.map((p) => `<tr id="p${p.no}" style="border-top: 1px solid rgba(255,255,255,0.1);"><td style="padding: 0.4rem 0.5rem 0.4rem 0; white-space: nowrap;">${p.no}. ${esc(p.pillar)}（${esc(p.reading)}）</td><td style="padding: 0.4rem 0.5rem 0.4rem 0;">${esc(p.element)}</td><td style="padding: 0.4rem 0;">${p.kaigou ? '<strong>魁罡</strong>。' : ''}${esc(p.image)}。${esc(p.line)}</td></tr>`).join('\n            ')}
          </tbody>
        </table>

        <h2 style="${h2}">よくある質問</h2>
        ${tool.faq.map((f) => `<h3 style="font-size: 1rem; color: #fef08a;">${esc(f.q)}</h3>\n        <p>${esc(f.a)}</p>`).join('\n        ')}

        <h2 style="${h2}">関連する記事</h2>
        <ul>
          ${tool.related.map((r) => `<li><a href="${r.href}" style="color: #e2c074;">${esc(r.label)}</a></li>`).join('\n          ')}
        </ul>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold;">無料で相性を占う</a></p>
      </article>
    </div>
  `;
  writePage('tools/nicchu', tool.title, tool.description, tool.keywords, url, html, [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '日柱の調べ方', 'item': url }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': tool.faq.map((f) => ({ '@type': 'Question', 'name': f.q, 'acceptedAnswer': { '@type': 'Answer', 'text': f.a } }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': tool.h1,
      'url': url,
      'description': tool.description,
      'applicationCategory': 'LifestyleApplication',
      'operatingSystem': 'All',
      'inLanguage': 'ja',
      'isAccessibleForFree': true,
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'JPY' }
    }
  ]);
  console.log('✅ Pre-rendered /tools/nicchu');
}

// 5. /compatibility 16タイプ恋愛相性表（画面 ToolCompatView と同じ文面・同じ表。点数は鑑定と同じ MBTI_COMPAT_100）
console.log('🚀 Pre-rendering /compatibility (16タイプ恋愛相性表)...');
{
  const page = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/mbti-compat-page.json'), 'utf-8'));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const name = (t) => page.types[t];
  const types = MBTI_COMPAT_TYPES;
  const pairs = [];
  types.forEach((a, i) => { for (let j = i + 1; j < types.length; j++) pairs.push({ a, b: types[j], score: MBTI_COMPAT_100[i][j] }); });
  const top = pairs.sort((x, y) => y.score - x.score).slice(0, 10);
  const url = `${BASE_URL}/compatibility`;
  const h2 = 'font-size: 1.2rem; color: #e2c074; margin-top: 2rem;';
  const td = 'padding: 0.25rem; text-align: center; border: 1px solid rgba(255,255,255,0.1);';
  const html = `
    <div style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>16タイプ恋愛相性表</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #fef08a;">${esc(page.h1)}</h1>
        ${page.conclusion.map((t) => `<p><strong>${esc(t)}</strong></p>`).join('\n        ')}
        <h2 style="${h2}">点数が高い組み合わせ ベスト10</h2>
        <ol>
          ${top.map((p) => `<li>${p.a}（${esc(name(p.a))}）× ${p.b}（${esc(name(p.b))}）：${p.score}点</li>`).join('\n          ')}
        </ol>
        <p style="margin: 1.5rem 0;">16タイプだけでは分からない相性も、生年月日から見る四柱推命・九星気学と組み合わせて無料で鑑定できます。 <a href="/" style="color: #e2c074; font-weight: bold;">無料で相性を占う</a></p>
        <h2 id="table" style="${h2}">全256通りの相性表（0〜100点）</h2>
        <p>行があなた、列がお相手のタイプです（入れ替えても同じ点数）。</p>
        <div style="overflow-x: auto;">
        <table style="border-collapse: collapse; font-size: 0.75rem;">
          <thead><tr><th style="${td}">あなた＼お相手</th>${types.map((t) => `<th scope="col" style="${td}">${t}</th>`).join('')}</tr></thead>
          <tbody>
            ${types.map((r, i) => `<tr><th scope="row" style="${td}">${r}（${esc(name(r))}）</th>${MBTI_COMPAT_100[i].map((s) => `<td style="${td}">${s}</td>`).join('')}</tr>`).join('\n            ')}
          </tbody>
        </table>
        </div>
        <h2 style="${h2}">点数の決め方</h2>
        ${page.howTo.map((t) => `<p>${esc(t)}</p>`).join('\n        ')}
        ${page.notes.map((t) => `<p>${esc(t)}</p>`).join('\n        ')}
        <h2 style="${h2}">よくある質問</h2>
        ${page.faq.map((f) => `<h3 style="font-size: 1rem; color: #fef08a;">${esc(f.q)}</h3>\n        <p>${esc(f.a)}</p>`).join('\n        ')}
        <h2 style="${h2}">関連する記事</h2>
        <ul>
          ${page.related.map((r) => `<li><a href="${r.href}" style="color: #e2c074;">${esc(r.label)}</a></li>`).join('\n          ')}
        </ul>
        <p style="margin-top: 2rem;"><a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold;">無料で相性を占う</a></p>
      </article>
    </div>
  `;
  writePage('compatibility', page.title, page.description, page.keywords, url, html, [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '16タイプ恋愛相性表', 'item': url }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': page.faq.map((f) => ({ '@type': 'Question', 'name': f.q, 'acceptedAnswer': { '@type': 'Answer', 'text': f.a } }))
    }
  ]);
}

// The 256 /compatibility/[type1]-[type2] pages are no longer pre-rendered (thin, near-duplicate content).
// vercel.json rewrites them to the SPA, which reads the pair from the URL, and sends X-Robots-Tag: noindex.

// 6. Pre-render root homepage (dist/index.html) with semantic HTML and internal link network
console.log('🚀 Pre-rendering root homepage (dist/index.html)...');
const escHome = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const homeColumnCount = loadColumns().length;
const homeSemanticHtml = `
  <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
    <header style="text-align: center; margin-bottom: 2rem;">
      <p style="color: #e2c074; font-size: 0.85rem; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 0.5rem;">四柱推命 × 九星気学 × 16タイプ</p>
      <h1 style="font-size: 1.7rem; color: #fef08a; margin: 0 0 0.75rem 0; line-height: 1.35; font-weight: bold;">
        【公式】月と蓮｜生年月日と16タイプで占う恋愛相性診断（無料）
      </h1>
      <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; max-width: 580px; margin: 0 auto;">
        ${escHome(SERVICE.summary)}
      </p>
      <div style="margin-top: 1.5rem;">
        <a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.85rem 2.2rem; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.05rem; box-shadow: 0 4px 20px rgba(226,192,116,0.35);">
          今すぐ無料で恋愛相性を占う
        </a>
      </div>
    </header>

    <section style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(226,192,116,0.2); border-radius: 16px; padding: 1.25rem;">
      <h2 style="font-size: 1.15rem; color: #fef08a; margin-top: 0; margin-bottom: 0.5rem;">占いの仕組み</h2>
      <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: #cbd5e1; line-height: 1.8;">
        ${SERVICE.methods.map((m) => `<li><strong>${escHome(m.title)}</strong>：${escHome(m.body)}</li>`).join('')}
      </ul>
      <p style="font-size: 0.82rem; color: #cbd5e1; margin: 0.5rem 0 0;">${escHome(SERVICE.scoring[0])}</p>
      <p style="font-size: 0.8rem; margin: 0.75rem 0 0;"><a href="/about" style="color: #e2c074; text-decoration: underline;">仕組みと料金をくわしく見る →</a></p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.15rem; color: #e2c074; margin-bottom: 0.5rem;">料金</h2>
      <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0;">鑑定は無料・会員登録なしで使えます。${SERVICE.plans.map((pl) => `${escHome(pl.name)}は${escHome(pl.price)}`).join('、')}です。</p>
    </section>

    <!-- Column Quick Links -->
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.15rem; color: #e2c074; margin-bottom: 0.75rem; text-align: center;">恋愛コラム</h2>
      <p style="text-align: center; font-size: 0.85rem; color: #cbd5e1;">16タイプ・四柱推命・九星気学・LINE・復縁などの記事を公開しています。</p>
      <p style="text-align: center; margin-top: 0.5rem;">
        <a href="/column" style="font-size: 0.8rem; color: #e2c074; font-weight: bold; text-decoration: underline;">コラム一覧を見る（全${homeColumnCount}記事） →</a>
      </p>
    </section>

    <!-- Footer Links -->
    <footer style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; text-align: center; font-size: 0.75rem; color: #9ca3af;">
      <nav style="display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; justify-content: center; margin-bottom: 1rem;">
        <a href="/" style="color: #cbd5e1; text-decoration: none;">恋愛診断ホーム</a>
        <a href="/column" style="color: #cbd5e1; text-decoration: none;">開運コラム</a>
        <a href="/about" style="color: #cbd5e1; text-decoration: none;">月と蓮とは</a>
        <a href="/tools/nicchu" style="color: #cbd5e1; text-decoration: none;">日柱の調べ方</a>
        <a href="/compatibility" style="color: #cbd5e1; text-decoration: none;">16タイプ恋愛相性表</a>
        <a href="/terms" style="color: #9ca3af; text-decoration: none;">利用規約</a>
        <a href="/privacy" style="color: #9ca3af; text-decoration: none;">プライバシーポリシー</a>
        <a href="/tokushoho" style="color: #9ca3af; text-decoration: none;">特定商取引法に基づく表記</a>
        <a href="/company" style="color: #9ca3af; text-decoration: none;">運営会社</a>
      </nav>
      <p style="margin: 0; font-size: 0.7rem; color: #64748b;">© 2026 月と蓮（Tsuki to Ren） - Ill株式会社</p>
    </footer>
  </div>
`;

// Insert into dist/index.html
// トップだけ og:url を外す。og:url がトップ固定だと、Xは ?utm_… 付きのURLも同じページとみなし、
// 前に覚えた古いカード画像を出し続けるため（2026-11-02）。検索エンジン向けの canonical は残す。
// ほかのページ（コラム・SEOページ）は、このあと/これまでに各自の og:url を入れているので、そのまま。
const updatedIndexHtml = baseHtml
  .replace('<div id="root"></div>', `<div id="root">${homeSemanticHtml}</div>`)
  .replace(/\s*<meta property="og:url" content="[^"]*" \/>/i, '');
fs.writeFileSync(indexHtmlPath, updatedIndexHtml, 'utf-8');
console.log('✅ Pre-rendered root homepage: dist/index.html');
