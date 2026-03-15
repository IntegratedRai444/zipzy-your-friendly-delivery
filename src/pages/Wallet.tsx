import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { 
  Package, ArrowLeft, Wallet as WalletIcon, ArrowUpRight, 
  ArrowDownLeft, Clock, CheckCircle, XCircle, IndianRupee 
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type TransactionType = Database['public']['Enums']['transaction_type'];
type TransactionStatus = Database['public']['Enums']['transaction_status'];

const transactionTypeConfig: Record<TransactionType, { icon: React.ElementType; label: string; color: string }> = {
  deposit: { icon: ArrowDownLeft, label: 'Deposit', color: 'text-green-600' },
  withdrawal: { icon: ArrowUpRight, label: 'Withdrawal', color: 'text-red-600' },
  escrow_hold: { icon: Clock, label: 'Escrow Hold', color: 'text-yellow-600' },
  escrow_release: { icon: ArrowDownLeft, label: 'Payment Released', color: 'text-green-600' },
  escrow_refund: { icon: ArrowDownLeft, label: 'Refund', color: 'text-green-600' },
  platform_fee: { icon: ArrowUpRight, label: 'Platform Fee', color: 'text-orange-600' },
  carrier_payout: { icon: ArrowDownLeft, label: 'Carrier Payout', color: 'text-green-600' },
};

const statusConfig: Record<TransactionStatus, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600' },
  completed: { icon: CheckCircle, color: 'text-green-600' },
  failed: { icon: XCircle, color: 'text-red-600' },
  refunded: { icon: ArrowDownLeft, color: 'text-blue-600' },
};

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const { wallet, transactions, loading } = useWallet();

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Package className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-display font-bold">Wallet</span>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-3xl font-display font-bold flex items-center">
                <IndianRupee className="w-6 h-6" />
                {wallet?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Add Money
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-xl font-semibold flex items-center">
              <IndianRupee className="w-4 h-4" />
              {transactions
                .filter(t => ['escrow_hold', 'platform_fee', 'withdrawal'].includes(t.type) && t.status === 'completed')
                .reduce((sum, t) => sum + Number(t.amount), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-background rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
            <p className="text-xl font-semibold flex items-center text-green-600">
              <IndianRupee className="w-4 h-4" />
              {transactions
                .filter(t => t.type === 'carrier_payout' && t.status === 'completed')
                .reduce((sum, t) => sum + Number(t.amount), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-background rounded-xl border border-border">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No transactions yet</h3>
              <p className="text-sm text-muted-foreground">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
          {transactions.map((transaction) => {
                const typeConfig = transactionTypeConfig[transaction.type];
                const status = statusConfig[transaction.status];
                const TypeIcon = typeConfig.icon;
                const StatusIcon = status.icon;
                const isIncoming = ['deposit', 'escrow_release', 'escrow_refund', 'carrier_payout'].includes(transaction.type);

                return (
                  <div
                    key={transaction.id}
                    className="bg-background rounded-xl border border-border p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isIncoming ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                      }`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{typeConfig.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold flex items-center justify-end ${typeConfig.color}`}>
                        {isIncoming ? '+' : '-'}
                        <IndianRupee className="w-3.5 h-3.5" />
                        {Number(transaction.amount).toFixed(2)}
                      </p>
                      <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Wallet;