import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DeliveryDetails } from '@/components/delivery/DeliveryDetails';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DeliveryDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      if (!id) return;

      try {
        // Fetch delivery with related data
        const response = await api.get(`/deliveries/${id}`);
        
        if (response.success) {
          setDelivery(response.data);
        } else {
          // Fallback: try to fetch from requests if delivery endpoint doesn't exist
          const requestResponse = await api.get(`/requests/${id}`);
          if (requestResponse.success) {
            // Create a mock delivery object
            setDelivery({
              id: id,
              status: requestResponse.data.status,
              requests: requestResponse.data,
              partner_users: requestResponse.data.partner_users,
              users: requestResponse.data.users,
              created_at: requestResponse.data.accepted_at,
              completed_at: requestResponse.data.completed_at
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch delivery details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delivery not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPartner = user?.id === delivery.partner_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <DeliveryDetails
          delivery={delivery}
          currentUserId={user?.id || ''}
          isPartner={isPartner}
          onComplete={() => {
            // Refresh delivery data or redirect
            navigate('/dashboard');
          }}
        />
      </div>
    </div>
  );
};

export default DeliveryDetailsPage;
