import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { FileText, BarChart3, Users, Shield, Zap, Globe } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();

  // Move navigation into useEffect to avoid setState during render
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading", language)}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Shartnoma UZ Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("uz")}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  language === "uz"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                O'z
              </button>
              <button
                onClick={() => setLanguage("ru")}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  language === "ru"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ру
              </button>
            </div>
            <a href={getLoginUrl()}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                {language === "uz" ? "Kirish" : "Вход"}
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {language === "uz"
                ? "Shartномалар bilan ishlashni osonlashtiring"
                : "Упростите работу с контрактами"}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {language === "uz"
                ? "Professional shartnoma boshqaruv tizimi. Shartномалар yaratish, PDF/Word generatsiyasi va boshqa xizmatlar."
                : "Профессиональная система управления контрактами. Создание контрактов, генерация PDF/Word и другие услуги."}
            </p>
            <div className="flex gap-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  {language === "uz" ? "Boshlash" : "Начать"}
                </Button>
              </a>
              <Button size="lg" variant="outline">
                {language === "uz" ? "Batafsil" : "Подробнее"}
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="space-y-4">
                <div className="h-3 bg-indigo-200 rounded w-3/4"></div>
                <div className="h-3 bg-indigo-100 rounded w-full"></div>
                <div className="h-3 bg-indigo-100 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            {language === "uz" ? "Asosiy xususiyatlar" : "Основные возможности"}
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                titleUz: "Shartnoma yaratish",
                titleRu: "Создание контрактов",
                descUz: "Multi-step forma orqali professional shartномалар yarating",
                descRu: "Создавайте профессиональные контракты через многошаговую форму",
              },
              {
                icon: BarChart3,
                titleUz: "Statistika va tahlil",
                titleRu: "Статистика и анализ",
                descUz: "Oylik tendensiyalar va shartnoma statistikasini ko'ring",
                descRu: "Просмотрите ежемесячные тренды и статистику контрактов",
              },
              {
                icon: Users,
                titleUz: "Kontragent boshqaruvi",
                titleRu: "Управление контрагентами",
                descUz: "Kontragentlar ma'lumotlarini saqlang va qayta ishlating",
                descRu: "Сохраняйте и переиспользуйте данные контрагентов",
              },
              {
                icon: Shield,
                titleUz: "Xavfsizlik",
                titleRu: "Безопасность",
                descUz: "Barcha ma'lumotlar shifrlangan va himoyalangan",
                descRu: "Все данные зашифрованы и защищены",
              },
              {
                icon: Zap,
                titleUz: "Tez va samarali",
                titleRu: "Быстро и эффективно",
                descUz: "Auto-save va instant sinkronizatsiya",
                descRu: "Автосохранение и мгновенная синхронизация",
              },
              {
                icon: Globe,
                titleUz: "Bilingual",
                titleRu: "Двуязычный",
                descUz: "O'zbek va Rus tillarida to'liq qo'llab-quvvatlash",
                descRu: "Полная поддержка узбекского и русского языков",
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                <feature.icon className="w-12 h-12 text-indigo-600 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === "uz" ? feature.titleUz : feature.titleRu}
                </h4>
                <p className="text-gray-600">
                  {language === "uz" ? feature.descUz : feature.descRu}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            {language === "uz"
              ? "Bugundan boshlang"
              : "Начните прямо сейчас"}
          </h3>
          <p className="text-indigo-100 mb-8 text-lg">
            {language === "uz"
              ? "Bepul ro'yxatdan o'ting va shartномалар bilan ishlashni boshlang"
              : "Зарегистрируйтесь бесплатно и начните работать с контрактами"}
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              {language === "uz" ? "Ro'yxatdan o'tish" : "Зарегистрироваться"}
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 Shartnoma UZ Pro. {language === "uz" ? "Barcha huquqlar himoyalangan." : "Все права защищены."}</p>
        </div>
      </footer>
    </div>
  );
}
