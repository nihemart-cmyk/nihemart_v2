import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { authorizedAPI, unauthorizedAPI } from "@/lib/api";
import handleApiRequest from "@/lib/handleApiRequest";
import { useAuth } from "@/hooks/useAuth";

// Types
export interface Rider {
   id: string;
   userId?: string | null;
   fullName?: string | null;
   phone?: string | null;
   vehicle?: string | null;
   imageUrl?: string | null;
   location?: string | null;
   active: boolean;
   createdAt: string;
   updatedAt: string;
}

export interface OrderAssignment {
   id: string;
   orderId: string;
   riderId?: string | null;
   status: "assigned" | "accepted" | "rejected" | "completed";
   assignedAt: string;
   respondedAt?: string | null;
   notes?: string | null;
   order?: any; // Order details when joined
}

export interface RiderInput {
   userId?: string | null;
   fullName?: string | null;
   phone?: string | null;
   vehicle?: string | null;
   imageUrl?: string | null;
   location?: string | null;
   active?: boolean;
}

// Query keys
=======
import {
   createRider,
   fetchRiders,
   assignOrderToRider,
   respondToAssignment,
   getAssignmentsForRider,
   fetchRiderByUserId,
   type Rider,
} from "@/integrations/supabase/riders";
import { useAuth } from "@/hooks/useAuth";

>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
export const riderKeys = {
   all: ["riders"] as const,
   lists: () => [...riderKeys.all, "list"] as const,
   list: (activeOnly = false) =>
      [...riderKeys.lists(), { activeOnly }] as const,
<<<<<<< HEAD
   details: () => [...riderKeys.all, "detail"] as const,
   detail: (id: string) => [...riderKeys.details(), id] as const,
   byUser: (userId: string) => [...riderKeys.all, "byUser", userId] as const,
   myProfile: () => [...riderKeys.all, "myProfile"] as const,
   assignments: (riderId: string) =>
      [...riderKeys.all, "assignments", riderId] as const,
   myAssignments: () => [...riderKeys.all, "myAssignments"] as const,
};

// Internal API functions
const riderAPI = {
   // Admin: List riders
   listRiders: async (activeOnly = false): Promise<Rider[]> => {
      return handleApiRequest(() =>
         authorizedAPI.get(`/riders?active=${activeOnly}`)
      );
   },

   // Admin: Get rider by ID
   getRiderById: async (id: string): Promise<Rider> => {
      return handleApiRequest(() => authorizedAPI.get(`/riders/${id}`));
   },

   // Admin: Create rider
   createRider: async (input: RiderInput): Promise<Rider> => {
      return handleApiRequest(() => authorizedAPI.post("/riders", input));
   },

   // Admin: Update rider
   updateRider: async (id: string, updates: RiderInput): Promise<Rider> => {
      return handleApiRequest(() =>
         authorizedAPI.put(`/riders/${id}`, updates)
      );
   },

   // Admin: Delete rider
   deleteRider: async (id: string): Promise<{ message: string }> => {
      return handleApiRequest(() => authorizedAPI.delete(`/riders/${id}`));
   },

   // Rider: Get my profile
   getMyRiderProfile: async (): Promise<Rider> => {
      return handleApiRequest(() => authorizedAPI.get("/riders/me/profile"));
   },

   // Rider: Get my assignments
   getMyAssignments: async (): Promise<OrderAssignment[]> => {
      return handleApiRequest(() => authorizedAPI.get("/riders/me/assignments"));
   },

   // Rider: Respond to assignment
   respondToAssignment: async (
      assignmentId: string,
      status: "accepted" | "rejected" | "completed"
   ): Promise<OrderAssignment> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/riders/assignments/${assignmentId}/respond`, {
            status,
         })
      );
   },

   // Admin: Assign order to rider
   assignOrderToRider: async (
      riderId: string,
      orderId: string,
      notes?: string
   ): Promise<OrderAssignment> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/riders/${riderId}/assign`, {
            orderId,
            notes,
         })
      );
   },

   // Admin: Reassign order to rider
   reassignOrderToRider: async (
      riderId: string,
      orderId: string,
      notes?: string
   ): Promise<OrderAssignment> => {
      return handleApiRequest(() =>
         authorizedAPI.post(`/riders/${riderId}/reassign`, {
            orderId,
            notes,
         })
      );
   },

   // Admin: Get assignments for rider
   getAssignmentsForRider: async (
      riderId: string
   ): Promise<OrderAssignment[]> => {
      return handleApiRequest(() =>
         authorizedAPI.get(`/riders/${riderId}/assignments`)
      );
   },
};

/**
 * Hook to get all riders (admin only)
 */
