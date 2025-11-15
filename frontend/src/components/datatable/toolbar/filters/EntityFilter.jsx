import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export default function EntityFilter({ filters, setFilters, filterSchema }) {
  const { t } = useTranslation();
  // Получаем актуальную схему фильтров (если это функция)
  const currentFilterSchema =
    typeof filterSchema === "function"
      ? filterSchema(filters)
      : filterSchema || [];

  const toggleArrayFilter = (key, value) => {
    const prev = filters[key] || [];
    const updated = prev.includes(value)
      ? prev.filter((v) => v !== value)
      : [...prev, value];

    setFilters((f) => ({ ...f, [key]: updated }));
  };

  return (
    <>
      {currentFilterSchema.map((filter) => {
        if (filter.showWhen) {
          const dependentValues = filters[filter.showWhen.key] || [];
          if (!dependentValues.includes(filter.showWhen.value)) return null;
        }

        const selected = Array.isArray(filters[filter.key])
          ? filters[filter.key]
          : [];

        return (
          <DropdownMenu key={filter.key}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {filter.label}
                {selected.length > 0 && <Badge>{selected.length}</Badge>}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filter.options?.length > 0 ? (
                filter.options.map(({ key, value, label }) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={selected.includes(value)}
                    onCheckedChange={() => toggleArrayFilter(filter.key, value)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  {t("datatable.noOptionsAvailable")}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </>
  );
}
