import generatePayload from 'promptpay-qr';

import { getShopSettings } from './shop-settings-service';

// ----------------------------------------------------------------------

export class PromptPayNotConfiguredError extends Error {}

/**
 * PromptPay QR payload for the given amount, to render as a QR code.
 * Prefers the id set in admin → ข้อมูลร้านค้า, falling back to the
 * PROMPTPAY_ID environment variable if the store hasn't set one yet.
 */
export async function getPromptPayPayload(amount: number): Promise<string> {
  const settings = await getShopSettings();
  const promptPayId = settings.promptPayId || process.env.PROMPTPAY_ID;

  if (!promptPayId) {
    throw new PromptPayNotConfiguredError('PromptPay id is not configured.');
  }

  return generatePayload(promptPayId, { amount });
}