export function useRiders(activeOnly = false) {
   return useQuery({
      queryKey: riderKeys.list(activeOnly),
      queryFn: () => riderAPI.listRiders(activeOnly),
=======
   assignments: (riderId: string) =>
      [...riderKeys.all, "assignments", riderId] as const,
};

export function useRiders(activeOnly = false) {
   return useQuery({
      queryKey: riderKeys.list(activeOnly),
      queryFn: () => fetchRiders(activeOnly),
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
   });
}

<<<<<<< HEAD
/**
 * Hook to get rider by ID (admin only)
 */
export function useRiderById(id: string) {
   return useQuery({
      queryKey: riderKeys.detail(id),
      queryFn: () => riderAPI.getRiderById(id),
      enabled: !!id,
   });
}

/**
 * Hook to get my rider profile (rider only)
 */
export function useMyRiderProfile() {
   return useQuery({
      queryKey: riderKeys.myProfile(),
      queryFn: () => riderAPI.getMyRiderProfile(),
      staleTime: 1000 * 10, // 10 seconds
   });
}

/**
 * Hook to get rider by user ID (for compatibility)
 */
export function useRiderByUserId(userId?: string) {
   return useQuery({
      queryKey: riderKeys.byUser(userId || ""),
      queryFn: async () => {
         if (!userId) return null;
         // Try to get my profile first, then fallback to admin endpoint if needed
         try {
            return await riderAPI.getMyRiderProfile();
         } catch {
            // If not a rider, return null
            return null;
         }
=======
export function useCreateRider() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (payload: Partial<Rider>) => {
         // Call the server-side API so the service role creates the rider and we avoid RLS issues
         const res = await fetch("/api/admin/create-rider", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         });
         if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || "Failed to create rider");
         }
         const json = await res.json();
         qc.invalidateQueries({ queryKey: riderKeys.lists() });
         return json.rider;
      },
   });
}

export function useUpdateRider() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({ riderId, updates }: any) => {
         const res = await fetch(
            `/api/rider/update?riderId=${encodeURIComponent(riderId)}`,
            {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ updates }),
            }
         );
         if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || "Failed to update rider");
         }
         const json = await res.json();
         // Invalidate lists and the per-user rider cache so UI updates in realtime
         qc.invalidateQueries({ queryKey: riderKeys.lists() });
         try {
            const updated = json.rider as any;
            // The shared query key uses the auth user id (user_id) not the riders row id
            if (updated && updated.user_id) {
               qc.invalidateQueries({
                  queryKey: ["rider", "byUser", updated.user_id],
               });
            }
         } catch (e) {
            // best-effort
         }
         return json.rider;
      },
   });
}

export function useRiderByUserId(userId?: string) {
   return useQuery({
      queryKey: ["rider", "byUser", userId || ""],
      queryFn: async () => {
         if (!userId) return null;
         const r = await fetchRiderByUserId(userId);
         return r;
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      },
      enabled: Boolean(userId),
      staleTime: 1000 * 10,
   });
}

<<<<<<< HEAD
/**
 * Hook to get my assignments (rider only)
 */
export function useMyAssignments() {
   return useQuery({
      queryKey: riderKeys.myAssignments(),
      queryFn: () => riderAPI.getMyAssignments(),
      staleTime: 1000 * 10, // 10 seconds
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
   });
}

/**
 * Hook to get assignments for a specific rider (admin only)
 */
export function useRiderAssignments(riderId?: string) {
   const { user } = useAuth();

   return useQuery({
      queryKey: riderKeys.assignments(riderId || ""),
      queryFn: async () => {
         if (!riderId) return [];

         // If user is a rider and this is their own ID, use my assignments endpoint
         if (user && user.roles.includes("rider")) {
            try {
               const myProfile = await riderAPI.getMyRiderProfile();
               if (myProfile.id === riderId) {
                  return await riderAPI.getMyAssignments();
               }
            } catch {
               // Fall through to admin endpoint
            }
         }

         // Admin endpoint or different rider
         return await riderAPI.getAssignmentsForRider(riderId);
      },
      enabled: Boolean(riderId),
      staleTime: 1000 * 10,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
   });
}

/**
 * Hook to create rider (admin only)
 */
export function useCreateRider() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (payload: RiderInput) => {
         return riderAPI.createRider(payload);
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.lists() });
      },
   });
}

/**
 * Hook to update rider (admin or rider for own profile)
 */
export function useUpdateRider() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         riderId,
         updates,
      }: {
         riderId: string;
         updates: RiderInput;
      }) => {
         return riderAPI.updateRider(riderId, updates);
      },
      onSuccess: (data) => {
         qc.invalidateQueries({ queryKey: riderKeys.lists() });
         qc.invalidateQueries({ queryKey: riderKeys.detail(data.id) });
         qc.invalidateQueries({ queryKey: riderKeys.myProfile() });
         if (data.userId) {
            qc.invalidateQueries({ queryKey: riderKeys.byUser(data.userId) });
         }
      },
   });
}

