import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { FileText, TrendingUp, Users, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();

  // Fetch contracts and announcements
  const { data: contracts, isLoading: contractsLoading } = trpc.contracts.list.useQuery({ limit: 100 });
  const { data: announcements } = trpc.announcements.latest.useQuery({ limit: 5 });
  const { data: profile } = trpc.profile.me.useQuery();

  // Calculate statistics
  const totalContracts = contracts?.length || 0;
  const draftContracts = contracts?.filter((c) => c.status === "draft").length || 0;
  const readyContracts = contracts?.filter((c) => c.status === "ready").length || 0;

  // Mock data for monthly chart
  const monthlyData = [
    { month: "Jan", contracts: 4 },
    { month: "Feb", contracts: 3 },
    { month: "Mar", contracts: 2 },
    { month: "Apr", contracts: 5 },
    { month: "May", contracts: 6 },
    { month: "Jun", contracts: 7 },
  ];

  const recentContracts = contracts?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === "uz" ? "Xush kelibsiz" : "Добро пожаловать"}, {user?.name}!
        </h1>
        <p className="text-indigo-100">
          {language === "uz"
            ? "Shartnoma boshqaruv tizimiga xush kelibsiz"
            : "Добро пожаловать в систему управления контрактами"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("totalContracts", language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalContracts}</div>
            <p className="text-xs text-gray-500 mt-1">
              {language === "uz" ? "Jami shartномалар" : "Всего контрактов"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t("draftContracts", language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{draftContracts}</div>
            <p className="text-xs text-gray-500 mt-1">
              {language === "uz" ? "Qoralama" : "Черновики"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {language === "uz" ? "Tayyor" : "Готово"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{readyContracts}</div>
            <p className="text-xs text-gray-500 mt-1">
              {language === "uz" ? "Tayyorlangan" : "Подготовленные"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("counterpartiesCount", language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {profile?.contractsUsed || 0}/{profile?.contractsLimit || 10}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === "uz" ? "Reja cheklovisi" : "Лимит плана"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>{t("monthlyTrends", language)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contracts" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "uz" ? "Tendensiya" : "Тренд"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="contracts" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recentActivity", language)}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/contracts")}>
            {language === "uz" ? "Barchasi" : "Все"}
          </Button>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t("loading", language)}...
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("noData", language)}
            </div>
          ) : (
            <div className="space-y-4">
              {recentContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {contract.counterpartyName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {t(contract.type as any, language)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/contracts/${contract.id}`)}
                    >
                      {language === "uz" ? "Ko'rish" : "Просмотр"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "uz" ? "E'lonlar" : "Объявления"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 border-l-4 border-indigo-600 bg-indigo-50 rounded"
                >
                  <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
