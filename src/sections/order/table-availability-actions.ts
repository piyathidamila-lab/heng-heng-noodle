'use server';

import type { RestaurantTableAvailability } from 'src/lib/table-service';

import { getTableAvailability } from 'src/lib/table-service';

// ----------------------------------------------------------------------

/** Public action that returns status only; no session, order, or customer data. */
export async function listTableAvailability(): Promise<RestaurantTableAvailability[]> {
  return getTableAvailability();
}
