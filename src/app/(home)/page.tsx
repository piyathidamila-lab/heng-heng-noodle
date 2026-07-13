import type { Metadata } from 'next';

import { OrderView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'สั่งอาหาร | เฮงเฮง ก๋วยเตี๋ยว',
  description: 'สั่งอาหารออนไลน์จากเฮงเฮง ก๋วยเตี๋ยว บ้านขามเรียง มหาสารคาม',
};

export default function Page() {
  return <OrderView />;
}
