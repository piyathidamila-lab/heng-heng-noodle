export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
  isAvailable: boolean;
};
