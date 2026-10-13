"use client";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  MessageCircle, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles
} from "lucide-react";

const SHIPPING_RATES = [
  { name: "الإسكندرية", cost: 75 },
  { name: "القاهرة", cost: 105 },
  { name: "الجيزة", cost: 105 },
  { name: "القليوبية", cost: 110 },
  { name: "الشرقية", cost: 110 },
  { name: "الغربية (طنطا والمحلة)", cost: 110 },
  { name: "الدقهلية (المنصورة)", cost: 110 },
  { name: "المنوفية", cost: 110 },
  { name: "كفر الشيخ", cost: 110 },
  { name: "البحيرة (دمنهور)", cost: 110 },
  { name: "دمياط", cost: 110 },
  { name: "بورسعيد", cost: 110 },
  { name: "الإسماعيلية", cost: 110 },
  { name: "السويس", cost: 110 },
  { name: "الفيوم", cost: 120 },
  { name: "بني سويف", cost: 120 },
  { name: "المنيا", cost: 120 },
  { name: "أسيوط", cost: 120 },
  { name: "سوهاج", cost: 120 },
  { name: "قنا", cost: 120 },
  { name: "الأقصر", cost: 125 },
  { name: "أسوان", cost: 125 },
  { name: "مطروح والساحل الشمالي", cost: 125 },
  { name: "شمال سيناء", cost: 125 },
  { name: "جنوب سيناء (شرم الشيخ / دهب)", cost: 125 },
  { name: "البحر الأحمر (الغردقة)", cost: 125 },
  { name: "الوادي الجديد", cost: 125 },
];

export default function CartDrawer() {
  const { 
    cartItems, 
    cartCount, 
    cartSubtotal, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "القاهرة",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isCartOpen) return null;

  const currentShipping = SHIPPING_RATES.find((item) => item.name === formData.city) || SHIPPING_RATES[1];
  const shippingCost = currentShipping.cost;
  const grandTotal = cartSubtotal + shippingCost;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg("يرجى إكمال جميع الخانات لتجهيز الطلب وشحنه.");
      return;
    }

    if (cartItems.length === 0) return;

    setLoading(true);
    setErrorMsg("");

    const fullAddress = `${formData.city} - ${formData.address.trim()}`;

    // 1. تسجيل الطلب المجمع في Supabase
    try {
      const { error } = await supabase.from("orders").insert([
        {
          customer_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          city: formData.city,
          address: formData.address.trim(),
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            image: item.image || "",
          })),
          total_price: grandTotal,
          status: "جديد",
        },
      ]);

      if (error) console.error("Supabase error:", error);
    } catch (err) {
      console.error("Connection error:", err);
    }

    // 2. صياغة رسالة واتساب مجمعة تشمل تفاصيل المنتجات كافة
    const itemsText = cartItems
      .map((item, idx) => `${idx + 1}. *${item.name}* (الكمية: ${item.quantity}) - ${item.price * item.quantity} ج.م`)
      .join("\n");

    const message = 
`السلام عليكم، أود تأكيد طلبي من متجر لكي ولأسرتك:

📦 *تفاصيل المنتجات:*
${itemsText}

💵 *مجموع المنتجات:* ${formatPrice(cartSubtotal)}
🚚 *مصاريف الشحن (${formData.city}):* ${shippingCost} ج.م
💰 *المبلغ الإجمالي عند الاستلام:* ${formatPrice(grandTotal)}

👤 *الاسم:* ${formData.fullName.trim()}
📱 *الهاتف:* ${formData.phone.trim()}
📍 *العنوان:* ${fullAddress}`;

    const whatsAppUrl = `https://wa.me/201027877028?text=${encodeURIComponent(message)}`;

    setLoading(false);
    clearCart();
    closeCart();
    window.location.href = whatsAppUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        
        {/* هيدر السلة */}
        <div className="p-4 sm:p-5 border-b border-[#EADFD5] flex items-center justify-between bg-[#FDF7F3]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F4ED] text-[#2D6A4F] flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#2E332F]">سلة المشتريات</h2>
              <p className="text-[11px] text-[#7A6B63]">{cartCount} منتجات في سلتك</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* محتوى السلة */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#2D6A4F] flex items-center justify-center mx-auto text-2xl">
                🛍️
              </div>
              <h3 className="font-black text-sm text-[#2E332F]">سلتك فارغة حالياً</h3>
              <p className="text-xs text-[#7A6B63] max-w-xs mx-auto">
                تصفحي منتجاتنا واختاري ما يناسب جمالك وعنايتك لإضافته هنا
              </p>
              <button
                onClick={closeCart}
                className="mt-3 px-6 py-2.5 bg-[#2D6A4F] text-white rounded-xl text-xs font-black hover:bg-[#23533E] transition-all cursor-pointer"
              >
                تصفحي المنتجات الآن
              </button>
            </div>
          ) : (
            <>
              {/* قائمة المنتجات */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[#EADFD5] bg-[#FAF6F3]/50 hover:bg-white transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white border border-[#EADFD5] overflow-hidden flex items-center justify-center shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🌿</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs text-[#2E332F] truncate">{item.name}</h4>
                      <p className="text-xs font-black text-[#2D6A4F] mt-0.5">{item.price} ج.م</p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#EADFD5] bg-white rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-gray-500 hover:text-black hover:bg-gray-50 rounded-r-lg cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-gray-500 hover:text-black hover:bg-gray-50 rounded-l-lg cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer mr-auto"
                          title="حذف من السلة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* نموذج إدخال بيانات التوصيل */}
              <div className="pt-2 border-t border-[#EADFD5]">
                <h3 className="font-black text-xs text-[#2E332F] mb-3 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#2D6A4F]" />
                  <span>بيانات استلام الشحنة</span>
                </h3>

                {errorMsg && (
                  <div className="p-2.5 mb-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2.5 text-xs">
                  <div>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="الاسم الكامل *"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-[#EADFD5] rounded-xl font-medium focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="رقم الهاتف للتأكيد والتوصيل *"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-[#EADFD5] rounded-xl font-medium focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>

                  <div>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-[#EADFD5] rounded-xl font-bold focus:outline-none focus:border-[#2D6A4F]"
                    >
                      {SHIPPING_RATES.map((rate) => (
                        <option key={rate.name} value={rate.name}>
                          {rate.name} — مصاريف الشحن: {rate.cost} ج.م
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="العنوان بالتفصيل (الشارع والعقار) *"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-[#EADFD5] rounded-xl font-medium focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ملخص الفاتورة وزر التأكيد */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#EADFD5] bg-[#FAF6F3] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>مجموع المنتجات:</span>
                <span className="font-bold text-gray-900">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>مصاريف الشحن ({formData.city}):</span>
                <span className="font-bold text-gray-900">{shippingCost} ج.م</span>
              </div>
              <div className="pt-2 border-t border-[#EADFD5] flex justify-between items-center text-sm font-black text-[#2D6A4F]">
                <span>المبلغ الإجمالي عند الاستلام:</span>
                <span className="text-base text-emerald-800">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2D6A4F] to-[#3B7A5C] hover:from-[#23533E] hover:to-[#2D6A4F] text-white font-black rounded-2xl shadow-lg shadow-[#2D6A4F]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm cursor-pointer disabled:opacity-50"
            >
              <MessageCircle size={18} />
              <span>{loading ? "جاري تسجيل طلبك..." : `تأكيد الطلب بمبلغ ${formatPrice(grandTotal)}`}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
          }
                    
