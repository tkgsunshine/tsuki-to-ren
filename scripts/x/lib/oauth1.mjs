import crypto from 'node:crypto';

const enc = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/** OAuth 1.0a (HMAC-SHA1) の署名。extraParams は署名対象に含めるクエリ/フォームパラメータ */
export function signOAuth1({ method, url, creds, extraParams = {}, nonce, timestamp }) {
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce || crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp || Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  const all = { ...extraParams, ...oauth };
  const paramString = Object.keys(all)
    .map((k) => [enc(k), enc(all[k])])
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const base = [method.toUpperCase(), enc(url), enc(paramString)].join('&');
  const key = `${enc(creds.apiSecret)}&${enc(creds.accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', key).update(base).digest('base64');
  return { ...oauth, oauth_signature: signature };
}

export function authHeader(oauthParams) {
  return (
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${enc(k)}="${enc(oauthParams[k])}"`)
      .join(', ')
  );
}
