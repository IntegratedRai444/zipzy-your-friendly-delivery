import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Verification {
  id: string;
  user_id: string;
  verification_type: string;
  document_url: string | null;
  status: string;
  rejected_reason: string | null;
  created_at: string;
}

export const AdminVerifications = () => {
  const { user: currentUser } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (verification: Verification) => {
    setProcessing(true);
    try {
      // Update verification status
      const { error: verifyError } = await supabase
        .from('user_verifications')
        .update({ status: 'approved', verified_at: new Date().toISOString() })
        .eq('id', verification.id);

      if (verifyError) throw verifyError;

      // Update profile verification status
      await supabase
        .from('profiles')
        .update({ is_verified: true, verification_status: 'approved' })
        .eq('user_id', verification.user_id);

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUser?.id,
        action_type: 'approve_verification',
        target_type: 'verification',
        target_id: verification.id,
        description: `Approved ${verification.verification_type} verification`
      });

      toast.success('Verification approved');
      setSelected(null);
      fetchVerifications();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (verification: Verification) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_verifications')
        .update({ status: 'rejected', rejected_reason: rejectReason })
        .eq('id', verification.id);

      if (error) throw error;

      // Update profile
      await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('user_id', verification.user_id);

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUser?.id,
        action_type: 'reject_verification',
        target_type: 'verification',
        target_id: verification.id,
        description: `Rejected: ${rejectReason}`
      });

      toast.success('Verification rejected');
      setSelected(null);
      setRejectReason('');
      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">User Verifications</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading verifications...
                  </TableCell>
                </TableRow>
              ) : verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No verifications submitted
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{v.verification_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {v.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{statusBadge(v.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(v.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelected(v)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selected.verification_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {statusBadge(selected.status)}
                </div>
              </div>

              {selected.document_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Document</p>
                  <a
                    href={selected.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline text-sm"
                  >
                    View Document
                  </a>
                </div>
              )}

              {selected.status === 'pending' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Rejection Reason (if rejecting)</p>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selected)}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selected)}
                      disabled={processing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selected.status === 'rejected' && selected.rejected_reason && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Rejection reason:</strong> {selected.rejected_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
