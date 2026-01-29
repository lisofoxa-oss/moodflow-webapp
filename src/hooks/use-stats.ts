import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type StatsResponse } from "@shared/schema";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      return data as StatsResponse;
    },
    // Don't refetch automatically, we'll rely on WebSocket updates
    refetchOnWindowFocus: false,
    staleTime: Infinity, 
  });
}
