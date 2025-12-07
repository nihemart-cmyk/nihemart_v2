import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authorizedAPI, unauthorizedAPI } from "@/lib/api";
import handleApiRequest from "@/lib/handleApiRequest";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

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
export const riderKeys = {
   all: ["riders"] as const,
   lists: () => [...riderKeys.all, "list"] as const,
   list: (activeOnly = false) =>
      [...riderKeys.lists(), { activeOnly }] as const,
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
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
   });
}

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
   const { token } = useAuthStore();
   
   return useQuery({
      queryKey: riderKeys.myProfile(),
      queryFn: () => riderAPI.getMyRiderProfile(),
      enabled: !!token, // Only fetch if user is authenticated
      staleTime: 1000 * 10, // 10 seconds
      retry: false,
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
      },
      enabled: Boolean(userId),
      staleTime: 1000 * 10,
   });
}

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
      },
      onSuccess: () => {
         qc.invalidateQueries({ queryKey: riderKeys.all });
      },
   });
}

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
   });
}

export default useRiders;
