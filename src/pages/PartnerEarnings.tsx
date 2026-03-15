import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet } from 'lucide-react';
import { PartnerEarningsDashboard } from '@/components/partner/PartnerEarningsDashboard';

const PartnerEarnings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/partner">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Wallet className="w-5 h-5 text-background" />
              </div>
              <div>
                <span className="text-lg font-display font-bold">Partner Earnings</span>
                <p className="text-xs text-muted-foreground">Track your income</p>
              </div>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to="/wallet">
              View Wallet
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <PartnerEarningsDashboard />
      </main>
    </div>
  );
};

export default PartnerEarnings;
