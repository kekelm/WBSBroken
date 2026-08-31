import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, ClipboardList, Folder, FolderKanban, Grid3X3, LayoutDashboard, ShieldAlert, Users } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/wbs', label: 'WBS Builder', icon: ClipboardList },
  { to: '/hours', label: 'Staffing Plan', icon: Grid3X3 },
  { to: '/opportunities', label: 'Opportunities', icon: Folder },
  { to: '/labor-categories', label: 'Labor Categories', icon: BriefcaseBusiness },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/risks', label: 'Risks', icon: ShieldAlert },
];

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground px-3 py-2">
              <div className="text-sm font-semibold">WBS Planner</div>
              <div className="text-xs">Scope • hours • variance</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} end={to === '/'}>
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
