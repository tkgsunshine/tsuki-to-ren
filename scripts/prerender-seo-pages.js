import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  const noscriptBlock = `
    <noscript>
      ${noscriptContent}
    </noscript>
  `;
  pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root"></div>\n${noscriptBlock}`);

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
          <p>本サービスが提供する鑑定結果・運勢予測・AIによるアドバイスは、エンターテインメント目的のコンテンツであり、科学的根拠に基づく保証をするものではありません。鑑定結果に基づく判断・行動はユーザー自身の責任において行ってください。</p>
          <h2 style="font-size: 1.1rem; color: #e2c074;">第5条（有料サブスクリプションサービス）</h2>
          <p>本サービスでは、月額500円（税込）等の有料サブスクリプション機能を提供しています。契約期間満了までに解約手続きが行われない場合、自動更新されます。デジタルコンテンツの特性上、決済完了後のキャンセル・返金には応じられません。いつでも解約可能です。</p>
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
          <h2 style="font-size: 1.1rem; color: #86efac;">4. データの安全管理</h2>
          <p>Google Firebaseの暗号化セキュアクラウド環境にて厳重に管理されます。</p>
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
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">運営責任者</th><td style="padding: 0.75rem 0;">山下 高志</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">所在地</th><td style="padding: 0.75rem 0;">東京都渋谷区代々木２丁目２４−８</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">電話番号</th><td style="padding: 0.75rem 0;">08053565283</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">お問い合わせ</th><td style="padding: 0.75rem 0;">support@tsuki-to-ren.com</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">販売価格</th><td style="padding: 0.75rem 0;">プレミアムプラン: 月額500円（税込）</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">商品の引き渡し</th><td style="padding: 0.75rem 0;">決済完了後、ただちにご利用可能</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">返品・解約</th><td style="padding: 0.75rem 0;">デジタルコンテンツの特性上、決済完了後の返金はできません。プラン解約は設定画面よりいつでも即時可能です。</td></tr>
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
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">代表取締役</th><td style="padding: 0.75rem 0;">山下 高志</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">設立</th><td style="padding: 0.75rem 0;">2022年6月1日</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">所在地</th><td style="padding: 0.75rem 0;">東京都渋谷区代々木２丁目２４−８</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><th style="text-align: left; padding: 0.75rem 0; color: #9ca3af;">電話番号</th><td style="padding: 0.75rem 0;">08053565283</td></tr>
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

