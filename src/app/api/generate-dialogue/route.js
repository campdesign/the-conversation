import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ message: "Error: Missing API Key" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = await req.json();
    const { currentSpeaker, opponent, topic, history, speakerProfile } = body;

    // --- 1. CLEAN HISTORY ---
    const cleanHistory = (history || []).map(msg => {
      const cleanedContent = msg.content.replace(/^[\w\s]+:\s*/, ""); 
      return { role: msg.role, content: cleanedContent };
    });

    // --- 2. DEEP LISTENING INSTRUCTIONS ---
    const systemInstruction = `
      ${speakerProfile}
      
      You are speaking to **${opponent}**.
      Topic: "${topic}".

      ### INSTRUCTIONS:
      1. **LISTEN:** Do not just wait for your turn. You MUST reference or react to the specific point ${opponent} just made.
      2. **BE PROVOCATIVE:** Challenge their logic, riff on their metaphor, or dismiss them entirely based on your personality.
      3. **FORMAT:** Speak naturally. No "Ah, I see" filler. 
      4. **LENGTH:** Keep it under 50 words. Short and punchy.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemInstruction },
        ...cleanHistory
      ],
      temperature: 0.9, // Higher = More creative/unpredictable
      max_tokens: 150,
    });

    let text = completion.choices[0].message.content;
    text = text.replace(/^[\w\s]+:\s*/, "").replace(/"/g, ''); 

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: "Error: " + error.message }, { status: 500 });
  }
}
