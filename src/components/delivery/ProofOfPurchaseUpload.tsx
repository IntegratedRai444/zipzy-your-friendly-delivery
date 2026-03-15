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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${deliveryRequestId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('purchase-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('purchase-proofs')
        .getPublicUrl(fileName);

      // Update delivery request
      const { error: updateError } = await supabase
        .from('delivery_requests')
        .update({
          purchase_proof_url: urlData.publicUrl,
          purchase_proof_uploaded_at: new Date().toISOString(),
        })
        .eq('id', deliveryRequestId);

      if (updateError) throw updateError;

      toast.success('Purchase proof uploaded successfully!');
      onUploaded?.(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Failed to upload purchase proof');
      setPreviewUrl(existingProofUrl || null);
    } finally {
      setUploading(false);
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
        onChange={handleFileChange}
      />

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
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Replace
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        📸 Upload a photo of the receipt or bill as proof of purchase. This helps protect both parties.
      </p>
    </div>
  );
};
