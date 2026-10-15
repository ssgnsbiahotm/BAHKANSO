// Types mínimaux pour Supabase - À compléter avec le schéma réel si nécessaire
export interface Database {
  public: {
    Tables: {
      [tableName: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
  };
}