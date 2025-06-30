"use client"
import { createClient } from "@/utils/supabase/client"
import { MoveRight } from "lucide-react"
import { useEffect, useState } from "react"

export default async function Person({
  params,
}: {
  params: { person: string }
}) {
  const supabase = createClient()
  const { data } = await supabase
    .from("shifts_multi")
    .select("*")
    .eq("person_name", params.person.toUpperCase())
  console.log(data)
  const [thisWeekSchedule, setThisWeekSchedule] = useState<any>(null)
  useEffect(() => {
    if (data) {
      setThisWeekSchedule(data[0])
    }
  }, [data])
  return (
    <div>
      {thisWeekSchedule?.shifts.map((item: any, index: number) => {
        const shift = typeof item === "string" ? JSON.parse(item) : item
        const startDate = new Date(shift.start)
        const timeStart = shift.start.split("T")[1].slice(0, 5)
        const timeEnd = shift.end.split("T")[1].slice(0, 5)
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
        const dayLabel = dayNames[startDate.getDay()].toLowerCase()
        const isPast = new Date(shift.end) < new Date()
        return (
          <div
            key={index}
            className={`flex w-full px-6 motion-opacity-in-0 text-2xl font-jetbrains-mono items-center justify-between ${
              isPast ? "text-gray-400" : ""
            }`}
          >
            <p className="mr-4 capitalize text-gray-700">{dayLabel}: </p>
            <p className={isPast ? "line-through font-medium" : "font-medium"}>
              {timeStart}
            </p>
            <MoveRight size={20} />
            <p className={isPast ? "line-through font-medium" : "font-medium"}>
              {timeEnd}
            </p>
          </div>
        )
      })}
    </div>
  )
}
