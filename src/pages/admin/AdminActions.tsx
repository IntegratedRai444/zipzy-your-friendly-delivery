import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Shield, UserCheck, UserX, FileCheck, FileX } from 'lucide-react';
import { format } from 'date-fns';

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  description: string | null;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  grant_admin: <Shield className="w-4 h-4 text-green-500" />,
  remove_admin: <Shield className="w-4 h-4 text-red-500" />,
  approve_verification: <FileCheck className="w-4 h-4 text-green-500" />,
  reject_verification: <FileX className="w-4 h-4 text-red-500" />,
  ban_user: <UserX className="w-4 h-4 text-red-500" />,
  unban_user: <UserCheck className="w-4 h-4 text-green-500" />,
};

export const AdminActions = () => {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setActions(data || []);
      } catch (error) {
        console.error('Error fetching admin actions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Admin Action Logs</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Admin ID</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading action logs...
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No admin actions recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {actionIcons[action.action_type] || <ClipboardList className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                          {action.action_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{action.target_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                      {action.description || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {action.admin_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(action.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
