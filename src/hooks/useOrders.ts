import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
<<<<<<< HEAD
import { authorizedAPI } from "@/lib/api";
import handleApiRequest from "@/lib/handleApiRequest";
import type {
   Order,
   OrderQueryOptions,
   CreateOrderRequest,
   OrderStatus,
   RefundStatus,
} from "@/types/orders";

// Transform backend camelCase to frontend snake_case for compatibility
function transformOrder(order: any): Order {
   if (!order) return order;
   
   return {
      ...order,
      // Transform camelCase to snake_case
      order_number: order.orderNumber || order.order_number,
      user_id: order.userId || order.user_id,
      created_at: order.createdAt || order.created_at,
      updated_at: order.updatedAt || order.updated_at,
      shipped_at: order.shippedAt || order.shipped_at,
      delivered_at: order.deliveredAt || order.delivered_at,
      customer_email: order.customerEmail || order.customer_email,
      customer_first_name: order.customerFirstName || order.customer_first_name,
      customer_last_name: order.customerLastName || order.customer_last_name,
      customer_phone: order.customerPhone || order.customer_phone,
      delivery_address: order.deliveryAddress || order.delivery_address,
      delivery_city: order.deliveryCity || order.delivery_city,
      delivery_notes: order.deliveryNotes || order.delivery_notes,
      schedule_notes: order.scheduleNotes || order.schedule_notes,
      delivery_time: order.deliveryTime ? (typeof order.deliveryTime === 'string' ? order.deliveryTime : order.deliveryTime.toISOString()) : order.delivery_time,
      payment_method: order.paymentMethod || order.payment_method,
      is_paid: order.isPaid !== undefined ? order.isPaid : order.is_paid,
      is_external: order.isExternal !== undefined ? order.isExternal : order.is_external,
      refund_requested: order.refundRequested !== undefined ? order.refundRequested : order.refund_requested,
      refund_reason: order.refundReason || order.refund_reason,
      refund_status: order.refundStatus || order.refund_status,
      refund_requested_at: order.refundRequestedAt ? (typeof order.refundRequestedAt === 'string' ? order.refundRequestedAt : order.refundRequestedAt.toISOString()) : order.refund_requested_at,
      // Transform items
      items: order.items ? order.items.map((item: any) => ({
         ...item,
         order_id: item.orderId || item.order_id,
         product_id: item.productId || item.product_id,
         product_variation_id: item.productVariationId || item.product_variation_id,
         product_name: item.productName || item.product_name,
         product_sku: item.productSku || item.product_sku,
         variation_name: item.variationName || item.variation_name,
         product_image_url: item.productImageUrl || item.product_image_url,
         created_at: item.createdAt || item.created_at,
         refund_requested: item.refundRequested !== undefined ? item.refundRequested : item.refund_requested,
         refund_reason: item.refundReason || item.refund_reason,
         refund_status: item.refundStatus || item.refund_status,
         refund_requested_at: item.refundRequestedAt ? (typeof item.refundRequestedAt === 'string' ? item.refundRequestedAt : item.refundRequestedAt.toISOString()) : item.refund_requested_at,
      })) : order.items,
   } as Order;
}

function transformOrderList(data: any): any {
   if (!data) return data;
   
   // Handle paginated response
   if (data.data && Array.isArray(data.data)) {
      return {
         ...data,
         data: data.data.map(transformOrder),
      };
   }
   
   // Handle array response
   if (Array.isArray(data)) {
      return data.map(transformOrder);
   }
   
   return transformOrder(data);
}
=======
import {
   fetchUserOrders,
   fetchAllOrders,
   fetchOrderById,
   createOrder,
   updateOrderStatus,
   requestRefundForItem,
   cancelRefundRequestForItem,
   requestRefundForOrder,
   cancelRefundRequestForOrder,
   respondToRefundRequest,
   respondToOrderRefundRequest,
   deleteOrder,
   getOrderStats,
   type Order,
   type OrderQueryOptions,
   type CreateOrderRequest,
   type OrderStatus,
} from "@/integrations/supabase/orders";
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6

// Query Keys
export const orderKeys = {
   all: ["orders"] as const,
   lists: () => [...orderKeys.all, "list"] as const,
   list: (options: OrderQueryOptions) =>
      [...orderKeys.lists(), options] as const,
   details: () => [...orderKeys.all, "detail"] as const,
   detail: (id: string) => [...orderKeys.details(), id] as const,
   stats: () => [...orderKeys.all, "stats"] as const,
   userOrders: (userId: string) => [...orderKeys.all, "user", userId] as const,
};

