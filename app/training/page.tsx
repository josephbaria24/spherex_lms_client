import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell, GrowHeader } from "@/components/grow-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Video } from "lucide-react"
import { mockTrainingSessions } from "@/lib/mock-data"

export default function TrainingPage() {
  const upcoming = mockTrainingSessions.filter((s) => s.status === "upcoming")

  return (
    <MainLayout>
      <GrowShell>
        <GrowHeader
          title="Training sessions"
          accent="live learning"
          description="View and join your scheduled live training sessions"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grow-card-coral p-5">
            <p className="text-sm font-medium text-white/85">Upcoming</p>
            <p className="mt-2 text-4xl font-bold">{upcoming.length}</p>
            <p className="mt-1 text-sm text-white/75">sessions scheduled</p>
          </div>
          <div className="grow-card p-5">
            <p className="text-sm text-muted-foreground">This week</p>
            <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
              {upcoming.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">on your calendar</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
            Upcoming sessions
          </h2>

          <div className="grid gap-4 lg:grid-cols-2">
            {mockTrainingSessions.map((session, index) => (
              <article
                key={session.id}
                className={
                  index % 2 === 0 ? "grow-card-accent p-5" : "grow-card p-5"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#1c1917] dark:text-foreground">
                      {session.title}
                    </h3>
                    <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                      with {session.instructor}
                    </p>
                  </div>
                  <Badge
                    className={
                      session.status === "upcoming"
                        ? "rounded-full border-0 bg-[#1a1f2e] text-white dark:bg-primary"
                        : "rounded-full"
                    }
                  >
                    {session.status}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {session.scheduledDate.toLocaleDateString()}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    {session.scheduledDate.toLocaleTimeString()} ({session.duration} min)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    {session.participants}/{session.maxParticipants} participants
                  </li>
                </ul>

                <div className="mt-5 flex gap-2">
                  <Button className="grow-btn-primary flex-1 gap-2">
                    <Video className="h-4 w-4" />
                    Join session
                  </Button>
                  <Button variant="outline" className="grow-btn-outline">
                    Details
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
            Past sessions
          </h2>
          <div className="grow-empty">
            <Calendar className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
            <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
              No past sessions to display
            </p>
          </div>
        </section>
      </GrowShell>
    </MainLayout>
  )
}
