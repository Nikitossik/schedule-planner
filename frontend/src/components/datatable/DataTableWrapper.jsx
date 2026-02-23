import { useState } from "react";
import { DataTable } from "./DataTable";
import DataTableToolbar from "@/components/datatable/toolbar/DataTableToolbar";
import { useServerTableQuery } from "@/hooks/useServerTableQuery";

export default function DataTableWrapper({
  entity,
  pageLabel, 
  columns,
  defaultFilters,
  defaultSorting,
  localStorageKey,
  sortFields,
  filterSchema,
  addButton,
  searchPlaceholder,
  showSearch = true,
  onEdit,
  onDelete,
  onRefresh, 
  additionalFilters = {},
  refetchTrigger = 0, 
  hideCreateButton = false, 
}) {
  const shouldHideCreateButton = hideCreateButton;

  const {
    data,
    isLoading,
    error,
    refetch,
    pagination,
    sorting,
    filters,
    setPagination,
    setSorting,
    setFilters,
    resetAll,
  } = useServerTableQuery({
    entity,
    defaultFilters: { ...defaultFilters, ...additionalFilters },
    defaultSorting,
    localStorageKey,
    refetchTrigger,
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const enrichedColumns = columns.map((column) => {
    if (column.id === "actions" || column.accessorKey === "actions") {
      return {
        ...column,
        cell: ({ row }) =>
          column.cell
            ? column.cell({ row, onEdit, onDelete, onRefresh })
            : null,
      };
    }
    return column;
  });

  return (
    <div className="flex flex-col gap-4">
      {pageLabel && (
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">{pageLabel}</h1>
        </div>
      )}
      <DataTableToolbar
        filters={filters}
        setFilters={setFilters}
        sorting={sorting}
        setSorting={setSorting}
        resetAll={resetAll}
        sortFields={sortFields}
        filterSchema={filterSchema}
        searchPlaceholder={searchPlaceholder}
        showSearch={showSearch}
        addButton={!shouldHideCreateButton ? addButton : undefined}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setRowSelection={setRowSelection}
        refetch={refetch}
        entity={entity}
        pageLabel={pageLabel}
      />
      <DataTable
        columns={enrichedColumns}
        data={isLoading || error ? [] : data.items}
        rowCount={data.total}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        sorting={sorting}
        filters={filters}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onFilterChange={setFilters}
        onSelectedIdsChange={setSelectedIds}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </div>
  );
}
