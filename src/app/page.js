'use client';
import { useState, useEffect, useRef } from 'react';
import { characters } from './utils/characters';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState('');
  const [conversation, setConversation] = useState([]); 
  const [isTalking, setIsTalking] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const chatBottomRef = useRef(null);
  const isTalkingRef = useRef(false);

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
  }, [conversation, isTalking]);

  const runTurn = async (currentHistory, speakerIndex) => {
    if (!isTalkingRef.current) return; 

    const speaker = characters.find(c => c.id === selected[speakerIndex]);
    const opponent = characters.find(c => c.id === selected[speakerIndex === 0 ? 1 : 0]);

    try {
      const response = await fetch('/api/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSpeaker: speaker.name,
          opponent: opponent.name,
          speakerProfile: speaker.prompt, 
          topic: topic || "The Future",
          history: currentHistory.map(msg => ({ 
            role: msg.speaker === speaker.name ? "assistant" : "user", 
            content: msg.text 
          }))
        })
      });

      const data = await response.json();
      
      if (!isTalkingRef.current) return;

      const newLine = { speaker: speaker.name, text: data.message, avatar: speaker.avatar };
      const newHistory = [...currentHistory, newLine];
      setConversation(newHistory);

      if (newHistory.length % 6 !== 0) { 
        setTimeout(() => runTurn(newHistory, speakerIndex === 0 ? 1 : 0), 4000);
      } else {
        setIsTalking(false);
        isTalkingRef.current = false;
        setShowControls(true);
      }

    } catch (error) {
      console.error(error);
      setIsTalking(false);
      isTalkingRef.current = false;
    }
  };

  const startPerformance = () => {
    if (selected.length !== 2) return alert("Select 2 thinkers.");
    setConversation([]);
    setShowControls(false);
    setIsTalking(true);
    isTalkingRef.current = true; 
    runTurn([], 0);
  };

  const continuePerformance = () => {
    setShowControls(false);
    setIsTalking(true);
    isTalkingRef.current = true;
    const lastSpeakerName = conversation[conversation.length - 1].speaker;
    const nextSpeakerIndex = characters.find(c => c.id === selected[0]).name === lastSpeakerName ? 1 : 0;
    runTurn(conversation, nextSpeakerIndex);
  };

  const setRandomTopic = () => {
    const topics = ["The Afterlife", "Artificial Intelligence", "What is Art?", "The Perfect Society", "Love vs Logic", "Squirrels"];
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

      {/* INPUT */}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <button onClick={setRandomTopic} style={{ background: 'none', border: '1px solid #ccc', padding: '8px 15px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '4px' }}>RANDOM TOPIC ↻</button>
        
        {!isTalking && !showControls && (
          <button onClick={startPerformance} style={{ padding: '15px 40px', fontSize: '1.2rem', background: 'black', color: 'white', border: 'none', cursor: 'pointer', letterSpacing: '1px', borderRadius: '4px' }}>
            BEGIN PERFORMANCE
          </button>
        )}

        {isTalking && (
          <button disabled style={{ padding: '15px 40px', fontSize: '1.2rem', background: '#ccc', color: 'white', border: 'none', cursor: 'wait', letterSpacing: '1px', borderRadius: '4px' }}>
            DEBATING...
          </button>
        )}

        {showControls && (
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={continuePerformance} style={{ padding: '15px 30px', fontSize: '1rem', background: 'black', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              CONTINUE DISCUSSION
            </button>
            <button onClick={startPerformance} style={{ padding: '15px 30px', fontSize: '1rem', background: 'white', color: 'black', border: '1px solid black', cursor: 'pointer', borderRadius: '4px' }}>
              RESTART
            </button>
          </div>
        )}

      </div>

      {/* STAGE */}
      {conversation.length > 0 && (
        <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
          {conversation.map((line, index) => {
            const isLeft = line.speaker === characters.find(c => c.id === selected[0]).name;
            return (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: isLeft ? 'row' : 'row-reverse', 
                alignItems: 'center', // Aligns bubble with center of head
                gap: '20px', // Bigger gap for bigger heads
                alignSelf: isLeft ? 'flex-start' : 'flex-end', 
                maxWidth: '90%'
              }}>
                {/* THE FIX: 
                   1. width/height: 100px (2x larger)
                   2. flexShrink: 0 (Prevents squishing)
                   3. objectFit: 'cover' (Keeps face proportional)
                */}
                <img 
                  src={line.avatar} 
                  alt={line.speaker} 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    flexShrink: 0,
                    border: '2px solid #eee'
                  }} 
                />
                
                <div style={{ 
                  background: isLeft ? '#f0f0f0' : 'black', 
                  color: isLeft ? 'black' : 'white',
                  padding: '25px 30px', // Larger bubble padding
                  borderRadius: '24px',
                  borderBottomLeftRadius: isLeft ? '4px' : '24px',
                  borderBottomRightRadius: isLeft ? '24px' : '4px',
                  fontSize: '1.1rem',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {line.speaker}
                  </strong>
                  {line.text}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
      )}
    </main>
  );
}
