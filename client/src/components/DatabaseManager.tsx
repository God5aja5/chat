import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  HardDrive,
  Clock,
  FileText,
  Eye
} from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";

interface DatabaseBackup {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  backupType: "full" | "incremental";
  createdAt: string;
}

interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  databaseSize: string;
  lastBackup?: string;
}

export function DatabaseManager() {
  const [viewData, setViewData] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ["/api/admin/database/backups"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/database/stats"],
  });

  const createBackupMutation = useMutation({
    mutationFn: async (type: "full" | "incremental") => {
      return await apiRequest("/api/admin/database/backup", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/stats"] });
      toast({
        title: "Success",
        description: "Database backup created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create database backup",
        variant: "destructive",
      });
    },
  });

  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/admin/database/backup/${backupId}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database backup downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to download database backup",
        variant: "destructive",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      return await apiRequest(`/api/admin/database/backup/${backupId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
      toast({
        title: "Success",
        description: "Database backup deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete database backup",
        variant: "destructive",
      });
    },
  });

  const viewDatabaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/database/view", {
        method: "GET",
      });
    },
    onSuccess: (data) => {
      setViewData(data);
      setIsViewDialogOpen(true);
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to fetch database data",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalTables || 0}</div>
                <div className="text-sm text-muted-foreground">Tables</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.totalRows || 0}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.databaseSize || "0 MB"}</div>
                <div className="text-sm text-muted-foreground">Database Size</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{backups?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Backups</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => createBackupMutation.mutate("full")}
              disabled={createBackupMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-create-full-backup"
            >
              <Download className="h-4 w-4" />
              Create Full Backup
            </Button>
            
            <Button 
              onClick={() => createBackupMutation.mutate("incremental")}
              disabled={createBackupMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-create-incremental-backup"
            >
              <Download className="h-4 w-4" />
              Create Incremental Backup
            </Button>

            <Button 
              onClick={() => viewDatabaseMutation.mutate()}
              disabled={viewDatabaseMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-view-database"
            >
              <Eye className="h-4 w-4" />
              View Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : !backups?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups found. Create your first backup above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup: DatabaseBackup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`backup-${backup.id}`}>
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-semibold">{backup.fileName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatBytes(backup.fileSize)} • {formatDate(backup.createdAt)}
                      </div>
                    </div>
                    <Badge variant={backup.backupType === "full" ? "default" : "secondary"}>
                      {backup.backupType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBackupMutation.mutate(backup.id)}
                      disabled={downloadBackupMutation.isPending}
                      data-testid={`button-download-${backup.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBackupMutation.mutate(backup.id)}
                      disabled={deleteBackupMutation.isPending}
                      data-testid={`button-delete-${backup.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Database Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Database Structure & Data</DialogTitle>
            <DialogDescription>
              Overview of your database tables and sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {viewData && Object.entries(viewData).map(([tableName, tableData]: [string, any]) => (
              <div key={tableName} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 capitalize">{tableName.replace('_', ' ')}</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  {Array.isArray(tableData) ? `${tableData.length} records` : 'No data'}
                </div>
                {Array.isArray(tableData) && tableData.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(tableData[0]).map(key => (
                            <th key={key} className="text-left p-2 font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.slice(0, 5).map((row: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            {Object.values(row).map((value: any, valueIdx: number) => (
                              <td key={valueIdx} className="p-2 truncate max-w-[200px]">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tableData.length > 5 && (
                      <div className="text-center py-2 text-muted-foreground">
                        ... and {tableData.length - 5} more records
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}