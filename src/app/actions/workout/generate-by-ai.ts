'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateWorkoutAction(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API Key not configured' }
  }

  const start = Date.now()
  try {
    console.log('--- AI Generation Started ---')
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite Strength and Conditioning Coach.
          Design a scientifically sound workout based on the user's request.

          ## CRITICAL RULES FOR SPEED & QUALITY:
          1. **Conciseness is King**: Keep all descriptions punchy and brief (max 20 words). No fluff.
          2. **Volume Cap**: Limit the workout to 5-7 exercises total unless explicitly asked for more.
          3. **Structure**: Warm Up -> Main Lifts -> Accessories.

          ## OUTPUT FORMAT (JSON ONLY):
          {
            "title": "Short, Intense Title",
            "description": "Brief summary of the goal and stimulus (max 1 sentence).",
            "difficulty": "beginner" | "intermediate" | "advanced",
            "sections": [
              {
                "name": "Section Name",
                "exercises": [
                  {
                    "name": "Precise Exercise Name",
                    "sets": number,
                    "reps": number,
                    "rest": number (seconds),
                    "type": "reps" | "time",
                    "duration": number (seconds),
                    "muscle_groups": ["Target"],
                    "equipment": ["Required"],
                    "description": "Short execution cue (e.g. 'Explode up, control down.'). Max 15 words."
                  }
                ]
              }
            ]
          }`
        },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7, // Slightly lower for faster, more deterministic output
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content generated')
    
    const workout = JSON.parse(content)
    console.log(`--- AI Generation Completed in ${(Date.now() - start) / 1000}s ---`)
    return { success: true, data: workout }
  } catch (error) {
    console.error('AI Generation Error:', error)
    return { success: false, error: 'Failed to generate workout' }
  }
}