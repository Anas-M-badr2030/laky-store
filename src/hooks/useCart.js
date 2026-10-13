"use client";
import { useState, useEffect, createContext, useContext } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'order' | 'quiz' | null
  const [selectedProduct, setSelectedProduct] = useState(null);

  // استرجاع السلة من التخزين المحلي عند فتح الصفحة
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("laky_cart");
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch {
      // تجاهل الخطأ في بيئة السيرفر
    }
  }, []);

  // حفظ التعديلات في السلة
  useEffect(() => {
    try {
      localStorage.setItem("laky_cart", JSON.stringify(cartItems));
    } catch {
      // تجاهل الخطأ
    }
  }, [cartItems]);

  // إضافة منتج للسلة (أو زيادة كميته إذا كان موجوداً)
  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          subtitle: product.subtitle || "",
          price: Number(product.price),
          original_price: product.original_price || product.originalPrice || null,
          image: product.image || "",
          brand: product.brand || "raihanna",
          quantity,
        },
      ];
    });
  };

  // تعديل كمية منتج
  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // حذف منتج من السلة
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  // إفراغ السلة بالكامل
  const clearCart = () => {
    setCartItems([]);
  };

  // فتح وإغلاق السلة
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // التحكم في النوافذ المنبثقة للطلب السريع والاختبار
  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setActiveModal("order");
  };

  const openQuizModal = () => {
    setActiveModal("quiz");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedProduct(null);
  };

  // حساب إجمالي عدد القطع وقيمتها المالية
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        activeModal,
        selectedProduct,
        openOrderModal,
        openQuizModal,
        closeModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
        }
        