/**
 * Hook to delete rider (admin only)
 */
export function useDeleteRider() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (id: string) => {
         return riderAPI.deleteRider(id);
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.lists() });
      },
   });
}

/**
 * Hook to assign order to rider (admin only)
 */
export function useAssignOrder() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         orderId,
         riderId,
         notes,
      }: {
         orderId: string;
         riderId: string;
         notes?: string;
      }) => {
         return riderAPI.assignOrderToRider(riderId, orderId, notes);
=======
export function useAssignOrder() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({ orderId, riderId, notes }: any) => {
         // Call server-side API so the service role validates order state
         const res = await fetch(`/api/admin/assign-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, riderId, notes }),
         });
         if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            // Server returns { error: { code, message } }
            const errObj = json.error;
            const message =
               (errObj && errObj.message) ||
               json.error ||
               "Failed to assign order";
            const err = new Error(message);
            // Attach server status / code for downstream handling
            (err as any).status = res.status;
            (err as any).serverError = errObj || json;
            throw err;
         }
         const json = await res.json();
         return json.assignment;
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.all });
      },
   });
}

<<<<<<< HEAD
/**
 * Hook to reassign order to rider (admin only)
 */
export function useReassignOrder() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         orderId,
         riderId,
         notes,
      }: {
         orderId: string;
         riderId: string;
         notes?: string;
      }) => {
         return riderAPI.reassignOrderToRider(riderId, orderId, notes);
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.all });
      },
   });
}

/**
 * Hook to respond to assignment (rider only)
 */
export function useRespondToAssignment() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         assignmentId,
         status,
      }: {
         assignmentId: string;
         status: "accepted" | "rejected" | "completed";
      }) => {
         return riderAPI.respondToAssignment(assignmentId, status);
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.all });
      },
=======
// Admin: reassign an order to a different rider
export function useReassignOrder() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({ orderId, riderId, notes }: any) => {
         const res = await fetch(`/api/admin/reassign-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, riderId, notes }),
         });
         if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const errObj = json.error;
            const message =
               (errObj && errObj.message) ||
               json.error ||
               "Failed to reassign order";
            const err = new Error(message);
            (err as any).status = res.status;
            (err as any).serverError = errObj || json;
            throw err;
         }
         const json = await res.json();
         return json.assignment;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: riderKeys.all }),
   });
}

export function useRespondToAssignment() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({ assignmentId, status }: any) => {
         // Use server-side API route so the service role performs the update
         // (prevents RLS/permission issues when running from the browser).
         const res = await fetch(`/api/rider/respond-assignment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignmentId, status }),
         });
         if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const errObj = json.error;
            // If server returned structured error use its message
            throw new Error(
               (errObj && (errObj.message || errObj)) ||
                  json.error ||
                  "Failed to respond to assignment"
            );
         }
         const json = await res.json();
         return json.assignment;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: riderKeys.all }),
   });
}

export function useRiderAssignments(riderId?: string) {
   const { session } = useAuth();

   return useQuery({
      queryKey: riderKeys.assignments(riderId || ""),
      // If riderId is not provided or empty, disable the query entirely to avoid
      // making requests from admin/user pages that import this hook.
      queryFn: async () => {
         if (!riderId) return [] as any[];

         // If running in the browser prefer the server-side API route which uses the
         // service role to include joined order items even when RLS would block direct joins.
         if (typeof window !== "undefined") {
            // Require an auth token to call the rider endpoint
            const token = session?.access_token;
            const headers: Record<string, string> = {
               "Content-Type": "application/json",
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(
               `/api/rider/assignments?riderId=${encodeURIComponent(riderId)}`,
               { headers }
            );
            if (!res.ok) {
               const json = await res.json().catch(() => ({}));
               throw new Error(json.error || "Failed to fetch assignments");
            }
            const json = await res.json();
            return json.assignments || [];
         }

         // On the server or when the API is not available, fall back to direct supabase call
         return getAssignmentsForRider(riderId);
      },
      // ensure the query is disabled when riderId is falsy OR when not on the
      // rider portal path (prevents admin/user pages from triggering the
      // rider assignments API accidentally). Also ensure we have an access token.
      enabled:
         Boolean(riderId) &&
         typeof window !== "undefined" &&
         (window.location.pathname || "").startsWith("/rider") &&
         !!session?.access_token,
      // Safety: don't retry on failure (prevents infinite retry loops)
      retry: false,
      // Avoid aggressive refetching when window focus or reconnects occur
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Keep data fresh for a short time in case of transient UI updates
      staleTime: 1000 * 10, // 10s
>>>>>>> f3f7477e34a7b7ab8c2edc0fa2c4ed4f323ac3c6
   });
}

export default useRiders;
