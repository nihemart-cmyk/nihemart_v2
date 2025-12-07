import { authorizedAPI } from "../api";
import handleApiRequest from "@/lib/handleApiRequest";

export interface DashboardStats {
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  totalRefunded: number;
  refundedOrders: number;
  activeRiders: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  main_image_url?: string;
  order_count: number;
  price: number;
}

export interface DashboardOrdersResponse {
  data: any[];
  count?: number;
}

export interface DashboardUsersResponse {
  data: any[];
  count?: number;
}

// Internal API functions
const dashboardAPI = {
  // Get dashboard stats by aggregating from orders and users
  // Note: Backend may not have a dedicated dashboard endpoint, so we aggregate
  getStats: async (dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());

    // Get all orders for stats calculation
    const ordersRes = await handleApiRequest(() =>
      authorizedAPI.get(`/orders/admin/all${params.toString() ? `?${params.toString()}` : ""}`)
    );

    // Get all users count
    const usersRes = await handleApiRequest(() =>
      authorizedAPI.get(`/users?limit=1`)
    );

    // Get riders
    const ridersRes = await handleApiRequest(() =>
      authorizedAPI.get("/riders")
    );

    const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];
    const users = usersRes?.users || [];
    const riders = Array.isArray(ridersRes) ? ridersRes : ridersRes?.data || [];

    const totalRevenue = orders
      .filter((order: any) => order.status === "delivered")
      .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    const totalRefunded = orders
      .filter((order: any) => order.status === "refunded")
      .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    const refundedOrders = orders.filter((order: any) => order.status === "refunded").length;
    const pendingOrders = orders.filter((order: any) =>
      ["pending", "processing"].includes(order.status || "")
    ).length;
    const completedOrders = orders.filter(
      (order: any) => order.status === "delivered"
    ).length;
    const activeRiders = riders.filter((rider: any) => rider.active).length;

    return {
      totalRevenue,
      totalUsers: usersRes?.total_count || users.length || 0,
      totalOrders: orders.length,
      totalRefunded,
      refundedOrders,
      activeRiders,
      pendingOrders,
      completedOrders,
    };
  },

  // Get recent orders
  getRecentOrders: async (limit: number = 10, dateFrom?: Date, dateTo?: Date): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());

    const res = await handleApiRequest(() =>
      authorizedAPI.get(`/orders/admin/all?${params.toString()}`)
    );
    return Array.isArray(res) ? res : res?.data || [];
  },

  // Get recent users
  getRecentUsers: async (limit: number = 5): Promise<any[]> => {
    const res = await handleApiRequest(() =>
      authorizedAPI.get(`/users?limit=${limit}&sort=recent`)
    );
    return res?.users || [];
  },

  // Get top products (may need backend implementation)
  // For now, we'll calculate from orders
  getTopProducts: async (dateFrom?: Date, dateTo?: Date): Promise<TopProduct[]> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());

    const ordersRes = await handleApiRequest(() =>
      authorizedAPI.get(`/orders/admin/all${params.toString() ? `?${params.toString()}` : ""}`)
    );

    const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];
    
    // Aggregate products from order items
    const productMap = new Map<string, { count: number; product: any }>();
    
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId || item.product?.id;
          if (productId) {
            const existing = productMap.get(productId) || { count: 0, product: item.product || {} };
            existing.count += item.quantity || 1;
            productMap.set(productId, existing);
          }
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.product.name || "Unknown",
        main_image_url: data.product.main_image_url,
        order_count: data.count,
        price: data.product.price || 0,
      }))
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 10);
  },
};

export default dashboardAPI;

