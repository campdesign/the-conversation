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
  }, [conversation, showControls]);

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
    <main style={{ 
      // DARK GRADIENT BACKGROUND
      background: 'linear-gradient(to bottom, #111111, #2a2a2a)', 
      minHeight: '100vh',
      color: 'white',
      padding: '40px 20px', 
      fontFamily: 'serif', 
      textAlign: 'center' 
    }}>
      
      {/* BANNER HEADER */}
      <div style={{ marginBottom: '60px' }}>
        <img 
          src="/banner.png" 
          alt="The Conversation" 
          style={{ 
            maxWidth: '100%', 
            width: '600px', 
            height: 'auto', 
            display: 'block', 
            margin: '0 auto',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' // Subtle glow
          }} 
        />
      </div>

      {/* SELECTION GRID */}
      <section style={{ marginBottom: '60px' }}>
        <h3 style={{ fontStyle: 'italic', marginBottom: '30px', color: '#aaa', letterSpacing: '2px' }}>SELECT TWO THINKERS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          {characters.map(char => (
            <button 
              key={char.id}
              onClick={() => toggleChar(char.id)}
              style={{
                border: selected.includes(char.id) ? '3px solid #fff' : '1px solid #444',
                padding: '20px',
                // Semi-transparent tiles so they blend into the dark theme
                background: selected.includes(char.id) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '12px',
                transition: 'all 0.2s',
                backdropFilter: 'blur(5px)'
              }}
            >
              <img src={char.avatar} alt={char.name} style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '15px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{char.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* MARQUEE TOPIC AREA */}
      <div style={{ margin: '60px 0' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '10px', color: '#888' }}>...VS...</p>
        <input 
          type="text" 
          placeholder="ENTER TOPIC" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ 
            padding: '20px', 
            width: '100%', 
            fontSize: '3rem', 
            textAlign: 'center', 
            border: 'none',
            borderBottom: '2px solid white',
            background: 'transparent',
            textTransform: 'uppercase',
            fontWeight: '900',
            outline: 'none',
            color: 'white', // White Text
            textShadow: '0 0 20px rgba(255,255,255,0.3)'
          }}
        />
      </div>

      {/* MAIN ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '60px' }}>
        <button onClick={setRandomTopic} style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid #555', padding: '10px 20px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Random Topic ↻
        </button>
        
        {!isTalking && !showControls && (
          <button onClick={startPerformance} style={{ padding: '20px 60px', fontSize: '1.5rem', background: 'white', color: 'black', border: 'none', cursor: 'pointer', letterSpacing: '2px', borderRadius: '8px', textTransform: 'uppercase', fontWeight: 'bold', boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}>
            Begin Performance
          </button>
        )}

        {isTalking && (
          <button disabled style={{ padding: '20px 60px', fontSize: '1.5rem', background: '#333', color: '#888', border: 'none', cursor: 'wait', letterSpacing: '2px', borderRadius: '8px' }}>
            DEBATING...
          </button>
        )}
      </div>

      {/* STAGE */}
      {conversation.length > 0 && (
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
          {conversation.map((line, index) => {
            const isLeft = line.speaker === characters.find(c => c.id === selected[0]).name;
            return (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: isLeft ? 'row' : 'row-reverse', 
                alignItems: 'center', 
                gap: '20px', 
                alignSelf: isLeft ? 'flex-start' : 'flex-end', 
                maxWidth: '90%'
              }}>
                <img 
                  src={line.avatar} 
                  alt={line.speaker} 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    flexShrink: 0,
                    border: '3px solid #555',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                  }} 
                />
                
                {/* 3D BUBBLES */}
                <div style={{ 
                  // DIMENSION & GRADIENTS
                  background: isLeft 
                    ? 'linear-gradient(135deg, #ffffff 0%, #dcdcdc 100%)' // Left: Shiny White
                    : 'linear-gradient(135deg, #222222 0%, #000000 100%)', // Right: Deep Black
                  
                  color: isLeft ? 'black' : 'white',
                  border: isLeft ? 'none' : '1px solid #333',
                  
                  // 3D Shadow
                  boxShadow: isLeft 
                    ? '5px 5px 15px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(255,255,255,1)' 
                    : '5px 5px 15px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.1)',
                  
                  padding: '30px 40px', 
                  borderRadius: '30px',
                  borderBottomLeftRadius: isLeft ? '4px' : '30px',
                  borderBottomRightRadius: isLeft ? '30px' : '4px',
                  fontSize: '1.2rem',
                  lineHeight: '1.5',
                  textAlign: 'left',
                }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {line.speaker}
                  </strong>
                  {line.text}
                </div>
              </div>
            );
          })}

          {/* CONTROLS */}
          {showControls && (
            <div style={{ 
              marginTop: '40px', 
              padding: '40px', 
              borderTop: '1px solid #333', 
              display: 'flex', 
              gap: '20px', 
              justifyContent: 'center',
              animation: 'fadeIn 0.5s ease'
            }}>
              <button onClick={continuePerformance} style={{ padding: '20px 40px', fontSize: '1.2rem', background: 'white', color: 'black', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                CONTINUE DISCUSSION
              </button>
              <button onClick={startPerformance} style={{ padding: '20px 40px', fontSize: '1.2rem', background: 'transparent', color: 'white', border: '2px solid white', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>
                RESTART
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      )}
    </main>
  );
}
