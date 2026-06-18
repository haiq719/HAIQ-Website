import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

/**
 * Cart item shape:
 *
 * For single cookies (itemType: 'single'):
 *   { key, productId, variantId, name, subtitle, imageUrl,
 *     variantLabel, price, quantity, itemType: 'single', boxId: null }
 *
 * For a box (itemType: 'box'):
 *   { key, productId: null, variantId: null, name: 'Box Office',
 *     price: <total box price>, quantity: 1, itemType: 'box',
 *     boxId, boxContents: [{ name, quantity, productId, variantId }],
 *     boxProductId, boxVariantId }
 */

const parsePrice = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const STORAGE_KEY = 'haiq_cart_items';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (v) => typeof v === 'string' && UUID_RE.test(v);

const isValidCartItem = (item) => {
  if (item.itemType === 'box') {
    return isValidUUID(item.boxProductId) && isValidUUID(item.boxVariantId);
  }
  return isValidUUID(item.productId) && isValidUUID(item.variantId);
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Drop any items with invalid (non-UUID) IDs from old cart data
      return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [items]);

  const addItem = useCallback((product, variant, quantity = 1, options = {}) => {
    const { itemType = 'single' } = options;
    if (itemType === 'single') {
      const price = parsePrice(variant?.price ?? product?.base_price ?? 0);
      const key = `${product.id}-${variant.id}-single`;
      setItems(prev => {
        const existing = prev.find(i => i.key === key);
        if (existing) {
          return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i);
        }
        return [...prev, {
          key,
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          subtitle: product.subtitle || '',
          imageUrl: product.images?.[0]?.url || product.image_url || product.primary_image || null,
          variantLabel: variant.label || '4-Pack',
          price,
          quantity,
          itemType: 'single',
          boxId: null,
          boxContents: null,
        }];
      });
    }
  }, []);

  const addBox = useCallback((selections, boxPrice, boxProductId, boxVariantId) => {
    const boxId = `box-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const displayName = 'Box Office';
    const price = parsePrice(boxPrice);

    const boxContents = selections
      .filter(s => s.count > 0)
      .map(s => ({
        name: s.product.name,
        subtitle: s.product.subtitle || '',
        imageUrl: s.product.images?.[0]?.url || null,
        quantity: s.count,
        productId: s.product.id,
        variantId: s.variant?.id,
      }));

    setItems(prev => [...prev, {
      key: boxId,
      productId: null,
      variantId: null,
      name: displayName,
      subtitle: `Your Box · ${boxContents.map(c => `${c.quantity}× ${c.name}`).join(', ')}`,
      imageUrl: null,
      variantLabel: 'Box of 4',
      price,
      quantity: 1,
      itemType: 'box',
      boxId,
      boxContents,
      boxProductId,
      boxVariantId,
    }]);
  }, []);

  const removeItem = useCallback((item) => {
    setItems(prev => prev.filter(i => i.key !== item.key));
  }, []);

  const updateQty = useCallback((item, qty) => {
    if (item.itemType === 'box') return;
    if (qty < 1) setItems(prev => prev.filter(i => i.key !== item.key));
    else setItems(prev => prev.map(i => i.key === item.key ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const toOrderItems = () => {
    const result = [];
    items.forEach(item => {
      if (item.itemType === 'box' && item.boxProductId) {
        result.push({
          product_id: String(item.boxProductId),
          variant_id: String(item.boxVariantId),
          quantity: 1
        });
      } else if (item.productId && item.variantId) {
        result.push({
          product_id: String(item.productId),
          variant_id: String(item.variantId),
          quantity: item.quantity
        });
      }
    });
    return result;
  };

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      drawerOpen,
      addItem,
      addBox,
      removeItem,
      updateQty,
      clearCart,
      openDrawer,
      closeDrawer,
      toOrderItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}