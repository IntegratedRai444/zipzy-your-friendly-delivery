import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Package, Phone, MessageCircle, X, CheckCircle } from 'lucide-react';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface Request {
  id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  buyer_id: string;
  partner_id?: string;
  accepted_at?: string;
  item_name: string;
  item_description: string;
  pickup_address: string;
  drop_address: string;
  reward: number;
  item_value?: number;
  platform_fee?: number;
  total_price?: number;
  urgency: string;
  payment_method: string;
  users?: {
    email: string;
    full_name: string;
  };
  partner_users?: {
    email: string;
    full_name: string;
  };
}

interface RequestAcceptanceProps {
  request: Request;
  currentUserId: string;
  isPartner: boolean;
  onAccept?: () => void;
}

export const RequestAcceptance: React.FC<RequestAcceptanceProps> = ({
  request,
  currentUserId,
  isPartner,
  onAccept
}) => {
  const [showChat, setShowChat] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-open chat when request is accepted
  useEffect(() => {
    if (request.status === 'accepted' && request.partner_id) {
      setShowChat(true);
    }
  }, [request.status, request.partner_id]);

  const handleAccept = async () => {
    if (isAccepting || !isPartner) return;

    setIsAccepting(true);
    try {
      const response = await api.patch(`/requests/${request.id}/accept`, {});
      
      if (response.success) {
        console.log('✅ Request accepted:', response.data);
        // Set delivery ID for chat system
        if (response.data.delivery) {
          setDeliveryId(response.data.delivery.id);
          // Redirect to delivery details page
          navigate(`/delivery/${response.data.delivery.id}`);
        }
        setShowChat(true);
        onAccept?.();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const getOtherUser = () => {
    if (isPartner) {
      return {
        name: request.users?.full_name || 'Buyer',
        email: request.users?.email,
        role: 'Buyer'
      };
    } else {
      return {
        name: request.partner_users?.full_name || 'Partner',
        email: request.partner_users?.email,
        role: 'Partner'
      };
    }
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending': return 'text-yellow-600';
      case 'accepted': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'completed': return 'text-gray-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (request.status) {
      case 'pending': return 'Waiting for partner';
      case 'accepted': return 'Accepted by partner';
      case 'in_progress': return 'In progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return request.status;
    }
  };

  const otherUser = getOtherUser();

  if (showChat) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Chat with {otherUser.name}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <ChatMessages deliveryId={deliveryId} currentUserId={currentUserId} />
        </div>
        
        {/* Chat Input */}
        <div className="border-t p-4">
          <ChatInput deliveryId={deliveryId} currentUserId={currentUserId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Status */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request Status</h3>
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Item</p>
            <p className="font-medium">{request.item_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="font-medium">₹{request.total_price || request.reward}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Pickup</p>
            <p className="text-sm">{request.pickup_address}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Drop-off</p>
            <p className="text-sm">{request.drop_address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Urgency: {request.urgency}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Payment: {request.payment_method}</span>
        </div>

        {/* Other User Info */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{otherUser.name}</p>
              <p className="text-sm text-muted-foreground">{otherUser.email}</p>
              <p className="text-sm text-muted-foreground">({otherUser.role})</p>
            </div>
          </div>

          {/* Accept Button for Partners */}
          {isPartner && request.status === 'pending' && (
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept This Request
                </>
              )}
            </Button>
          )}

          {/* Chat Button for Buyers */}
          {!isPartner && request.status === 'accepted' && (
            <Button
              onClick={() => setShowChat(true)}
              className="w-full"
              variant="outline"
              size="lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
          )}

          {/* Status Message */}
          {request.status === 'accepted' && !isPartner && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Request Accepted!</p>
                  <p className="text-sm">
                    {request.partner_users?.full_name || 'A partner'} has accepted your request.
                  </p>
                  <p className="text-sm">Chat is now available for coordination.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
