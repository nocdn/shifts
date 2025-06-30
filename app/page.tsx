"use client"
import Image from "next/image"
import { Drawer } from "vaul"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ArrowRight, X, Plus, MoveRight } from "lucide-react"
import Spinner from "@/components/spinner"

export default function Home() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
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
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [thisWeekSchedule, setThisWeekSchedule] = useState<FetchedData | null>(
    null
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    async function fetchData() {
      setIsFetching(true)
      const { data } = await supabase.from("shifts").select("*")
      setFetchedData(data)
      console.log(data)
      setIsFetching(false)
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
          setThisWeekSchedule(item)
        }
      })
    }
  }, [fetchedData])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (files && files.length > 0) {
      setFile(files[0])
      const url = URL.createObjectURL(files[0])
      setPreviewURL(url)
      console.log(files[0])
    }
  }

  function pickFile() {
    fileInputRef.current?.click()
  }

  async function submitFile() {
    if (!file) return
    const formData = new FormData()
    formData.append("image", file)
    fetch("/api/upload", { method: "POST", body: formData })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
      })
  }

  function cancelFile() {
    console.log("clearing file")
    setFile(null)
    setPreviewURL(null)
  }

  return (
    <div
      className="h-dvh w-screen bg-white p-4 focus:outline-none focus:ring-0"
      data-vaul-drawer-wrapper
    >
      <Drawer.Root>
        <div className="mx-4">
          <Drawer.Trigger className="transition-opacity duration-150 active:opacity-50 w-full focus:outline-none focus:ring-0">
            <div className="flex items-center justify-center w-full font-jetbrains-mono gap-2 px-3.5 text-sm font-medium py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-white focus:border-none">
              <Plus size={17} />
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
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  className="rounded-lg border border-gray-200 px-3.5 py-2.5 font-jetbrains-mono font-medium text-gray-900 text-sm"
                  onClick={pickFile}
                >
                  PICK FILE
                </button>
                {previewURL && (
                  <Image
                    src={previewURL}
                    alt="rota"
                    height={400}
                    width={400}
                    className="rounded-lg"
                  />
                )}
                {previewURL && (
                  <div className="w-full flex items-center gap-3">
                    <button
                      className="rounded-lg cursor-pointer border border-gray-200 w-full py-2.5 font-jetbrains-mono font-medium text-gray-900 text-sm inline-flex items-center gap-1.5 justify-center"
                      onClick={submitFile}
                    >
                      SUBMIT <ArrowRight size={16} />
                    </button>
                    <button
                      className="rounded-lg cursor-pointer border border-gray-200 w-full py-2.5 font-jetbrains-mono font-medium text-red-800 text-sm inline-flex items-center gap-1.5 justify-center"
                      onClick={cancelFile}
                    >
                      CANCEL <X size={16} />
                    </button>
                  </div>
                )}
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
        {thisWeekSchedule?.shifts.map((item, index) => {
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
              <p
                className={isPast ? "line-through font-medium" : "font-medium"}
              >
                {timeStart}
              </p>
              <MoveRight size={20} />
              <p
                className={isPast ? "line-through font-medium" : "font-medium"}
              >
                {timeEnd}
              </p>
            </div>
          )
        })}
        {thisWeekSchedule?.total_hours && (
          <div className="flex items-center px-6 w-full gap-2 font-jetbrains-mono motion-opacity-in-0 font-medium mt-4">
            <p>
              TOTAL HOURS:{" "}
              <span className="text-gray-500 font-bold">
                {thisWeekSchedule.total_hours}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