<<<<<<< HEAD
// Internal API functions
const orderAPI = {
   // Get user orders
   getUserOrders: async (options: OrderQueryOptions = {}): Promise<any> => {
      const params = new URLSearchParams();
      
      if (options.filters) {
         if (options.filters.status) params.append("status", options.filters.status);
         if (options.filters.search) params.append("search", options.filters.search);
         if (options.filters.dateFrom) params.append("dateFrom", options.filters.dateFrom);
         if (options.filters.dateTo) params.append("dateTo", options.filters.dateTo);
         if (options.filters.priceMin) params.append("priceMin", String(options.filters.priceMin));
         if (options.filters.priceMax) params.append("priceMax", String(options.filters.priceMax));
         if (options.filters.city) params.append("city", options.filters.city);
         if (options.filters.isPaid !== undefined) params.append("isPaid", String(options.filters.isPaid));
         if (options.filters.isExternal !== undefined) params.append("isExternal", String(options.filters.isExternal));
      }
      
      if (options.pagination) {
         if (options.pagination.page) params.append("page", String(options.pagination.page));
         if (options.pagination.limit) params.append("limit", String(options.pagination.limit));
      }
      
      if (options.sort) {
         if (options.sort.column) params.append("sortColumn", options.sort.column);
         if (options.sort.direction) params.append("sortDirection", options.sort.direction);
      }
      
      const queryString = params.toString();
      const result = await handleApiRequest(() =>
         authorizedAPI.get(`/orders${queryString ? `?${queryString}` : ""}`)
      );
      return transformOrderList(result);
   },

   // Get all orders (admin)
   getAllOrders: async (options: OrderQueryOptions = {}): Promise<any> => {
      const params = new URLSearchParams();
      
      if (options.filters) {
         if (options.filters.status) params.append("status", options.filters.status);
         if (options.filters.search) params.append("search", options.filters.search);
         if (options.filters.dateFrom) params.append("dateFrom", options.filters.dateFrom);
         if (options.filters.dateTo) params.append("dateTo", options.filters.dateTo);
         if (options.filters.priceMin) params.append("priceMin", String(options.filters.priceMin));
         if (options.filters.priceMax) params.append("priceMax", String(options.filters.priceMax));
         if (options.filters.city) params.append("city", options.filters.city);
         if (options.filters.isPaid !== undefined) params.append("isPaid", String(options.filters.isPaid));
         if (options.filters.isExternal !== undefined) params.append("isExternal", String(options.filters.isExternal));
      }
      
      if (options.pagination) {
         if (options.pagination.page) params.append("page", String(options.pagination.page));
         if (options.pagination.limit) params.append("limit", String(options.pagination.limit));
      }
      
      if (options.sort) {
         if (options.sort.column) params.append("sortColumn", options.sort.column);
         if (options.sort.direction) params.append("sortDirection", options.sort.direction);
      }
      
      const queryString = params.toString();
      const result = await handleApiRequest(() =>
         authorizedAPI.get(`/orders/admin/all${queryString ? `?${queryString}` : ""}`)
      );
      return transformOrderList(result);
   },

   // Get order by ID
   getOrderById: async (id: string): Promise<Order> => {
      const result = await handleApiRequest(() => authorizedAPI.get(`/orders/${id}`));
      return transformOrder(result);
   },

   // Create order
   createOrder: async (request: CreateOrderRequest): Promise<Order> => {
      const result = await handleApiRequest(() => authorizedAPI.post("/orders", request));
      return transformOrder(result);
   },

   // Update order status (admin)
   updateOrderStatus: async (
      id: string,
      status: OrderStatus
   ): Promise<Order> => {
      const result = await handleApiRequest(() =>
         authorizedAPI.patch(`/orders/admin/${id}/status`, { status })
      );
      return transformOrder(result);
   },

   // Request refund for item
   requestItemRefund: async (
      itemId: string,
      reason: string
   ): Promise<any> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/orders/items/${itemId}/refund`, { reason })
      );
   },

   // Request refund for order
   requestOrderRefund: async (
      orderId: string,
      reason: string
   ): Promise<Order> => {
      const result = await handleApiRequest(() =>
         authorizedAPI.post(`/orders/${orderId}/refund`, { reason })
      );
      return transformOrder(result);
   },

   // Cancel item refund request
   cancelItemRefundRequest: async (itemId: string): Promise<any> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/orders/items/${itemId}/refund/cancel`)
      );
   },

   // Cancel order refund request
   cancelOrderRefundRequest: async (orderId: string): Promise<Order> => {
      const result = await handleApiRequest(() =>
         authorizedAPI.post(`/orders/${orderId}/refund/cancel`)
      );
      return transformOrder(result);
   },

   // Respond to item refund (admin)
   respondToItemRefund: async (
      itemId: string,
      approve: boolean
   ): Promise<any> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/orders/admin/items/${itemId}/refund/respond`, {
            approve,
         })
      );
   },

   // Respond to order refund (admin)
   respondToOrderRefund: async (
      orderId: string,
      approve: boolean
   ): Promise<Order> => {
      const result = await handleApiRequest(() =>
         authorizedAPI.post(`/orders/admin/${orderId}/refund/respond`, {
            approve,
         })
      );
      return transformOrder(result);
   },

   // Get refunded items (admin)
   getRefundedItems: async (options: {
      refundStatus?: string;
      page?: number;
      limit?: number;
   } = {}): Promise<any> => {
      const params = new URLSearchParams();
      if (options.refundStatus) params.append("refundStatus", options.refundStatus);
      if (options.page) params.append("page", String(options.page));
      if (options.limit) params.append("limit", String(options.limit));
      
      const queryString = params.toString();
      return handleApiRequest(() =>
         authorizedAPI.get(`/orders/admin/refunds/items${queryString ? `?${queryString}` : ""}`)
      );
   },
};

/**
 * Hook for fetching user's orders
 */
export function useUserOrders(options: OrderQueryOptions = {}) {
   const { user, isLoggedIn } = useAuth();

   const key = orderKeys.userOrders(user?.id || "");
=======
// Hook for fetching user's orders
export function useUserOrders(options: OrderQueryOptions = {}) {
   const { user, isLoggedIn } = useAuth();

   console.log("useUserOrders hook:", { user, isLoggedIn, options });

   const key = orderKeys.userOrders(user?.id || "");

>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
   const keyWithOptions = [...key, { ...(options || {}) }];

   return useQuery({
      queryKey: keyWithOptions,
<<<<<<< HEAD
      queryFn: () => orderAPI.getUserOrders(options),
=======
      queryFn: () => fetchUserOrders(options, user?.id),
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      enabled: isLoggedIn && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
   });
}

<<<<<<< HEAD
/**
 * Hook for fetching all orders (admin only)
 */
=======
// Hook for fetching all orders (admin only)
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useAllOrders(options: OrderQueryOptions = {}) {
   const { user, hasRole } = useAuth();

   return useQuery({
      queryKey: orderKeys.list(options),
<<<<<<< HEAD
      queryFn: () => orderAPI.getAllOrders(options),
=======
      queryFn: () => {
         console.log("Executing fetchAllOrders with options:", options);
         return fetchAllOrders(options);
      },
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      enabled: !!user && hasRole("admin"),
      staleTime: 0, // Disable stale time to always refetch
   });
}

<<<<<<< HEAD
/**
 * Hook for fetching single order
 */
=======
// Hook for fetching single order
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useOrder(id: string) {
   const { user, isLoggedIn } = useAuth();

   return useQuery({
      queryKey: orderKeys.detail(id),
<<<<<<< HEAD
      queryFn: () => orderAPI.getOrderById(id),
=======
      queryFn: () => fetchOrderById(id),
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      enabled: isLoggedIn && !!user && !!id,
   });
}

<<<<<<< HEAD
/**
 * Hook to fetch and cache the latest rider assignment for an order
 */
=======
// Hook to fetch and cache the latest rider assignment for an order
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useOrderAssignment(orderId?: string, enabled = true) {
   const { user, isLoggedIn } = useAuth();

   return useQuery({
      queryKey: ["orders", "assignment", orderId],
      queryFn: async () => {
         if (!orderId) return null as any;
<<<<<<< HEAD
         // Get order which includes assignment info
         const order = await orderAPI.getOrderById(orderId);
         return order?.rider || null;
=======
         const res = await fetch(`/api/orders/${orderId}/assignment`);
         if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
               body?.error || `Failed to fetch assignment for ${orderId}`
            );
         }
         const json = await res.json();
         return json?.rider || null;
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      },
      enabled: Boolean(orderId) && enabled && isLoggedIn && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
   });
}

<<<<<<< HEAD
/**
 * Hook for creating orders
 */
=======
// Hook for order statistics (admin only)
export function useOrderStats() {
   const { user, hasRole } = useAuth();

   return useQuery({
      queryKey: orderKeys.stats(),
      queryFn: getOrderStats,
      enabled: !!user && hasRole("admin"),
      staleTime: 1000 * 60 * 5, // 5 minutes
   });
}

// Hook for fetching refunded items (admin)
export function useRefundedItems({
   page = 1,
   limit = 20,
   refundStatus,
}: { page?: number; limit?: number; refundStatus?: string } = {}) {
   const { user, hasRole } = useAuth();

   return useQuery({
      queryKey: ["orders", "refunded", { page, limit, refundStatus }],
      queryFn: async () => {
         const q = new URLSearchParams();
         q.set("page", String(page));
         q.set("limit", String(limit));
         if (refundStatus) q.set("refundStatus", refundStatus);
         const res = await fetch(`/api/admin/refunds?${q.toString()}`);
         if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || "Failed to fetch refunded items");
         }
         return res.json();
      },
      enabled: !!user && hasRole("admin"),
      staleTime: 0,
   });
}

// Hook for creating orders
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useCreateOrder() {
   const queryClient = useQueryClient();
   const { user } = useAuth();

   return useMutation<Order, Error, CreateOrderRequest>({
      mutationFn: async (orderData: CreateOrderRequest) => {
<<<<<<< HEAD
         if (!orderData.order || !orderData.items) {
            throw new Error("Invalid order data structure");
         }
         
         const result = await orderAPI.createOrder(orderData);
         return result;
      },
      onSuccess: (data) => {
=======
         console.log("Regular Order Mutation - Starting with data:", orderData);
         console.log(
            "Regular Order Mutation - calling integrations.createOrder..."
         );
         if (!orderData.order || !orderData.items) {
            console.error("Invalid order data:", orderData);
            throw new Error("Invalid order data structure");
         }
         try {
            // Check if orders are enabled (server-side setting).
            // This check is best-effort; transient failures should not block checkout.
            // Orders can proceed with checkbox confirmation during non-working hours
            // No delivery_time validation required

            // Create the order via a server-side API so the insertion uses the
            // service role (avoids RLS denial when invoked from the browser).
            const resp = await fetch("/api/orders/create", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(orderData),
            });

            if (!resp.ok) {
               const body = await resp.json().catch(() => ({}));
               const msg =
                  body?.error || `Failed to create order: ${resp.status}`;
               throw new Error(msg);
            }

            const result = await resp.json();
            console.log(
               "Regular Order Mutation - integrations.createOrder returned:",
               result
            );
            if (!result) {
               throw new Error("No response received from server");
            }
            console.log("Regular Order Mutation - Success:", result);
            return result;
         } catch (error) {
            console.error("Regular Order Mutation - Error:", error);
            throw error instanceof Error
               ? error
               : new Error("Unknown error occurred");
         }
      },
      onMutate: (variables) => {
         console.log("Regular Order Mutation - onMutate:", variables);
      },
      onSuccess: (data) => {
         console.log("Regular Order Mutation - onSuccess:", data);
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         if (data?.id) {
            queryClient.setQueryData(orderKeys.detail(data.id), data);
         }
         if (user) {
            queryClient.invalidateQueries({
               queryKey: orderKeys.userOrders(user.id),
            });
         }

<<<<<<< HEAD
         // Handle payment linking (if needed)
=======
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
         try {
            if (typeof window !== "undefined") {
               const ref = sessionStorage.getItem("kpay_reference");
               if (ref && data?.id) {
                  (async () => {
                     const maxAttempts = 3;
                     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        try {
                           const resp = await fetch("/api/payments/link", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                 orderId: data.id,
                                 reference: ref,
                              }),
                           });

<<<<<<< HEAD
                           if (resp.ok || resp.status === 409) {
=======
                           if (resp.ok) {
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
                              try {
                                 sessionStorage.removeItem("kpay_reference");
                              } catch (e) {}
                              break;
                           }

<<<<<<< HEAD
                           if (attempt < maxAttempts) {
                              await new Promise((r) =>
                                 setTimeout(r, 500 * attempt)
                              );
                           }
                        } catch (e) {
                           console.warn("Auto-link payment attempt failed:", e);
                        }
=======
                           // If the response is a 409 (already linked) treat as success
                           if (resp.status === 409) {
                              try {
                                 sessionStorage.removeItem("kpay_reference");
                              } catch (e) {}
                              break;
                           }

                           // Non-OK responses will retry unless last attempt
                           const body = await resp.json().catch(() => ({}));
                           console.warn("Auto-link attempt failed:", {
                              attempt,
                              body,
                           });
                        } catch (e) {
                           console.warn("Auto-link payment attempt failed:", e);
                        }

                        if (attempt < maxAttempts) {
                           // backoff
                           await new Promise((r) =>
                              setTimeout(r, 500 * attempt)
                           );
                        }
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
                     }
                  })();
               }
            }
         } catch (e) {}
      },
      onError: (error: Error) => {
<<<<<<< HEAD
         toast.error(error.message || "Failed to create order");
      },
   });
}

/**
 * Hook for updating order status
 */
=======
         console.error("Regular Order Mutation - onError:", error);
         toast.error(error.message || "Failed to create order");
      },
      onSettled: (data, error, variables) => {
         console.log("Regular Order Mutation - onSettled:", {
            data,
            error,
            variables,
         });
      },
   });
}

// Hook for updating order status
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useUpdateOrderStatus() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async ({
         id,
         status,
         additionalFields,
      }: {
         id: string;
         status: OrderStatus;
         additionalFields?: Partial<Order>;
      }) => {
<<<<<<< HEAD
         const updated = await orderAPI.updateOrderStatus(id, status);
         // Merge additional fields if provided
         return { ...updated, ...(additionalFields || {}) } as Order;
=======
         // Call server API which uses service role key to perform status change
         const res = await fetch("/api/orders/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status, additionalFields }),
         });
         if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
               body?.error || `Failed to update status: ${res.status}`
            );
         }
         const updated = await res.json();
         return updated as Order;
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      },
      onMutate: async ({ id, status, additionalFields }) => {
         await queryClient.cancelQueries({ queryKey: orderKeys.all });

         const previousQueries = queryClient.getQueriesData({});

         for (const [key, data] of previousQueries) {
            try {
               if (!data) continue;

<<<<<<< HEAD
=======
               // If this is a single order detail
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
               const asOrder = data as any;
               if (asOrder && asOrder.id === id) {
                  const updated = {
                     ...asOrder,
                     ...(additionalFields || {}),
                     status,
                  };
                  queryClient.setQueryData(key, updated);
                  continue;
               }

<<<<<<< HEAD
=======
               // If this is a paginated list with `.data` array
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
               if (asOrder && Array.isArray(asOrder.data)) {
                  const updatedList = { ...asOrder } as any;
                  updatedList.data = asOrder.data.map((o: any) =>
                     o && o.id === id
                        ? { ...o, ...(additionalFields || {}), status }
                        : o
                  );
                  queryClient.setQueryData(key, updatedList);
               }
            } catch (e) {}
         }

         return { previousQueries };
      },
      onSuccess: (updatedOrder) => {
<<<<<<< HEAD
=======
         // Update the specific order in cache with server response
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
         try {
            queryClient.setQueryData(
               orderKeys.detail(updatedOrder.id),
               updatedOrder
            );
         } catch (e) {}
<<<<<<< HEAD
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      },
      onError: (error, variables, context: any) => {
=======
         // Invalidate order lists to refetch authoritative data
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         // Invalidate stats
         queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      },
      onError: (error, variables, context: any) => {
         // rollback optimistic updates using the captured previousQueries
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
         if (context?.previousQueries) {
            for (const [key, data] of context.previousQueries) {
               try {
                  queryClient.setQueryData(key, data);
               } catch (e) {}
            }
         }
         console.error("Failed to update order status:", error);
      },
      onSettled: (data) => {
<<<<<<< HEAD
=======
         // Ensure lists and details are refreshed
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
         try {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
            if (data?.id) {
               queryClient.invalidateQueries({
                  queryKey: orderKeys.detail(data.id),
               });
            }
         } catch (e) {}
      },
   });
}

<<<<<<< HEAD
/**
 * Hook for requesting refund for an order item
 */
=======
// Hook for rejecting an order item
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useRejectOrderItem() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({
         orderItemId,
         reason,
<<<<<<< HEAD
=======
         adminInitiated,
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      }: {
         orderItemId: string;
         reason: string;
         adminInitiated?: boolean;
<<<<<<< HEAD
      }) => orderAPI.requestItemRefund(orderItemId, reason),
      onSuccess: () => {
         toast.success("Refund requested");
         queryClient.invalidateQueries({ queryKey: orderKeys.all });
      },
      onError: (err: any) => {
         const message = err?.message || "Failed to request refund";
         toast.error(message);
      },
   });
}

/**
 * Hook for canceling item refund request
 */
=======
      }) => requestRefundForItem(orderItemId, reason, Boolean(adminInitiated)),
      onMutate: async ({
         orderItemId,
         reason,
      }: {
         orderItemId: string;
         reason: string;
      }) => {
         await queryClient.cancelQueries({ queryKey: orderKeys.details() });
         await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

         const previousDetails = queryClient.getQueriesData({
            queryKey: orderKeys.details(),
         });
         const previousLists = queryClient.getQueriesData({
            queryKey: orderKeys.lists(),
         });

         // Optimistically mark item as refund_requested/requested
         for (const [key, data] of previousDetails) {
            try {
               const order = data as any;
               if (order && Array.isArray(order.items)) {
                  const idx = order.items.findIndex(
                     (it: any) => it.id === orderItemId
                  );
                  if (idx !== -1) {
                     const updated = { ...order };
                     updated.items = [...order.items];
                     updated.items[idx] = {
                        ...updated.items[idx],
                        refund_requested: true,
                        refund_reason: reason,
                        refund_status: "requested",
                        refund_requested_at: new Date().toISOString(),
                     };
                     queryClient.setQueryData(key, updated);
                  }
               }
            } catch (e) {}
         }

         for (const [key, data] of previousLists) {
            try {
               const list = data as any;
               if (list && Array.isArray(list.data)) {
                  const updatedList = { ...list };
                  updatedList.data = list.data.map((order: any) => {
                     if (!order.items) return order;
                     const itemIdx = order.items.findIndex(
                        (it: any) => it.id === orderItemId
                     );
                     if (itemIdx === -1) return order;
                     const updatedOrder = { ...order };
                     updatedOrder.items = [...order.items];
                     updatedOrder.items[itemIdx] = {
                        ...updatedOrder.items[itemIdx],
                        refund_requested: true,
                        refund_reason: reason,
                        refund_status: "requested",
                        refund_requested_at: new Date().toISOString(),
                     };
                     return updatedOrder;
                  });
                  queryClient.setQueryData(key, updatedList);
               }
            } catch (e) {}
         }

         return { previousDetails, previousLists };
      },
      onError: (err, variables, context: any) => {
         // rollback
         if (context?.previousDetails) {
            for (const [key, data] of context.previousDetails) {
               try {
                  queryClient.setQueryData(key, data);
               } catch (e) {}
            }
         }
         if (context?.previousLists) {
            for (const [key, data] of context.previousLists) {
               try {
                  queryClient.setQueryData(key, data);
               } catch (e) {}
            }
         }
         const message = err?.message || "Failed to request refund";
         toast.error(message);
      },
      onSettled: (data: any) => {
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         if (data?.order_id) {
            queryClient.invalidateQueries({
               queryKey: orderKeys.detail(data.order_id),
            });
         } else {
            queryClient.invalidateQueries({ queryKey: orderKeys.details() });
         }
      },
      onSuccess: () => {
         toast.success("Refund requested");
      },
   });
}

// Hook for un-rejecting an order item (undo rejection)
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useUnrejectOrderItem() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (orderItemId: string) =>
<<<<<<< HEAD
         orderAPI.cancelItemRefundRequest(orderItemId),
      onSuccess: () => {
         toast.success("Refund request cancelled");
         queryClient.invalidateQueries({ queryKey: orderKeys.all });
      },
      onError: (err) => {
         toast.error("Failed to cancel refund request");
      },
   });
}

/**
 * Hook for fetching refunded items (admin)
 */
export function useRefundedItems({
   page = 1,
   limit = 20,
   refundStatus,
}: { page?: number; limit?: number; refundStatus?: string } = {}) {
   const { user, hasRole } = useAuth();

   return useQuery({
      queryKey: ["orders", "refunded", { page, limit, refundStatus }],
      queryFn: () => orderAPI.getRefundedItems({ refundStatus, page, limit }),
      enabled: !!user && hasRole("admin"),
      staleTime: 0,
   });
}

/**
 * Main hook that provides all order-related functionality
 */
=======
         cancelRefundRequestForItem(orderItemId),
      onMutate: async (orderItemId: string) => {
         await queryClient.cancelQueries({ queryKey: orderKeys.details() });
         await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

         const previousDetails = queryClient.getQueriesData({
            queryKey: orderKeys.details(),
         });
         const previousLists = queryClient.getQueriesData({
            queryKey: orderKeys.lists(),
         });

         for (const [key, data] of previousDetails) {
            try {
               const order = data as any;
               if (order && Array.isArray(order.items)) {
                  const idx = order.items.findIndex(
                     (it: any) => it.id === orderItemId
                  );
                  if (idx !== -1) {
                     const updated = { ...order };
                     updated.items = [...order.items];
                     updated.items[idx] = {
                        ...updated.items[idx],
                        refund_requested: false,
                        refund_reason: null,
                        refund_status: "cancelled",
                        refund_requested_at: null,
                     };
                     queryClient.setQueryData(key, updated);
                  }
               }
            } catch (e) {}
         }

         for (const [key, data] of previousLists) {
            try {
               const list = data as any;
               if (list && Array.isArray(list.data)) {
                  const updatedList = { ...list };
                  updatedList.data = list.data.map((order: any) => {
                     if (!order.items) return order;
                     const itemIdx = order.items.findIndex(
                        (it: any) => it.id === orderItemId
                     );
                     if (itemIdx === -1) return order;
                     const updatedOrder = { ...order };
                     updatedOrder.items = [...order.items];
                     updatedOrder.items[itemIdx] = {
                        ...updatedOrder.items[itemIdx],
                        refund_requested: false,
                        refund_reason: null,
                        refund_status: "cancelled",
                        refund_requested_at: null,
                     };
                     return updatedOrder;
                  });
                  queryClient.setQueryData(key, updatedList);
               }
            } catch (e) {}
         }

         return { previousDetails, previousLists };
      },
      onError: (err, variables, context: any) => {
         if (context?.previousDetails) {
            for (const [key, data] of context.previousDetails) {
               try {
                  queryClient.setQueryData(key, data);
               } catch (e) {}
            }
         }
         if (context?.previousLists) {
            for (const [key, data] of context.previousLists) {
               try {
                  queryClient.setQueryData(key, data);
               } catch (e) {}
            }
         }
         toast.error("Failed to cancel refund request");
      },
      onSettled: (data: any) => {
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         if (data?.order_id) {
            queryClient.invalidateQueries({
               queryKey: orderKeys.detail(data.order_id),
            });
         } else {
            queryClient.invalidateQueries({ queryKey: orderKeys.details() });
         }
      },
      onSuccess: () => {
         toast.success("Refund request cancelled");
      },
   });
}

// Hook for deleting orders (admin only)
export function useDeleteOrder() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (id: string) => deleteOrder(id),
      onSuccess: (_, deletedId) => {
         // Remove from cache
         queryClient.removeQueries({ queryKey: orderKeys.detail(deletedId) });

         // Invalidate lists
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

         // Invalidate stats
         queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      },
      onError: (error) => {
         console.error("Failed to delete order:", error);
      },
   });
}

// Main hook that provides all order-related functionality
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export function useOrders() {
   const { user, isLoggedIn, hasRole } = useAuth();
   const queryClient = useQueryClient();

   const isAdmin = hasRole("admin");

   return {
      // Query hooks
      useUserOrders: (options?: OrderQueryOptions) =>
         useUserOrders(options || {}),
      useAllOrders: (options?: OrderQueryOptions) =>
         useAllOrders(options || {}),
      useOrder: (id: string) => useOrder(id),
<<<<<<< HEAD
      useOrderStats: () => {
         // TODO: Implement stats endpoint if needed
         return useQuery({
            queryKey: orderKeys.stats(),
            queryFn: async () => {
               // Placeholder - implement when backend has stats endpoint
               return {};
            },
            enabled: !!user && hasRole("admin"),
            staleTime: 1000 * 60 * 5,
         });
      },
=======
      useOrderStats: () => useOrderStats(),
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      useRequestRefundItem: () => useRejectOrderItem(),
      useCancelRefundRequestItem: () => useUnrejectOrderItem(),
      useRespondRefundRequest: () =>
         useMutation({
            mutationFn: ({
               itemId,
               approve,
<<<<<<< HEAD
=======
               note,
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
            }: {
               itemId: string;
               approve: boolean;
               note?: string;
<<<<<<< HEAD
            }) => orderAPI.respondToItemRefund(itemId, approve),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Refund response processed");
=======
            }) => respondToRefundRequest(itemId, approve, note),
            onSuccess: (updatedItem) => {
               // Try to merge the updated item row into any cached orders so UI updates immediately
               try {
                  const item = updatedItem as any;
                  const updatedItemId = item?.id;
                  const parentOrderId = item?.order_id;

                  // Update any cached order detail queries
                  const details = queryClient.getQueriesData({
                     queryKey: orderKeys.details(),
                  });
                  for (const [key, data] of details) {
                     try {
                        const order = data as any;
                        if (!order || !Array.isArray(order.items)) continue;
                        const idx = order.items.findIndex(
                           (it: any) => it.id === updatedItemId
                        );
                        if (idx !== -1) {
                           const updated = { ...order };
                           updated.items = [...order.items];
                           updated.items[idx] = {
                              ...updated.items[idx],
                              ...item,
                           };
                           queryClient.setQueryData(key, updated);
                        }
                     } catch (e) {}
                  }

                  // Update paginated lists
                  const lists = queryClient.getQueriesData({
                     queryKey: orderKeys.lists(),
                  });
                  for (const [key, data] of lists) {
                     try {
                        const list = data as any;
                        if (!list || !Array.isArray(list.data)) continue;
                        const updatedList = { ...list };
                        updatedList.data = list.data.map((order: any) => {
                           if (!order.items) return order;
                           const itemIdx = order.items.findIndex(
                              (it: any) => it.id === updatedItemId
                           );
                           if (itemIdx === -1) return order;
                           const updatedOrder = { ...order };
                           updatedOrder.items = [...order.items];
                           updatedOrder.items[itemIdx] = {
                              ...updatedOrder.items[itemIdx],
                              ...item,
                           };
                           return updatedOrder;
                        });
                        queryClient.setQueryData(key, updatedList);
                     } catch (e) {}
                  }

                  // Also update the specific order detail key if present
                  if (parentOrderId) {
                     const existing = queryClient.getQueryData(
                        orderKeys.detail(parentOrderId)
                     );
                     if (existing) {
                        const order = existing as any;
                        if (Array.isArray(order.items)) {
                           const idx = order.items.findIndex(
                              (it: any) => it.id === updatedItemId
                           );
                           if (idx !== -1) {
                              const updated = { ...order };
                              updated.items = [...order.items];
                              updated.items[idx] = {
                                 ...updated.items[idx],
                                 ...item,
                              };
                              queryClient.setQueryData(
                                 orderKeys.detail(parentOrderId),
                                 updated
                              );
                           }
                        }
                     }
                  }
               } catch (e) {
                  // fallback to invalidation
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.lists(),
                  });
               }

               queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
               try {
                  if (
                     (updatedItem as any)?.refund_status === "rejected" &&
                     (updatedItem as any)?._mode === "reject"
                  ) {
                     toast.success("Reject response processed");
                  } else {
                     toast.success("Refund response processed");
                  }
               } catch (e) {
                  toast.success("Refund response processed");
               }
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
            },
            onError: (err) => {
               console.error("Failed to respond to refund:", err);
               toast.error(err?.message || "Failed to process refund response");
            },
         }),
<<<<<<< HEAD
=======
      // Admin respond to full-order refunds
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      useRespondOrderRefund: () =>
         useMutation({
            mutationFn: ({
               orderId,
               approve,
<<<<<<< HEAD
=======
               note,
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
            }: {
               orderId: string;
               approve: boolean;
               note?: string;
<<<<<<< HEAD
            }) => orderAPI.respondToOrderRefund(orderId, approve),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
=======
            }) => respondToOrderRefundRequest(orderId, approve, note),
            onSuccess: (updatedOrder) => {
               try {
                  const order = updatedOrder as any;
                  const id = order?.id;

                  // Merge into order detail cache
                  const existing = queryClient.getQueryData(
                     orderKeys.detail(id)
                  );
                  if (existing) {
                     const merged = { ...(existing as any), ...order } as any;
                     if (
                        order?.refund_status === "approved" &&
                        Array.isArray(merged.items)
                     ) {
                        merged.items = merged.items.map((it: any) => ({
                           ...it,
                           refund_status:
                              it.refund_status === "requested"
                                 ? "approved"
                                 : it.refund_status,
                        }));
                        // When a full-order refund is approved, ensure order status reflects refunded
                        merged.status =
                           merged.status === "delivered"
                              ? "refunded"
                              : merged.status;
                     }
                     queryClient.setQueryData(orderKeys.detail(id), merged);
                  }

                  // Merge into list pages
                  const lists = queryClient.getQueriesData({
                     queryKey: orderKeys.lists(),
                  });
                  for (const [key, data] of lists) {
                     try {
                        const list = data as any;
                        if (!list || !Array.isArray(list.data)) continue;
                        const updatedList = { ...list };
                        updatedList.data = list.data.map((o: any) => {
                           if (o.id !== id) return o;
                           const merged = { ...o, ...order } as any;
                           if (
                              order?.refund_status === "approved" &&
                              Array.isArray(merged.items)
                           ) {
                              merged.items = merged.items.map((it: any) => ({
                                 ...it,
                                 refund_status:
                                    it.refund_status === "requested"
                                       ? "approved"
                                       : it.refund_status,
                              }));
                              // Ensure list items reflect overall refunded status
                              merged.status =
                                 merged.status === "delivered"
                                    ? "refunded"
                                    : merged.status;
                           }
                           return merged;
                        });
                        queryClient.setQueryData(key, updatedList);
                     } catch (e) {}
                  }
               } catch (e) {
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.lists(),
                  });
               }

               queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
               toast.success("Order refund response processed");
            },
            onError: (err) => {
               console.error("Failed to respond to order refund:", err);
               toast.error(
                  err?.message || "Failed to process order refund response"
               );
            },
         }),
<<<<<<< HEAD
=======

      // Hook to request full-order refund
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      useRequestRefundOrder: () =>
         useMutation({
            mutationFn: ({
               orderId,
               reason,
<<<<<<< HEAD
=======
               adminInitiated,
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
            }: {
               orderId: string;
               reason: string;
               adminInitiated?: boolean;
<<<<<<< HEAD
            }) => orderAPI.requestOrderRefund(orderId, reason),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Full-order refund requested");
            },
            onError: (err) => {
=======
            }) =>
               requestRefundForOrder(orderId, reason, Boolean(adminInitiated)),
            onMutate: async ({
               orderId,
               reason,
            }: {
               orderId: string;
               reason: string;
            }) => {
               await queryClient.cancelQueries({
                  queryKey: orderKeys.details(),
               });
               await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

               const previousDetails = queryClient.getQueriesData({
                  queryKey: orderKeys.details(),
               });
               const previousLists = queryClient.getQueriesData({
                  queryKey: orderKeys.lists(),
               });

               for (const [key, data] of previousDetails) {
                  try {
                     const order = data as any;
                     if (order && order.id === orderId) {
                        const updated = {
                           ...order,
                           refund_requested: true,
                           refund_reason: reason,
                           refund_status: "requested",
                           refund_requested_at: new Date().toISOString(),
                        };
                        queryClient.setQueryData(key, updated);
                     }
                  } catch (e) {}
               }

               for (const [key, data] of previousLists) {
                  try {
                     const list = data as any;
                     if (list && Array.isArray(list.data)) {
                        const updatedList = { ...list };
                        updatedList.data = list.data.map((order: any) => {
                           if (order.id !== orderId) return order;
                           return {
                              ...order,
                              refund_requested: true,
                              refund_reason: reason,
                              refund_status: "requested",
                              refund_requested_at: new Date().toISOString(),
                           };
                        });
                        queryClient.setQueryData(key, updatedList);
                     }
                  } catch (e) {}
               }

               return { previousDetails, previousLists };
            },
            onError: (err, vars, context: any) => {
               if (context?.previousDetails) {
                  for (const [key, data] of context.previousDetails) {
                     try {
                        queryClient.setQueryData(key, data);
                     } catch (e) {}
                  }
               }
               if (context?.previousLists) {
                  for (const [key, data] of context.previousLists) {
                     try {
                        queryClient.setQueryData(key, data);
                     } catch (e) {}
                  }
               }
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
               toast.error(
                  err?.message || "Failed to request full-order refund"
               );
            },
<<<<<<< HEAD
         }),
      useCancelRefundRequestOrder: () =>
         useMutation({
            mutationFn: (orderId: string) =>
               orderAPI.cancelOrderRefundRequest(orderId),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Full-order refund cancelled");
            },
            onError: (err) => {
               toast.error("Failed to cancel full-order refund request");
            },
         }),
      // Mutation hooks
      createOrder: useCreateOrder(),
      updateOrderStatus: useUpdateOrderStatus(),
      deleteOrder: () => {
         // TODO: Implement if backend has delete endpoint
         return useMutation({
            mutationFn: (id: string) => {
               throw new Error("Delete order not implemented");
            },
         });
      },
=======
            onSettled: (data: any) => {
               queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
               if (data?.id) {
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.detail(data.id),
                  });
               } else {
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.details(),
                  });
               }
            },
            onSuccess: () => {
               toast.success("Full-order refund requested");
            },
         }),

      // Hook to cancel full-order refund
      useCancelRefundRequestOrder: () =>
         useMutation({
            mutationFn: (orderId: string) =>
               cancelRefundRequestForOrder(orderId),
            onMutate: async (orderId: string) => {
               await queryClient.cancelQueries({
                  queryKey: orderKeys.details(),
               });
               await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

               const previousDetails = queryClient.getQueriesData({
                  queryKey: orderKeys.details(),
               });
               const previousLists = queryClient.getQueriesData({
                  queryKey: orderKeys.lists(),
               });

               for (const [key, data] of previousDetails) {
                  try {
                     const order = data as any;
                     if (order && order.id === orderId) {
                        const updated = {
                           ...order,
                           refund_requested: false,
                           refund_reason: null,
                           refund_status: "cancelled",
                           refund_requested_at: null,
                        };
                        queryClient.setQueryData(key, updated);
                     }
                  } catch (e) {}
               }

               for (const [key, data] of previousLists) {
                  try {
                     const list = data as any;
                     if (list && Array.isArray(list.data)) {
                        const updatedList = { ...list };
                        updatedList.data = list.data.map((order: any) => {
                           if (order.id !== orderId) return order;
                           return {
                              ...order,
                              refund_requested: false,
                              refund_reason: null,
                              refund_status: "cancelled",
                              refund_requested_at: null,
                           };
                        });
                        queryClient.setQueryData(key, updatedList);
                     }
                  } catch (e) {}
               }

               return { previousDetails, previousLists };
            },
            onError: (err, vars, context: any) => {
               if (context?.previousDetails) {
                  for (const [key, data] of context.previousDetails) {
                     try {
                        queryClient.setQueryData(key, data);
                     } catch (e) {}
                  }
               }
               if (context?.previousLists) {
                  for (const [key, data] of context.previousLists) {
                     try {
                        queryClient.setQueryData(key, data);
                     } catch (e) {}
                  }
               }
               toast.error("Failed to cancel full-order refund request");
            },
            onSettled: (data: any) => {
               queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
               if (data?.id) {
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.detail(data.id),
                  });
               } else {
                  queryClient.invalidateQueries({
                     queryKey: orderKeys.details(),
                  });
               }
            },
            onSuccess: () => {
               toast.success("Full-order refund cancelled");
            },
         }),

      // Mutation hooks
      createOrder: useCreateOrder(),
      updateOrderStatus: useUpdateOrderStatus(),
      deleteOrder: useDeleteOrder(),

>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      // Utility functions
      invalidateOrders: () => {
         queryClient.invalidateQueries({ queryKey: orderKeys.all });
      },
<<<<<<< HEAD
=======

>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      // Refunds
      useRefundedItems: (opts?: {
         page?: number;
         limit?: number;
         refundStatus?: string;
      }) => useRefundedItems(opts || {}),
<<<<<<< HEAD
      useOrderAssignment: (orderId?: string, enabled = true) =>
         useOrderAssignment(orderId, enabled),
      prefetchOrder: (id: string) => {
         return queryClient.prefetchQuery({
            queryKey: orderKeys.detail(id),
            queryFn: () => orderAPI.getOrderById(id),
            staleTime: 1000 * 60 * 5,
         });
      },
=======
      // Expose assignment hook so components can cache/reuse rider lookups
      useOrderAssignment: (orderId?: string, enabled = true) =>
         useOrderAssignment(orderId, enabled),

      prefetchOrder: (id: string) => {
         return queryClient.prefetchQuery({
            queryKey: orderKeys.detail(id),
            queryFn: () => fetchOrderById(id),
            staleTime: 1000 * 60 * 5,
         });
      },

>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      // User state
      user,
      isLoggedIn,
      isAdmin,
   };
}
