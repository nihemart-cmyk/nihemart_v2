import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
   const keyWithOptions = [...key, { ...(options || {}) }];

   return useQuery({
      queryKey: keyWithOptions,
      queryFn: () => orderAPI.getUserOrders(options),
      enabled: isLoggedIn && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
   });
}

/**
 * Hook for fetching all orders (admin only)
 */
export function useAllOrders(options: OrderQueryOptions = {}) {
   const { user, hasRole } = useAuth();

   return useQuery({
      queryKey: orderKeys.list(options),
      queryFn: () => orderAPI.getAllOrders(options),
      enabled: !!user && hasRole("admin"),
      staleTime: 0, // Disable stale time to always refetch
   });
}

/**
 * Hook for fetching single order
 */
export function useOrder(id: string) {
   const { user, isLoggedIn } = useAuth();

   return useQuery({
      queryKey: orderKeys.detail(id),
      queryFn: () => orderAPI.getOrderById(id),
      enabled: isLoggedIn && !!user && !!id,
   });
}

/**
 * Hook to fetch and cache the latest rider assignment for an order
 */
export function useOrderAssignment(orderId?: string, enabled = true) {
   const { user, isLoggedIn } = useAuth();

   return useQuery({
      queryKey: ["orders", "assignment", orderId],
      queryFn: async () => {
         if (!orderId) return null as any;
         // Get order which includes assignment info
         const order = await orderAPI.getOrderById(orderId);
         return order?.rider || null;
      },
      enabled: Boolean(orderId) && enabled && isLoggedIn && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
   });
}

/**
 * Hook for creating orders
 */
export function useCreateOrder() {
   const queryClient = useQueryClient();
   const { user } = useAuth();

   return useMutation<Order, Error, CreateOrderRequest>({
      mutationFn: async (orderData: CreateOrderRequest) => {
         if (!orderData.order || !orderData.items) {
            throw new Error("Invalid order data structure");
         }
         
         const result = await orderAPI.createOrder(orderData);
         return result;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         if (data?.id) {
            queryClient.setQueryData(orderKeys.detail(data.id), data);
         }
         if (user) {
            queryClient.invalidateQueries({
               queryKey: orderKeys.userOrders(user.id),
            });
         }

         // Handle payment linking (if needed)
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

                           if (resp.ok || resp.status === 409) {
                              try {
                                 sessionStorage.removeItem("kpay_reference");
                              } catch (e) {}
                              break;
                           }

                           if (attempt < maxAttempts) {
                              await new Promise((r) =>
                                 setTimeout(r, 500 * attempt)
                              );
                           }
                        } catch (e) {
                           console.warn("Auto-link payment attempt failed:", e);
                        }
                     }
                  })();
               }
            }
         } catch (e) {}
      },
      onError: (error: Error) => {
         toast.error(error.message || "Failed to create order");
      },
   });
}

/**
 * Hook for updating order status
 */
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
         const updated = await orderAPI.updateOrderStatus(id, status);
         // Merge additional fields if provided
         return { ...updated, ...(additionalFields || {}) } as Order;
      },
      onMutate: async ({ id, status, additionalFields }) => {
         await queryClient.cancelQueries({ queryKey: orderKeys.all });

         const previousQueries = queryClient.getQueriesData({});

         for (const [key, data] of previousQueries) {
            try {
               if (!data) continue;

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
         try {
            queryClient.setQueryData(
               orderKeys.detail(updatedOrder.id),
               updatedOrder
            );
         } catch (e) {}
         queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
         queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      },
      onError: (error, variables, context: any) => {
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

/**
 * Hook for requesting refund for an order item
 */
export function useRejectOrderItem() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({
         orderItemId,
         reason,
      }: {
         orderItemId: string;
         reason: string;
         adminInitiated?: boolean;
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
export function useUnrejectOrderItem() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (orderItemId: string) =>
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
      useRequestRefundItem: () => useRejectOrderItem(),
      useCancelRefundRequestItem: () => useUnrejectOrderItem(),
      useRespondRefundRequest: () =>
         useMutation({
            mutationFn: ({
               itemId,
               approve,
            }: {
               itemId: string;
               approve: boolean;
               note?: string;
            }) => orderAPI.respondToItemRefund(itemId, approve),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Refund response processed");
            },
            onError: (err) => {
               console.error("Failed to respond to refund:", err);
               toast.error(err?.message || "Failed to process refund response");
            },
         }),
      useRespondOrderRefund: () =>
         useMutation({
            mutationFn: ({
               orderId,
               approve,
            }: {
               orderId: string;
               approve: boolean;
               note?: string;
            }) => orderAPI.respondToOrderRefund(orderId, approve),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Order refund response processed");
            },
            onError: (err) => {
               console.error("Failed to respond to order refund:", err);
               toast.error(
                  err?.message || "Failed to process order refund response"
               );
            },
         }),
      useRequestRefundOrder: () =>
         useMutation({
            mutationFn: ({
               orderId,
               reason,
            }: {
               orderId: string;
               reason: string;
               adminInitiated?: boolean;
            }) => orderAPI.requestOrderRefund(orderId, reason),
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: orderKeys.all });
               toast.success("Full-order refund requested");
            },
            onError: (err) => {
               toast.error(
                  err?.message || "Failed to request full-order refund"
               );
            },
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
      // Utility functions
      invalidateOrders: () => {
         queryClient.invalidateQueries({ queryKey: orderKeys.all });
      },
      // Refunds
      useRefundedItems: (opts?: {
         page?: number;
         limit?: number;
         refundStatus?: string;
      }) => useRefundedItems(opts || {}),
      useOrderAssignment: (orderId?: string, enabled = true) =>
         useOrderAssignment(orderId, enabled),
      prefetchOrder: (id: string) => {
         return queryClient.prefetchQuery({
            queryKey: orderKeys.detail(id),
            queryFn: () => orderAPI.getOrderById(id),
            staleTime: 1000 * 60 * 5,
         });
      },
      // User state
      user,
      isLoggedIn,
      isAdmin,
   };
}
