
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { MarketplaceProvider } from '@/contexts/MarketplaceContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import FinanceRoute from '@/components/FinanceRoute';
import OpsRoute from '@/components/OpsRoute';
import ReviewerRoute from '@/components/ReviewerRoute';
import MainLayout from '@/layouts/MainLayout';
import OpsHubDashboard from '@/pages/OpsHubDashboard';
import OpsDataEntry from '@/pages/OpsDataEntry';
import OpsHubImport from '@/pages/OpsHubImport';
import OpsHubProductDetail from '@/pages/OpsHubProductDetail';
import OpsHubScorecard from '@/pages/OpsHubScorecard';
import ProductMasterDataPage from '@/pages/ProductMasterDataPage';
import UserManagement from '@/pages/UserManagement';

import {
  Landing,
  Auth,
  Verify,
  Dashboard,
  ProvidersPage,
  ProviderNewPage,
  ProviderDetailPage,
  SettingsMarketplacesPage,
  ProductsPage,
  CreateProductPage,
  ProductEditPage,
  ProductDetailPage,
  PipelinePage,
  TasksPage,
  CompliancePage,
  SuppliersPage,
  SupplierDetailPage,
  InventoryPage,
  FinancePage,
  GrowthPage,
  ProviderCycleDirectory,
  ProviderCycleWorkspace,
  EmailIntakeInboxPage,
  EmailIntakeReviewPage,
  EmailIntakeSettingsPage,
  ProductImportQueuePage,
  ProductImportReviewPage
} from '@/pages';
import AdminTestData from '@/pages/AdminTestData';
import EmailSyncTroubleshootingPage from '@/pages/EmailSyncTroubleshootingPage';
import EmailSyncDiagnosticsPage from '@/pages/EmailSyncDiagnosticsPage';

const AppLayout = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>
      {children}
    </MainLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ConfirmProvider>
            <MarketplaceProvider>
              <SidebarProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/verify-email" element={<Verify />} />
                  <Route path="/verify" element={<Navigate to="/auth/verify-email" replace />} />
                  
                  {/* Redirects */}
                  <Route path="/app" element={<Navigate to="/ops-hub" replace />} />
                  
                  {/* Amazon Ops Hub Routes */}
                  <Route path="/ops-hub" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OpsHubDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ops-hub/entry" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OpsDataEntry />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ops-hub/import" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OpsHubImport />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ops-hub/products" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProductMasterDataPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ops-hub/product/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OpsHubProductDetail />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ops-hub/scorecard/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OpsHubScorecard />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Legacy Dashboard */}
                  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                  
                  {/* Products */}
                  <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
                  <Route path="/products/new" element={
                    <OpsRoute>
                      <MainLayout><CreateProductPage /></MainLayout>
                    </OpsRoute>
                  } />
                  <Route path="/products/:id" element={<AppLayout><ProductDetailPage /></AppLayout>} />
                  <Route path="/products/:id/edit" element={
                    <OpsRoute>
                      <MainLayout><ProductEditPage /></MainLayout>
                    </OpsRoute>
                  } />
                  <Route path="/products/edit/:id" element={
                    <OpsRoute>
                      <MainLayout><ProductEditPage /></MainLayout>
                    </OpsRoute>
                  } />
                  
                  {/* Product Import System */}
                  <Route path="/product-imports" element={
                    <OpsRoute>
                       <MainLayout><ProductImportQueuePage /></MainLayout>
                    </OpsRoute>
                  } />
                  <Route path="/product-imports/:jobId" element={
                    <OpsRoute>
                       <MainLayout><ProductImportReviewPage /></MainLayout>
                    </OpsRoute>
                  } />

                  {/* Ops */}
                  <Route path="/pipeline" element={<OpsRoute><MainLayout><PipelinePage /></MainLayout></OpsRoute>} />
                  <Route path="/tasks" element={<OpsRoute><MainLayout><TasksPage /></MainLayout></OpsRoute>} />
                  <Route path="/compliance" element={<OpsRoute><MainLayout><CompliancePage /></MainLayout></OpsRoute>} />
                  <Route path="/suppliers" element={<OpsRoute><MainLayout><SuppliersPage /></MainLayout></OpsRoute>} />
                  <Route path="/suppliers/:id" element={<OpsRoute><MainLayout><SupplierDetailPage /></MainLayout></OpsRoute>} />
                  <Route path="/inventory" element={<OpsRoute><MainLayout><InventoryPage /></MainLayout></OpsRoute>} />
                  
                  {/* Providers */}
                  <Route path="/providers" element={<OpsRoute><MainLayout><ProvidersPage /></MainLayout></OpsRoute>} />
                  <Route path="/providers/new" element={<OpsRoute><MainLayout><ProviderNewPage /></MainLayout></OpsRoute>} />
                  <Route path="/providers/:id" element={<OpsRoute><MainLayout><ProviderDetailPage /></MainLayout></OpsRoute>} />
                  <Route path="/provider-cycle" element={<ProtectedRoute><MainLayout><ProviderCycleDirectory /></MainLayout></ProtectedRoute>} />
                  <Route path="/provider-cycle/:id" element={<ProtectedRoute><MainLayout><ProviderCycleWorkspace /></MainLayout></ProtectedRoute>} />

                  {/* Finance */}
                  <Route path="/finance" element={<FinanceRoute><MainLayout><FinancePage /></MainLayout></FinanceRoute>} />
                  <Route path="/growth" element={<FinanceRoute><MainLayout><GrowthPage /></MainLayout></FinanceRoute>} />

                  {/* Email Intake Routes */}
                  <Route path="/email-intake" element={
                     <ReviewerRoute>
                        <MainLayout><EmailIntakeInboxPage /></MainLayout>
                     </ReviewerRoute>
                  } />
                  <Route path="/email-intake/:id" element={
                     <ReviewerRoute>
                        <MainLayout><EmailIntakeReviewPage /></MainLayout>
                     </ReviewerRoute>
                  } />
                  <Route path="/email-intake/settings" element={
                     <AdminRoute>
                        <MainLayout><EmailIntakeSettingsPage /></MainLayout>
                     </AdminRoute>
                  } />
                  
                  {/* Email Sync */}
                  <Route path="/email-sync-troubleshooting" element={
                     <OpsRoute>
                        <MainLayout><EmailSyncTroubleshootingPage /></MainLayout>
                     </OpsRoute>
                  } />
                  <Route path="/email-sync-diagnostics" element={
                     <AdminRoute>
                        <MainLayout><EmailSyncDiagnosticsPage /></MainLayout>
                     </AdminRoute>
                  } />

                  {/* Admin */}
                  <Route path="/user-management" element={
                    <ProtectedRoute requiredPermission="canManageUsers">
                      <MainLayout>
                        <UserManagement />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <Navigate to="/user-management" replace />
                  } />
                  <Route path="/settings/marketplaces" element={<AdminRoute><MainLayout><SettingsMarketplacesPage /></MainLayout></AdminRoute>} />
                  <Route path="/admin/test-data" element={<AdminRoute><MainLayout><AdminTestData /></MainLayout></AdminRoute>} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
              </SidebarProvider>
            </MarketplaceProvider>
          </ConfirmProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
