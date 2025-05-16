
import { Database, FileScan, Search, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const microFrontendItems = [
  {
    title: "Web Scraper Agent",
    icon: Search,
    path: "/web-scraper",
    bgColor: "bg-blue-600",
  },
  {
    title: "OCR Agent",
    icon: FileScan,
    path: "/",
    bgColor: "bg-purple-600",
  },
];

const containerItems = [
  {
    title: "Stored Data",
    icon: Database,
    path: "/stored-data",
    bgColor: "bg-green-600",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
    bgColor: "bg-gray-600",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar>
      <SidebarContent className="bg-gradient-to-b from-slate-900 to-slate-800 relative">
        <SidebarHeader className="px-2 py-4 flex items-center justify-between">
          <div className={cn(
            "flex items-center",
            isCollapsed && "hidden"
          )}>
            <img
              src="/visible-logo.svg"
              alt="OCRAgent Logo"
              className="h-10 w-auto"
            />
          </div>
          <SidebarTrigger className="absolute right-2 top-6 bg-slate-800 hover:bg-slate-700" />
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {microFrontendItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex gap-2 transition-all duration-200 hover:translate-x-1",
                      isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    )}
                  >
                    <Link to={item.path} className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-md", item.bgColor)}>
                        <item.icon size={16} className="text-white" />
                      </div>
                      <span className={cn(isCollapsed && "hidden")}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {containerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex gap-2 transition-all duration-200 hover:translate-x-1",
                      isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    )}
                  >
                    <Link to={item.path} className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-md", item.bgColor)}>
                        <item.icon size={16} className="text-white" />
                      </div>
                      <span className={cn(isCollapsed && "hidden")}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
