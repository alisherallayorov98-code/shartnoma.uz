import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

export default function AdminPanel() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {language === "uz" ? "Ruxsat yo'q" : "Доступ запрещен"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {language === "uz"
                    ? "Admin panel faqat administrator uchun mavjud"
                    : "Панель администратора доступна только администраторам"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate("/dashboard")}
                >
                  {language === "uz" ? "Dashboard ga qaytish" : "Вернуться на панель"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {language === "uz" ? "Admin Panel" : "Панель администратора"}
        </h1>
        <p className="text-gray-600 mt-2">
          {language === "uz"
            ? "Tizim boshqaruvi va monitoring"
            : "Управление системой и мониторинг"}
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Jami foydalanuvchilar" : "Всего пользователей"}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Jami shartномалар" : "Всего контрактов"}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Pro rejadagi" : "На Pro плане"}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Bloklangan" : "Заблокировано"}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Xabarlar" : "Объявления"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">
                {language === "uz"
                  ? "Yangi versiya chiqdi"
                  : "Вышла новая версия"}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {language === "uz"
                  ? "Shartnoma UZ Pro v2.0 yangi xususiyatlar bilan"
                  : "Shartnoma UZ Pro v2.0 с новыми функциями"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Tizim ma'lumotlari" : "Информация системы"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "uz" ? "Versiya" : "Версия"}
              </span>
              <span className="font-semibold text-gray-900">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "uz" ? "Status" : "Статус"}
              </span>
              <span className="font-semibold text-green-600">
                {language === "uz" ? "Faol" : "Активно"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "uz" ? "Tillar" : "Языки"}
              </span>
              <span className="font-semibold text-gray-900">
                {language === "uz" ? "O'zbek, Rus" : "Узбекский, Русский"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="pt-6">
          <p className="text-indigo-900">
            {language === "uz"
              ? "Admin panel hozircha cheklangan. Keyingi versiyada to'liq boshqaruv paneli qo'shiladi."
              : "Панель администратора ограничена. В следующей версии будет добавлена полная панель управления."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
