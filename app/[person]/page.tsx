"use client"
import { Drawer } from "vaul"
import React, { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { MoveRight } from "lucide-react"
import Spinner from "@/components/spinner"

export default function Person({ params }: { params: any }) {
  const supabase = createClient()
  const [isFetching, setIsFetching] = useState(false)
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
  const [thisWeekSchedule, setThisWeekSchedule] = useState<FetchedData | null>(
    null
  )

  const { person } = React.use(params) as { person: string }

  useEffect(() => {
    async function fetchData() {
      setIsFetching(true)
      const { data } = await supabase
        .from("shifts_multi")
        .select("*")
        .eq("person_name", person.toUpperCase())
      setFetchedData(data)
      console.log(data)
      setIsFetching(false)
    }
    fetchData()
  }, [supabase, person])

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
          setThisWeekSchedule(item)
        }
      })
    }
  }, [fetchedData])

  const [promptInput, setPromptInput] = useState("")
  const [promptResponse, setPromptResponse] = useState("")
  const [isPromptLoading, setIsPromptLoading] = useState(false)

  const handleSubmit = () => {
    setIsPromptLoading(true)
    console.log(promptInput)
    console.log("submitting to model")
    fetch("/api/prompt", {
      method: "POST",
      body: JSON.stringify({
        prompt: promptInput,
        person,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        setPromptResponse(data.response)
        setIsPromptLoading(false)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  // Days of the week helper (MON-SUN)
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  return (
    <div
      className="h-dvh w-screen bg-white p-4 focus:outline-none focus:ring-0"
      data-vaul-drawer-wrapper
    >
      <Drawer.Root>
        <div className="mx-4">
          <Drawer.Trigger className="transition-opacity duration-150 active:opacity-50 w-full focus:outline-none focus:ring-0 cursor-pointer">
            <div className="flex items-center justify-center w-full font-jetbrains-mono gap-2 px-3.5 text-sm font-medium py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-white focus:border-none">
              CHAT
            </div>
          </Drawer.Trigger>
        </div>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="bg-gray-100 flex flex-col rounded-t-[10px] mt-24 h-fit fixed bottom-0 left-0 right-0 outline-none">
            <Drawer.Title className="sr-only">upload a new shift</Drawer.Title>
            <div className="p-4 bg-white rounded-t-[10px] flex-1">
              <div
                aria-hidden
                className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8"
              />
              <div className="max-w-md mx-auto flex flex-col gap-3">
                {promptResponse !== "" && (
                  <p className="text-black rounded-lg bg-gray-100 p-2.5 font-sans">
                    {promptResponse}
                  </p>
                )}
                {isPromptLoading && (
                  <div className="font-jetbrains-mono font-medium text-sm flex items-center gap-1.5">
                    <Spinner /> LOADING RESPONSE...
                  </div>
                )}
                <textarea
                  placeholder="Who am I working with tomorrow..."
                  style={{ padding: "12px" }}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  className="w-full h-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-0 font-jetbrains-mono font-medium"
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <div className="flex flex-col gap-2 w-full items-center mt-8">
        {isFetching && (
          <div className="flex items-center justify-center w-full gap-2 font-jetbrains-mono text-sm font-medium motion-opacity-in-0">
            <Spinner /> FETCHING DATA...
          </div>
        )}
        {thisWeekSchedule === null && !isFetching && (
          <div className="flex items-center justify-center w-full gap-2 font-jetbrains-mono text-sm font-medium motion-opacity-in-0">
            <p>NO SHIFTS THIS WEEK</p>
          </div>
        )}
        {thisWeekSchedule &&
          dayNames.map((dayName, dayIndex) => {
            // Try to find a shift for the current week day
            const shiftItem = thisWeekSchedule.shifts.find((item) => {
              const shift = typeof item === "string" ? JSON.parse(item) : item
              // Map Monday-based index (0-6) to JS getDay() output (1-6,0)
              const weekDayNumber = (dayIndex + 1) % 7
              return new Date(shift.start).getDay() === weekDayNumber
            }) as Shift | undefined

            // Determine if the day has already passed (used for greyed-out style)
            let dayDate: Date | null = null
            if (thisWeekSchedule) {
              const weekStart = new Date(thisWeekSchedule.week_commencing) // Monday
              dayDate = new Date(weekStart)
              dayDate.setDate(weekStart.getDate() + dayIndex)
            }
            const now = new Date()

            if (shiftItem) {
              const parsedShift =
                typeof shiftItem === "string"
                  ? (JSON.parse(shiftItem) as Shift)
                  : (shiftItem as Shift)

              const timeStart = parsedShift.start.split("T")[1].slice(0, 5)
              const timeEnd = parsedShift.end.split("T")[1].slice(0, 5)
              const shiftIsPast = new Date(parsedShift.end) < now
              return (
                <div
                  key={dayIndex}
                  className={`flex w-full px-6 motion-opacity-in-0 text-2xl font-jetbrains-mono items-center justify-between ${
                    shiftIsPast ? "text-gray-400" : ""
                  }`}
                >
                  <p className="mr-4 capitalize text-gray-700">
                    {dayName.toLowerCase()}:{" "}
                  </p>
                  <p
                    className={
                      shiftIsPast ? "line-through font-medium" : "font-medium"
                    }
                  >
                    {timeStart}
                  </p>
                  <MoveRight size={20} />
                  <p
                    className={
                      shiftIsPast ? "line-through font-medium" : "font-medium"
                    }
                  >
                    {timeEnd}
                  </p>
                </div>
              )
            }

            // Day off
            return (
              <div
                key={dayIndex}
                className="flex w-full px-6 motion-opacity-in-0 text-2xl font-jetbrains-mono items-center justify-between text-gray-400 relative"
              >
                <p className="mr-4 capitalize">{dayName.toLowerCase()}: </p>
                <p className="font-medium">OFF&nbsp;&nbsp;</p>
                <MoveRight size={20} className="invisible" />
                <p className="font-medium invisible">OFF&nbsp;&nbsp;</p>
              </div>
            )
          })}
        {thisWeekSchedule?.total_hours && (
          <div className="flex items-center px-6 w-full gap-2 font-jetbrains-mono motion-opacity-in-0 font-medium mt-4">
            <p className="whitespace-nowrap">
              TOTAL HOURS:{" "}
              <span className="text-gray-500 font-bold">
                {thisWeekSchedule.total_hours}
              </span>
            </p>
            <div className="bg-gray-300 h-0.5 w-full rounded-lg ml-3.5"></div>
          </div>
        )}
      </div>
    </div>
  )
}
