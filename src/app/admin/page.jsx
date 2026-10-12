"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Layers, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  ExternalLink,
  Lock,
  ArrowUpDown
} from "lucide-react";

export default function AdminDashboard() {
  // نظام الدخول السريع برمز سري
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [activeTab, setActiveTab] = useState("products"); // products | categories | orders
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة نموذج المنتج (إضافة / تعديل)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    subtitle: "",
    description: "",
    price: "",
    original_price: "",
    image: "",
    badge: "",
    category_id: "",
    sort_order: 1,
    is_bundle: false,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // حالة نموذج القسم
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    subtitle: "",
    icon: "✨",
    tag: "اكتشفي",
    sort_order: 1,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "2026") {
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("رمز الدخول غير صحيح");
    }
  };

  // جلب البيانات من Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      const { data: prods } = await supabase.from("products").select("*, categories(*)").order("sort_order", { ascending: true });
      const { data: ords } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

      setCategories(cats || []);
      setProducts(prods || []);
      setOrders(ords || []);
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // رفع الصورة إلى Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products-images")
        .getPublicUrl(filePath);

      setProductForm((prev) => ({ ...prev, image: publicUrl }));
    } catch (err) {
      alert("تعذر رفع الصورة. تأكد من إنشاء Bucket باسم products-images وجعله Public.");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  // حفظ المنتج (إضافة أو تحديث)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...productForm,
      id: productForm.id || `p-${Date.now()}`,
      price: Number(productForm.price),
      original_price: productForm.original_price ? Number(productForm.original_price) : null,
      sort_order: Number(productForm.sort_order),
    };

    const { error } = await supabase.from("products").upsert(payload);
    if (error) {
      alert("خطأ في حفظ المنتج: " + error.message);
    } else {
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("خطأ في الحذف: " + error.message);
    else fetchData();
  };

  // حفظ قسم جديد
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").upsert({
      ...categoryForm,
      sort_order: Number(categoryForm.sort_order)
    });
    if (error) alert("خطأ في حفظ القسم: " + error.message);
    else {
      setShowCategoryModal(false);
      fetchData();
    }
  };

  // تحديث حالة الطلب
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) alert("خطأ في تحديث الحالة");
    else fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDF7F3] flex items-center justify-center p-4" dir="rtl">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-[#EADFD5] shadow-lg max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 bg-[#E8F4ED] rounded-2xl flex items-center justify-center mx-auto text-[#2D6A4F]">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-black text-[#2E332F]">لوحة تحكم لكي ولأسرتك</h1>
          <p className="text-xs text-[#5C5652]">أدخل الرمز السري للوصول للوحة الإدارة</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="الرمز السري (الافتراضي 2026)"
            className="w-full px-4 py-3 border border-[#EADFD5] rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
          {pinError && <p className="text-xs text-red-600 font-bold">{pinError}</p>}
          <button type="submit" className="w-full py-3 bg-[#2D6A4F] text-white rounded-xl font-bold hover:bg-[#23533E] transition-all">
            دخول
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2E332F] pb-16" dir="rtl">
      {/* شريط الإدارة العلوي */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2D6A4F]">لوحة التحكم | Laky Store</h1>
          <p className="text-xs text-gray-500">إدارة المنتجات، الأقسام، وحركة الطلبات</p>
        </div>

        {/* أزرار التبويب */}
        <div className="flex gap-2 bg-[#F1F3F5] p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activeTab === "products" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600 hover:text-black"
            }`}
          >
            <Package size={16} />
            <span>المنتجات ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activeTab === "categories" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600 hover:text-black"
            }`}
          >
            <Layers size={16} />
            <span>الأقسام ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activeTab === "orders" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600 hover:text-black"
            }`}
          >
            <ShoppingBag size={16} />
            <span>الطلبات ({orders.length})</span>
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ==================== 1. إدارة المنتجات ==================== */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">قائمة المنتجات الحالية</h2>
                <p className="text-xs text-gray-500">تحكم بالأسعار، الصور، والترتيب داخل كل قسم</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    id: "",
                    name: "",
                    subtitle: "",
                    description: "",
                    price: "",
                    original_price: "",
                    image: "",
                    badge: "",
                    category_id: categories[0]?.id || "",
                    sort_order: products.length + 1,
                    is_bundle: false,
                  });
                  setShowProductModal(true);
                }}
                className="px-4 py-2.5 bg-[#2D6A4F] text-white rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#23533E] transition-all"
              >
                <Plus size={16} />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAFBFB] border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-3.5">الترتيب</th>
                    <th className="p-3.5">الصورة</th>
                    <th className="p-3.5">اسم المنتج</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">السعر الحالي</th>
                    <th className="p-3.5">السعر الأصلي</th>
                    <th className="p-3.5">شارة العرض</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3.5 font-bold text-gray-500">{p.sort_order}</td>
                      <td className="p-3.5">
                        <img src={p.image || "/favicon.ico"} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                      </td>
                      <td className="p-3.5">
                        <p className="font-black text-[#2E332F]">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.subtitle}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-[#2D6A4F]">
                        {p.categories?.name || p.category_id}
                      </td>
                      <td className="p-3.5 font-black text-emerald-700">{p.price} ج.م</td>
                      <td className="p-3.5 text-gray-400 line-through">{p.original_price ? `${p.original_price} ج.م` : "-"}</td>
                      <td className="p-3.5">
                        {p.badge && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">{p.badge}</span>}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm(p);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 2. إدارة الأقسام ==================== */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">أقسام المتجر</h2>
                <p className="text-xs text-gray-500">تحكم بأسماء الأقسام وترتيب ظهورها في الصفحة الرئيسية</p>
              </div>
              <button
                onClick={() => {
                  setCategoryForm({
                    id: "",
                    name: "",
                    subtitle: "",
                    icon: "✨",
                    tag: "اكتشفي",
                    sort_order: categories.length + 1,
                  });
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2.5 bg-[#2D6A4F] text-white rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{c.icon}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                      ترتيب #{c.sort_order}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-[#2E332F]">{c.name}</h3>
                  <p className="text-xs text-gray-400">{c.subtitle}</p>
                  <p className="text-[10px] text-gray-400">معرف الرابط: <code className="bg-gray-100 px-1 rounded">{c.id}</code></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 3. إدارة الطلبات ==================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black">سجل الطلبات الواردة</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAFBFB] border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">المحافظة / العنوان</th>
                    <th className="p-3.5">المنتجات المطلوبة</th>
                    <th className="p-3.5">الإجمالي</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-gray-400">لا توجد طلبات مسجلة بعد في قاعدة البيانات.</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="p-3.5 font-bold">{o.customer_name}</td>
                        <td className="p-3.5 font-mono">
                          <a
                            href={`https://wa.me/2${o.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                          >
                            <Phone size={13} />
                            <span>{o.phone}</span>
                          </a>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold">{o.city}</p>
                          <p className="text-[11px] text-gray-400">{o.address}</p>
                        </td>
                        <td className="p-3.5">
                          {Array.isArray(o.items) ? (
                            o.items.map((it, idx) => (
                              <p key={idx} className="text-[11px] text-gray-600">
                                • {it.name} ({it.quantity || 1})
                              </p>
                            ))
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 font-black text-emerald-700">{o.total_price} ج.م</td>
                        <td className="p-3.5">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          >
                            <option value="جديد">جديد</option>
                            <option value="تم التأكيد">تم التأكيد</option>
                            <option value="جاري الشحن">جاري الشحن</option>
                            <option value="تم التسليم">تم التسليم</option>
                            <option value="ملغي">ملغي</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* نافذة إضافة / تعديل منتج */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4" dir="rtl">
            <h3 className="text-base font-black text-[#2E332F]">
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">الوصف الفرعي (العنوان التوضيحي)</label>
                <input
                  type="text"
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">السعر النهائي (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">السعر قبل الخصم (ج.م)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">القسم</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">رقم الترتيب داخل القسم</label>
                  <input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(e) => setProductForm({ ...productForm, sort_order: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* رفع الصورة */}
              <div>
                <label className="font-bold text-gray-600 block mb-1">صورة المنتج</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="رابط الصورة أو ارفع ملف"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-xl text-left font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-xl font-bold flex items-center gap-1">
                    <Upload size={14} />
                    <span>{uploadingImage ? "جاري الرفع..." : "رفع"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">شارة ترويجية (Badge)</label>
                <input
                  type="text"
                  placeholder="مثال: الأكثر مبيعاً / وفر 100 ج.م"
                  value={productForm.badge}
                  onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">وصف المنتج الكامل</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D6A4F] text-white rounded-xl font-bold hover:bg-[#23533E]"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة قسم */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4" dir="rtl">
            <h3 className="text-base font-black">إضافة قسم جديد</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">معرف القسم بالإنجليزي (ID)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: perfumes"
                  value={categoryForm.id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">اسم القسم بالعربي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: العطور الفاخرة"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">الأيقونة (Emoji)</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">رقم الترتيب</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-center"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D6A4F] text-white rounded-xl font-bold hover:bg-[#23533E]"
                >
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
