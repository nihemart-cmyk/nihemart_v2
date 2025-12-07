// Supabase client stub - no longer using Supabase, migrated to backend API
// This file exists to prevent import errors while code is being migrated

// Create a minimal stub that won't throw errors
const createStubClient = () => {
   return {
      auth: {
         getSession: async () => ({ data: { session: null }, error: null }),
         getUser: async () => ({ data: { user: null }, error: null }),
         signOut: async () => ({ error: null }),
         onAuthStateChange: () => ({ data: { subscription: null }, unsubscribe: () => {} }),
      },
      from: () => ({
         select: () => ({ data: [], error: null }),
         insert: () => ({ data: null, error: null }),
         update: () => ({ data: null, error: null }),
         delete: () => ({ data: null, error: null }),
         upsert: () => ({ data: null, error: null }),
      }),
      storage: {
         from: () => ({
            upload: async () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
            remove: async () => ({ data: null, error: null }),
         }),
      },
      channel: () => ({
         on: () => ({}),
         subscribe: () => ({}),
      }),
      removeChannel: () => {},
      rpc: () => ({ data: null, error: null }),
   } as any;
};

export const supabase = createStubClient();
