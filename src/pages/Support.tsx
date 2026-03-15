import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useDisputes } from '@/hooks/useDisputes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, HelpCircle, AlertTriangle, MessageSquare, Plus } from 'lucide-react';
import { CreateTicketDialog } from '@/components/support/CreateTicketDialog';
import { TicketCard } from '@/components/support/TicketCard';
import { DisputeCard } from '@/components/disputes/DisputeCard';
import { Skeleton } from '@/components/ui/skeleton';

const Support: React.FC = () => {
  const { user } = useAuth();
  const { tickets, loading: ticketsLoading } = useSupportTickets();
  const { disputes, loading: disputesLoading } = useDisputes();

  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));
  const openDisputes = disputes.filter(d => !['resolved', 'closed'].includes(d.status));
  const closedDisputes = disputes.filter(d => ['resolved', 'closed'].includes(d.status));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-background" />
              </div>
              <div>
                <span className="text-lg font-display font-bold">Help & Support</span>
                <p className="text-xs text-muted-foreground">Get help with your orders</p>
              </div>
            </div>
          </div>

          <CreateTicketDialog />
        </div>
      </header>

      <main className="container py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CreateTicketDialog 
            defaultCategory="payment"
            trigger={
              <div className="bg-background rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <span className="text-lg">💳</span>
                </div>
                <p className="font-medium text-sm">Payment Issue</p>
                <p className="text-xs text-muted-foreground">Refunds, failed payments</p>
              </div>
            }
          />
          <CreateTicketDialog 
            defaultCategory="delivery"
            trigger={
              <div className="bg-background rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <span className="text-lg">📦</span>
                </div>
                <p className="font-medium text-sm">Delivery Problem</p>
                <p className="text-xs text-muted-foreground">Delays, lost items</p>
              </div>
            }
          />
          <CreateTicketDialog 
            defaultCategory="partner"
            trigger={
              <div className="bg-background rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <span className="text-lg">🤝</span>
                </div>
                <p className="font-medium text-sm">Partner Issue</p>
                <p className="text-xs text-muted-foreground">Behaviour, no-show</p>
              </div>
            }
          />
          <CreateTicketDialog 
            defaultCategory="account"
            trigger={
              <div className="bg-background rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                  <span className="text-lg">👤</span>
                </div>
                <p className="font-medium text-sm">Account Help</p>
                <p className="text-xs text-muted-foreground">Profile, verification</p>
              </div>
            }
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tickets">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="tickets" className="gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Support Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Disputes ({disputes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            {ticketsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No support tickets</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                  Need help? Create a support ticket and we'll get back to you.
                </p>
                <CreateTicketDialog 
                  trigger={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Ticket
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-6">
                {openTickets.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Open Tickets</h3>
                    <div className="space-y-3">
                      {openTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  </section>
                )}

                {closedTickets.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Resolved</h3>
                    <div className="space-y-3">
                      {closedTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="mt-6">
            {disputesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No disputes</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  If you have an issue with a delivery, you can raise a dispute from the order page.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {openDisputes.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Disputes</h3>
                    <div className="space-y-3">
                      {openDisputes.map((dispute) => (
                        <DisputeCard key={dispute.id} dispute={dispute} />
                      ))}
                    </div>
                  </section>
                )}

                {closedDisputes.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Resolved</h3>
                    <div className="space-y-3">
                      {closedDisputes.map((dispute) => (
                        <DisputeCard key={dispute.id} dispute={dispute} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Support;
