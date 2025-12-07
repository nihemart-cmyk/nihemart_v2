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
      from: () => {
         // Create a chainable query builder
         const createQueryBuilder = () => {
            const builder = {
               data: [],
               error: null,
               order: function() { return this; },
               eq: function() { return this; },
               neq: function() { return this; },
               gt: function() { return this; },
               gte: function() { return this; },
               lt: function() { return this; },
               lte: function() { return this; },
               like: function() { return this; },
               ilike: function() { return this; },
               in: function() { return this; },
               is: function() { return this; },
               or: function() { return this; },
               limit: function() { return this; },
               range: function() { return this; },
            };
            // Make it awaitable (returns a promise that resolves to itself)
            return Promise.resolve(builder);
         };
         
         return {
            select: createQueryBuilder,
            insert: () => ({ data: null, error: null }),
            update: () => ({
               data: null,
               error: null,
               eq: function() { return this; },
               neq: function() { return this; },
            }),
            delete: () => ({
               data: null,
               error: null,
               eq: function() { return this; },
            }),
            upsert: () => ({ data: null, error: null }),
            order: function() { return this; },
            eq: function() { return this; },
            neq: function() { return this; },
            gt: function() { return this; },
            gte: function() { return this; },
            lt: function() { return this; },
            lte: function() { return this; },
            like: function() { return this; },
            ilike: function() { return this; },
            in: function() { return this; },
            limit: function() { return this; },
            range: function() { return this; },
         };
      },
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
