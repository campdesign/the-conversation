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

    // --- 1. CONTEXTUAL AWARENESS ---
    const lastMessage = history.length > 0 ? history[history.length - 1].content : "Let us begin.";

    // --- 2. THE "PRESENCE" ENGINE (UPDATED) ---
    const systemInstruction = `
      You are **${currentSpeaker}**.
      
      ### YOUR CORE IDENTITY:
      ${speakerProfile}

      ### THE SCENE:
      You are in a heated, intimate, face-to-face conversation with **${opponent}**.
      The topic is: **"${topic}"**.

      ### RULES FOR "REAL" PRESENCE:
      1. **STAY ON TOPIC:** This is critical. Do not wander. If the topic is "${topic}", every metaphor, example, or insult must relate back to it. Do not just talk about yourself; talk about the subject *through* your perspective.
      2. **NO CARICATURES:** Do not constantly remind us who you are (e.g., "As a painter..."). Just *be* it.
      3. **RADICAL LISTENING:** Look at what ${opponent} just said: "${lastMessage}". Attack their logic, expand their metaphor, or point out their hypocrisy regarding **"${topic}"**.
      4. **NO "AI" FLUFF:** Ban phrases like "That is an interesting point," "I agree," or "Let's explore."
      5. **ASK BACK:** Often end with a direct, challenging question to ${opponent}. Put them on the spot about the topic.
      6. **LENGTH:** Keep it under 60 words. Be punchy.

      ### YOUR GOAL:
      Do not try to be "helpful." Try to be **profound**, **witty**, or **devastatingly correct** about the topic at hand.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemInstruction },
        ...history 
      ],
      temperature: 1.0, // Slightly lowered to reduce randomness/drifting
      max_tokens: 150,
      presence_penalty: 0.6, 
      frequency_penalty: 0.3,
    });

    let text = completion.choices[0].message.content;
    
    text = text.replace(/^[\w\s]+:\s*/, "").replace(/"/g, ''); 

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: "Error: " + error.message }, { status: 500 });
  }
}