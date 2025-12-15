
import cabocilAPI from "@/apis/cabocil_api"
import { ActivityBookCard, ActivityVideoCard } from "@/components/ActivityBar"
import { Card, CardContent } from "@/components/ui/card"
import Utils from "@/models/Utils"
import { useEffect, useState } from "react"

export default function UserActivitiesPage() {
  const [userActivities, setUserActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    setLoading(true)
    try {
      const response = await cabocilAPI.GetRecentActivities("", {}, {})

      if (response.status === 200) {
        const body = await response.json()
        if (body.success && body.data && body.data.users) {
          setUserActivities(body.data.users)
        }
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Recent User Activities</h1>
        <div className="text-sm text-muted-foreground">{userActivities.length} active sessions</div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-sm text-muted-foreground">Loading activities...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {userActivities.map((user) => (
            <Card key={user.app_session} className="overflow-hidden bg-card/50 p-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  {/* Compact Header */}
                  <div className="flex flex-row justify-between items-start sm:items-center gap-2 border-b pb-2 mb-1 border-border/50">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md" title={user.email}>
                          {user.email || "Guest"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-mono">
                          {user.app_session}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      <span className="hidden sm:inline">Last Active: </span>{formatDate(user.last_activity_at)} ({Utils.GetTimeElapsed(user.last_activity_at)})
                    </div>
                  </div>

                  {/* Horizontal Activities List using reused components */}
                  {(!user.activities || user.activities.length === 0) ? (
                    <p className="text-muted-foreground italic text-xs py-2">No recent activities recorded.</p>
                  ) : (
                    <div className="flex flex-row overflow-x-auto gap-3 pb-2 -mx-1 px-1 py-1 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-secondary">
                      {user.activities.map((activity, actIndex) => {
                        const key = `${user.app_session}-${actIndex}`
                        if (activity.activity_type === 'video') {
                          return <ActivityVideoCard key={key} activity={activity} />
                        }
                        return <ActivityBookCard key={key} activity={activity} />
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {userActivities.length === 0 && (
            <div className="text-center p-8 text-muted-foreground text-sm">No recent user activities found.</div>
          )}
        </div>
      )}
    </div>
  )
}
