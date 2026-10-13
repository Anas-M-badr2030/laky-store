import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import BrandSection from "@/components/home/BrandSection";
import QuizBanner from "@/components/home/QuizBanner";
import TrustBar from "@/components/home/TrustBar";
import QuickOrderModal from "@/components/modals/QuickOrderModal";
import QuizModal from "@/components/modals/QuizModal";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import { supabase } from "@/lib/supabase";

// تعطيل الكاش لضمان ظهور التعديلات والإخفاء فوراً للزوار
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // جلب الأقسام مرتبة
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  // جلب المنتجات المفعّلة فقط
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const raihannaProducts = (products || []).filter(
    (p) => !p.brand || p.brand === "raihanna"
  );

  return (
    <main className="min-h-screen flex flex-col bg-white relative">
      <Navbar />
      <HeroSection />
      <CategoryGrid />

      {/* قسم المنتجات مربوط ديناميكياً مع الأقسام وفلاتر التصفية */}
      <div id="products">
        <BrandSection
          brand="raihanna"
          logoText="Raihanna"
          title="منتجات ريحانة الطبيعية"
          subtitle="تركيبات عشبية نقية وعناية متكاملة لشعرك وبشرتك"
          products={raihannaProducts}
          categories={categories || []}
        />
      </div>

      <QuizBanner />
      <TrustBar />
      <Footer />
      <QuickOrderModal />
      <QuizModal />
      <FloatingWhatsApp />
    </main>
  );
}
