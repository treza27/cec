import { supabase } from './supabase';

const PAGE_SIZE = 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fetches all rows from a Supabase table by paginating in batches of 1000.
 * Supabase's default row limit is 1000 per request — this bypasses it
 * by looping with .range() until no more rows are returned.
 */
export async function fetchAll<T = any>(
  table: string,
  select = '*',
  options?: {
    filter?: (query: any) => any;
    order?: { column: string; ascending?: boolean };
  },
): Promise<T[]> {
  let allRows: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select);

    if (options?.filter) {
      query = options.filter(query);
    }

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows = allRows.concat(data as T[]);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}
