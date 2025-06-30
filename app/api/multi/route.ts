import OpenAI from "openai"
import { createServerClient } from "@/utils/supabase/server"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface PersonData {
  week_commencing: string
  shifts: { start: string; end: string }[]
  total_hours: number
}

type ParsedResponse = Record<string, PersonData>

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
            text: "from this image, please extract information for all the people in the JSON keys, of 'week_commencing', 'shifts', and 'total_hours'. All date and time values (including 'week_commencing', and the 'start' and 'end' fields in 'shifts') should be in ISO 8601 format with timezone of +1 (e.g., 2025-07-01T13:00:00+01:00). The JSON you output should not be in a codeblock, not in back ticks or anything like that, just the JSON should be your response, without any formatting, so no new line characters, etc. Because there will be data for multiple people, make sure to include the 'week_commencing', 'shifts', and 'total_hours' under each person's key - so it would look like this: { 'person1': { 'week_commencing': '2025-07-01T13:00:00+01:00', 'shifts': [ { 'start': '2025-07-01T13:00:00+01:00', 'end': '2025-07-01T14:00:00+01:00' } ], 'total_hours': 1 }, 'person2': { 'week_commencing': '2025-07-01T13:00:00+01:00', 'shifts': [ { 'start': '2025-07-01T13:00:00+01:00', 'end': '2025-07-01T14:00:00+01:00' } ], 'total_hours': 1 } }, only use the first names for the keys. The first names should be in all caps.",
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
  for (const [person_name, item] of Object.entries(parsed)) {
    const { data, error } = await supabase
      .from("shifts_multi")
      .insert([
        {
          week_commencing: item.week_commencing,
          person_name,
          shifts: item.shifts,
          total_hours: item.total_hours,
        },
      ])
      .select()
    insertResults.push({ person_name, data, error })
  }

  return Response.json({ parsed, insertResults })
}
