import generatePayload from 'promptpay-qr';

// ----------------------------------------------------------------------

export class PromptPayNotConfiguredError extends Error {}

/** PromptPay QR payload for the given amount, to render as a QR code. */
export function getPromptPayPayload(amount: number): string {
  const promptPayId = process.env.PROMPTPAY_ID;

  if (!promptPayId) {
    throw new PromptPayNotConfiguredError('Missing PROMPTPAY_ID environment variable.');
  }

  return generatePayload(promptPayId, { amount });
}
