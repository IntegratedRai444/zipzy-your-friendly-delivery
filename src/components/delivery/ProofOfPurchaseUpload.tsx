import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Camera, Check, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProofOfPurchaseUploadProps {
  deliveryRequestId: string;
  onUploaded?: (url: string) => void;
  existingProofUrl?: string | null;
}

export const ProofOfPurchaseUpload: React.FC<ProofOfPurchaseUploadProps> = ({
  deliveryRequestId,
  onUploaded,
  existingProofUrl,
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
  const [actualPrice, setActualPrice] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) {
      toast.error('Please select a receipt image');
      return;
    }

    if (!actualPrice || isNaN(parseFloat(actualPrice))) {
      toast.error('Please enter a valid actual price');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${deliveryRequestId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('purchase-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('purchase-proofs')
        .getPublicUrl(fileName);

      // 3. Call Backend API to finalize price and status
      const { data, error } = await supabase.functions.invoke('zipzy-backend', {
        body: {
          method: 'POST',
          path: `/api/deliveries/${deliveryRequestId}/proof`,
          body: {
            actual_item_price: parseFloat(actualPrice),
            purchase_proof_url: urlData.publicUrl
          }
        }
      });

      // SINCE we don't have Edge Functions setup like this usually, let's use standard fetch/axios if available.
      // Assuming api.ts or similar is used. 
      // Actually, looking at the code, it uses supabase direct or axios.
      // Let's use a standard fetch to the NODE backend.
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deliveries/${deliveryRequestId}/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          actual_item_price: parseFloat(actualPrice),
          purchase_proof_url: urlData.publicUrl
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setPreviewUrl(urlData.publicUrl);
      toast.success('Receipt and price submitted successfully!');
      onUploaded?.(urlData.publicUrl);
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast.error(error.message || 'Failed to submit purchase proof');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Proof of Purchase</p>
        {previewUrl && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Uploaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelect}
      />

      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Actual Item Price (₹)</label>
            <input
              type="number"
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              placeholder="e.g. 110"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button 
            className="shrink-0" 
            onClick={handleUpload}
            disabled={uploading || !actualPrice}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Submit for Billing
          </Button>
        </div>

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Purchase proof"
              className="w-full h-40 object-cover rounded-lg border border-border"
            />
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-2 right-2 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-4 h-4" />
              Replace Photo
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload Receipt Photo</p>
                <p className="text-xs text-muted-foreground">
                  Take a photo of the bill or receipt
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        📸 Upload a photo of the receipt or bill as proof of purchase. This helps protect both parties.
      </p>
    </div>
  );
};
