import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Counterparties() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "legal" as const,
    stir: "",
    bankName: "",
    mfo: "",
    account: "",
    address: "",
    director: "",
    phone: "",
    email: "",
  });

  const { data: counterparties, isLoading, refetch } = trpc.counterparties.list.useQuery();
  const createMutation = trpc.counterparties.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      setFormData({
        name: "",
        type: "legal",
        stir: "",
        bankName: "",
        mfo: "",
        account: "",
        address: "",
        director: "",
        phone: "",
        email: "",
      });
    },
  });

  const filteredCounterparties = counterparties?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("counterpartiesCount", language)}
        </h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              {language === "uz" ? "Yangi kontragent" : "Новый контрагент"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === "uz" ? "Kontragent qo'shish" : "Добавить контрагента"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("counterpartyName", language)}</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("counterpartyType", language)}</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                  >
                    <option value="legal">
                      {language === "uz" ? "Yuridik shaxs" : "Юридическое лицо"}
                    </option>
                    <option value="yatt">YATT</option>
                    <option value="individual">
                      {language === "uz" ? "Jismoniy shaxs" : "Физическое лицо"}
                    </option>
                  </select>
                </div>
                <div>
                  <Label>{t("counterpartyStir", language)}</Label>
                  <Input
                    value={formData.stir}
                    onChange={(e) =>
                      setFormData({ ...formData, stir: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("counterpartyDirector", language)}</Label>
                  <Input
                    value={formData.director}
                    onChange={(e) =>
                      setFormData({ ...formData, director: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("counterpartyBank", language)}</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("counterpartyMfo", language)}</Label>
                  <Input
                    value={formData.mfo}
                    onChange={(e) =>
                      setFormData({ ...formData, mfo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("counterpartyAccount", language)}</Label>
                  <Input
                    value={formData.account}
                    onChange={(e) =>
                      setFormData({ ...formData, account: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{language === "uz" ? "Telefon" : "Телефон"}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>{t("counterpartyAddress", language)}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>{language === "uz" ? "Email" : "Email"}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  {t("cancel", language)}
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={createMutation.isPending}
                >
                  {t("create", language)}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={language === "uz" ? "Qidirish..." : "Поиск..."}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Counterparties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {t("loading", language)}...
          </div>
        ) : filteredCounterparties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">{t("noData", language)}</p>
          </div>
        ) : (
          filteredCounterparties.map((counterparty) => (
            <Card key={counterparty.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{counterparty.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {counterparty.type === "legal"
                        ? language === "uz"
                          ? "Yuridik shaxs"
                          : "Юридическое лицо"
                        : counterparty.type === "yatt"
                        ? "YATT"
                        : language === "uz"
                        ? "Jismoniy shaxs"
                        : "Физическое лицо"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {counterparty.stir && (
                  <div>
                    <span className="text-gray-600">STIR:</span>
                    <span className="ml-2 font-medium">{counterparty.stir}</span>
                  </div>
                )}
                {counterparty.director && (
                  <div>
                    <span className="text-gray-600">
                      {language === "uz" ? "Direktori:" : "Директор:"}
                    </span>
                    <span className="ml-2 font-medium">{counterparty.director}</span>
                  </div>
                )}
                {counterparty.phone && (
                  <div>
                    <span className="text-gray-600">
                      {language === "uz" ? "Telefon:" : "Телефон:"}
                    </span>
                    <span className="ml-2 font-medium">{counterparty.phone}</span>
                  </div>
                )}
                {counterparty.address && (
                  <div>
                    <span className="text-gray-600">
                      {language === "uz" ? "Manzil:" : "Адрес:"}
                    </span>
                    <span className="ml-2 font-medium text-xs">
                      {counterparty.address}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