// 8. /about
writePage(
  'about',
  '【全2.7億通り】四柱推命×九星気学×16タイプの精密ハイブリッド鑑定ロジック | 月と蓮',
  '東洋最高峰の四柱推命（日柱天干地支3,600通り）、九星気学（81通り）、西洋16タイプ心理学（289通り）、特殊星（9通り）等を融合した全273,088,320通り（約2.7億通り）の完全オーダーメイド鑑定ロジックを解説。',
  '月と蓮, 約2.7億通り, 四柱推命ロジック, 魁罡, 極星, 16タイプ 心理学, 九星気学',
  `${BASE_URL}/about`,
  `
    <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>占い解説</span>
      </nav>
      <article>
        <h1 style="font-size: 1.6rem; color: #fef08a; border-bottom: 1px solid rgba(226,192,116,0.3); padding-bottom: 0.5rem;">月と蓮の占術ロジック解説</h1>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.15rem; color: #e2c074;">全273,088,320通り（約2.7億通り）の算術マトリクス</h2>
          <p>四柱推命（日柱3,600通り）× 九星気学（81通り）× 西洋16タイプ理論（289通り）× 特殊星（9通り）× 性別・関係性（20通り）× 守護AI観点（2通り）＝ 全273,088,320通り（約2.7億通り）の多角アプローチを完全自動算出するオーダーメイド相性鑑定エンジンです。</p>
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
        { '@type': 'ListItem', 'position': 2, 'name': '占い解説', 'item': `${BASE_URL}/about` }
      ]
    }
  ]
);

console.log('✅ Pre-rendered Legal, Company, Result, Chat, Mypage & About pages successfully.');

// MBTI Types Data
const MBTI_TYPES = [
  { code: 'INFJ', name: '提唱者', tag: '理想主義・深い洞察', element: '内向的直観', loveStyle: '魂の深いつながりを重視し、時間をかけて本物の信頼を築く誠実な愛' },
  { code: 'INFP', name: '仲介者', tag: '純粋・深い共感', element: '内向的感情', loveStyle: '言葉のニュアンスや感受性を大切にし、ありのままを受け入れ合うロマンチックな愛' },
  { code: 'ENFJ', name: '主人公', tag: '情熱・献身リーダー', element: '外向的感情', loveStyle: 'パートナーを温かく導き、相手の幸せを自分の喜びにできる惜しみない愛' },
  { code: 'ENFP', name: '運動家', tag: '天真爛漫・ひらめき', element: '外向的直観', loveStyle: '自由とワクワクを共有し、お互いの可能性を無限に広げ合う情熱的な愛' },
  { code: 'INTJ', name: '建築家', tag: '戦略家・知性独立', element: '内向的直観', loveStyle: 'べたべたした依存を嫌い、知的な刺激と将来を見据えた確固たる大人の絆' },
  { code: 'INTP', name: '論理学者', tag: 'マイペース・探求者', element: '内向的思考', loveStyle: '自分の世界を尊重し合い、知的な対話で静かに心を通わせる穏やかな愛' },
  { code: 'ENTJ', name: '指揮官', tag: '決断力・カリスマ統率', element: '外向的思考', loveStyle: 'お互いを高め合える高みを目指し、誠実かつ堂々と未来を切り開くパートナーシップ' },
  { code: 'ENTP', name: '討論者', tag: '独創的・ユーモア', element: '外向的直観', loveStyle: '刺激的な会話と新しい挑戦で飽きさせず、お互いに自由を尊重し合うエキサイティングな恋' },
  { code: 'ISFJ', name: '擁護者', tag: '誠実・細やかな気配り', element: '内向的感覚', loveStyle: '相手の日常を献身的に支え、安心感と温もりに満ちた居心地の良い家庭的な愛' },
  { code: 'ISFP', name: '冒険家', tag: '自然体・美意識', element: '内向的感情', loveStyle: '押し付けを嫌い、言葉よりも肌感覚の一致と穏やかな時間を慈しむピュアな愛' },
  { code: 'ESFJ', name: '領事官', tag: '社交的・愛情豊か', element: '外向的感情', loveStyle: 'マメな連絡と周囲にも自慢できる温かな関係を大切にする安心のパートナーシップ' },
  { code: 'ESFP', name: 'エンターテイナー', tag: 'ポジティブ・瞬間燃焼', element: '外向的感覚', loveStyle: '今この瞬間を最高に楽しく過ごし、笑顔とスキンシップが絶えない明るい恋' },
  { code: 'ISTJ', name: '管理者', tag: '堅実・責任感抜群', element: '内向的感覚', loveStyle: '言葉よりも行動で示し、嘘をつかず約束を絶対に守る揺るぎない誠実な愛' },
  { code: 'ISTP', name: '巨匠', tag: 'クール・臨機応変', element: '内向的思考', loveStyle: '過度な干渉を嫌い、ピンチの時に静かに頼りになる自然体の距離感' },
  { code: 'ESTJ', name: '幹部', tag: '頼れるリーダー・秩序', element: '外向的思考', loveStyle: 'ストレートで分かりやすく、将来の人生設計をしっかりリードする心強い愛' },
  { code: 'ESTP', name: '起業家', tag: '行動派・スリル追求', element: '外向的感覚', loveStyle: 'スピード感あふれるアプローチと直球勝負で、ドラマチックに相手を惹きつける恋' }
];

// 5. Generate /compatibility Hub Page
console.log('🚀 Pre-rendering /compatibility Hub Page...');

const hubTitle = '【16タイプ相性診断】MBTI全256通り恋愛相性・トリセツまとめ | 月と蓮';
const hubDesc = '16タイプ（MBTI）全256通りの恋愛相性ランキング、惹かれ合う理由、すれ違いの防ぎ方、LINE吉時間を一覧網羅。四柱推命×16タイプであなたとお相手の真実の相性を完全鑑定。';
const hubCanonical = `${BASE_URL}/compatibility`;

let hubLinksHtml = `
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
`;

for (const t1 of MBTI_TYPES) {
  hubLinksHtml += `
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(226,192,116,0.2); border-radius: 12px; padding: 1rem;">
      <h3 style="color: #fef08a; font-size: 1rem; margin: 0 0 0.5rem;">${t1.code}（${t1.name}）の相性一覧</h3>
      <p style="font-size: 0.75rem; color: #9ca3af; margin: 0 0 0.75rem;">${t1.tag}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
  `;
  for (const t2 of MBTI_TYPES) {
    hubLinksHtml += `
      <a href="/compatibility/${t1.code.toLowerCase()}-${t2.code.toLowerCase()}" style="display: inline-block; font-size: 0.72rem; color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 3px 6px; border-radius: 4px; text-decoration: none;">
        ${t1.code}×${t2.code}
      </a>
    `;
  }
  hubLinksHtml += `
      </div>
    </div>
  `;
}
hubLinksHtml += `</div>`;

writePage(
  'compatibility',
  hubTitle,
  hubDesc,
  '16タイプ 相性, MBTI 相性, 16タイプ 恋愛, 相性ランキング, 四柱推命 16タイプ, 月と蓮',
  hubCanonical,
  `
    <div style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
      <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
        <a href="/" style="color: #e2c074;">ホーム</a> &gt; <span>16タイプ恋愛相性一覧</span>
      </nav>
      <header>
        <h1 style="font-size: 1.8rem; color: #fef08a; margin-bottom: 0.5rem;">16タイプ（MBTI）全256通り 恋愛相性・トリセツ完全一覧</h1>
        <p style="font-size: 0.9rem; color: #cbd5e1;">東洋の最高峰「四柱推命」と西洋の「16タイプ心理学」を融合させた精密相性診断。気になる組み合わせをクリックして、二人の相性スコアやLINE吉時間をチェックしてください。</p>
      </header>
      ${hubLinksHtml}
      <div style="text-align: center; margin-top: 3rem; padding: 2rem; background: rgba(226,192,116,0.06); border: 1px solid rgba(226,192,116,0.3); border-radius: 16px;">
        <h2 style="color: #fef08a; font-size: 1.3rem; margin-bottom: 0.5rem;">お二人の生年月日を入力して精密鑑定</h2>
        <p style="font-size: 0.85rem; color: #d1d5db; margin-bottom: 1.25rem;">16タイプだけでなく、生年月日から導く四柱推命の魂レベルの相性と、本日の返信率最大LINE吉時間もすべて無料で導き出します。</p>
        <a href="/" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.8rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1rem;">今すぐ無料で恋愛相性を占う</a>
      </div>
    </div>
  `,
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '16タイプ相性一覧', 'item': `${BASE_URL}/compatibility` }
      ]
    }
  ]
);

// 6. Generate All 256 /compatibility/[type1]-[type2] Pages
console.log('🚀 Pre-rendering 256 MBTI Combination Pages...');

let mbtiCount = 0;

for (const t1 of MBTI_TYPES) {
  for (const t2 of MBTI_TYPES) {
    const slug = `${t1.code.toLowerCase()}-${t2.code.toLowerCase()}`;
    const pairTitle = `【16タイプ相性】${t1.code}（${t1.name}）× ${t2.code}（${t2.name}）の恋愛相性・トリセツ | 月と蓮`;
    const pairDesc = `${t1.code}（${t1.name}）と${t2.code}（${t2.name}）の恋愛相性、惹かれ合う理由、すれ違いの防ぎ方、LINE返信率を高める吉時間を徹底分析。四柱推命×16タイプで二人の運命バイオリズムを無料鑑定。`;
    const pairKeywords = `${t1.code} ${t2.code} 相性, ${t1.code} ${t2.code} 恋愛, ${t1.code} ${t1.name}, ${t2.code} ${t2.name}, 16タイプ相性, LINE吉時間, 四柱推命相性, 月と蓮`;
    const pairCanonical = `${BASE_URL}/compatibility/${slug}`;

    // Dynamic relationship insight
    const isSameType = t1.code === t2.code;
    const isEIOpposite = t1.code[0] !== t2.code[0];
    const isNSopposite = t1.code[1] !== t2.code[1];
    const isTFOpposite = t1.code[2] !== t2.code[2];
    const isJPOpposite = t1.code[3] !== t2.code[3];

    let dynamicChemistry = '';
    let adviceText = '';
    let lineTip = '';

    if (isSameType) {
      dynamicChemistry = `同じ【${t1.code}】同士だからこそ、価値観や物事の捉え方が鏡のように一致し、言葉にしなくても相手の感情が手に取るように分かります。深い安心感と共感に包まれる理想的なパートナーシップを築けます。`;
      adviceText = `似た者同士ゆえに、悩みやネガティブな感情に陥った際にお互いに引きずられてしまうことがあります。どちらかが一歩引いて客観的な視点を持つこと、また外部の友人や新しい趣味を取り入れると関係が活性化します。`;
      lineTip = `共感性の高いメッセージや、お互いの共通の趣味に関する話題が最も効果的です。無理に駆け引きをせず、素直な気持ちを丁寧な言葉で伝えると即座に返信率が上がります。`;
    } else {
      dynamicChemistry = `【${t1.code}（${t1.name}）】の${t1.element}と、【${t2.code}（${t2.name}）】の${t2.element}が出会うことで、お互いに自分にはない視点や魅力に強く惹かれ合います。${isEIOpposite ? '内向と外向のバランスが良く、お互いの世界を広げ合える好相性です。' : 'テンポや波長が合いやすく、自然体で過ごせる心地よさがあります。'}`;
      adviceText = `${isTFOpposite ? '感情を重視する側と論理を重んじる側で、すれ違いが生じる場面があります。「正論」よりも「共感」を先に伝えることを意識しましょう。' : '似た価値判断の基準を持つため意思疎通はスムーズですが、細かな表現の違いに気を配ることでさらに親密度が増します。'}`;
      lineTip = `相手の生活リズムと16タイプの心理傾向に合わせた時間帯が吉です。${t2.code.includes('P') ? '相手は自由なペースを好むため、追撃LINEは避け、短くライトな質問を送るのが返信率アップの鍵です。' : '相手は計画性や誠実さを重視するため、丁寧な挨拶と明確な用件を添えると好感度が急上昇します。'}`;
    }

    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': '16タイプ相性一覧', 'item': `${BASE_URL}/compatibility` },
        { '@type': 'ListItem', 'position': 3, 'name': `${t1.code} × ${t2.code}`, 'item': pairCanonical }
      ]
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': `${t1.code}（${t1.name}）と${t2.code}（${t2.name}）の恋愛相性は良いですか？`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': dynamicChemistry
          }
        },
        {
          '@type': 'Question',
          'name': `${t1.code}から${t2.code}への効果的なLINEメッセージや接し方は？`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': lineTip
          }
        }
      ]
    };

    const noscriptContent = `
      <div style="max-width: 720px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205; line-height: 1.8;">
        <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
          <a href="/" style="color: #e2c074;">ホーム</a> &gt; <a href="/compatibility" style="color: #e2c074;">16タイプ相性一覧</a> &gt; <span>${t1.code} × ${t2.code}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <span style="font-size: 0.8rem; color: #e2c074; font-weight: bold; background: rgba(226,192,116,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(226,192,116,0.3);">
              16タイプ恋愛攻略マトリクス
            </span>
            <h1 style="font-size: 1.6rem; color: #fef08a; margin: 0.75rem 0 0.5rem; line-height: 1.4;">
              【16タイプ相性】${t1.code}（${t1.name}）× ${t2.code}（${t2.name}）の恋愛相性・トリセツ
            </h1>
            <p style="font-size: 0.85rem; color: #9ca3af; margin: 0;">
              あなた：${t1.code}（${t1.tag}） × お相手：${t2.code}（${t2.tag}）
            </p>
          </header>

          <section style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.15rem; color: #fef08a; margin-top: 0;">二人の相性と惹かれ合う理由</h2>
            <p style="font-size: 0.9rem; color: #e2e8f0; margin: 0;">${dynamicChemistry}</p>
          </section>

          <section style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.15rem; color: #fef08a; margin-top: 0;">すれ違いを防ぐコミュニケーションのコツ</h2>
            <p style="font-size: 0.9rem; color: #e2e8f0; margin: 0;">${adviceText}</p>
          </section>

          <section style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; margin-bottom: 2rem;">
            <h2 style="font-size: 1.15rem; color: #fef08a; margin-top: 0;">返信率を高めるLINEの送り方＆吉時間</h2>
            <p style="font-size: 0.9rem; color: #e2e8f0; margin: 0;">${lineTip}</p>
          </section>

          <!-- Interactive Diagnostic CTA -->
          <div style="text-align: center; padding: 2rem 1.25rem; background: linear-gradient(135deg, rgba(226,192,116,0.15) 0%, rgba(168,85,247,0.15) 100%); border: 1.5px solid rgba(226,192,116,0.4); border-radius: 18px; margin-top: 2rem;">
            <h3 style="color: #ffffff; font-size: 1.2rem; margin: 0 0 0.5rem;">二人の生年月日でさらに深層鑑定！</h3>
            <p style="font-size: 0.85rem; color: #e2e8f0; margin: 0 0 1.25rem; line-height: 1.6;">
              16タイプの性格傾向に加え、東洋最古の占術「四柱推命」で二人の魂の結びつきと今日のLINE吉時間を完全算出します。
            </p>
            <a href="/?mm=${t1.code}&om=${t2.code}" style="display: inline-block; background: linear-gradient(135deg, #fef08a 0%, #e2c074 100%); color: #000; padding: 0.85rem 2rem; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(226,192,116,0.4);">
              ${t1.code} × ${t2.code} の相性を生年月日で無料鑑定する
            </a>
          </div>

          <!-- Other Pairs Navigation -->
          <div style="margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
            <h4 style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 0.75rem;">${t1.code} の他の組み合わせを見る</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${MBTI_TYPES.map(o => `
                <a href="/compatibility/${t1.code.toLowerCase()}-${o.code.toLowerCase()}" style="font-size: 0.72rem; color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 3px 6px; border-radius: 4px; text-decoration: none;">
                  ${t1.code}×${o.code}
                </a>
              `).join('')}
            </div>
          </div>
        </article>
      </div>
    `;

    writePage(
      `compatibility/${slug}`,
      pairTitle,
      pairDesc,
      pairKeywords,
      pairCanonical,
      noscriptContent,
      [breadcrumbs, faqSchema]
    );

    mbtiCount++;
  }
}

console.log(`🎉 Successfully pre-rendered 4 legal pages + 1 hub page + ${mbtiCount} MBTI combination pages!`);
