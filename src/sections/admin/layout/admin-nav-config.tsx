import type { IconifyName } from 'src/components/iconify';
import type { NavSectionProps } from 'src/components/nav-section';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const adminNavData: NavSectionProps['data'] = [
  {
    items: [
      {
        title: 'ภาพรวม',
        path: '/admin/overview',
        icon: <Iconify icon="solar:chart-square-outline" width={24} />,
      },
      {
        title: 'จัดการเมนู',
        path: '/admin/menu',
        icon: <Iconify icon="custom:fast-food-fill" width={24} />,
      },
      {
        title: 'จัดการหมวดหมู่',
        path: '/admin/categories',
        icon: <Iconify icon="solar:tag-horizontal-bold-duotone" width={24} />,
      },
      {
        title: 'เมนูขายดี',
        path: '/admin/best-sellers',
        icon: <Iconify icon={'solar:fire-bold' as IconifyName} width={24} />,
      },
      {
        title: 'ออเดอร์',
        path: '/admin/orders',
        icon: <Iconify icon="solar:cart-3-bold" width={24} />,
      },
      {
        title: 'โต๊ะ',
        path: '/admin/tables',
        icon: <Iconify icon={'solar:qr-code-bold' as IconifyName} width={24} />,
      },
      {
        title: 'ข้อมูลร้านค้า',
        path: '/admin/settings',
        icon: <Iconify icon="solar:settings-bold" width={24} />,
      },
    ],
  },
];
