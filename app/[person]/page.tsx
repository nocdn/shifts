"use client"
import { Drawer } from "vaul"
import React, { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, ArrowRight, MoveRight } from "lucide-react"
import { motion } from "motion/react"
import Spinner from "@/components/spinner"
import { Toaster, toast } from "sonner"

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

  // Index of the currently displayed week within the fetched data array
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number | null>(null)

  const { person } = React.use(params) as { person: string }

  useEffect(() => {
    async function fetchData() {
      setIsFetching(true)
      const { data } = await supabase
        .from("shifts_multi")
        .select("*")
        .eq("person_name", person.toUpperCase())

      // Sort the results chronologically by week_commencing (ascending)
      const sorted = data
        ? [...data].sort(
            (a, b) =>
              new Date(a.week_commencing).getTime() -
              new Date(b.week_commencing).getTime()
          )
        : null

      setFetchedData(sorted)
      console.log(sorted)
      setIsFetching(false)
    }
    fetchData()
  }, [supabase, person])

  // Determine the initial week index once data has been fetched
  useEffect(() => {
    if (!fetchedData || fetchedData.length === 0) return

    function getMonday(d = new Date()) {
      const date = new Date(d)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(date.setDate(diff))
    }

    const currentMondayISO = getMonday().toISOString().slice(0, 10)
    const idx = fetchedData.findIndex(
      (item) => item.week_commencing.slice(0, 10) === currentMondayISO
    )

    // If current week not found, default to the most recent week
    setCurrentWeekIndex(idx !== -1 ? idx : fetchedData.length - 1)
  }, [fetchedData])

  // Update the displayed schedule whenever the index changes
  useEffect(() => {
    if (
      fetchedData &&
      currentWeekIndex !== null &&
      fetchedData[currentWeekIndex]
    ) {
      setThisWeekSchedule(fetchedData[currentWeekIndex])
    }
  }, [fetchedData, currentWeekIndex])

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
      {/* Week commencing label */}
      {thisWeekSchedule && (
        <div className="w-full flex mt-6 motion-opacity-in-0 px-6">
          <p className="font-jetbrains-mono font-medium text-sm text-gray-500">
            WEEK COMMENCING:{" "}
            <span className="text-black font-semibold">
              {new Date(thisWeekSchedule.week_commencing).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )}
            </span>
          </p>
        </div>
      )}
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
                  onClick={() => {
                    // calculate how many hours the shift is
                    const shiftHours =
                      (new Date(parsedShift.end).getTime() -
                        new Date(parsedShift.start).getTime()) /
                      (1000 * 60 * 60)
                    console.log(shiftHours)
                    toast(
                      <div className="flex items-center gap-1 font-jetbrains-mono">
                        <p className="font-medium text-gray-500">
                          TOTAL HOURS:{" "}
                        </p>
                        <p className="font-semibold">{shiftHours}</p>
                      </div>
                    )
                  }}
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
      {/* Navigation buttons */}
      <div className="grid grid-cols-2 gap-2 w-full mt-4 px-4.5">
        {(() => {
          const canGoBack = currentWeekIndex !== null && currentWeekIndex > 0
          const canGoNext =
            currentWeekIndex !== null &&
            fetchedData &&
            currentWeekIndex < fetchedData.length - 1

          return (
            <>
              <motion.div
                whileTap={
                  canGoBack
                    ? { scale: 0.95, backgroundColor: "#f3f4f6" }
                    : undefined
                }
                animate={{ backgroundColor: "#fff" }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                  backgroundColor: { duration: 0.35 },
                }}
                onMouseDown={() => {
                  if (canGoBack)
                    setCurrentWeekIndex((prev) =>
                      prev !== null ? prev - 1 : prev
                    )
                }}
                className={`px-4 py-2 rounded-lg font-jetbrains-mono font-medium border border-gray-200 flex gap-2 items-center justify-center transition-colors duration-300 ${
                  canGoBack ? "cursor-pointer" : "opacity-50 cursor-default"
                }`}
                style={{ backgroundColor: "#fff" }}
              >
                <div className="flex items-center gap-3">
                  <ArrowLeft size={18} strokeWidth={2.5} />
                  <p>BACK</p>
                </div>
              </motion.div>

              <motion.div
                whileTap={
                  canGoNext
                    ? { scale: 0.95, backgroundColor: "#f3f4f6" }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                  backgroundColor: { duration: 0.35 },
                }}
                onMouseDown={() => {
                  if (canGoNext)
                    setCurrentWeekIndex((prev) =>
                      prev !== null ? prev + 1 : prev
                    )
                }}
                className={`px-4 py-2 rounded-lg font-jetbrains-mono font-medium border border-gray-200 flex gap-2 items-center justify-center ${
                  canGoNext ? "cursor-pointer" : "opacity-50 cursor-default"
                }`}
                style={{ backgroundColor: "#fff" }}
              >
                <div className="flex items-center gap-3">
                  <p>NEXT</p>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </div>
              </motion.div>
            </>
          )
        })()}
      </div>
      <Toaster duration={500} />
    </div>
  )
}
