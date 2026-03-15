import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Search, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  user_id: string | null;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  deposit: <ArrowDownLeft className="w-4 h-4 text-green-500" />,
  withdrawal: <ArrowUpRight className="w-4 h-4 text-red-500" />,
  escrow_hold: <Wallet className="w-4 h-4 text-yellow-500" />,
  escrow_release: <Wallet className="w-4 h-4 text-green-500" />,
  escrow_refund: <Wallet className="w-4 h-4 text-blue-500" />,
  platform_fee: <Wallet className="w-4 h-4 text-purple-500" />,
  carrier_payout: <ArrowUpRight className="w-4 h-4 text-green-500" />,
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
};

export const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (typeFilter !== 'all') {
          query = query.eq('type', typeFilter as 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'escrow_refund' | 'platform_fee' | 'carrier_payout');
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [typeFilter]);

  const filteredTransactions = transactions.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    if (t.type === 'platform_fee' && t.status === 'completed') {
      return sum + Number(t.amount);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Platform fees earned: ₹{totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="escrow_hold">Escrow Hold</SelectItem>
              <SelectItem value="escrow_release">Escrow Release</SelectItem>
              <SelectItem value="platform_fee">Platform Fee</SelectItem>
              <SelectItem value="carrier_payout">Carrier Payout</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
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
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[t.type] || <Wallet className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                          {t.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(t.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[t.status] || ''}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {t.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(t.created_at), 'MMM d, yyyy HH:mm')}
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
