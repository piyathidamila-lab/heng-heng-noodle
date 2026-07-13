import type { Metadata } from 'next';

import { Suspense } from 'react';

import { getPublicMenuItems } from 'src/lib/menu-service';

import { OrderView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'สั่งอาหาร | เฮงเฮง ก๋วยเตี๋ยว',
  description: 'สั่งอาหารออนไลน์จากเฮงเฮง ก๋วยเตี๋ยว บ้านขามเรียง มหาสารคาม',
};

export default async function Page() {
  const items = await getPublicMenuItems();

  return (
    <Suspense fallback={null}>
      <OrderView items={items} />
    </Suspense>
  );
}
