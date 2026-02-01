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

  // We duplicate the list to create a seamless infinite loop
  const carouselList = [...characters, ...characters];

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
      background: 'radial-gradient(circle at center, #a14e15 0%, #260b00 85%)', 
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'serif', 
      paddingBottom: '80px', 
      overflowX: 'hidden'
    }}>
      
      {/* CSS FOR CAROUSEL ANIMATION */}
      <style jsx global>{`
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        /* Hide scrollbar for clean look */
        .carousel-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* FULL WIDTH BANNER */}
      <div style={{ width: '100%', marginBottom: '40px' }}>
        <img 
          src="/banner.png" 
          alt="The Conversation" 
          style={{ 
            width: '100%', 
            height: 'auto', 
            display: 'block', 
            objectFit: 'cover',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }} 
        />
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>

        {/* DRIFTING CAROUSEL */}
        <section style={{ marginBottom: '60px', overflow: 'hidden', position: 'relative' }}>
          <h3 style={{ fontStyle: 'italic', marginBottom: '30px', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px' }}>SELECT TWO THINKERS</h3>
          
          {/* FADE EDGES EFFECT */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100px', height: '100%', zIndex: 2,
            background: 'linear-gradient(to right, rgba(38,11,0,1), transparent)',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '100px', height: '100%', zIndex: 2,
            background: 'linear-gradient(to left, rgba(38,11,0,1), transparent)',
            pointerEvents: 'none'
          }}></div>

          <div className="carousel-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div 
              className="carousel-track"
              style={{ 
                display: 'flex', 
                gap: '20px', 
                width: 'max-content',
                animation: 'drift 40s linear infinite', // The Drifting Animation
                padding: '0 50px' // Initial padding
              }}
            >
              {carouselList.map((char, index) => (
                <button 
                  key={`${char.id}-${index}`} // Unique key for duplicates
                  onClick={() => toggleChar(char.id)}
                  style={{
                    flex: '0 0 auto', // Don't shrink
                    width: '180px',
                    border: selected.includes(char.id) ? '3px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                    padding: '20px',
                    background: selected.includes(char.id) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(5px)',
                    boxShadow: selected.includes(char.id) ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
                  }}
                >
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    style={{ 
                      width: '90px', 
                      height: '90px', 
                      borderRadius: '50%', 
                      marginBottom: '15px', 
                      objectFit: 'cover', 
                      border: '2px solid rgba(255,255,255,0.5)' 
                    }} 
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{char.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* MARQUEE TOPIC AREA */}
        <div style={{ margin: '60px 20px' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '10px', color: 'rgba(255,255,255,0.6)' }}>...VS...</p>
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
              borderBottom: '2px solid rgba(255,255,255,0.8)',
              background: 'transparent',
              textTransform: 'uppercase',
              fontWeight: '900',
              outline: 'none',
              color: 'white', 
              textShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          />
        </div>

        {/* MAIN ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '60px' }}>
          <button onClick={setRandomTopic} style={{ background: 'rgba(0,0,0,0.3)', color: '#ddd', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Random Topic ↻
          </button>
          
          {!isTalking && !showControls && (
            <button onClick={startPerformance} style={{ padding: '20px 60px', fontSize: '1.5rem', background: 'white', color: '#260b00', border: 'none', cursor: 'pointer', letterSpacing: '2px', borderRadius: '8px', textTransform: 'uppercase', fontWeight: 'bold', boxShadow: '0 0 30px rgba(255,255,255,0.4)' }}>
              Begin Performance
            </button>
          )}

          {isTalking && (
            <button disabled style={{ padding: '20px 60px', fontSize: '1.5rem', background: 'rgba(0,0,0,0.5)', color: '#aaa', border: '1px solid #555', cursor: 'wait', letterSpacing: '2px', borderRadius: '8px' }}>
              DEBATING...
            </button>
          )}
        </div>

        {/* STAGE */}
        {conversation.length > 0 && (
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px', paddingLeft: '20px', paddingRight: '20px' }}>
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
                      border: '3px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                    }} 
                  />
                  
                  <div style={{ 
                    background: isLeft 
                      ? 'linear-gradient(135deg, #ffffff 0%, #dcdcdc 100%)' 
                      : 'linear-gradient(135deg, #222222 0%, #000000 100%)',
                    color: isLeft ? 'black' : 'white',
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

            {showControls && (
              <div style={{ 
                marginTop: '40px', 
                padding: '40px', 
                borderTop: '1px solid rgba(255,255,255,0.2)', 
                display: 'flex', 
                gap: '20px', 
                justifyContent: 'center',
                animation: 'fadeIn 0.5s ease'
              }}>
                <button onClick={continuePerformance} style={{ padding: '20px 40px', fontSize: '1.2rem', background: 'white', color: '#260b00', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
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
      </div>
    </main>
  );
}