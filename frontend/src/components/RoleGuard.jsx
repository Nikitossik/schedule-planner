import { useAuth } from "@/contexts/AuthContext";

function RoleGuard({ children, allowedRoles, fallback = null }) {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
}

export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = useAuth();

  return isAdmin() ? children : fallback;
}

export default RoleGuard;
