import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Package } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Delivery {
  id: string;
  item_name?: string;
  item_description: string;
  pickup_city: string;
  drop_city: string;
  status: string;
  urgency: string;
  reward: number | null;
  created_at: string;
  buyer_id: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  matched: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  in_transit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const AdminDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as 'pending' | 'matched' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled');
        }

        const { data, error } = await query;
        if (error) throw error;
        setDeliveries(data || []);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [statusFilter]);

  const filteredDeliveries = deliveries.filter(d =>
    d.item_description.toLowerCase().includes(search.toLowerCase()) ||
    d.pickup_city.toLowerCase().includes(search.toLowerCase()) ||
    d.drop_city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-display font-bold">Delivery Management</h1>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search deliveries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading deliveries...
                  </TableCell>
                </TableRow>
              ) : filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No deliveries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[200px]">
                          {delivery.item_name || delivery.item_description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {delivery.pickup_city} → {delivery.drop_city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[delivery.status] || ''}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{delivery.urgency}</Badge>
                    </TableCell>
                    <TableCell>
                      {delivery.reward ? `₹${delivery.reward}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(delivery.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDelivery(delivery)}
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

      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{selectedDelivery.item_name || selectedDelivery.item_description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedDelivery.status]}>
                    {selectedDelivery.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{selectedDelivery.pickup_city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drop</p>
                  <p className="font-medium">{selectedDelivery.drop_city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium capitalize">{selectedDelivery.urgency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Fare</p>
                  <p className="font-medium">₹{selectedDelivery.reward || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedDelivery.created_at), 'PPp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer ID</p>
                  <p className="font-medium">{selectedDelivery.buyer_id}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">Delivery ID: {selectedDelivery.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
