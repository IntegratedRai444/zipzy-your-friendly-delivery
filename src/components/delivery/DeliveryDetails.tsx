import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, User, Package, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface DeliveryDetailsProps {
  delivery: any;
  currentUserId: string;
  isPartner: boolean;
  onComplete?: () => void;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({
  delivery,
  currentUserId,
  isPartner,
  onComplete
}) => {
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const request = delivery.requests || {};
  const partnerInfo = delivery.partner_users || {};
  const buyerInfo = delivery.users || {};

  const handleGenerateOtp = async () => {
    if (!isPartner) return;

    setIsGeneratingOtp(true);
    try {
      const response = await api.post(`/requests/${request.id}/generate-otp`);
      if (response.success) {
        // In a real app, this would be sent via SMS/email
        // For demo, we'll show it in console
        console.log('Generated OTP (for demo):', response.data.otp);
        toast.success('OTP generated successfully! Check console for demo OTP.', {
          duration: 3000
        });
        setGeneratedOtp(response.data.otp);
      }
    } catch (error) {
      toast.error('Failed to generate OTP', {
        duration: 3000
      });
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isPartner || !otp) return;

    setIsVerifyingOtp(true);
    try {
      const response = await api.post(`/requests/${request.id}/verify-otp`, { otp });
      if (response.success) {
        toast.success('Delivery completed successfully!', {
          duration: 3000
        });
        onComplete?.();
      }
    } catch (error) {
      toast.error('Invalid OTP or verification failed', {
        duration: 3000
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation', {
        duration: 3000
      });
      return;
    }

    setIsCancelling(true);
    try {
      const response = await api.patch(`/requests/${request.id}/cancel`, { 
        reason: cancelReason 
      });
      if (response.success) {
        toast.success('Request cancelled successfully', {
          duration: 3000
        });
        onComplete?.();
      }
    } catch (error) {
      toast.error('Failed to cancel request', {
        duration: 3000
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setCancelReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = delivery.status !== 'completed' && delivery.status !== 'cancelled';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Details</h1>
        <div className="flex items-center gap-4">
          <Badge className={getStatusColor(delivery.status)}>
            {delivery.status.replace('_', ' ')}
          </Badge>
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Item Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">{request.item_name}</h3>
            <p className="text-gray-600">{request.item_description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Item Value</span>
              <p className="font-semibold">₹{request.item_value || 0}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Delivery Charge</span>
              <p className="font-semibold">₹{request.reward || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Pricing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPartner ? (
            // Partner View - Show earnings breakdown
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Item Price</span>
                <span className="font-semibold">₹{request.item_value || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">You'll Earn</span>
                <span className="font-semibold text-green-600">₹{request.reward || 0}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Reimbursement</span>
                  <span className="font-bold text-lg">₹{(request.item_value || 0) + (request.reward || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Buyer View - Show total cost breakdown
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Item Price</span>
                <span className="font-semibold">₹{request.item_value || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Delivery Fee</span>
                <span className="font-semibold">₹{request.reward || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Platform Fee</span>
                <span className="font-semibold">₹{request.platform_fee || 0}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Cost</span>
                  <span className="font-bold text-lg">₹{request.total_price || 0}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{request.pickup_address}</p>
            <p className="text-sm text-gray-500">{request.pickup_city}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Drop Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{request.drop_address}</p>
            <p className="text-sm text-gray-500">{request.drop_city}</p>
            {request.drop_notes && (
              <p className="text-sm text-gray-600 mt-2">Notes: {request.drop_notes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Buyer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{buyerInfo.full_name || 'Buyer'}</p>
            <p className="text-sm text-gray-500">{buyerInfo.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Partner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{partnerInfo.full_name || 'Partner'}</p>
            <p className="text-sm text-gray-500">{partnerInfo.email}</p>
          </CardContent>
        </Card>
      </div>

      {/* OTP Section (Partner Only) */}
      {isPartner && delivery.status !== 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Delivery Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generatedOtp ? (
              <Button 
                onClick={handleGenerateOtp}
                disabled={isGeneratingOtp}
                className="w-full"
              >
                {isGeneratingOtp ? 'Generating...' : 'Generate OTP'}
              </Button>
            ) : (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={4}
                />
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otp.length !== 4}
                  className="w-full"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP & Complete Delivery'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {delivery.status === 'completed' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800">Delivery Completed!</h3>
              <p className="text-green-600">This delivery has been successfully completed.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Cancel Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for cancellation
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Please provide a reason for cancelling this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1"
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
