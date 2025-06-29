import OpenAI from "openai"
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
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: "how many hours is Bartosz working" },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64}`,
          },
        ],
      },
    ],
  })

  const data = { text: response.output?.[0]?.content?.[0]?.text ?? "" }
  return Response.json(data)
}
