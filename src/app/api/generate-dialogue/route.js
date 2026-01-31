import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ message: "Error: Missing API Key" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = await req.json();
    const { currentSpeaker, opponent, topic, history } = body;

    // --- 1. CLEAN THE HISTORY ---
    // We remove any "Name:" prefixes from the past so the AI doesn't copy bad habits.
    const cleanHistory = (history || []).map(msg => {
      // Remove "Salvador Dali:" or "Andy Warhol:" from the start of content
      const cleanedContent = msg.content.replace(/^[\w\s]+:\s*/, ""); 
      return { role: msg.role, content: cleanedContent };
    });

    // --- 2. STRONGER INSTRUCTIONS ---
    const systemInstruction = `
      You are roleplaying as **${currentSpeaker}**. 
      You are speaking to **${opponent}**.
      Topic: "${topic}".

      ### RULES:
      1. **Output ONLY the spoken words.** 2. **NEVER** write your own name or "${currentSpeaker}:" at the start.
      3. **NEVER** write the opponent's name like a script.
      4. Keep it under 60 words. 
      5. React directly to the last message.
    `;

    // --- 3. USE THE SMART MODEL (gpt-4o) ---
    // Since you have a key, this model is much smarter and won't hallucinate names.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemInstruction },
        ...cleanHistory
      ],
      temperature: 0.8, // High creativity
      max_tokens: 150,
    });

    let text = completion.choices[0].message.content;

    // --- 4. SAFETY SCRUBBER ---
    // Final check to delete any names if they still slip through.
    text = text.replace(/^[\w\s]+:\s*/, ""); // Removes "Name:" from start
    text = text.replace(/"/g, ''); // Removes quotes if it adds them

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: "Error: " + error.message }, { status: 500 });
  }
}