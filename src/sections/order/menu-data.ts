export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
};

export type MenuCategory = {
  value: string;
  label: string;
};

export const MENU_CATEGORIES: MenuCategory[] = [
  { value: 'noodle', label: 'ก๋วยเตี๋ยว' },
  { value: 'side', label: 'ของทานเล่น' },
  { value: 'drink', label: 'เครื่องดื่ม' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'noodle-clear-pork',
    category: 'noodle',
    name: 'ก๋วยเตี๋ยวหมูน้ำใส',
    description: 'เส้นเลือกได้ ต้มน้ำซุปกระดูกหมู ใส่หมูสับและลูกชิ้น',
    price: 45,
    emoji: '🍜',
  },
  {
    id: 'noodle-tom-yum-pork',
    category: 'noodle',
    name: 'ก๋วยเตี๋ยวหมูน้ำตก',
    description: 'รสจัดจ้าน เปรี้ยวเผ็ดกำลังดี ใส่หมูและเครื่องในหมู',
    price: 50,
    emoji: '🍜',
  },
  {
    id: 'noodle-braised-pork',
    category: 'noodle',
    name: 'ก๋วยเตี๋ยวหมูตุ๋น',
    description: 'หมูตุ๋นเปื่อยนุ่ม น้ำซุปตุ๋นสมุนไพรหอมกลมกล่อม',
    price: 55,
    emoji: '🍲',
  },
  {
    id: 'yentafo',
    category: 'noodle',
    name: 'เย็นตาโฟ',
    description: 'น้ำยำสูตรเข้มข้น ใส่ลูกชิ้นปลา เต้าหู้ยี้ ปลาหมึก',
    price: 50,
    emoji: '🍥',
  },
  {
    id: 'noodle-stir-chicken',
    category: 'noodle',
    name: 'ก๋วยเตี๋ยวคั่วไก่',
    description: 'เส้นใหญ่คั่วแห้งกับไก่และไข่ หอมกระเทียมเจียว',
    price: 50,
    emoji: '🍝',
  },
  {
    id: 'ba-mee-red-pork',
    category: 'noodle',
    name: 'บะหมี่หมูแดงหมูกรอบ',
    description: 'บะหมี่เหนียวนุ่ม เสิร์ฟพร้อมหมูแดงและหมูกรอบ',
    price: 50,
    emoji: '🍜',
  },
  {
    id: 'gyoza-fried',
    category: 'side',
    name: 'เกี๊ยวซ่าทอด',
    description: 'เกี๊ยวซ่าทอดกรอบ เสิร์ฟพร้อมน้ำจิ้ม (5 ชิ้น)',
    price: 40,
    emoji: '🥟',
  },
  {
    id: 'spring-roll',
    category: 'side',
    name: 'ปอเปี๊ยะทอด',
    description: 'ปอเปี๊ยะทอดกรอบไส้แน่น เสิร์ฟพร้อมน้ำจิ้มบ๊วย',
    price: 35,
    emoji: '🥠',
  },
  {
    id: 'grilled-meatball',
    category: 'side',
    name: 'ลูกชิ้นปิ้ง',
    description: 'ลูกชิ้นหมูปิ้งเสียบไม้ 5 ไม้ เสิร์ฟพร้อมน้ำจิ้มแจ่ว',
    price: 30,
    emoji: '🍢',
  },
  {
    id: 'thai-iced-tea',
    category: 'drink',
    name: 'ชาไทย',
    description: 'ชาไทยหอมมัน เข้มข้น เสิร์ฟเย็นฉ่ำ',
    price: 25,
    emoji: '🧋',
  },
  {
    id: 'shaved-ice',
    category: 'drink',
    name: 'น้ำแข็งไส',
    description: 'น้ำแข็งไสเย็นชื่นใจ ราดน้ำหวานหลากรส',
    price: 20,
    emoji: '🍧',
  },
  {
    id: 'soft-drink',
    category: 'drink',
    name: 'น้ำอัดลม',
    description: 'โค้ก / สไปรท์ / แฟนต้า เย็นสดชื่น',
    price: 15,
    emoji: '🥤',
  },
  {
    id: 'drinking-water',
    category: 'drink',
    name: 'น้ำเปล่า',
    description: 'น้ำดื่มบรรจุขวด เย็นสดชื่น',
    price: 10,
    emoji: '💧',
  },
];
