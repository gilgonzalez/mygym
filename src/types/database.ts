// Los tipos generados por Supabase ahora viven en @mygym/shared, para poder
// reutilizarse también desde apps/mobile. Este archivo solo re-exporta para
// no romper los imports existentes (`@/types/database`) dentro de apps/web.
export * from '@mygym/shared/types/database'
