import OpenAI from "openai"
import { createServerClient } from "@/utils/supabase/server"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
            text: "from this image, please extract information for BARTOSZ in the JSON keys, of 'week_commencing', 'shifts', and 'total_hours'. All date and time values (including 'week_commencing', and the 'start' and 'end' fields in 'shifts') should be in ISO 8601 format with timezone of +1 (e.g., 2025-07-01T13:00:00+01:00). The JSON you output should not be in a codeblock, not in back ticks or anything like that, just the JSON should be your response, without any formatting, so no new line characters, etc.",
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
  let parsed = null
  try {
    parsed = response.output_text ? JSON.parse(response.output_text) : null
    console.log("parsed:", parsed)
  } catch (e) {
    console.error("Failed to parse JSON from model output:", e, response)
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("shifts")
    .insert([
      {
        week_commencing: parsed?.week_commencing,
        shifts: parsed?.shifts,
        total_hours: parsed?.total_hours,
      },
    ])
    .select()

  return Response.json({ parsed })
}
