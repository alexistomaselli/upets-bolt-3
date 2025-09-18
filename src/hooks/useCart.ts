import { useState, useEffect } from 'react';
import { Cart, CartItem, Product } from '../types/product';

// Estado global del carrito para reactividad
let globalCart: Cart = {
  items: [],
  item_count: 0,
  total: 0,
  subtotal: 0,
  shipping_total: 0,
  tax_total: 0
};

const cartListeners: Set<(cart: Cart) => void> = new Set();

const notifyCartChange = (newCart: Cart) => {
  globalCart = newCart;
  cartListeners.forEach(listener => listener(newCart));
};

export const useCart = () => {
  const [cart, setCart] = useState<Cart>(() => {
    const storedCart = getCartFromStorage();
    globalCart = storedCart;
    return storedCart;
  });

  useEffect(() => {
    // Suscribirse a cambios del carrito
    cartListeners.add(setCart);
    
    // Cleanup
    return () => {
      cartListeners.delete(setCart);
    };
  }, []);

  const addToCart = async (product: Product, quantity: number = 1, variation?: any) => {
    try {
      const currentCart = globalCart;
    const existingItemIndex = currentCart.items.findIndex(
      item => item.id === product.id && 
      JSON.stringify(item.variation) === JSON.stringify(variation)
    );

    let newItems = [...currentCart.items];

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex].quantity += quantity;
      newItems[existingItemIndex].line_total = 
        newItems[existingItemIndex].quantity * newItems[existingItemIndex].price;
    } else {
      const newItem: CartItem = {
        key: `${product.id}-${Date.now()}`,
        id: product.id,
        quantity,
        name: product.name,
        price: parseFloat(product.price),
        line_total: parseFloat(product.price) * quantity,
        variation,
        product_data: product,
      };
      newItems.push(newItem);
    }

      const updatedCart = await updateCartStorage(newItems);
    notifyCartChange(updatedCart);
    } catch (error) {
      // Error silencioso
    }
  };

  const removeFromCart = async (itemKey: string) => {
    try {
      const newItems = globalCart.items.filter(item => item.key !== itemKey);
      const updatedCart = await updateCartStorage(newItems);
    notifyCartChange(updatedCart);
    } catch (error) {
      // Error silencioso
    }
  };

  const updateQuantity = async (itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(itemKey);
    }

    const newItems = globalCart.items.map(item => {
      if (item.key === itemKey) {
        return {
          ...item,
          quantity,
          line_total: item.price * quantity,
        };
      }
      return item;
    });

    const updatedCart = await updateCartStorage(newItems);
    notifyCartChange(updatedCart);
  };

  const clearCart = async () => {
    const updatedCart = await updateCartStorage([]);
    notifyCartChange(updatedCart);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};

// Funciones auxiliares para el carrito
const updateCartStorage = async (items: any[]): Promise<Cart> => {
  const cart = {
    items: items,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    shipping_total: 0,
    tax_total: 0,
    total: 0
  };
  cart.total = cart.subtotal + cart.shipping_total + cart.tax_total;
  
  localStorage.setItem('afpets_cart', JSON.stringify(cart));
  return cart;
};

const getCartFromStorage = (): Cart => {
  try {
    const cartData = localStorage.getItem('afpets_cart');
    return cartData ? JSON.parse(cartData) : {
      items: [],
      item_count: 0,
      total: 0,
      subtotal: 0,
      shipping_total: 0,
      tax_total: 0
    };
  } catch (error) {
    console.error('Error getting cart from storage:', error);
    return {
      items: [],
      item_count: 0,
      total: 0,
      subtotal: 0,
      shipping_total: 0,
      tax_total: 0
    };
  }
};