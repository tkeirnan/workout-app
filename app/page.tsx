import { NavigationTabs } from "@/components/navigation-tabs"

export const metadata = {
  title: "Workout Logger",
  description: "Track your gym workouts with ease",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <NavigationTabs />
    </main>
  )
}
