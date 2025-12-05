import { useRouter } from "next/router";
import Home from "./home";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    router.push("/home")
  }, [])

  return (<></>)
}
