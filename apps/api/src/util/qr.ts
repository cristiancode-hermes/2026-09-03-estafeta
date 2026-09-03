import * as QRCode from 'qrcode';

export async function makeQr(url: string): Promise<{ qrSvg: string; qrUrl: string }> {
  const raw = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  });
  const withUrl = raw.includes(url)
    ? raw
    : raw.replace('<svg', `<svg data-session-url="${url}"`).replace('</svg>', `<desc>${url}</desc></svg>`);
  const tagged = withUrl.includes('data-session-url')
    ? withUrl
    : withUrl.replace('<svg', `<svg data-session-url="${url}"`);
  return { qrSvg: tagged, qrUrl: url };
}
