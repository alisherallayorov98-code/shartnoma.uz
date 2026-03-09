import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, Download, Trash2 } from "lucide-react";

export default function Contracts() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "ready" | "cancelled">("all");

  const { data: contracts, isLoading } = trpc.contracts.list.useQuery({ limit: 100 });

  // Filter contracts
  const filteredContracts = contracts?.filter((c) => {
    const matchesSearch =
      c.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("contracts", language)}
        </h1>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => navigate("/dashboard/contracts/new")}
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === "uz" ? "Yangi shartnoma" : "Новый контракт"}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder={language === "uz" ? "Qidirish..." : "Поиск..."}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["all", "draft", "ready", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status as any)}
                  className={
                    filterStatus === status
                      ? "bg-indigo-600 text-white"
                      : ""
                  }
                >
                  {t(status === "all" ? "contracts" : (status as any), language)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Shartномалар ro'yxati" : "Список контрактов"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t("loading", language)}...
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{t("noData", language)}</p>
              <Button
                onClick={() => navigate("/dashboard/contracts/new")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === "uz" ? "Birinchi shartnomayi yaratish" : "Создать первый контракт"}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Raqami" : "Номер"}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Kontragent" : "Контрагент"}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Turi" : "Тип"}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Summa" : "Сумма"}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Holati" : "Статус"}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      {language === "uz" ? "Amallar" : "Действия"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {contract.contractNumber || `#${contract.id}`}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {contract.counterpartyName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {t(contract.type as any, language)}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {contract.amount} {contract.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            contract.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : contract.status === "ready"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {t(contract.status as any, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/contracts/${contract.id}`)}
                          >
                            {language === "uz" ? "Ko'rish" : "Просмотр"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title={language === "uz" ? "Yuklab olish" : "Скачать"}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title={language === "uz" ? "O'chirish" : "Удалить"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
