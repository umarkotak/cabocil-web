import { LayoutDashboard, LogOut, Moon, Sun } from "lucide-react"
import Link from "next/link"
import cabocilAPI from '@/apis/cabocil_api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { InstallButton } from "../InstallButton";
import { useTheme } from "next-themes";

export default function UserDropdown({userData}) {
  const router = useRouter()
  const { setTheme } = useTheme()

  function Logout() {
    cabocilAPI.removeCookie("CK:AT")
    toast.success("Logout Successfull")
    router.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-full">
          <Avatar className="h-7 w-7 border border-primary">
            <AvatarImage src={userData.photo_url} alt={userData.name} />
            <AvatarFallback className=""><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
          </Avatar>
          {/* <span className="text-xs">{userData.name}</span> */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userData.photo_url} alt={userData.name} />
              <AvatarFallback className="rounded-lg"><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{userData.name}</span>
              <span className="truncate text-xs">{userData.email}</span>
              {/* <span className="truncate text-xs">{userData.user_role}</span> */}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <InstallButton />
        <DropdownMenuItem onClick={()=>setTheme("light")}><Sun />Light Mode</DropdownMenuItem>
        <DropdownMenuItem onClick={()=>setTheme("dark")}><Moon />Dark Mode</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={()=>Logout()}><LogOut />Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
