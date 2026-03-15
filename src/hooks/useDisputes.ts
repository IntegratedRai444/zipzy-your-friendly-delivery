import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyDisputeUpdate } from '@/hooks/useTriggerPushNotification';

export interface Dispute {
  id: string;
  delivery_request_id: string;
  raised_by: string;
  against_user_id: string;
  reason: string;
  description: string | null;
  evidence_urls: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution: string | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisputeData {
  delivery_request_id: string;
  against_user_id: string;
  reason: string;
  description?: string;
  evidence_urls?: string[];
}

export const useDisputes = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching disputes:', error);
    } else {
      setDisputes((data || []) as Dispute[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const createDispute = async (disputeData: CreateDisputeData) => {
    if (!user) {
      toast.error('Please sign in to raise a dispute');
      return null;
    }

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        raised_by: user.id,
        ...disputeData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to raise dispute');
      return null;
    }

    // Notify the user that the dispute was created
    notifyDisputeUpdate(user.id, 'open');

    toast.success('Dispute raised successfully. Our team will review it shortly.');
    await fetchDisputes();
    return data as Dispute;
  };

  const uploadEvidence = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('dispute-evidence')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Failed to upload evidence');
      return null;
    }

    const { data } = supabase.storage
      .from('dispute-evidence')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    disputes,
    loading,
    createDispute,
    uploadEvidence,
    refetch: fetchDisputes,
  };
};
