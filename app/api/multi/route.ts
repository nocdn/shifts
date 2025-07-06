import OpenAI from "openai"
import { createServerClient } from "@/utils/supabase/server"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface PersonData {
  week_commencing: string
  shifts: { start: string; end: string }[]
  total_hours: number
}

type ParsedResponse = {
  person_name: string
  week_commencing: string
  shifts: { start: string; end: string }[]
  total_hours: number
}[]

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("image")

  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
    })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")

  const response = await openai.responses.create({
    model: "o4-mini",
    reasoning: { effort: "high" },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: 'from this image, please extract information for all people into a JSON array of objects where each object has the keys "person_name", "week_commencing", "shifts", and "total_hours". All date and time values should be in ISO 8601 format with timezone +1. Output only the JSON array without any formatting or code blocks, no newlines. Example: [{ "person_name": "ALICE", "week_commencing": "2025-07-01T00:00:00+01:00", "shifts": [ { "start": "2025-07-01T09:00:00+01:00", "end": "2025-07-01T17:30:00+01:00" } ], "total_hours": 16.5 }, { "person_name": "BOB", "week_commencing": "2025-07-01T00:00:00+01:00", "shifts": [ { "start": "2025-07-03T08:30:00+01:00", "end": "2025-07-03T15:00:00+01:00" } ], "total_hours": 14.5 }]',
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64}`,
            detail: "high",
          },
        ],
      },
    ],
  })
  let parsed: ParsedResponse | null = null
  try {
    parsed = response.output_text
      ? (JSON.parse(response.output_text) as ParsedResponse)
      : null
    console.log("parsed:", parsed)
  } catch (e) {
    console.error("Failed to parse JSON from model output:", e, response)
  }

  if (!parsed) {
    return Response.json(
      { error: "Failed to parse model response" },
      { status: 500 }
    )
  }

  const supabase = createServerClient()

  // Insert each person's data into the shifts_multi table
  const insertResults = []
  for (const item of parsed) {
    const { data, error } = await supabase
      .from("shifts_multi")
      .insert([item])
      .select()
    insertResults.push({ person_name: item.person_name, data, error })
  }

  return Response.json({ parsed, insertResults })
}
