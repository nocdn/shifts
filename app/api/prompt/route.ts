import OpenAI from "openai"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
import { createServerClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const { prompt, person } = await request.json()

  // Fetch the full schedule for the current week from Supabase
  const supabase = createServerClient()

  function getMonday(d: Date = new Date()) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  const thisMonday = getMonday()
  const isoMonday = thisMonday.toISOString().slice(0, 10) // YYYY-MM-DD

  // The week_commencing values in the DB include timezone (+01:00). Build a pattern that matches the date regardless of the time / tz part.
  const { data: scheduleData, error } = await supabase
    .from("shifts_multi")
    .select("*")
    .like("week_commencing", `${isoMonday}%`)

  if (error) {
    console.error("Error fetching schedule from Supabase:", error)
  }

  const schedule = JSON.stringify(scheduleData ?? [])

  const systemPrompt = `You are a helpful assistant that can answer questions about the weekly rota. The current week commences on ${isoMonday}. Here is the full schedule JSON for everyone this week: ${schedule}. The user asking the question is ${person}. Please answer precisely and concisely. The current date is ${new Date().toISOString()}. Do not use any markdown formatting. When you output dates, use the format DD/MM/YYYY. For times when the user asks who they're working with, add the times that they will be working with them in brackets next to the name (anchored to the original user asking the question, and what I mean by that is the time is relative to the user asking the question). For example, if the user asks who they're working with tomorrow, and tomorrow is 02/07/2025, and they're working with Katarzyna and Martyna, you should output "Tomorrow you're on with Katarzyna (13:00-17:00) and Martyna (13:00-20:00).", because the user would for example start at 13:00, so any time that they are working before 13:00 is not important to the user, unless they specify otherwise.`

  console.log("System prompt:", systemPrompt)
  console.log("User prompt:", prompt)
  const response = await openai.responses.create({
    model: "o4-mini",
    reasoning: { effort: "high" },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
  })
  return Response.json({ response: response.output_text })
}
