import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { useDisputes } from '@/hooks/useDisputes';

interface RaiseDisputeDialogProps {
  deliveryRequestId: string;
  againstUserId: string;
  trigger?: React.ReactNode;
  onDisputed?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DISPUTE_REASONS = [
  { value: 'wrong_item', label: 'Wrong item delivered' },
  { value: 'damaged_item', label: 'Item damaged' },
  { value: 'item_not_delivered', label: 'Item not delivered' },
  { value: 'no_show', label: 'Partner didn\'t show up' },
  { value: 'overcharged', label: 'Overcharged for item' },
  { value: 'rude_behavior', label: 'Rude behavior' },
  { value: 'fraud', label: 'Suspected fraud' },
  { value: 'other', label: 'Other issue' },
];

export const RaiseDisputeDialog: React.FC<RaiseDisputeDialogProps> = ({
  deliveryRequestId,
  againstUserId,
  trigger,
  onDisputed,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { createDispute, uploadEvidence } = useDisputes();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Support controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);

    try {
      // Upload evidence files
      setUploadProgress(true);
      const evidenceUrls: string[] = [];
      
      for (const file of files) {
        const url = await uploadEvidence(file);
        if (url) evidenceUrls.push(url);
      }
      setUploadProgress(false);

      // Create dispute
      const result = await createDispute({
        delivery_request_id: deliveryRequestId,
        against_user_id: againstUserId,
        reason,
        description,
        evidence_urls: evidenceUrls,
      });

      if (result) {
        setOpen(false);
        setReason('');
        setDescription('');
        setFiles([]);
        onDisputed?.();
      }
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only render trigger if not controlled */}
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive" size="sm" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Raise Dispute
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Raise a Dispute
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>What went wrong?</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe the issue</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <div className="border border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                id="evidence"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="evidence"
                className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">Click to upload photos</span>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Our team will review your dispute within 24-48 hours. You'll be notified once a decision is made.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={loading || !reason}>
              {uploadProgress ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
