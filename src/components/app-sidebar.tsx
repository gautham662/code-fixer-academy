import { NavLink, useLocation } from "react-router-dom";
import {
  Code,
  Home,
  Trophy,
  User,
  BookOpen,
  LogOut,
  Bug,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "Challenge", url: "/challenge", icon: Code },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isParentActive = navigationItems.some((item) => isActive(item.url));

  const getNavClasses = (path: string) =>
    isActive(path)
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-muted/50";

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="font-bold text-lg">DebugMaster</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!isCollapsed && (
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}