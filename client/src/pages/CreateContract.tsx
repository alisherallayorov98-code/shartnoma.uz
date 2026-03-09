import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ContractType = "service" | "sale" | "rent" | "custom";
type CounterpartyType = "legal" | "yatt" | "individual";

interface FormData {
  type: ContractType;
  counterpartyType: CounterpartyType;
  contractNumber: string;
  date: string;
  counterpartyName: string;
  counterpartyStir: string;
  counterpartyDirector: string;
  counterpartyAddress: string;
  counterpartyBank: string;
  counterpartyMfo: string;
  counterpartyAccount: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  description: string;
  language: "uz" | "ru";
}

export default function CreateContract() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    type: "service",
    counterpartyType: "legal",
    contractNumber: "",
    date: new Date().toISOString().split("T")[0],
    counterpartyName: "",
    counterpartyStir: "",
    counterpartyDirector: "",
    counterpartyAddress: "",
    counterpartyBank: "",
    counterpartyMfo: "",
    counterpartyAccount: "",
    amount: "",
    currency: "UZS",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    description: "",
    language: language as "uz" | "ru",
  });

  const { data: counterparties } = trpc.counterparties.list.useQuery();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success(language === "uz" ? "Shartnoma yaratildi" : "Контракт создан");
      navigate("/dashboard/contracts");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCounterpartySelect = (id: number) => {
    const counterparty = counterparties?.find((c) => c.id === id);
    if (counterparty) {
      setFormData((prev) => ({
        ...prev,
        counterpartyName: counterparty.name,
        counterpartyStir: counterparty.stir || "",
        counterpartyDirector: counterparty.director || "",
        counterpartyAddress: counterparty.address || "",
        counterpartyBank: counterparty.bankName || "",
        counterpartyMfo: counterparty.mfo || "",
        counterpartyAccount: counterparty.account || "",
        counterpartyType: (counterparty.type as CounterpartyType) || "legal",
      }));
    }
  };

  const handleSubmit = () => {
    createMutation.mutate({
      type: formData.type,
      language: formData.language,
      contractNumber: formData.contractNumber,
      date: formData.date,
      counterpartyType: formData.counterpartyType,
      counterpartyName: formData.counterpartyName,
      counterpartyStir: formData.counterpartyStir,
      counterpartyDirector: formData.counterpartyDirector,
      counterpartyAddress: formData.counterpartyAddress,
      counterpartyBank: formData.counterpartyBank,
      counterpartyMfo: formData.counterpartyMfo,
      counterpartyAccount: formData.counterpartyAccount,
      amount: formData.amount,
      currency: formData.currency,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
    });
  };

  const steps = [
    { number: 1, label: language === "uz" ? "Turi" : "Тип" },
    { number: 2, label: language === "uz" ? "Kontragent" : "Контрагент" },
    { number: 3, label: language === "uz" ? "Shartlar" : "Условия" },
    { number: 4, label: language === "uz" ? "Ko'rish" : "Просмотр" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex flex-col items-center ${
                s.number <= step ? "opacity-100" : "opacity-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                  s.number < step
                    ? "bg-green-500 text-white"
                    : s.number === step
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {s.number < step ? "✓" : s.number}
              </div>
              <span className="text-xs text-center">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Steps */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1]?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Contract Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>{language === "uz" ? "Shartnoma turi" : "Тип контракта"}</Label>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { value: "service", labelUz: "Xizmat", labelRu: "Услуга" },
                    { value: "sale", labelUz: "Sotish", labelRu: "Продажа" },
                    { value: "rent", labelUz: "Ijara", labelRu: "Аренда" },
                    { value: "custom", labelUz: "Boshqa", labelRu: "Другое" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: type.value as ContractType,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === type.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {language === "uz" ? type.labelUz : type.labelRu}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{language === "uz" ? "Kontragent turi" : "Тип контрагента"}</Label>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { value: "legal", labelUz: "Yuridik", labelRu: "Юридическое" },
                    { value: "yatt", labelUz: "YATT", labelRu: "YATT" },
                    { value: "individual", labelUz: "Jismoniy", labelRu: "Физическое" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          counterpartyType: type.value as CounterpartyType,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.counterpartyType === type.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {language === "uz" ? type.labelUz : type.labelRu}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Counterparty Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>{language === "uz" ? "Kontragent tanlash" : "Выбор контрагента"}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCounterpartySelect(parseInt(e.target.value));
                    }
                  }}
                >
                  <option value="">
                    {language === "uz" ? "Tanlang..." : "Выберите..."}
                  </option>
                  {counterparties?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <Label>{language === "uz" ? "Kontragent ma'lumotlari" : "Информация контрагента"}</Label>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-sm">{language === "uz" ? "Nomi" : "Имя"}</Label>
                    <Input
                      name="counterpartyName"
                      value={formData.counterpartyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">STIR/JSHSHIR</Label>
                    <Input
                      name="counterpartyStir"
                      value={formData.counterpartyStir}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === "uz" ? "Direktori" : "Директор"}</Label>
                    <Input
                      name="counterpartyDirector"
                      value={formData.counterpartyDirector}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === "uz" ? "Manzil" : "Адрес"}</Label>
                    <Input
                      name="counterpartyAddress"
                      value={formData.counterpartyAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === "uz" ? "Bank" : "Банк"}</Label>
                    <Input
                      name="counterpartyBank"
                      value={formData.counterpartyBank}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">MFO</Label>
                    <Input
                      name="counterpartyMfo"
                      value={formData.counterpartyMfo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">{language === "uz" ? "Hisob raqami" : "Номер счета"}</Label>
                    <Input
                      name="counterpartyAccount"
                      value={formData.counterpartyAccount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contract Terms */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === "uz" ? "Shartnoma raqami" : "Номер контракта"}</Label>
                  <Input
                    name="contractNumber"
                    value={formData.contractNumber}
                    onChange={handleChange}
                    placeholder="001/2026"
                  />
                </div>
                <div>
                  <Label>{language === "uz" ? "Sana" : "Дата"}</Label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>{language === "uz" ? "Summa" : "Сумма"}</Label>
                  <Input
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label>{language === "uz" ? "Valyuta" : "Валюта"}</Label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
                <div>
                  <Label>{language === "uz" ? "Boshlanish sanasi" : "Дата начала"}</Label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>{language === "uz" ? "Tugash sanasi" : "Дата окончания"}</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <Label>{language === "uz" ? "Tavsifi" : "Описание"}</Label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder={language === "uz" ? "Shartnoma tavsifi" : "Описание контракта"}
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {language === "uz" ? "Shartnoma ko'rinishi" : "Предпросмотр контракта"}
                </h4>
                <pre className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-96 bg-white p-4 rounded border">
                  {`CONTRACT

Type: ${formData.type}
Date: ${formData.date}
Number: ${formData.contractNumber}

Counterparty:
${formData.counterpartyName}
STIR: ${formData.counterpartyStir}
Director: ${formData.counterpartyDirector}
Address: ${formData.counterpartyAddress}
Bank: ${formData.counterpartyBank}
MFO: ${formData.counterpartyMfo}
Account: ${formData.counterpartyAccount}

Terms:
Amount: ${formData.amount} ${formData.currency}
Start Date: ${formData.startDate}
End Date: ${formData.endDate}

Description:
${formData.description}`}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {language === "uz" ? "Orqaga" : "Назад"}
        </Button>

        {step === 4 ? (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending
              ? language === "uz"
                ? "Yaratilmoqda..."
                : "Создание..."
              : language === "uz"
              ? "Yaratish"
              : "Создать"}
          </Button>
        ) : (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setStep(Math.min(4, step + 1))}
          >
            {language === "uz" ? "Keyingi" : "Далее"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
