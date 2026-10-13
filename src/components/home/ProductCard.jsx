"use client";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Zap, Sparkles } from "lucide-react";

export default function ProductCard({ product }) {
  const { addToCart, openCart, openOrderModal } = useCart();
  const isCavillo = product.brand === "cavillo";
  const originalPrice = product.original_price || product.originalPrice;

  return (
    <div className="bg-white rounded-3xl border border-[#EADFD5]/90 p-3 sm:p-4 flex flex-col justify-between product-card-shadow relative group hover:border-[#9FC8A1] hover:shadow-xl transition-all duration-300">
      
      {/* شارة التميز */}
      {product.badge && (
        <span className="absolute top-2.5 right-2.5 z-10 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF7C] to-[#E6C99F] text-[#3D2916] shadow-xs flex items-center gap-1">
          <Sparkles size={10} className="text-[#3D2916]" />
          {product.badge}
        </span>
      )}

      {/* صورة المنتج */}
      <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-b from-[#FAF6F3] to-white border border-[#EADFD5] flex items-center justify-center overflow-hidden mb-3 group-hover:border-[#9FC8A1] transition-all">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center p-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-1 text-xl">
              🌿
            </div>
            <span className="text-[10px] text-[#2D6A4F] font-bold block line-clamp-1">ريحانة الطبيعية</span>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج والأسعار */}
      <div className="space-y-1 text-right mb-3">
        <h4 className="font-extrabold text-[#2E332F] text-xs sm:text-sm group-hover:text-[#2D6A4F] transition-colors leading-snug line-clamp-2 min-h-[2.3rem]">
          {product.name}
        </h4>
        <p className="text-[11px] text-[#7A6B63] line-clamp-1 font-medium">{product.subtitle || product.description}</p>
        
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-base sm:text-lg font-black text-[#2D6A4F]">{product.price} ج.م</span>
          {originalPrice && (
            <span className="text-[10px] sm:text-xs text-stone-400 line-through font-bold">
              {originalPrice} ج.م
            </span>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات المزدوجة */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {/* زر الإضافة للسلة مع فتح الدرج */}
        <button
          type="button"
          onClick={() => {
            addToCart(product);
            openCart();
          }}
          className="py-2.5 px-2 bg-gradient-to-r from-[#2D6A4F] to-[#3B7A5C] hover:from-[#23533E] hover:to-[#2D6A4F] text-white font-black rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-xs transition-all"
        >
          <ShoppingBag size={13} />
          <span>أضيفي للسلة</span>
        </button>

        {/* زر الطلب الفوري المنفرد */}
        <button
          type="button"
          onClick={() => openOrderModal(product)}
          className="py-2.5 px-2 bg-[#FAF4EE] hover:bg-[#F3E8DD] text-[#2D6A4F] border border-[#EADFD5] font-black rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer transition-all"
        >
          <Zap size={13} className="text-amber-600" />
          <span>طلب فوري</span>
        </button>
      </div>

    </div>
  );
}
