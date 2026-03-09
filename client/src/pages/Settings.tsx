import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    stir: user?.stir || "",
    jshshir: user?.jshshir || "",
    bankName: user?.bankName || "",
    bankAccount: user?.bankAccount || "",
    mfo: user?.mfo || "",
    address: user?.address || "",
    director: user?.director || "",
    phone: user?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success(
      language === "uz"
        ? "Sozlamalar saqlandi"
        : "Настройки сохранены"
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Profil ma'lumotlari" : "Информация профиля"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === "uz" ? "Ism" : "Имя"}</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Kompaniya ma'lumotlari" : "Информация компании"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === "uz" ? "Kompaniya nomi" : "Название компании"}</Label>
              <Input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>STIR</Label>
              <Input
                name="stir"
                value={formData.stir}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>JSHSHIR</Label>
              <Input
                name="jshshir"
                value={formData.jshshir}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>{language === "uz" ? "Direktori" : "Директор"}</Label>
              <Input
                name="director"
                value={formData.director}
                onChange={handleChange}
              />
            </div>
            <div className="col-span-2">
              <Label>{language === "uz" ? "Manzil" : "Адрес"}</Label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>{language === "uz" ? "Telefon" : "Телефон"}</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Bank rekvizitleri" : "Банковские реквизиты"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === "uz" ? "Bank nomi" : "Название банка"}</Label>
              <Input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>MFO</Label>
              <Input
                name="mfo"
                value={formData.mfo}
                onChange={handleChange}
              />
            </div>
            <div className="col-span-2">
              <Label>{language === "uz" ? "Hisob raqami" : "Номер счета"}</Label>
              <Input
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Til sozlamalari" : "Языковые параметры"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === "uz" ? "Interfeys tili" : "Язык интерфейса"}</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={language === "uz" ? "default" : "outline"}
                onClick={() => setLanguage("uz")}
                className={language === "uz" ? "bg-indigo-600" : ""}
              >
                O'zbek
              </Button>
              <Button
                variant={language === "ru" ? "default" : "outline"}
                onClick={() => setLanguage("ru")}
                className={language === "ru" ? "bg-indigo-600" : ""}
              >
                Русский
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Reja ma'lumotlari" : "Информация о плане"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === "uz" ? "Joriy reja" : "Текущий план"}</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded">
                {user?.plan === "free"
                  ? language === "uz"
                    ? "Bepul"
                    : "Бесплатный"
                  : "Pro"}
              </div>
            </div>
            <div>
              <Label>{language === "uz" ? "Shartномалар cheklovisi" : "Лимит контрактов"}</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded">
                {user?.contractsUsed || 0} / {user?.contractsLimit || 10}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          {language === "uz" ? "Bekor qilish" : "Отмена"}
        </Button>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
        >
          {t("save", language)}
        </Button>
      </div>
    </div>
  );
}
