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
        children: [
          {
            title: 'รายการเมนู',
            path: '/admin/menu',
          },
          {
            title: 'หมวดหมู่',
            path: '/admin/categories',
          },
          {
            title: 'เมนูขายดี',
            path: '/admin/best-sellers',
          },
          {
            title: 'ความอร่อยเลือกเอง',
            path: '/admin/custom-order',
          },
        ],
      },
      {
        title: 'จัดการออเดอร์',
        path: '/admin/orders',
        icon: <Iconify icon="solar:cart-3-bold" width={24} />,
        children: [
          {
            title: 'ออเดอร์ปัจจุบัน',
            path: '/admin/orders',
          },
          {
            title: 'ประวัติออเดอร์',
            path: '/admin/order-history',
          },
          {
            title: 'เช็คบิล',
            path: '/admin/bills',
          },
        ],
      },
      {
        title: 'จัดการร้านค้า',
        path: '/admin/tables',
        icon: <Iconify icon="solar:settings-bold" width={24} />,
        children: [
          {
            title: 'โต๊ะและ QR Code',
            path: '/admin/tables',
          },
          {
            title: 'สะสมดาว',
            path: '/admin/loyalty',
          },
          {
            title: 'ข้อมูลร้านค้า',
            path: '/admin/settings',
          },
          {
            title: 'จัดการผู้ใช้งาน',
            path: '/admin/users',
          },
        ],
      },
    ],
  },
];
