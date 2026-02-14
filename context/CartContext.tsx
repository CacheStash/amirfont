import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  cartId: string; // ID unik untuk setiap baris di keranjang
  fontId: string;
  name: string;
  price: number;
  tier: string;
  usages: string[];
  webTierLabel?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  cartCount: number;
  // Modal Control
  isModalOpen: boolean;
  selectedFont: any | null;
  openConfigurator: (font: any) => void;
  closeConfigurator: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState<any>(null);

  const openConfigurator = (font: any) => {
    setSelectedFont(font);
    setIsModalOpen(true);
  };

  const closeConfigurator = () => {
    setIsModalOpen(false);
    setSelectedFont(null);
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    closeConfigurator();
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter(item => item.cartId !== cartId));
  };

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, cartCount: cart.length, 
      isModalOpen, selectedFont, openConfigurator, closeConfigurator 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};