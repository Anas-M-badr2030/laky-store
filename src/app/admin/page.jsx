"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Layers, 
  ShoppingBag, 
  Users,
  KeyRound,
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Phone, 
  Lock, 
  Mail, 
  LogOut, 
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminDashboard() {
  const [sessionUser, setSessionUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // تسجيل الدخول
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // تغيير كلمة المرور
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // التبويب النشط
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // استيراد CSV
  const [importingCSV, setImportingCSV] = useState(false);
  const csvFileInputRef = useRef(null);

  // نموذج المنتج
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
    is_active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // نموذج القسم
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    subtitle: "",
    icon: "✨",
    tag: "اكتشفي",
    sort_order: 1,
  });

  // فحص الصلاحيات
  const checkUserRole = async (user) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      } else if (user.email === "anasmustafabadr@gmail.com") {
        await supabase.from("admin_profiles").upsert({
          id: user.id,
          email: user.email,
          role: "super_admin",
        });
        setUserRole("super_admin");
      } else {
        setUserRole("orders_manager");
      }
    } catch {
      if (user.email === "anasmustafabadr@gmail.com") setUserRole("super_admin");
      else setUserRole("orders_manager");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setSessionUser(user);
      if (user) checkUserRole(user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setSessionUser(user);
      if (user) await checkUserRole(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setAuthLoading(false);
    } else {
      setSessionUser(data.user);
      await checkUserRole(data.user);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUserRole(null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "كلمة المرور يجب أن لا تقل عن 6 أحرف" });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMsg({ type: "", text: "" });

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ type: "error", text: "حدث خطأ: " + error.message });
    } else {
      setPasswordMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح!" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword("");
        setPasswordMsg({ type: "", text: "" });
      }, 1500);
    }
    setUpdatingPassword(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      const { data: prods } = await supabase.from("products").select("*, categories(*)").order("sort_order", { ascending: true });
      const { data: ords } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

      setCategories(cats || []);
      setProducts(prods || []);
      setOrders(ords || []);

      if (userRole === "super_admin") {
        const { data: team } = await supabase.from("admin_profiles").select("*").order("created_at", { ascending: false });
        setTeamMembers(team || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionUser && userRole) {
      fetchData();
      if (userRole === "orders_manager" && activeTab === "products") {
        setActiveTab("orders");
      }
    }
  }, [sessionUser, userRole]);

  // تبديل حالة الظهور للمنتج بزر العين
  const handleToggleVisibility = async (id, currentStatus) => {
    const nextStatus = !currentStatus;

    // تحديث فوري وسريع في الواجهة (Optimistic update)
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextStatus } : p))
    );

    const { error } = await supabase
      .from("products")
      .update({ is_active: nextStatus })
      .eq("id", id);

    if (error) {
      alert("تعذر تحديث حالة الظهور: " + error.message);
      fetchData();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("products-images").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("products-images").getPublicUrl(filePath);
      setProductForm((prev) => ({ ...prev, image: publicUrl }));
    } catch {
      alert("تعذر رفع الصورة. تأكد من تفعيل صلاحيات products-images في Storage.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      id: productForm.id || `p-${Date.now()}`,
      brand: "raihanna",
      name: productForm.name,
      subtitle: productForm.subtitle || "",
      description: productForm.description || "",
      price: Number(productForm.price),
      original_price: productForm.original_price ? Number(productForm.original_price) : null,
      image: productForm.image || "",
      badge: productForm.badge || "",
      category_id: productForm.category_id || (categories[0]?.id || null),
      sort_order: Number(productForm.sort_order) || 1,
      is_bundle: Boolean(productForm.is_bundle),
      is_active: productForm.is_active !== false,
    };

    const { error } = await supabase.from("products").upsert(payload);
    if (error) alert("تعذر حفظ المنتج: " + error.message);
    else {
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("خطأ في الحذف: " + error.message);
    else fetchData();
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").upsert({
      ...categoryForm,
      sort_order: Number(categoryForm.sort_order) || 1,
    });
    if (error) alert("خطأ في حفظ القسم: " + error.message);
    else {
      setShowCategoryModal(false);
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) alert("خطأ في تحديث الحالة");
    else fetchData();
  };

  const handleUpdateRole = async (memberId, newRole) => {
    const { error } = await supabase.from("admin_profiles").update({ role: newRole }).eq("id", memberId);
    if (error) alert("تعذر تحديث الصلاحية: " + error.message);
    else {
      alert("تم تحديث صلاحية العضو بنجاح");
      fetchData();
    }
  };

  const handleDownloadTemplate = () => {
    const defaultCat = categories[0]?.id || "hair-care";
    const csvHeader = "id,name,subtitle,description,price,original_price,image,badge,category_id,sort_order\n";
    const sampleRow1 = `,"سيروم ريحانة للتغذية","سيروم طبيعي للشعر","تركيبة متطورة من الزيوت الطبيعية",325,450,"","الأكثر مبيعاً",${defaultCat},1\n`;
    const sampleRow2 = `,"زيت المساج الفاخر","ترطيب عميق ونعومة","مستخلصات طبيعية منعشة",275,350,"","وفر 75 ج.م",${defaultCat},2\n`;
    
    const blob = new Blob(["\uFEFF" + csvHeader + sampleRow1 + sampleRow2], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "نموذج_استيراد_منتجات_ريحانة.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCSV(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") throw new Error("تعذر قراءة الملف");

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert("الملف فارغ أو لا يحتوي على أسطر منتجات.");
          setImportingCSV(false);
          return;
        }

        const parseLine = (line) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
        const importedPayload = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          if (values.length === 0 || values.every((v) => v === "")) continue;

          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, "").trim() : "";
          });

          const name = row.name || row["اسم المنتج"] || row["الاسم"];
          const rawPrice = row.price || row["السعر"];

          if (!name || !rawPrice) continue;

          importedPayload.push({
            id: row.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            brand: "raihanna",
            name: name,
            subtitle: row.subtitle || row["العنوان التوضيحي"] || "",
            description: row.description || row["الوصف"] || "",
            price: Number(rawPrice) || 0,
            original_price: row.original_price ? Number(row.original_price) : null,
            image: row.image || row["الصورة"] || row["رابط الصورة"] || "",
            badge: row.badge || row["الشارة"] || "",
            category_id: row.category_id || row["معرف القسم"] || (categories[0]?.id || null),
            sort_order: Number(row.sort_order || row["الترتيب"]) || i,
            is_bundle: false,
            is_active: true,
          });
        }

        if (importedPayload.length === 0) {
          alert("لم يتم العثور على منتجات صالحة في الملف.");
          setImportingCSV(false);
          return;
        }

        const { error } = await supabase.from("products").upsert(importedPayload);
        if (error) {
          alert("حدث خطأ أثناء حفظ المنتجات: " + error.message);
        } else {
          alert(`تم استيراد ${importedPayload.length} منتج بنجاح!`);
          fetchData();
        }
      } catch {
        alert("فشل فحص الملف. تأكد من صحة الصياغة.");
      } finally {
        setImportingCSV(false);
        if (csvFileInputRef.current) csvFileInputRef.current.value = "";
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#FDF7F3] flex items-center justify-center p-4" dir="rtl">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-[#EADFD5] shadow-xl max-w-sm w-full space-y-4">
          <div className="w-14 h-14 bg-[#E8F4ED] rounded-2xl flex items-center justify-center mx-auto text-[#2D6A4F]">
            <Lock size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-[#2E332F]">تسجيل دخول الإدارة</h1>
            <p className="text-xs text-[#5C5652] mt-1">الدخول مقتصر على المشرفين المصرح لهم فقط</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني (Gmail)</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
                <Mail size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
                <Lock size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          {authError && <p className="text-xs text-red-600 font-bold text-center">{authError}</p>}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-[#2D6A4F] text-white rounded-xl font-bold hover:bg-[#23533E] transition-all text-xs"
          >
            {authLoading ? "جاري التحقق..." : "دخول إلى لوحة التحكم"}
          </button>
        </form>
      </div>
    );
  }

  const isSuperAdmin = userRole === "super_admin";
  const canManageProducts = isSuperAdmin || userRole === "products_manager";
  const canManageOrders = isSuperAdmin || userRole === "orders_manager";

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2E332F] pb-16" dir="rtl">
      {/* شريط الإدارة العلوي */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-[#2D6A4F]">لوحة تحكم المتجر | Laky Store</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E8F4ED] text-[#2D6A4F] border border-[#2D6A4F]/20 flex items-center gap-1">
              <ShieldCheck size={12} />
              {isSuperAdmin ? "المدير العام" : userRole === "products_manager" ? "مسؤول منتجات" : "مسؤول طلبات"}
            </span>
          </div>
          <p className="text-xs text-gray-400">{sessionUser.email}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-[#F1F3F5] p-1 rounded-2xl text-xs">
            {canManageProducts && (
              <>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1 transition-all ${
                    activeTab === "products" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600"
                  }`}
                >
                  <Package size={14} />
                  <span>المنتجات ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("categories")}
                  className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1 transition-all ${
                    activeTab === "categories" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600"
                  }`}
                >
                  <Layers size={14} />
                  <span>الأقسام ({categories.length})</span>
                </button>
              </>
            )}

            {canManageOrders && (
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1 transition-all ${
                  activeTab === "orders" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600"
                }`}
              >
                <ShoppingBag size={14} />
                <span>الطلبات ({orders.length})</span>
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("team")}
                className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1 transition-all ${
                  activeTab === "team" ? "bg-white text-[#2D6A4F] shadow-xs" : "text-gray-600"
                }`}
              >
                <Users size={14} />
                <span>صلاحيات الفريق</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="p-2 text-gray-600 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-xl border border-gray-200"
            title="تغيير كلمة المرور"
          >
            <KeyRound size={17} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200"
            title="تسجيل الخروج"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* 1. المنتجات */}
        {activeTab === "products" && canManageProducts && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-black">إدارة منتجات ريحانة</h2>
                <p className="text-xs text-gray-500">اضغط على زر العين لإخفاء أي منتج عن زوار المتجر فوراً</p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="تحميل ملف CSV تجريبي"
                >
                  <Download size={15} />
                  <span>تحميل نموذج CSV</span>
                </button>

                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv, text/csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={importingCSV}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet size={15} />
                  <span>{importingCSV ? "جاري الاستيراد..." : "استيراد ملف CSV"}</span>
                </button>

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
                      is_active: true,
                    });
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#23533E] transition-all"
                >
                  <Plus size={16} />
                  <span>إضافة منتج</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAFBFB] border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-3.5">الترتيب</th>
                    <th className="p-3.5">الصورة</th>
                    <th className="p-3.5">اسم المنتج</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">السعر</th>
                    <th className="p-3.5">السعر الأصلي</th>
                    <th className="p-3.5">الشارة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const isVisible = p.is_active !== false;
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-gray-50 transition-colors ${!isVisible ? "bg-gray-50/70 opacity-60" : ""}`}
                      >
                        <td className="p-3.5 font-bold text-gray-500">#{p.sort_order}</td>
                        <td className="p-3.5">
                          <img src={p.image || "/favicon.ico"} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-[#2E332F]">{p.name}</p>
                            {!isVisible && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] font-bold">
                                مخفي عن الزوار
                              </span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-center gap-1.5">
                            {/* زر العين للتحكم في الإظهار والإخفاء */}
                            <button
                              onClick={() => handleToggleVisibility(p.id, isVisible)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isVisible 
                                  ? "text-emerald-700 hover:bg-emerald-50" 
                                  : "text-gray-400 hover:bg-gray-200"
                              }`}
                              title={isVisible ? "المنتج ظاهر (اضغط لإخفائه)" : "المنتج مخفي (اضغط لإظهاره)"}
                            >
                              {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>

                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm({
                                  id: p.id,
                                  name: p.name,
                                  subtitle: p.subtitle || "",
                                  description: p.description || "",
                                  price: p.price,
                                  original_price: p.original_price || "",
                                  image: p.image || "",
                                  badge: p.badge || "",
                                  category_id: p.category_id || "",
                                  sort_order: p.sort_order || 1,
                                  is_bundle: p.is_bundle || false,
                                  is_active: p.is_active !== false,
                                });
                                setShowProductModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="تعديل المنتج"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="حذف المنتج"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. الأقسام */}
        {activeTab === "categories" && canManageProducts && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">أقسام المتجر وترتيبها</h2>
                <p className="text-xs text-gray-500">تحكم بأسماء وترتيب ظهور الأقسام</p>
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
                className="px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-black flex items-center gap-1.5"
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. الطلبات */}
        {activeTab === "orders" && canManageOrders && (
          <div className="space-y-6">
            <h2 className="text-lg font-black">سجل الطلبات الواردة</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAFBFB] border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">المحافظة / العنوان</th>
                    <th className="p-3.5">المنتجات</th>
                    <th className="p-3.5">الإجمالي</th>
                    <th className="p-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-400">لا توجد طلبات مسجلة بعد.</td>
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

        {/* 4. صلاحيات الفريق */}
        {activeTab === "team" && isSuperAdmin && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black">أعضاء الإدارة وتوزيع الصلاحيات</h2>
              <p className="text-xs text-gray-500">تحديد مستوى وصول وصلاحيات كل عضو مسجل في النظام</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAFBFB] border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">الصلاحية الحالية</th>
                    <th className="p-3.5">تعديل الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="p-3.5 font-bold font-mono">
                        {member.email}
                        {member.email === "anasmustafabadr@gmail.com" && (
                          <span className="mr-2 px-2 py-0.5 bg-emerald-100 text-[#2D6A4F] rounded text-[10px]">المالك الرئيسي</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg font-bold">
                          {member.role === "super_admin" ? "مدير عام (كامل الصلاحيات)" :
                           member.role === "products_manager" ? "مسؤول منتجات وأقسام فقط" :
                           "مسؤول طلبات وشحن فقط"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {member.email === "anasmustafabadr@gmail.com" ? (
                          <span className="text-gray-400 text-[11px]">صلاحية ثابتة للمدير العام</span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                          >
                            <option value="super_admin">مدير عام (كامل الصلاحيات)</option>
                            <option value="products_manager">مسؤول منتجات وأقسام فقط</option>
                            <option value="orders_manager">مسؤول طلبات وشحن فقط</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* نافذة تغيير كلمة المرور */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4" dir="rtl">
            <div className="flex items-center gap-2 text-[#2D6A4F]">
              <KeyRound size={22} />
              <h3 className="text-base font-black text-[#2E332F]">تغيير كلمة المرور</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                required
                placeholder="كلمة المرور الجديدة (6 خانات فأكثر)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
              />

              {passwordMsg.text && (
                <p className={`text-xs font-bold ${passwordMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                  {passwordMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#23533E]"
                >
                  {updatingPassword ? "جاري التحديث..." : "حفظ كلمة المرور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <label className="font-bold text-gray-600 block mb-1">العنوان التوضيحي</label>
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
                  <label className="font-bold text-gray-600 block mb-1">الترتيب داخل القسم</label>
                  <input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(e) => setProductForm({ ...productForm, sort_order: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">صورة المنتج</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="رابط الصورة أو ارفع ملف من جهازك"
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
                <label className="font-bold text-gray-600 block mb-1">شارة العرض (Badge)</label>
                <input
                  type="text"
                  placeholder="مثال: الأكثر مبيعاً / وفر 100 ج.م"
                  value={productForm.badge}
                  onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">وصف المنتج</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* خيار تفعيل ظهور المنتج */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300 focus:ring-[#2D6A4F]"
                  />
                  <span className="font-bold text-gray-700">إظهار المنتج لزوار المتجر</span>
                </label>
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
                  حفظ التعديلات
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