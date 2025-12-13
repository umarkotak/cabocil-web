import { Book, Contact, GalleryHorizontalEnd, Gamepad2, HandCoins, Home, ImageIcon, Instagram, Joystick, LayoutDashboard, Pencil, ReceiptText, Tv, TvIcon, UserCheck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"

const items = [
  { key: "item-tv", title: "Tv", url: "/tv", icon: Tv },
  { key: "item-channel", title: "Channel", url: "/channels", icon: UserCheck },
  { key: "item-book", title: "Buku", url: "/books", icon: Book },
  { key: "item-workbook", title: "Lembar Kerja", url: "/workbooks", icon: Pencil },
  { key: "item-game", title: "Permainan", url: "/games", icon: Gamepad2 },
  { key: "item-subscription", title: "Langganan", url: "/subscription", icon: ReceiptText },
  { key: "item-contact", title: "Hubungi Kami", url: "/contact", icon: Contact },
  // { key: "item-support", title: "Support CaBocil", url: "https://trakteer.id/marumaru", icon: HandCoins },
]

const adminItems = [
  { key: "admin-item-1", title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { key: "admin-item-4", title: "Books", url: "/admin/books", icon: Book },
  { key: "admin-item-2", title: "Channels", url: "/admin/channels", icon: TvIcon },
]

export function AppSidebar({ userData, isAdmin }) {
  const pathName = usePathname()
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()

  function handleClickSidebarItem() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-none"
    >
      <SidebarHeader>
        <SidebarMenu>
          <a href="/">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="/icons/cabocil-logo-clear.png" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    CaBocil
                  </span>
                  <span className="truncate text-xs">aplikasi untuk anak</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </a>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem onClick={() => handleClickSidebarItem()}>
              <SidebarMenuButton asChild isActive={`${pathName}`.startsWith("/home")}>
                <Link href="/home">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem onClick={() => handleClickSidebarItem()}>
              <SidebarMenuButton asChild isActive={`${pathName}`.startsWith("/activity")}>
                <Link href="/activity">
                  <GalleryHorizontalEnd />
                  <span>Activity</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key} onClick={() => handleClickSidebarItem()}>
                  <SidebarMenuButton asChild isActive={`${pathName}`.startsWith(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && <>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.key} onClick={() => handleClickSidebarItem()}>
                    <SidebarMenuButton asChild isActive={`${pathName}` === item.url}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>}
      </SidebarContent>
    </Sidebar>
  )
}
