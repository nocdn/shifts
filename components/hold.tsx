"use client"
import { useRef, useEffect } from "react"

export default function HoldButton({ onComplete }: { onComplete: () => void }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerDown = () => {
    timeoutRef.current = setTimeout(() => {
      onComplete()
      timeoutRef.current = null
    }, 2000)
  }

  const handlePointerUp = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <button
        className="button font-jetbrains-mono rounded-lg cursor-pointer border border-gray-200 w-full py-2.5 text-sm"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div aria-hidden="true" className="hold-overlay rounded-lg">
          HOLD TO CANCEL
        </div>
        HOLD TO CANCEL
      </button>
      <style jsx>{`
        .button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          color: #21201c;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          transition: transform 160ms ease-out;
        }

        .button:active {
          transform: scale(0.97);
          border-color: #ffb3b5;
        }

        .button:active .hold-overlay {
          clip-path: inset(0px 0px 0px 0px);
          transition: clip-path 2s linear;
        }

        .hold-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: #ffdbdc;
          color: #e5484d;
          clip-path: inset(0px 100% 0px 0px);
          transition: clip-path 200ms ease-out;
        }
      `}</style>
    </>
  )
}
