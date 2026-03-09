import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Download, Printer, Edit2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { generatePDF, generateWord, downloadAsText, printContract } from "@/lib/documentGenerator";
import { useState } from "react";

interface ContractDetailProps {
  contractId: string;
}

export default function ContractDetail({ contractId }: ContractDetailProps) {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  const { data: contract, isLoading } = trpc.contracts.getById.useQuery({
    id: parseInt(contractId),
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("loading", language)}...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("noData", language)}</p>
        <Button
          className="mt-4"
          onClick={() => navigate("/dashboard/contracts")}
        >
          {language === "uz" ? "Orqaga" : "Назад"}
        </Button>
      </div>
    );
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const contractContent = `Contract #${contract.contractNumber || contract.id}\nType: ${contract.type}\nDate: ${contract.date}\nCounterparty: ${contract.counterpartyName}\nAmount: ${contract.amount} ${contract.currency}\nStatus: ${contract.status}`;
      await generatePDF(
        {
          contractNumber: contract.contractNumber || "",
          date: contract.date || "",
          ourName: contract.ourName || "",
          ourStir: contract.ourStir || "",
          ourDirector: contract.ourDirector || "",
          ourAddress: contract.ourAddress || "",
          ourBank: {
            bank: (contract.ourBank as any)?.bank,
            mfo: (contract.ourBank as any)?.mfo,
            account: (contract.ourBank as any)?.account,
          },
          counterpartyName: contract.counterpartyName || "",
          counterpartyStir: contract.counterpartyStir || "",
          counterpartyDirector: contract.counterpartyDirector || "",
          counterpartyAddress: contract.counterpartyAddress || "",
          counterpartyBank: contract.counterpartyBank || "",
          counterpartyMfo: contract.counterpartyMfo || "",
          counterpartyAccount: contract.counterpartyAccount || "",
          amount: contract.amount || "",
          currency: contract.currency || "",
          startDate: contract.startDate || "",
          endDate: contract.endDate || "",
          description: contract.description || "",
          content: contractContent,
        },
        `${contract.contractNumber || "contract"}.pdf`
      );
      toast.success(
        language === "uz"
          ? "PDF yuklab olindi"
          : "PDF загружен"
      );
    } catch (error) {
      toast.error(
        language === "uz"
          ? "PDF yaratishda xato"
          : "Ошибка при создании PDF"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      const contractContent = `Contract #${contract.contractNumber || contract.id}\nType: ${contract.type}\nDate: ${contract.date}\nCounterparty: ${contract.counterpartyName}\nAmount: ${contract.amount} ${contract.currency}\nStatus: ${contract.status}`;
      await generateWord(
        {
          contractNumber: contract.contractNumber || "",
          date: contract.date || "",
          ourName: contract.ourName || "",
          ourStir: contract.ourStir || "",
          ourDirector: contract.ourDirector || "",
          ourAddress: contract.ourAddress || "",
          ourBank: {
            bank: (contract.ourBank as any)?.bank,
            mfo: (contract.ourBank as any)?.mfo,
            account: (contract.ourBank as any)?.account,
          },
          counterpartyName: contract.counterpartyName || "",
          counterpartyStir: contract.counterpartyStir || "",
          counterpartyDirector: contract.counterpartyDirector || "",
          counterpartyAddress: contract.counterpartyAddress || "",
          counterpartyBank: contract.counterpartyBank || "",
          counterpartyMfo: contract.counterpartyMfo || "",
          counterpartyAccount: contract.counterpartyAccount || "",
          amount: contract.amount || "",
          currency: contract.currency || "",
          startDate: contract.startDate || "",
          endDate: contract.endDate || "",
          description: contract.description || "",
          content: contractContent,
        },
        `${contract.contractNumber || "contract"}.docx`
      );
      toast.success(
        language === "uz"
          ? "Word yuklab olindi"
          : "Word загружен"
      );
    } catch (error) {
      toast.error(
        language === "uz"
          ? "Word yaratishda xato"
          : "Ошибка при создании Word"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    try {
      const contractContent = `Contract #${contract.contractNumber || contract.id}\nType: ${contract.type}\nDate: ${contract.date}\nCounterparty: ${contract.counterpartyName}\nAmount: ${contract.amount} ${contract.currency}\nStatus: ${contract.status}`;
      downloadAsText(
        {
          contractNumber: contract.contractNumber || "",
          date: contract.date || "",
          ourName: contract.ourName || "",
          ourStir: contract.ourStir || "",
          ourDirector: contract.ourDirector || "",
          ourAddress: contract.ourAddress || "",
          ourBank: {
            bank: (contract.ourBank as any)?.bank,
            mfo: (contract.ourBank as any)?.mfo,
            account: (contract.ourBank as any)?.account,
          },
          counterpartyName: contract.counterpartyName || "",
          counterpartyStir: contract.counterpartyStir || "",
          counterpartyDirector: contract.counterpartyDirector || "",
          counterpartyAddress: contract.counterpartyAddress || "",
          counterpartyBank: contract.counterpartyBank || "",
          counterpartyMfo: contract.counterpartyMfo || "",
          counterpartyAccount: contract.counterpartyAccount || "",
          amount: contract.amount || "",
          currency: contract.currency || "",
          startDate: contract.startDate || "",
          endDate: contract.endDate || "",
          description: contract.description || "",
          content: contractContent,
        },
        `${contract.contractNumber || "contract"}.txt`
      );
      toast.success(
        language === "uz"
          ? "Text yuklab olindi"
          : "Текст загружен"
      );
    } catch (error) {
      toast.error(
        language === "uz"
          ? "Text yaratishda xato"
          : "Ошибка при создании текста"
      );
    }
  };

  const handlePrint = () => {
    const contractContent = `Contract #${contract.contractNumber || contract.id}\nType: ${contract.type}\nDate: ${contract.date}\nCounterparty: ${contract.counterpartyName}\nAmount: ${contract.amount} ${contract.currency}\nStatus: ${contract.status}`;
    printContract({
      contractNumber: contract.contractNumber || "",
      date: contract.date || "",
      ourName: contract.ourName || "",
      ourStir: contract.ourStir || "",
      ourDirector: contract.ourDirector || "",
      ourAddress: contract.ourAddress || "",
      ourBank: {
        bank: (contract.ourBank as any)?.bank,
        mfo: (contract.ourBank as any)?.mfo,
        account: (contract.ourBank as any)?.account,
      },
      counterpartyName: contract.counterpartyName || "",
      counterpartyStir: contract.counterpartyStir || "",
      counterpartyDirector: contract.counterpartyDirector || "",
      counterpartyAddress: contract.counterpartyAddress || "",
      counterpartyBank: contract.counterpartyBank || "",
      counterpartyMfo: contract.counterpartyMfo || "",
      counterpartyAccount: contract.counterpartyAccount || "",
      amount: contract.amount || "",
      currency: contract.currency || "",
      startDate: contract.startDate || "",
      endDate: contract.endDate || "",
      description: contract.description || "",
      content: contractContent,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {contract.contractNumber || `#${contract.id}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === "uz" ? "Kontragent:" : "Контрагент:"} {contract.counterpartyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/contracts/${contract.id}/edit`)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {language === "uz" ? "Tahrirlash" : "Редактировать"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {language === "uz" ? "O'chirish" : "Удалить"}
          </Button>
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Holati" : "Статус"}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {t(contract.status as any, language)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Turi" : "Тип"}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {t(contract.type as any, language)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Summa" : "Сумма"}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {contract.amount} {contract.currency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              {language === "uz" ? "Sana" : "Дата"}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {contract.date
                ? new Date(contract.date).toLocaleDateString(
                    language === "uz" ? "uz-UZ" : "ru-RU"
                  )
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Yuklab olish" : "Загрузить"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={handleExportWord}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Word
            </Button>
            <Button
              onClick={handleExportText}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "uz" ? "Text" : "Текст"}
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              {language === "uz" ? "Chop etish" : "Печать"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contract Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "uz" ? "Shartnoma matni" : "Текст контракта"}
          </CardTitle>
        </CardHeader>
        <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap">
            {`Contract #${contract.contractNumber || contract.id}
Type: ${contract.type}
Date: ${contract.date}
Counterparty: ${contract.counterpartyName}
Amount: ${contract.amount} ${contract.currency}
Status: ${contract.status}`}
          </pre>
        </CardContent>
      </Card>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate("/dashboard/contracts")}
      >
        {language === "uz" ? "Orqaga" : "Назад"}
      </Button>
    </div>
  );
}
