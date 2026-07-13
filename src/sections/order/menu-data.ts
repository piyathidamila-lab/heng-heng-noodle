export type MenuCategoryValue = 'noodle' | 'side' | 'drink';

export type MenuItem = {
  id: string;
  category: MenuCategoryValue;
  name: string;
  description: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type MenuCategory = {
  value: MenuCategoryValue;
  label: string;
};

export const MENU_CATEGORIES: MenuCategory[] = [
  { value: 'noodle', label: 'ก๋วยเตี๋ยว' },
  { value: 'side', label: 'ของทานเล่น' },
  { value: 'drink', label: 'เครื่องดื่ม' },
];
