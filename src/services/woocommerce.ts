import axios from 'axios';
import { Product, ProductCategory, Order, Cart } from '../types/product';

// Configuración de variables de entorno
const WC_API_BASE_URL = import.meta.env.VITE_WC_API_BASE_URL || 'https://shop.afpets.com/wp-json/wc/v3';
const WC_CONSUMER_KEY = import.meta.env.VITE_WC_CONSUMER_KEY || 'ck_72d9441104adb4f5fbfe9ae3cb2da5847b2bf5a3';
const WC_CONSUMER_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET || 'cs_1380cb1668ca1ca58ae9aa9fac6de571f1092e70';
// export const WP_AUTH_METHOD = ... (removed unused variable)

// Validar configuración
if (!WC_API_BASE_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
  // WooCommerce no configurado, funcionará con productos placeholder
}

// Configurar cliente axios
const wcApi = axios.create({
  baseURL: WC_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para autenticación
wcApi.interceptors.request.use((config) => {
  if (WC_CONSUMER_KEY && WC_CONSUMER_SECRET) {
    // Usar parámetros de query para autenticación (método recomendado para WooCommerce)
    config.params = {
      ...config.params,
      consumer_key: WC_CONSUMER_KEY,
      consumer_secret: WC_CONSUMER_SECRET,
    };
  }
  
  return config;
});

// Interceptor para respuestas
wcApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (err) => {
    // Error silencioso para evitar spam en consola
    return Promise.reject(err);
  }
);

export class WooCommerceAPI {
  // Método para probar la conexión
  static async testConnection(): Promise<boolean> {
    try {
      await wcApi.get('/products', { params: { per_page: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  // Productos
  static async getProducts(params?: {
    per_page?: number;
    page?: number;
    category?: string;
    featured?: boolean;
    search?: string;
  }): Promise<Product[]> {
    try {
      // Preparar parámetros de la consulta
      const queryParams: Record<string, unknown> = {
        per_page: params?.per_page || 12,
        page: params?.page || 1,
        status: 'publish',
        ...params
      };

      // Si hay categoría, buscar por slug
      if (params?.category) {
        // Primero obtener el ID de la categoría por slug
        const categories = await this.getCategories();
        const category = categories.find(cat => cat.slug === params.category);
        if (category) {
          queryParams.category = category.id;
        }
      }

      const response = await wcApi.get('/products', { params: queryParams });
      const products = response.data;
      
      return products;
    } catch (error) {
      return [];
    }
  }

  static async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await wcApi.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  static async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const response = await wcApi.get('/products', { 
        params: { 
          slug,
          per_page: 1,
          status: 'publish'
        } 
      });
      
      const product = response.data[0] || null;
      if (product) {
        return product;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Categorías
  static async getCategories(): Promise<ProductCategory[]> {
    try {
      const response = await wcApi.get('/products/categories', {
        params: {
          per_page: 100,
          hide_empty: true
        }
      });
      
      const categories = response.data;
      return categories;
    } catch (error) {
      return [];
    }
  }

  // Variaciones de producto
  static async getProductVariations(productId: number) {
    try {
      const response = await wcApi.get(`/products/${productId}/variations`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Órdenes
  static async createOrder(orderData: any): Promise<Order | null> {
    try {
      const response = await wcApi.post('/orders', orderData);
      return response.data;
    } catch (err: unknown) {
      console.error('Error creating WooCommerce order:', err);
      throw err;
    }
  }

  static async getOrder(id: number): Promise<Order | null> {
    try {
      const response = await wcApi.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Carrito (localStorage)
  static async updateCart(items: any[]): Promise<Cart> {
    try {
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
    } catch {
      return this.getCartFromStorage();
    }
  }

  static getCartFromStorage(): Cart {
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
    } catch {
      return {
        items: [],
        item_count: 0,
        total: 0,
        subtotal: 0,
        shipping_total: 0,
        tax_total: 0
      };
    }
  }
}

// Probar conexión al cargar el módulo
if (typeof window !== 'undefined' && WC_API_BASE_URL && WC_CONSUMER_KEY) {
  WooCommerceAPI.testConnection().then(success => {
    if (success) {
      console.log('✅ WooCommerce conectado');
    } else {
      console.log('⚠️ WooCommerce no disponible, usando productos placeholder');
    }
  });
}