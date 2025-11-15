import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export default function SortOrderSelector({
  sorting = [],
  setSorting,
  defaultField = "id", // новый пропс с дефолтным полем
}) {
  const { t } = useTranslation();
  const currentField = sorting[0]?.id || defaultField;

  return (
    <Select
      value={sorting[0]?.desc ? "desc" : "asc"}
      onValueChange={(val) => {
        setSorting([{ id: currentField, desc: val === "desc" }]);
      }}
    >
      <SelectTrigger className="w-28 flex items-center justify-between font-medium">
        <SelectValue placeholder={t("datatable.order")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="asc">{t("datatable.asc")}</SelectItem>
        <SelectItem value="desc">{t("datatable.desc")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
