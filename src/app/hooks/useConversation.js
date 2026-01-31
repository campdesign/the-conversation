import { useState, useEffect, useRef } from 'react';

export function useConversation() {
  const [messages, setMessages] = useState([]);
  const [isConversing, setIsConversing] = useState(false);
  const [speakers, setSpeakers] = useState({ a: null, b: null });
  const [status, setStatus] = useState('idle'); // idle, speaking, thinking, waitingForUser

  // Identify who speaks next
  const getNextSpeaker = () => {
    if (messages.length === 0) return speakers.a;
    const lastSpeakerName = messages[messages.length - 1].speaker;
    return lastSpeakerName === speakers.a.name ? speakers.b : speakers.a;
  };

  const processTurn = async () => {
    if (!isConversing) return;

    const currentSpeaker = getNextSpeaker();
    const opponent = currentSpeaker.id === speakers.a.id ? speakers.b : speakers.a;

    // --- 1. HUMAN CHECK ---
    // If the next speaker is the human, we STOP and wait.
    if (currentSpeaker.id === 'user') {
      setStatus('waitingForUser');
      return; 
    }

    // --- 2. AI TURN ---
    setStatus('speaking');
    
    try {
      const response = await fetch('/api/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSpeaker: currentSpeaker.name,
          opponent: opponent.name,
          topic: messages.length === 0 ? speakers.topic : messages[0].topic, // keep topic consistent
          history: messages.map(m => ({ 
            role: m.speaker === currentSpeaker.name ? 'assistant' : 'user', 
            content: m.text 
          }))
        }),
      });

      const data = await response.json();
      
      if (!data.message) throw new Error("No message returned");

      // Add AI message to list
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          speaker: currentSpeaker.name, 
          text: data.message,
          topic: speakers.topic
        }
      ]);

    } catch (error) {
      console.error(error);
      setIsConversing(false); // Stop if error
    }
  };

  // --- 3. HUMAN INPUT FUNCTION ---
  // The UI will call this when YOU type something
  const sendUserMessage = (text) => {
    const currentSpeaker = getNextSpeaker();
    setMessages(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        speaker: currentSpeaker.name, 
        text: text 
      }
    ]);
    setStatus('thinking'); // Briefly show thinking before AI replies
  };

  // The Loop: Whenever messages change, trigger the next turn (unless it's human turn)
  useEffect(() => {
    if (isConversing && status !== 'waitingForUser') {
      const timeout = setTimeout(processTurn, 2000); // 2-second pause for pacing
      return () => clearTimeout(timeout);
    }
  }, [messages, isConversing, status]);

  const startConversation = (personA, personB, topic) => {
    setSpeakers({ a: personA, b: personB, topic });
    setMessages([]);
    setIsConversing(true);
    setStatus('starting');
  };

  return { 
    messages, 
    isConversing, 
    status, 
    startConversation,
    sendUserMessage // <--- We expose this so page.js can use it
  };
}