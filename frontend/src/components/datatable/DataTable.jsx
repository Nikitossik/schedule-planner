import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import DataTablePagination from "./DataTablePagination";

export function DataTable({
  columns,
  data,
  isLoading,
  error,
  rowCount,
  pagination,
  sorting,
  filters,
  rowSelection,
  setRowSelection,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  onSelectedIdsChange,
}) {
  const { t } = useTranslation();
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
    state: { sorting, filters, rowSelection, pagination },
    onPaginationChange,
    onSortingChange,
    onFilterChange,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  React.useEffect(() => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    onSelectedIdsChange?.(selectedIds);
  }, [rowSelection]);

  if (isLoading)
    return (
      <div className="w-full py-20 flex justify-center items-center ">
        <Spinner size={"medium"}>{t("datatable.loading")}</Spinner>
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 text-center">{t("datatable.error")}</div>
    );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, {
                          ...header.getContext(),
                          filters,
                          onFilterChange,
                        })}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("datatable.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </>
  );
}
