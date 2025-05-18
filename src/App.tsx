
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { lazy, Suspense, useEffect } from "react";
import { Card } from "@/components/ui/card";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/auth/AuthProvider";
import { RequireAuth } from "./components/auth/RequireAuth";
import AuthPage from "./pages/AuthPage";
import { supabase } from "./integrations/supabase/client";
import { RedirectToOCR } from "./components/RedirectToOCR";

const WebScraperPage = lazy(() => import("./pages/WebScraperPage"));
const OCRPage = lazy(() => import("./pages/OCRPage"));
const StoredDataPage = lazy(() => import("./pages/StoredDataPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient();

const MicroFrontendLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <Card className="w-full h-[80vh] flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse">
        <div className="text-xl font-semibold text-primary">Loading Agent...</div>
      </Card>
    }
  >
    {children}
  </Suspense>
);

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // The hash contains access_token, refresh_token etc.
    const handleAuthCallback = async () => {
      try {
        // We extract the info from the hash
        const hashParams = new URLSearchParams(location.hash.substring(1));

        if (hashParams.get("access_token")) {
          // Let Supabase handle the session with the hash values
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Error processing auth callback:", error.message);
            navigate("/auth");
            return;
          }

          // Get user data from the session
          const session = data.session;
          if (session?.user) {
            console.log("User authenticated successfully:", session.user.email);

            // User profile data is saved in the AuthProvider component
            // when the auth state changes to SIGNED_IN
          }
        }

        // Redirect to the main page or intended destination
        navigate("/");
      } catch (error) {
        console.error("Error in auth callback:", error);
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <Card className="w-full h-[80vh] flex items-center justify-center">
      <div className="text-xl font-semibold text-primary">Completing authentication...</div>
    </Card>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* RedirectToOCR component disabled */}
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout>
                    <MicroFrontendLoader>
                      <OCRPage />
                    </MicroFrontendLoader>
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/web-scraper"
              element={
                <RequireAuth>
                  <MainLayout>
                    <MicroFrontendLoader>
                      <WebScraperPage />
                    </MicroFrontendLoader>
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/stored-data"
              element={
                <RequireAuth>
                  <MainLayout>
                    <MicroFrontendLoader>
                      <StoredDataPage />
                    </MicroFrontendLoader>
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <MainLayout>
                    <MicroFrontendLoader>
                      <SettingsPage />
                    </MicroFrontendLoader>
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
