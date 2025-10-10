import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, HandshakeIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { toast } from "react-toastify"
import cabocilAPI from "@/apis/cabocil_api"

const GCID = "218571481520-eg3pfk5m2rtu846e7d90qfoh0a7jsi3d.apps.googleusercontent.com"

export default function SignIn() {
  const router = useRouter()

  async function PostSignUp(credentialResponse) {
    try {
      const response = await cabocilAPI.PostSignIn("", {}, {
        google_credential: credentialResponse.credential
      })
      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`error ${JSON.stringify(body)}`)
        return
      }

      toast.success("Login Successfull")

      cabocilAPI.SetCookie("CK:AT", body.data.access_token, 0)

      router.push("/home")

    } catch (e) {
      toast.error(`catch error ${e}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center self-center font-medium">
          <img src="/images/cookie_kid_logo_circle.png" className="h-16 w-16" />
          CaBocil
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <GoogleOAuthProvider clientId={GCID}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    // credentialResponse.credential is a JWT string from Google
                    PostSignUp(credentialResponse);
                  }}
                  onError={() => toast.error("Sorry, Login Failed")}
                  // 🔽 styling options
                  theme="filled_black"      // "outline" | "filled_blue" | "filled_black"
                  size="large"              // "small" | "medium" | "large"
                  shape="pill"              // "rectangular" | "pill" | "circle" | "square"
                  text="signin_with"        // "signin_with" | "signup_with" | "continue_with" | "signin"
                  logo_alignment="left"     // "left" | "center"
                  width="100%"              // px as string
                  locale="en"               // or "id" etc.
                  useOneTap                 // enable One Tap (optional)
                />
              </GoogleOAuthProvider>
            </div>
          </CardContent>
        </Card>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
          By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
          and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </div>
  )
}
