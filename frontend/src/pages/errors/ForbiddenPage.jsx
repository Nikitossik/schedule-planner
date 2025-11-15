import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {t("errorPages.forbidden.title")}
        </h2>
        <p className="text-gray-600 mb-8">
          {t("errorPages.forbidden.description")}
        </p>
        <Button asChild>
          <Link to="/">{t("errorPages.forbidden.goBackHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
