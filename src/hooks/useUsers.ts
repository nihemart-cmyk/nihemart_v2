"use client";

import { useState, useCallback, useEffect } from "react";
import userAPI, { AppRole, SortBy, UserRow, UserFilters } from "@/lib/api/users";

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<UserFilters>({
    role: null,
    sortBy: "recent",
    fromDate: null,
    toDate: null,
    minOrders: null,
    maxOrders: null,
    minSpend: null,
    maxSpend: null,
    search: "",
  });

  // Fetch all users from backend API with filters and sorting applied
  const fetchUsers = useCallback(
    async (
      p: number = page,
      l: number = limit,
      appliedFilters: UserFilters = filters
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await userAPI.getAllUsers({
          ...appliedFilters,
          page: p,
          limit: l,
        });

        // Backend returns array directly or { users: [...] }
        const usersArray = Array.isArray(response) ? response : (response.users || []);
        
        // Fetch orders to calculate order counts and total spend per user
        let ordersData: any[] = [];
        try {
          // Use authorizedAPI to fetch orders from backend
          const { authorizedAPI } = await import("@/lib/api");
          const handleApiRequest = (await import("@/lib/handleApiRequest")).default;
          const ordersRes = await handleApiRequest(() =>
            authorizedAPI.get("/orders/admin/all")
          );
          ordersData = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];
        } catch (e) {
          console.error("Failed to fetch orders for user stats:", e);
        }
        
        // Calculate order counts and total spend per user
        const userStats = new Map<string, { orderCount: number; totalSpend: number }>();
        ordersData.forEach((order: any) => {
          const userId = order.userId || order.user_id;
          if (userId) {
            const stats = userStats.get(userId) || { orderCount: 0, totalSpend: 0 };
            stats.orderCount += 1;
            stats.totalSpend += Number(order.total || 0);
            userStats.set(userId, stats);
          }
        });
        
        const apiUsers = usersArray.map((u: any) => {
          // Backend returns roles as array, map to single role for compatibility
          const roles = u.roles || (u.role ? [u.role] : []);
          const primaryRole = roles[0] || u.role || "user";
          const stats = userStats.get(u.id) || { orderCount: 0, totalSpend: 0 };
          
          return {
            id: u.id,
            email: u.email || "",
            full_name: u.fullName || u.full_name || "",
            phone: u.phone || "",
            created_at: u.createdAt || u.created_at,
            role: primaryRole as AppRole,
            roles: roles, // Keep roles array for filtering
            orderCount: stats.orderCount,
            totalSpend: stats.totalSpend,
          };
        });

        const apiCount =
          typeof response.total_count === "number" ? response.total_count : null;
        const apiFilteredCount =
          typeof response.count === "number" ? response.count : null;

        setUsers(apiUsers);
        setTotalCount(apiCount ?? apiUsers.length);
        setFilteredCount(apiFilteredCount ?? apiUsers.length);

        // Store role counts from API
        if (response.role_counts) {
          setRoleCounts(response.role_counts);
        }
        // Fallback: if API didn't provide a total_count, fetch unpaginated
        // list to obtain the real total users count
        if (apiCount === null) {
          try {
            const fullResponse = await userAPI.getAllUsers({});
            const fullUsersArray = Array.isArray(fullResponse) ? fullResponse : (fullResponse.users || []);
            setTotalCount(fullUsersArray.length);
          } catch (e) {
            // ignore fallback errors
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch users");
        setUsers([]);
        setTotalCount(0);
        setFilteredCount(0);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, filters]
  );

  // Auto-fetch when the hook is used in a client component so multiple
  // components don't need to call fetchUsers manually. This keeps the UX
  // simpler: components that need users will mount the hook and get data.
  useEffect(() => {
    // Fetch current page when hook mounts or page/limit/filters change
    fetchUsers(page, limit, filters);
  }, [fetchUsers]);

  // Update sort filter
  const setSortBy = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy }));
    setPage(1); // Reset to first page when filter changes
  }, []);

  // Update role filter
  const setRoleFilter = useCallback((role: AppRole | null) => {
    setFilters((prev) => ({ ...prev, role }));
    setPage(1);
  }, []);

  // Update date range filter
  const setDateRange = useCallback(
    (fromDate: Date | null, toDate: Date | null) => {
      setFilters((prev) => ({ ...prev, fromDate, toDate }));
      setPage(1);
    },
    []
  );

  // Update search filter
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(1);
  }, []);

  // Update order count filter
  const setOrderCountFilter = useCallback(
    (minOrders: number | null, maxOrders: number | null) => {
      setFilters((prev) => ({ ...prev, minOrders, maxOrders }));
      setPage(1);
    },
    []
  );

  // Update spend filter
  const setSpendFilter = useCallback(
    (minSpend: number | null, maxSpend: number | null) => {
      setFilters((prev) => ({ ...prev, minSpend, maxSpend }));
      setPage(1);
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      role: null,
      sortBy: "recent",
      fromDate: null,
      toDate: null,
      minOrders: null,
      maxOrders: null,
      minSpend: null,
      maxSpend: null,
    });
    setPage(1);
  }, []);

  // Update user role
  const updateUserRole = useCallback(
    async (userId: string, role: AppRole) => {
      setLoading(true);
      setError(null);
      try {
        await userAPI.updateUserRole(userId, role);
        await fetchUsers(page, limit, filters);
      } catch (err: any) {
        setError(err.message || "Failed to update role");
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, page, limit, filters]
  );

  // Delete user (hard delete - backend doesn't support soft delete)
  const deleteUser = useCallback(
    async (userId: string, hardDelete = false) => {
      setLoading(true);
      setError(null);
      try {
        await userAPI.deleteUser(userId);
        await fetchUsers(page, limit, filters);
      } catch (err: any) {
        setError(err.message || "Failed to delete user");
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, page, limit, filters]
  );

  return {
    users,
    loading,
    error,
    fetchUsers,
    page,
    limit,
    setPage,
    setLimit,
    totalCount,
    filteredCount,
    updateUserRole,
    deleteUser,
    filters,
    setSortBy,
    setRoleFilter,
    setDateRange,
    setOrderCountFilter,
    setSpendFilter,
    resetFilters,
    setSearch,
    roleCounts,
  };
}
