
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Get the title based on the current route
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Web Scraper';
      case '/ocr':
        return 'OCR Agent';
      case '/settings':
        return 'OCRAgent Settings';
      case '/stored-data':
        return 'Stored Data';
      default:
        return 'OCRAgent';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <header className="h-16 border-b border-white/10 flex items-center px-6 bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm">
              <div>
                <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                  {getTitle()}
                </h1>
                {location.pathname !== '/settings' && (
                  <p className="text-xs text-purple-200/70">Micro Frontend Application</p>
                )}
              </div>
            </header>
            <div className={cn(
              "flex-1 overflow-auto p-6",
              "bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50",
              "backdrop-blur-sm"
            )}>
              <div className="h-full rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
