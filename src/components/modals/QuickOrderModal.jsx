"use client";
import { useState } from "react";
import { useModal } from "@/hooks/useModal";
import { generateWhatsAppLink, formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { X, ShieldCheck, Truck, MessageCircle, AlertCircle, ShoppingBag, Sparkles } from "lucide-react";

export default function QuickOrderModal() {
  const { isOpen, modalType, selectedProduct, closeModal } = useModal();
  const [formData, setFormData] = useState({ fullName: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || modalType !== "order" || !selectedProduct) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg("");
  };

  const handleSubmitAndRedirect = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg("يرجى ملء الاسم ورقم الهاتف والعنوان لتجهيز شحنتك فوراً.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const addressParts = formData.address.split(/[-–,،]/);
    const detectedCity = addressParts.length > 1 ? addressParts[0].trim() : "مصر";

    // 1. تسجيل الطلب والانتظار حتى يؤكد Supabase استلام البيانات
    try {
      const { error } = await supabase.from("orders").insert([
        {
          customer_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          city: detectedCity || "مصر",
          address: formData.address.trim(),
          items: [
            {
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              quantity: 1,
              image: selectedProduct.image || "",
            },
          ],
          total_price: Number(selectedProduct.price),
          status: "جديد",
        },
      ]);

      if (error) {
        console.error("Supabase error:", error);
      }
    } catch (err) {
      console.error("Connection error:", err);
    }

    // 2. تجهيز الرابط والتحويل بعد ضمان انتهاء التسجيل
    const whatsAppUrl = generateWhatsAppLink({
      productName: selectedProduct.name,
      price: selectedProduct.price,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerAddress: formData.address,
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

        <div className="p-6 md:p-8 space-y-5">
          
          {/* بطاقة تعريف المنتج */}
          <div className="flex items-center gap-4 pb-4 border-b border-[#EADFD5]">
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
            
            <div className="space-y-1">
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
              
              <h3 className="text-base sm:text-lg font-black text-[#2E332F] leading-tight">
                {selectedProduct.name}
              </h3>
              
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-xl font-black text-[#2D6A4F]">{formatPrice(selectedProduct.price)}</span>
                {selectedProduct.originalPrice && (
                  <span className="text-xs text-stone-400 line-through font-bold">
                    {formatPrice(selectedProduct.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* شريط الثقة السريع */}
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

          {/* نموذج إدخال البيانات */}
          <form onSubmit={handleSubmitAndRedirect} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1">الاسم الكامل *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="اكتبي اسمك الثلاثي"
                className="w-full px-4 py-3 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] placeholder:text-[#A67C5B]/50 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
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
                className="w-full px-4 py-3 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] placeholder:text-[#A67C5B]/50 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E332F] mb-1">العنوان بالتفصيل *</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="المحافظة - المدينة - اسم الشارع ورقم العقار"
                className="w-full px-4 py-3 bg-white border border-[#EADFD5] rounded-xl text-sm text-[#2E332F] placeholder:text-[#A67C5B]/50 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#2D6A4F] to-[#3B7A5C] hover:from-[#23533E] hover:to-[#2D6A4F] text-white font-black rounded-2xl shadow-xl shadow-[#2D6A4F]/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm sm:text-base cursor-pointer disabled:opacity-50"
              >
                <MessageCircle size={20} className="stroke-[2.2]" />
                <span>{loading ? "جاري تجهيز وتأكيد طلبك..." : "تأكيد الطلب فوراً عبر واتساب"}</span>
              </button>
              
              <p className="text-[11px] text-center text-[#7A6B63] font-semibold mt-2.5 leading-relaxed">
                ⚡ بمجرد الضغط ستفتح معكِ محادثة واتساب رسمية ومجهزة بتفاصيل طلبك لبدء الشحن فوراً.
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
