import { NextResponse } from 'next/server';

import { getShopSettings } from 'src/lib/shop-settings-service';

// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getShopSettings();

    return NextResponse.json(
      { name: settings.name, logoUrl: settings.logoUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { name: 'เฮงเฮง ก๋วยเตี๋ยว', logoUrl: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
