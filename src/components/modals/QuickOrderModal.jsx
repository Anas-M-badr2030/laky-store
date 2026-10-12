"use client";
import { useState } from "react";
import { useModal } from "@/hooks/useModal";
import { generateWhatsAppLink, formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { X, ShieldCheck, Truck, MessageCircle, AlertCircle, ShoppingBag, Sparkles, MapPin } from "lucide-react";

// جدول أسعار الشحن بعد إضافة الـ 5 ج.م الإضافية
const SHIPPING_RATES = [
  { name: "الإسكندرية", cost: 75, group: "alex" },
  { name: "القاهرة", cost: 105, group: "cairo" },
  { name: "الجيزة", cost: 105, group: "cairo" },
  { name: "القليوبية", cost: 110, group: "delta" },
  { name: "الشرقية", cost: 110, group: "delta" },
  { name: "الغربية (طنطا والمحلة)", cost: 110, group: "delta" },
  { name: "الدقهلية (المنصورة)", cost: 110, group: "delta" },
  { name: "المنوفية", cost: 110, group: "delta" },
  { name: "كفر الشيخ", cost: 110, group: "delta" },
  { name: "البحيرة (دمنهور)", cost: 110, group: "delta" },
  { name: "دمياط", cost: 110, group: "delta" },
  { name: "بورسعيد", cost: 110, group: "delta" },
  { name: "الإسماعيلية", cost: 110, group: "delta" },
  { name: "السويس", cost: 110, group: "delta" },
  { name: "الفيوم", cost: 120, group: "upper" },
  { name: "بني سويف", cost: 120, group: "upper" },
  { name: "المنيا", cost: 120, group: "upper" },
  { name: "أسيوط", cost: 120, group: "upper" },
  { name: "سوهاج", cost: 120, group: "upper" },
  { name: "قنا", cost: 120, group: "upper" },
  { name: "الأقصر", cost: 125, group: "remote" },
  { name: "أسوان", cost: 125, group: "remote" },
  { name: "مطروح والساحل الشمالي", cost: 125, group: "remote" },
  { name: "شمال سيناء", cost: 125, group: "remote" },
  { name: "جنوب سيناء (شرم الشيخ / دهب)", cost: 125, group: "remote" },
  { name: "البحر الأحمر (الغردقة)", cost: 125, group: "remote" },
  { name: "الوادي الجديد", cost: 125, group: "remote" },
];

export default function QuickOrderModal() {
  const { isOpen, modalType, selectedProduct, closeModal } = useModal();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "القاهرة",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || modalType !== "order" || !selectedProduct) return null;

  // استخراج سعر شحن المحافظة المختارة
  const currentShipping = SHIPPING_RATES.find((item) => item.name === formData.city) || SHIPPING_RATES[1];
  const shippingCost = currentShipping.cost;
  const productPrice = Number(selectedProduct.price);
  const totalPrice = productPrice + shippingCost;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
  };

  const handleSubmitAndRedirect = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg("يرجى ملء جميع الحانات المطلوبة لتجهيز شحنتك فوراً.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const fullAddress = `${formData.city} - ${formData.address.trim()}`;

    // 1. تسجيل الطلب في Supabase بالإجمالي شاملاً الشحن
    try {
      const { error } = await supabase.from("orders").insert([
        {
          customer_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          city: formData.city,
          address: formData.address.trim(),
          items: [
            {
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: productPrice,
              shipping_cost: shippingCost,
              quantity: 1,
              image: selectedProduct.image || "",
            },
          ],
          total_price: totalPrice,
          status: "جديد",
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    } catch (err) {
      console.error("Connection error:", err);
    }

    // 2. توجيه العميل لواتساب برسالة مجهزة شاملة الشحن والإجمالي
    const whatsAppUrl = generateWhatsAppLink({
      productName: `${selectedProduct.name} (سعر المنتج: ${productPrice} ج.م + مصاريف الشحن: ${shippingCost} ج.م)`,
      price: totalPrice,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerAddress: fullAddress,
    });

    setLoading(false);
    closeModal();
    window.location.href = whatsAppUrl;
  };

  const isCavillo = selectedProduct.brand === "cavillo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#FAF6F3] to-white rounded-3xl shadow-2xl overflow-hidden border border-[#EADFD5] max-h-[92vh] overflow-y-auto">
        
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-4 left-4 p-2 text-[#4B4B4B] hover:text-[#2E332F] hover:bg-white bg-[#EADFD5]/70 rounded-full transition-colors z-10 cursor-pointer shadow-2xs"
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-8 space-y-4">
          
          {/* بطاقة تعريف المنتج */}
          <div className="flex items-center gap-4 pb-3 border-b border-[#EADFD5]">
            <div className="w-16 h-16 bg-white rounded-2xl p-1.5 border border-[#EADFD5] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <ShoppingBag className={isCavillo ? "text-[#8B4D43]" : "text-[#2D6A4F]"} size={26} />
              )}
            </div>
            
            <div className="space-y-0.5">
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs ${
                  isCavillo
                    ? "bg-gradient-to-r from-[#8B4D43] to-[#A35E53] text-white"
                    : "bg-gradient-to-r from-[#2D6A4F] to-[#407B5E] text-white"
                }`}
              >
                <Sparkles size={11} />
                {isCavillo ? "كافيلو Cavillo" : "ريحانة Raihanna"}
              </span>
              
              <h3 className="text-sm sm:text-base font-black text-[#2E332F] leading-tight">
                {selectedProduct.name}
              </h3>
              
              <div className="text-xs font-bold text-[#2D6A4F]">
                سعر العرض: {formatPrice(productPrice)}
              </div>
            </div>
          </div>

          {/* شريط الضمان */}
          <div className="bg-[#E8F4ED] border border-[#9FC8A1]/60 p-2.5 rounded-2xl flex items-center justify-between text-xs text-[#224A32] font-black">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#2D6A4F]" /> أصلي ومضمون 100%
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={16} className="text-[#2D6A4F]" /> دفع عند الاستلام والمعاينة
            </span>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* نموذج البيانات */}
          <form onSubmit={handleSubmitAndRedirect} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1">الاسم الكامل *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="اكتبي اسمك الثلاثي"
                className="w-full px-4 py-2.5 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1">رقم الهاتف (للتوصيل والتأكيد) *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="010XXXXXXXX"
                className="w-full px-4 py-2.5 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              />
            </div>

            {/* قائمة اختيار المحافظة مع عرض الشحن المباشر */}
            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1 flex items-center gap-1">
                <MapPin size={14} className="text-[#2D6A4F]" />
                <span>المحافظة ومصاريف الشحن *</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-[#EADFD5] rounded-xl text-xs sm:text-sm font-bold text-[#2E332F] focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              >
                {SHIPPING_RATES.map((rate) => (
                  <option key={rate.name} value={rate.name}>
                    {rate.name} — مصاريف الشحن: {rate.cost} ج.م
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1">العنوان بالتفصيل *</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="المنطقة - اسم الشارع ورقم العقار / علامة مميزة"
                className="w-full px-4 py-2.5 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              />
            </div>

            {/* ملخص الفاتورة الشامل */}
            <div className="bg-[#FAF4EE] p-3.5 rounded-2xl border border-[#EADFD5] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5C5652]">
                <span>سعر المنتج:</span>
                <span className="font-bold text-[#2E332F]">{formatPrice(productPrice)}</span>
              </div>
              <div className="flex justify-between text-[#5C5652]">
                <span>مصاريف الشحن ({formData.city}):</span>
                <span className="font-bold text-[#2E332F]">{shippingCost} ج.م</span>
              </div>
              <div className="pt-2 border-t border-[#E2D5C8] flex justify-between items-center font-black text-sm text-[#2D6A4F]">
                <span>المبلغ الإجمالي عند الاستلام:</span>
                <span className="text-base text-emerald-800">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#2D6A4F] to-[#3B7A5C] hover:from-[#23533E] hover:to-[#2D6A4F] text-white font-black rounded-2xl shadow-xl shadow-[#2D6A4F]/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base cursor-pointer disabled:opacity-50"
              >
                <MessageCircle size={18} className="stroke-[2.2]" />
                <span>{loading ? "جاري تجهيز وتأكيد طلبك..." : `تأكيد الطلب بمبلغ ${formatPrice(totalPrice)}`}</span>
              </button>
              
              <p className="text-[11px] text-center text-[#7A6B63] font-semibold mt-2 leading-relaxed">
                ⚡ بمجرد الضغط ستفتح معكِ محادثة واتساب لتأكيد شحن طلبك إلى {formData.city}.
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
