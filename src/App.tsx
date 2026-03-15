import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CreateRequest from "./pages/CreateRequest";
import PartnerMode from "./pages/PartnerMode";
import PartnerTrips from "./pages/PartnerTrips";
import PartnerEarnings from "./pages/PartnerEarnings";
import Support from "./pages/Support";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HowPricingWorks from "./pages/HowPricingWorks";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDeliveries } from "./pages/admin/AdminDeliveries";
import { AdminVerifications } from "./pages/admin/AdminVerifications";
import { AdminTransactions } from "./pages/admin/AdminTransactions";
import { AdminActions } from "./pages/admin/AdminActions";
import { AdminPromos } from "./pages/admin/AdminPromos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/request" element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            } />
            {/* Legacy route */}
            <Route path="/create-delivery" element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            } />
            <Route path="/partner" element={
              <ProtectedRoute>
                <PartnerMode />
              </ProtectedRoute>
            } />
            {/* Legacy route */}
            <Route path="/carrier" element={
              <ProtectedRoute>
                <PartnerMode />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/partner/trips" element={
              <ProtectedRoute>
                <PartnerTrips />
              </ProtectedRoute>
            } />
            <Route path="/partner/earnings" element={
              <ProtectedRoute>
                <PartnerEarnings />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="actions" element={<AdminActions />} />
              <Route path="promos" element={<AdminPromos />} />
            </Route>
            {/* Static Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pricing" element={<HowPricingWorks />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
