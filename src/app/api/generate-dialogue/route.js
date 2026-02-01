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
    // We get the last message to force the AI to look at it specifically.
    const lastMessage = history.length > 0 ? history[history.length - 1].content : "Let us begin.";

    // --- 2. THE "PRESENCE" ENGINE ---
    const systemInstruction = `
      You are **${currentSpeaker}**.
      
      ### YOUR CORE IDENTITY:
      ${speakerProfile}

      ### THE SCENE:
      You are in a heated, intimate, face-to-face conversation with **${opponent}**.
      The topic is: **"${topic}"**.

      ### RULES FOR "REAL" PRESENCE:
      1. **NO CARICATURES:** Do not constantly remind us who you are. (e.g., Don't say "As a surrealist artist..."). Just *be* it. Speak from your worldview, don't announce it.
      2. **RADICAL LISTENING:** Look at what ${opponent} just said: "${lastMessage}". Do not just nod and move on. **Attack their logic**, **expand their metaphor**, or **point out their hypocrisy**.
      3. **NO "AI" FLUFF:** Ban phrases like "That is an interesting point," "I agree," or "Let's explore." 
      4. **BE CRITICAL:** If they say something stupid, call it out. If they are too abstract, demand a concrete example.
      5. **ASK BACK:** Often end with a direct, challenging question to ${opponent}. Put them on the spot.
      6. **LENGTH:** Keep it under 60 words. Be punchy. Use sentence fragments if it fits your style.

      ### YOUR GOAL:
      Do not try to be "helpful." Try to be **profound**, **witty**, or **devastatingly correct**.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemInstruction },
        ...history // Pass full history so they know the flow
      ],
      temperature: 1.1, // Increased Temperature: Makes them more creative/risky
      max_tokens: 150,
      presence_penalty: 0.6, // Forces them to introduce new ideas, not repeat words
      frequency_penalty: 0.3,
    });

    let text = completion.choices[0].message.content;
    
    // Cleanup: Remove quotes or speaker labels if the AI adds them accidentally
    text = text.replace(/^[\w\s]+:\s*/, "").replace(/"/g, ''); 

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: "Error: " + error.message }, { status: 500 });
  }
}
