import { AppSidebar } from "./app-sidebar";
import { usePathname } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, LogInIcon, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import cabocilAPI from '@/apis/cabocil_api';
import UserDropdown from './user-dropdown';

export default function AppLayout({ children }) {
  const { resolvedTheme } = useTheme();

  const [isAdmin, setIsAdmin] = useState(false)
  const [userData, setUserData] = useState({})

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else if (resolvedTheme === 'light') {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [resolvedTheme])

  const pathName = usePathname()
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()

  const [padMain, setPadMain] = useState(true)
  const [showSidebarTrigger, setShowSidebarTrigger] = useState(true)

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

    // add padding on content / not
    if (
      ["/home","/activity","/games","/subscription","/subscription/package","/games/maze","/games/golf"].includes(pathName)
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

  function BreadcrumbsButton() {
    if (!pathName) { return null }

    // back link
    if (pathName.startsWith("/watch")) {
      return <Link href="/tv"><Button size="smv2" variant="outline"><ChevronLeft size={8} /> back</Button></Link>
    }

    if (pathName.includes("/books") && pathName.includes("/read")) {
      return <Link href="/books"><Button size="smv2" variant="outline"><ChevronLeft size={8} /> back</Button></Link>
    }

    if (pathName.includes("/workbooks") && pathName.includes("/read")) {
      return <Link href="/workbooks"><Button size="smv2" variant="outline"><ChevronLeft size={8} /> back</Button></Link>
    }

    if (pathName.includes("/games/")) {
      return <Link href="/games"><Button size="smv2" variant="outline"><ChevronLeft size={8} /> back</Button></Link>
    }

    return <Link href={pathName}><Button size="smv2" variant="ghost">{pathName}</Button></Link>
  }

  return (
    <>
      <AppSidebar userData={userData} isAdmin={isAdmin} />

      <div className={`${!isMobile ? open ? "w-[calc(100%-13rem)]": "w-[calc(100%-3rem)]" : "w-full"}`}>
        <header className={`sticky top-0 flex justify-between shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 z-30 backdrop-blur-lg bg-[hsl(43,100%,97%)] dark:bg-[hsl(240,10%,10%)] bg-opacity-80 dark:bg-opacity-80 py-3 pb-2 px-3 border-none`}>
          <div className="flex items-center gap-2">
            {showSidebarTrigger && <SidebarTrigger />}
            <BreadcrumbsButton />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon_sm" onClick={() => window.location.reload()}>
              <RefreshCcw />
            </Button>
            { userData.guid
              ? <UserDropdown userData={userData} />
              : <Link href="/sign_in"><Button size="smv2" variant="outline"><LogInIcon size={4} /> sign in</Button></Link>
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
