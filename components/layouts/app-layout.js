import { AppSidebar } from "./app-sidebar";
import { usePathname } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, LogInIcon, RefreshCcw, Sun, Moon, Settings2 } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import cabocilAPI from '@/apis/cabocil_api';
import UserDropdown from './user-dropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { InstallButton } from "../InstallButton";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

// refer to ui/sidebar
const contentWidthOnSideOpen = "w-[calc(100%-14rem)]"
const contentWidthOnSideClose = "w-[calc(100%-3rem)]"

export default function AppLayout({ children }) {
  const { setTheme } = useTheme()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [userData, setUserData] = useState({})

  const pathName = usePathname()
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()

  const [padMain, setPadMain] = useState(true)
  const [showSidebarTrigger, setShowSidebarTrigger] = useState(true)
  const [collapsible, setCollapsible] = useState("icon")

  useEffect(() => {
    if (!pathName) { return }

    // sidebar default open / close
    if (
      pathName.startsWith("/watch")
      || pathName.startsWith("/games/flowchart")
      || (pathName.includes("/books") && pathName.includes("/read"))
      || (pathName.includes("/workbooks") && pathName.includes("/read"))
      || pathName.includes("/games/golf")
    ) {
      setOpen(false)
    } else {
      setOpen(true)
    }

    // collapsible
    if (
      (pathName.includes("/books") && pathName.includes("/read"))
      || (pathName.includes("/workbooks") && pathName.includes("/read"))
    ) {
      setCollapsible("offcanvas")
    } else {
      setCollapsible("icon")
    }

    // add padding on content / not
    if (
      ["/home", "/activity", "/games", "/subscription", "/subscription/package", "/games/maze", "/games/golf"].includes(pathName)
      || (pathName.includes("/books") && pathName.includes("/read"))
      || (pathName.includes("/workbooks") && pathName.includes("/read"))
    ) {
      setPadMain(false)
    } else {
      setPadMain(true)
    }

    // sidebar trigger
    if (
      (pathName.includes("/workbooks") && pathName.includes("/read"))
    ) {
      setShowSidebarTrigger(false)
    } else {
      setShowSidebarTrigger(true)
    }
  }, [pathName])


  useEffect(() => {
    GetCheckAuth()
  }, [pathName])

  async function GetCheckAuth() {
    if (cabocilAPI.GenAuthToken() === "") { return }

    try {
      const response = await cabocilAPI.GetCheckAuth("", {}, {})
      const body = await response.json()

      if (response.status !== 200) {
        Logout()
        // toast.error(`error ${JSON.stringify(body)}`)
        return
      }

      // console.warn("USER DATA", body.data)

      setUserData(body.data.user)

      if (["admin", "superadmin"].includes(body.data.user.user_role)) {
        setIsAdmin(true)
      }

    } catch (e) {
      Logout()
      toast.error(`error ${e}`)
    }
  }

  function Logout() {
    cabocilAPI.removeCookie("CK:AT")
    toast.success("Logout Successfull")
    router.reload()
  }

  // ("str1,str2,str3,str4".match(/,/g) || []).length
  function BreadcrumbsButton({ pathName }) {
    if (!pathName) { return null }

    if ((pathName.match(/\//g) || []).length <= 1) {
      // return <Button size="sm7" variant="outline" onClick={() => router.back()}><ChevronLeft size={8} /> back</Button>
      return <Link href="/home"><Button size="sm7" variant="ghost"><ChevronLeft size={8} /> {pathName}</Button></Link>
    }

    // back link
    if (pathName.startsWith("/watch") || pathName.startsWith("/channels")) {
      return <Link href="/tv"><Button size="sm7" variant="ghost"><ChevronLeft size={8} /> /tv</Button></Link>
    }

    if (pathName.includes("/books") && pathName.includes("/read")) {
      return <Link href="/books"><Button size="sm7" variant="ghost"><ChevronLeft size={8} /> back</Button></Link>
    }

    if (pathName.includes("/workbooks") && pathName.includes("/read")) {
      return <Link href="/workbooks"><Button size="sm7" variant="ghost"><ChevronLeft size={8} /> back</Button></Link>
    }

    if (pathName.includes("/games/")) {
      return <Link href="/games"><Button size="sm7" variant="ghost"><ChevronLeft size={8} /> back</Button></Link>
    }

    return <Link href={pathName}><Button size="sm7" variant="ghost">{pathName}</Button></Link>
  }

  function SidebarDecider() {
    if (isMobile) {
      return "w-full"
    }

    if (collapsible === "offcanvas") {
      return "w-full"
    }

    if (open) {
      return contentWidthOnSideOpen
    }

    return contentWidthOnSideClose
  }

  return (
    <>
      <AppSidebar userData={userData} isAdmin={isAdmin} collapsible={collapsible} />

      <div className={`${SidebarDecider()}`}>
        <header className={`sticky top-0 flex justify-between shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 z-30 py-3 pb-2 px-3 bg-sidebar`}>
          <div className="flex items-center gap-2">
            {showSidebarTrigger && <SidebarTrigger />}
            <BreadcrumbsButton pathName={pathName} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm7" onClick={() => window.location.reload()}>
              <RefreshCcw />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm7"><Settings2 /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => setTheme("light")}><Sun />Light Mode</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}><Moon />Dark Mode</DropdownMenuItem>
                <InstallButton />
              </DropdownMenuContent>
            </DropdownMenu>
            {userData.guid
              ? <UserDropdown userData={userData} />
              : <Link href="/sign_in"><Button size="sm7" variant="outline"><LogInIcon size={4} /> sign in</Button></Link>
            }
          </div>
        </header>

        {/* ${isDark ? "dark:bg-slate-900": "bg-gradient-to-br from-pink-100 via-sky-100 to-emerald-100"} */}
        <div
          className={`transition-colors duration-300
          min-h-[calc(100vh-48px)]
          ${padMain ? "relative py-2 px-2 sm:px-3 w-full" : ""}`}
        >
          {children}
        </div>
      </div>
    </>
  )
}

function hasMoreThanOneSlash(str) {
  if (!str) { return false }
  const matches = str.match(/\//g);
  return matches !== null && matches.length > 1;
}