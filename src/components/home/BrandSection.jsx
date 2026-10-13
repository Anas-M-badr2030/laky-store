"use client";
import { useState } from "react";
import ProductCard from "./ProductCard";
import { ArrowLeft } from "lucide-react";

export default function BrandSection({ brand, title, subtitle, logoText, products = [], categories = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isRaihanna = brand === "raihanna";

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category_id === selectedCategory);

  return (
    <section className="py-6 sm:py-10 bg-[#FDF7F3]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        
        {/* بنر ريحانة مع زر تسوقي الآن */}
        {isRaihanna && (
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[#EADFD5] group">
            <img
              src="/images/raihanna-banner.png"
              alt="منتجات ريحانة Raihanna"
              className="w-full h-auto object-cover max-h-[280px] sm:max-h-[340px] transition-transform duration-500 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5">
              <a
                href="#products-list"
                className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-[#2D6A4F]/95 hover:bg-[#1B4332] text-white font-black text-xs sm:text-sm rounded-full backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>تسوقي الآن ✨</span>
                <ArrowLeft size={14} />
              </a>
            </div>
          </div>
        )}

        {/* شريط تبويبات الأقسام الفعالة فقط */}
        <div id="products-list" className="pt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25 scale-105"
                  : "bg-white text-gray-700 border border-[#EADFD5] hover:bg-emerald-50"
              }`}
            >
              جميع المنتجات ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              if (count === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25 scale-105"
                      : "bg-white text-gray-700 border border-[#EADFD5] hover:bg-emerald-50"
                  }`}
                >
                  <span>{cat.icon || "✨"}</span>
                  <span>{cat.name}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* كروت المنتجات */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#EADFD5]">
            <p className="text-sm font-bold text-gray-500">لا توجد منتجات معروضة في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
