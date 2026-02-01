'use client';
import { useState, useEffect, useRef } from 'react';
import { characters } from './utils/characters';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState('');
  const [conversation, setConversation] = useState([]); 
  const [isTalking, setIsTalking] = useState(false);
  
  // This keeps the chat scrolled to the bottom
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

  // --- THE LOGIC: Talking to your API ---
  const runTurn = async (currentHistory, speakerIndex) => {
    if (!isTalking) return; 

    // 1. Identify who is speaking right now
    const speaker = characters.find(c => c.id === selected[speakerIndex]);
    const opponent = characters.find(c => c.id === selected[speakerIndex === 0 ? 1 : 0]);

    try {
      // 2. Call your backend (route.js)
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
      
      // 3. Add the new line to the screen
      const newLine = { speaker: speaker.name, text: data.message };
      const newHistory = [...currentHistory, newLine];
      setConversation(newHistory);

      // 4. If less than 6 turns, wait 1 second and run the next person!
      if (newHistory.length < 6) {
        setTimeout(() => runTurn(newHistory, speakerIndex === 0 ? 1 : 0), 1000);
      } else {
        setIsTalking(false); // End conversation
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
    
    // Start the loop with empty history, Speaker 0 goes first
    runTurn([], 0);
  };

  // Simple Random Topic Generator
  const setRandomTopic = () => {
    const topics = ["The Afterlife", "Artificial Intelligence", "What is Art?", "The Perfect Society", "Love vs Logic"];
    setTopic(topics[Math.floor(Math.random() * topics.length)]);
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', fontFamily: 'serif', textAlign: 'center' }}>
      
      <h1 style={{ fontSize: '3rem', marginBottom: '40px', letterSpacing: '2px' }}>THE CONVERSATION</h1>

      {/* SELECTION GRID */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontStyle: 'italic', marginBottom: '20px' }}>SELECT TWO THINKERS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
          {characters.map(char => (
            <button 
              key={char.id}
              onClick={() => toggleChar(char.id)}
              style={{
                border: selected.includes(char.id) ? '2px solid black' : '1px solid #ccc',
                padding: '15px',
                background: selected.includes(char.id) ? '#f0f0f0' : 'white',
                opacity: (selected.length >= 2 && !selected.includes(char.id)) ? 0.5 : 1,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <img src={char.avatar} alt={char.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover' }} />
              <span style={{ fontWeight: 'bold' }}>{char.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* INPUT AREA */}
      <div style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '30px 0', margin: '40px 0' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>...VS...</p>
        <input 
          type="text" 
          placeholder="Topic (e.g. The Moon)" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ padding: '10px', width: '60%', fontSize: '1rem', textAlign: 'center' }}
        />
      </div>

      {/* BUTTONS (Swapped Order) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        
        <button 
          onClick={setRandomTopic}
          style={{ background: 'none', border: '1px solid #ccc', padding: '8px 15px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '4px' }}>
          RANDOM TOPIC ↻
        </button>

        <button 
          onClick={startPerformance}
          disabled={isTalking}
          style={{ 
            padding: '15px 40px', 
            fontSize: '1.2rem', 
            background: isTalking ? '#ccc' : 'black', 
            color: 'white', 
            border: 'none', 
            cursor: isTalking ? 'default' : 'pointer',
            letterSpacing: '1px',
            borderRadius: '4px'
          }}>
          {isTalking ? 'DEBATING...' : 'BEGIN PERFORMANCE'}
        </button>

      </div>

      {/* THE STAGE (Chat Output) */}
      {conversation.length > 0 && (
        <div style={{ marginTop: '60px', textAlign: 'left', background: '#f9f9f9', padding: '40px', borderRadius: '8px', minHeight: '200px' }}>
          {conversation.map((line, index) => (
            <div key={index} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: '#555' }}>{line.speaker}</strong>
              <p style={{ fontSize: '1.2rem', marginTop: '5px', lineHeight: '1.5' }}>{line.text}</p>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
      )}

    </main>
  );
}
