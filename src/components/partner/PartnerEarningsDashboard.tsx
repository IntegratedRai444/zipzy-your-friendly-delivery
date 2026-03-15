import React from 'react';
import { usePartnerEarnings } from '@/hooks/usePartnerEarnings';
import { format } from 'date-fns';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const PartnerEarningsDashboard: React.FC = () => {
  const { summary, earnings, loading } = usePartnerEarnings();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const monthChange = summary.lastMonthEarnings > 0
    ? ((summary.thisMonthEarnings - summary.lastMonthEarnings) / summary.lastMonthEarnings) * 100
    : summary.thisMonthEarnings > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">₹{summary.totalEarnings}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{summary.pendingEarnings}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{summary.completedDeliveries}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {summary.averageRating > 0 ? summary.averageRating : '-'}
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Month vs Last Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-xl font-bold">₹{summary.thisMonthEarnings}</p>
              {monthChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm mt-1 ${monthChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthChange > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(Math.round(monthChange))}% from last month</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">Last Month</p>
              <p className="text-xl font-bold">₹{summary.lastMonthEarnings}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No earnings yet. Start accepting deliveries!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.slice(0, 10).map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{entry.item_description}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.pickup_city} → {entry.drop_city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-semibold ${
                      entry.status === 'delivered' ? 'text-green-600' : 
                      entry.status === 'cancelled' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {entry.status === 'cancelled' ? '-' : '+'}₹{entry.amount}
                    </p>
                    <Badge 
                      variant="secondary"
                      className={`text-xs ${
                        entry.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        entry.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {entry.status === 'delivered' ? 'Completed' :
                       entry.status === 'cancelled' ? 'Cancelled' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
