"use client"
import { Drawer } from "vaul"
import Spinner from "@/components/spinner"
import React, { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ArrowRight, X, Plus } from "lucide-react"
import { Cropper, type CropperRef } from "react-advanced-cropper"
import "react-advanced-cropper/dist/style.css"

export default function Admin() {
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
  const [isLoading, setIsLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropperRef = useRef<CropperRef>(null)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("shifts_multi").select("*")
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
    setIsLoading(true)
    if (!file) return
    // get cropped image blob if cropper is available
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas()
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (!blob) return
          console.log("Cropped blob:", blob)
          const dataUrl = canvas.toDataURL("image/png")
          console.log("Cropped data URL:", dataUrl)
          const formData = new FormData()
          formData.append("image", blob, file.name)
          for (const [key, value] of formData.entries()) {
            console.log("FormData entry:", key, value)
          }
          try {
            const response = await fetch("/api/multi", {
              method: "POST",
              body: formData,
            })
            const data = await response.json()
            console.log(data)
          } catch (error) {
            console.error(error)
          }
        }, "image/png")
        return
      }
    }
    // fallback with logging
    const formData = new FormData()
    formData.append("image", file)
    console.log("Fallback file:", file)
    for (const [key, value] of formData.entries()) {
      console.log("FormData entry:", key, value)
    }
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      console.log(data)
      setIsLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  function cancelFile() {
    console.log("clearing file")
    setFile(null)
    setPreviewURL(null)
    setIsLoading(false)
    setIsVaulOpen(false)
  }

  const [isVaulOpen, setIsVaulOpen] = React.useState(false)

  return (
    <div
      className="h-dvh w-screen bg-white p-4 focus:outline-none focus:ring-0"
      data-vaul-drawer-wrapper
    >
      <Drawer.Root
        dismissible={false}
        open={isVaulOpen}
        onOpenChange={setIsVaulOpen}
      >
        <div className="mx-4">
          <Drawer.Trigger className="transition-opacity duration-150 active:opacity-50 w-full focus:outline-none focus:ring-0 cursor-pointer">
            <div className="flex items-center justify-center w-full font-jetbrains-mono gap-2 px-3.5 text-sm font-medium py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-white focus:border-none">
              <Plus size={17} />
            </div>
          </Drawer.Trigger>
        </div>
        <Drawer.Portal>
          <Drawer.Overlay
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsVaulOpen(false)}
          />
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
                  className="rounded-lg border border-gray-200 px-3.5 py-2.5 font-jetbrains-mono font-medium text-gray-900 text-sm cursor-pointer"
                  onClick={pickFile}
                >
                  PICK FILE
                </button>
                {previewURL && (
                  <Cropper
                    ref={cropperRef}
                    src={previewURL}
                    className="rounded-lg"
                    // optionally configure stencilProps such as aspectRatio
                  />
                )}
                {previewURL && (
                  <div className="w-full flex items-center gap-3">
                    <button
                      className="rounded-lg cursor-pointer border border-gray-200 w-full py-2.5 font-jetbrains-mono font-medium text-gray-900 text-sm inline-flex items-center gap-1.5 justify-center"
                      onClick={() => {
                        if (isLoading) return
                        submitFile()
                      }}
                    >
                      {isLoading ? (
                        <Spinner size={20} />
                      ) : (
                        <>
                          SUBMIT <ArrowRight size={16} />
                        </>
                      )}
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
