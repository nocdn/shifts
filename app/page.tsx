"use client"
import Image from "next/image"
import { Drawer } from "vaul"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ArrowRight, X, Plus } from "lucide-react"

export default function Home() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
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
      fetchedData.forEach((item, index) => {
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
    <div className="h-dvh w-screen bg-white p-4" data-vaul-drawer-wrapper>
      <Drawer.Root shouldScaleBackground>
        <Drawer.Trigger className="transition-opacity duration-150 active:opacity-50">
          <Plus />
        </Drawer.Trigger>
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
    </div>
  )
}
