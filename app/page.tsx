"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function Home() {
  const supabase = createClient()
  interface Shift {
    start: string
    end: string
  }

  interface FetchedData {
    week_commencing: string
    shifts: Shift[]
    total_hours: number
  }

  const [fetchedData, setFetchedData] = useState<FetchedData[] | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("shifts").select("*")
      setFetchedData(data)
      console.log(data)
    }
    fetchData()
  }, [supabase])

  useEffect(() => {
    const now = new Date()
    const isoNow = now.toISOString()
    console.log(isoNow)

    function getMonday(d = new Date()) {
      const date = new Date(d)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(date.setDate(diff))
    }

    const weekCommencing = getMonday()
    console.log(weekCommencing.toISOString().slice(0, 10))

    if (fetchedData) {
      fetchedData.forEach((item) => {
        if (
          item.week_commencing.slice(0, 10) ===
          weekCommencing.toISOString().slice(0, 10)
        ) {
          console.log("thisWeekSchedule:", item)
        }
      })
    }
  }, [fetchedData])

  const peopleRoutes = [
    {
      name: "Sylwia",
      route: "/sylwia",
    },
    {
      name: "Anita",
      route: "/anita",
    },
    {
      name: "Katarzyna",
      route: "/katarzyna",
    },
    {
      name: "Martyna",
      route: "/martyna",
    },
    {
      name: "Justyna",
      route: "/justyna",
    },
    {
      name: "Grzegorz",
      route: "/grzegorz",
    },
    {
      name: "Bartosz",
      route: "/bartosz",
    },
    {
      name: "Nicol",
      route: "/nicol",
    },
  ]

  return (
    <div
      className="h-dvh w-screen bg-white p-4 focus:outline-none focus:ring-0"
      data-vaul-drawer-wrapper
    >
      <div className="mt-6 ml-4">
        <p className="text-sm font-medium font-jetbrains-mono">
          PICK PERSON TO VIEW SHIFTS:
        </p>
        <div className="flex flex-wrap gap-2 font-jetbrains-mono text-sm font-medium mt-4">
          {peopleRoutes.map((person) => (
            <a
              className="border border-gray-200 rounded-lg px-3.5 py-2.5 w-fit"
              key={person.name}
              href={person.route}
            >
              {person.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
