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
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import CreateRequest from "./pages/CreateRequest";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDeliveries } from "./pages/admin/AdminDeliveries";
import { AdminVerifications } from "./pages/admin/AdminVerifications";
import { AdminTransactions } from "./pages/admin/AdminTransactions";
import { AdminActions } from "./pages/admin/AdminActions";
import { AdminPromos } from "./pages/admin/AdminPromos";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerMode from "./pages/PartnerMode";
import PartnerEarnings from "./pages/PartnerEarnings";
import PartnerTrips from "./pages/PartnerTrips";
import DeliveryDetails from "./pages/DeliveryDetails";
import { GlobalAIChat } from "@/components/chat/GlobalAIChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <GlobalAIChat />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/request" element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/delivery/:id" element={
              <ProtectedRoute>
                <DeliveryDetails />
              </ProtectedRoute>
            } />
            <Route path="/chat/:id" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/partner-onboarding" element={
              <ProtectedRoute>
                <PartnerOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/partner" element={
              <ProtectedRoute>
                <PartnerMode />
              </ProtectedRoute>
            } />
            <Route path="/partner/earnings" element={
              <ProtectedRoute>
                <PartnerEarnings />
              </ProtectedRoute>
            } />
            <Route path="/partner/trips" element={
              <ProtectedRoute>
                <PartnerTrips />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
