import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserColumns } from "./columns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import { useUserRoleFilter } from "@/components/datatable/toolbar/filters/UserRoleFilter";
import { useUserTypeFilter } from "@/components/datatable/toolbar/filters/UserTypeFilter";
import UserModal from "./UserModal";
import { useAuth } from "@/contexts/AuthContext";
import { AdminOnly } from "@/components/RoleGuard";

export default function UsersPage() {
  const { t } = useTranslation();
  const columns = useUserColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { canManageUsers } = useAuth();

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    // Триггерим обновление таблицы
    setRefetchTrigger((prev) => prev + 1);
    handleModalClose();
  };

  const handleRefresh = () => {
    // Функция для обновления таблицы
    setRefetchTrigger((prev) => prev + 1);
  };
  // Композируем статические фильтры для пользователей
  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useUserRoleFilter, // независимый статический фильтр
    useUserTypeFilter, // независимый статический фильтр с showWhen
  ]);

  return (
    <>
      <div className="container mx-auto py-3">
        <DataTableWrapper
          entity="user"
          pageLabel={t("sidebar.users")}
          columns={columns}
          defaultFilters={{
            q: "",
            user_roles: [],
            user_types: [],
          }}
          defaultSorting={[{ id: "id", desc: false }]}
          localStorageKey="usersTableState"
          searchPlaceholder={t("users.table.searchPlaceholder")}
          addButton={
            canManageUsers()
              ? {
                  label: t("users.table.addButton"),
                  onClick: handleCreate,
                }
              : undefined
          }
          sortFields={[
            { label: t("users.table.columns.id"), value: "id" },
            { label: t("users.table.columns.name"), value: "name" },
            { label: t("users.table.columns.surname"), value: "surname" },
            { label: t("users.table.columns.email"), value: "email" },
          ]}
          filterSchema={filterSchema}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          refetchTrigger={refetchTrigger}
        />
      </div>

      <AdminOnly>
        <UserModal
          isOpen={isModalOpen}
          user={editingUser}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </AdminOnly>
    </>
  );
}
