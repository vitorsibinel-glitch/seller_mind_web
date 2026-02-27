"use client";

import * as React from "react";
import {
  Briefcase,
  Cpu,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  DollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { NavMain } from "@/components/nav-main";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useTheme } from "next-themes";

const data = {
  navMain: [
    {
      title: "Visão Geral",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "Pedidos",
      url: "/dashboard/orders",
      icon: Cpu,
      items: [],
    },
    {
      title: "Financeiro",
      url: "/dashboard/finances",
      icon: DollarSign,
      items: [
        {
          title: "Notas Fiscais",
          url: "/dashboard/finances/invoices",
        },
        {
          title: "Contabilidade",
          url: "/dashboard/finances/accounting",
        },
        {
          title: "DRE",
          url: "/dashboard/finances/dre",
        },
      ],
    },
    {
      title: "Gerenciamento e Estoque",
      url: "/dashboard/management",
      icon: Briefcase,
      items: [
        {
          title: "Produtos internos",
          url: "/dashboard/management/products",
        },
        {
          title: "Estoque FBA",
          url: "/dashboard/management/fba-inventory",
        },
      ],
    },
    {
      title: "Configurações",
      url: "/dashboard/settings",
      icon: Settings,
      items: [
        {
          title: "Integrações",
          url: "/dashboard/settings/integrations",
        },
        {
          title: "Meu Perfil",
          url: "/dashboard/settings/profile",
        },
      ],
    },
  ],
};

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const logoSrc =
    theme === "dark" ? "/images/logo_dark.png" : "/images/logo_light.png";

  const logoMinimalistSrc =
    theme === "dark"
      ? "/images/logo_minimalist_dark.png"
      : "/images/logo_minimalist_light.png";

  const username = `${user?.firstName || ""} ${user?.lastName || ""}`;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) =>
    (name || "")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const unreadNotifications = 3;

  const notifications = [
    {
      id: "1",
      title: "Estoque baixo: FON-BT-001",
      description: "Só 8 unidades disponíveis",
      time: "5 min atrás",
      type: "warning",
      read: false,
    },
    {
      id: "2",
      title: "Novos pedidos recebidos",
      description: "3 novos pedidos precisam de atenção",
      time: "15 min atrás",
      type: "info",
      read: false,
    },
    {
      id: "3",
      title: "Sincronização concluída",
      description: "Amazon: 450 produtos atualizados",
      time: "1 hora atrás",
      type: "success",
      read: false,
    },
  ];

  const sidebarItemClass =
    "flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-muted transition-colors w-full group-data-[collapsible=icon]:justify-center";

  const getNotificationIcon = (type: string) => {
    const classes = {
      warning: "bg-warning/10 text-warning",
      info: "bg-info/10 text-info",
      success: "bg-success/10 text-success",
      error: "bg-danger/10 text-danger",
    };

    return (
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          classes[type as keyof typeof classes],
        )}
      >
        {type === "warning" && <span>⚠️</span>}
        {type === "info" && <span>ℹ️</span>}
        {type === "success" && <span>✅</span>}
        {type === "error" && <span>❌</span>}
      </div>
    );
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="relative flex items-center justify-center w-full">
          <Image
            src={logoSrc}
            alt="Sellermind"
            width={160}
            height={60}
            className="transition-all duration-200 group-data-[collapsible=icon]:hidden"
            priority
          />

          <Image
            src={logoMinimalistSrc}
            alt="Sellermind Icon"
            width={36}
            height={36}
            className="
        hidden
        rounded-sm
        transition-all duration-200
        group-data-[collapsible=icon]:block
      
      "
            priority
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarRail />

      <SidebarFooter className="flex flex-col gap-1 px-2 pb-2">
        <ThemeToggle />

        <button
          className={sidebarItemClass}
          onClick={() => setDialogOpen(true)}
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-warning animate-pulse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {unreadNotifications}
              </span>
            )}
          </div>
          <span className="text-sm group-data-[collapsible=icon]:hidden">
            Notificações
          </span>
        </button>

        <Sheet>
          <SheetTrigger asChild>
            <button className={cn(sidebarItemClass, "hidden")}>
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-warning animate-pulse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <span className="text-sm group-data-[collapsible=icon]:hidden">
                Notificações
              </span>
            </button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="font-poppins text-xl">
                Notificações
              </SheetTitle>
            </SheetHeader>
            <Tabs defaultValue="all" className="mt-6">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">Não Lidas</TabsTrigger>
                <TabsTrigger value="settings">Config</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border flex items-start space-x-3 transition-colors cursor-pointer",
                      !notification.read && "border-primary/30 bg-primary/5",
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        <span className="text-xs">{notification.time}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.description}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="unread" className="space-y-4">
                {notifications
                  .filter((n) => !n.read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-start space-x-3"
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <span className="text-xs">{notification.time}</span>
                        </div>
                        <p className="text-sm mt-1">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent value="settings">
                <div className="p-4 text-sm">Preferências de notificação</div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>

        <div className="h-px bg-border my-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${sidebarItemClass} justify-start group-data-[collapsible=icon]:justify-center`}
            >
              <div className="shrink-0 aspect-square size-8 rounded-sm bg-tertiary flex items-center justify-center">
                {getInitials(username)}
              </div>
              <div className="flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <div className="font-medium truncate">{user?.firstName}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.planName}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem className="text-danger" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-inter text-center">
              Funcionalidade de notificações em desenvolvimento...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
