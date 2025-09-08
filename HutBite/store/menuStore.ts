import { create } from 'zustand';
import { IStoreProfile, MenuCategory, MenuGroup, IBaseProduct } from '@/types/store';
import { IToppingGroup } from '@/types/toppings';

interface MenuState {
  selectedStore: IStoreProfile | null;
  menuCategories: MenuCategory[];
  menuGroups: MenuGroup[];
  products: IBaseProduct[];
  toppings: IToppingGroup[];
  cart: IBaseProduct[];
  setSelectedStore: (store: IStoreProfile) => void;
  setMenuCategories: (categories: MenuCategory[]) => void;
  setMenuGroups: (groups: MenuGroup[]) => void;
  setProducts: (products: IBaseProduct[]) => void;
  setToppings: (toppings: IToppingGroup[]) => void;
  addToCart: (product: IBaseProduct) => void;
  removeFromCart: (productId: string) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  selectedStore: null,
  menuCategories: [],
  menuGroups: [],
  products: [],
  toppings: [],
  cart: [],
  setSelectedStore: (store) => set({ selectedStore: store }),
  setMenuCategories: (categories) => set({ menuCategories: categories }),
  setMenuGroups: (groups) => set({ menuGroups: groups }),
  setProducts: (products) => set({ products: products }),
  setToppings: (toppings) => set({ toppings: toppings }),
  addToCart: (product) => set((state) => ({ cart: [...state.cart, product] })),
  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((p) => p.ID !== productId) })),
}));
