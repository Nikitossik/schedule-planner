import { useMutation } from "@tanstack/react-query";
import { useProtectedFetch } from "./useProtectedFetch";
import { toast } from "sonner";

export function useScheduleExport() {
  const protectedFetch = useProtectedFetch();

  const exportSchedule = useMutation({
    mutationFn: async ({ scheduleId, format, groupIds, filename }) => {
      const params = new URLSearchParams({
        format: format,
      });

    
      if (groupIds && groupIds.length > 0) {
        groupIds.forEach((id) => params.append("group_ids", id));
      }

  
      if (filename) {
        params.append("filename", filename);
      }

      const endpoint = `http://localhost:8000/api/schedule/${scheduleId}/export?${params}`;

      const response = await protectedFetch(endpoint, { method: "GET" });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Export failed");
      }

     
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const downloadFilename = filenameMatch
        ? filenameMatch[1]
        : `${filename || "schedule"}.${format === "excel" ? "xlsx" : "pdf"}`;

      return {
        blob,
        filename: downloadFilename,
        format,
      };
    },
    onSuccess: ({ blob, filename, format }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename; 
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success(`${format.toUpperCase()} file downloaded successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to export file: ${error.message}`);
    },
  });

  return {
    exportSchedule: exportSchedule.mutate,
    isExporting: exportSchedule.isPending,
    error: exportSchedule.error,
  };
}
