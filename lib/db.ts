export const db = {
  query: async (sql: string, params?: any[]) => {
    return [];
  },
  insert: async (sql: string, params?: any[]) => {
    return { id: Date.now() };
  },
};
