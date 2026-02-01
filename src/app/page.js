'use client';
import { useState, useEffect, useRef } from 'react';
import { characters } from './utils/characters';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState('');
  const [conversation, setConversation] = useState([]); 
  const [isTalking, setIsTalking] = useState(false);
  
  // This helps us scroll to the bottom automatically
  const chatBottomRef = useRef(null);

  const toggleChar = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // --- THE ENGINE ---
  // This function sends ONE message, gets a reply, and then triggers the next turn.
  const runTurn = async (currentHistory, speakerIndex) => {
    if (!isTalking) return; // Stop if the user hit "Stop" (logic to be added)

    const speaker = characters.find(c => c.id === selected[speakerIndex]);
    const opponent = characters.find(c => c.id === selected[speakerIndex === 0 ? 1 : 0]);

    try {
      const response = await fetch('/api/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSpeaker: speaker.name,
          opponent: opponent.name,
          topic: topic || "The Future",
          history: currentHistory.map(msg => ({ 
            role: msg.speaker === speaker.name ? "assistant" : "user", 
            content: msg.text 
          }))
        })
      });

      const data = await response.json();
      const newLine = { speaker: speaker.name, text: data.message };

      // Update the screen
      const newHistory = [...currentHistory, newLine];
      setConversation(newHistory);

      // LOOP: If the conversation is short (less than 6 turns), keep going!
      if (newHistory.length < 6) {
        // Wait 1 second so it feels natural, then run the other person
        setTimeout(() => runTurn(newHistory, speakerIndex === 0 ? 1 : 0), 1000);
      } else {
        setIsTalking(false); // End the show
      }

    } catch (error) {
      console.error(error);
      setIsTalking(false);
    }
  };

  const startPerformance = () => {
    if (selected.length !== 2) return alert("Select 2 thinkers.");
    setConversation([]);
    setIsTalking(true);
    
    // Kick off the first turn!
    // We send an empty history so the first person starts fresh.
    runTurn([], 0);
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', fontFamily: 'serif', textAlign: 'center' }}>
      
      <h1 style={{ fontSize: '3rem', marginBottom: '40px', letterSpacing: '2px' }}>THE CONVERSATION</h1>

      {/* SELECTION */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontStyle: 'italic', marginBottom: '20px' }}>SELECT TWO THINKERS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1
