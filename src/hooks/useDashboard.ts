import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => dashboardApi.getDashboardSummary(user!.id),
    enabled: Boolean(user),
  });
}
