'use client';
import { useState, useEffect, useRef } from 'react';
import { characters } from './utils/characters';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState('');
  const [conversation, setConversation] = useState([]); 
  const [isTalking, setIsTalking] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const chatBottomRef = useRef(null);
  const isTalkingRef = useRef(false);
  const carouselRef = useRef(null);

  const carouselList = [...characters, ...characters];

  // Helper to find selected character objects
  const player1 = selected.length > 0 ? characters.find(c => c.id === selected[0]) : null;
  const player2 = selected.length > 1 ? characters.find(c => c.id === selected[1]) : null;

  const toggleChar = (id) => {
    if (isDragging) return;

    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e) => {
    setIsDragging(false); 
    carouselRef.current.style.animationPlayState = 'paused';
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return;
    e.preventDefault();
    setIsDragging(true);
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    carouselRef.current.style.animationPlayState = 'running';
    setTimeout(() => setIsDragging(false), 50);
  };

  // --- API LOGIC ---
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

      if (newHistory.length % 2 !== 0) { 
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
    
    // Slight scroll just to bring the stage into view initially
    setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  const continuePerformance = () => {
    setShowControls(false);
    setIsTalking(true);
    isTalkingRef.current = true;
    const lastSpeakerName = conversation[conversation.length - 1].speaker;
    const nextSpeakerIndex = characters.find(c => c.id === selected[0]).name === lastSpeakerName ? 1 : 0;
    runTurn(conversation, nextSpeakerIndex);
  };

  const fullReset = () => {
    setIsTalking(false);
    isTalkingRef.current = false;
    setSelected([]);       
    setTopic('');          
    setConversation([]);   
    setShowControls(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const setRandomTopic = () => {
    const topics = ["The Afterlife", "Artificial Intelligence", "What is Art?", "The Perfect Society", "Love vs Logic", "Squirrels"];
    setTopic(topics[Math.floor(Math.random() * topics.length)]);
  };

  return (
    <main style={{ 
      backgroundImage: "url('/texture.png'), radial-gradient(circle at center, #a14e15 0%, #260b00 85%)",
      backgroundRepeat: 'repeat, no-repeat',
      backgroundPosition: 'top left, center',
      backgroundSize: '400px, cover', 
      backgroundBlendMode: 'multiply', 
      
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'serif', 
      paddingBottom: '0px', 
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      
      {/* CSS FOR RESPONSIVENESS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 10px rgba(0,0,0,0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.2); }
          100% { transform: scale(1); box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        }
        .carousel-container::-webkit-scrollbar { display: none; }
        .carousel-container { -ms-overflow-style: none; scrollbar-width: none; }

        .responsive-banner {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        /* FADE WIDTH DEFAULTS (Desktop) */
        .carousel-fade { width: 400px; }

        /* MOBILE OVERRIDES */
        @media (max-width: 768px) {
          /* Shrink fade on mobile so we can still see characters */
          .carousel-fade { width: 80px !important; }

          .responsive-banner { 
            height: 140px !important; 
            object-position: center !important;
          }
          
          .intro-text { font-size: 1rem !important; }
          .vs-container { flex-direction: column !important; gap: 20px !important; }
          .topic-input { font-size: 1.5rem !important; width: 90% !important; }
          .chat-avatar { width: 60px !important; height: 60px !important; }
          .chat-bubble { padding: 15px 20px !important; font-size: 1rem !important; border-radius: 20px !important; }
          .action-button { width: 90% !important; padding: 20px !important; font-size: 1.2rem !important; }
        }
      `}} />

      <div>
        {/* BANNER (Top) */}
        <div style={{ width: '100%', marginBottom: '0px', background: 'transparent' }}>
          <img 
            src="/banner.png" 
            alt="The Conversation" 
            className="responsive-banner" 
            style={{ margin: '0 auto' }} 
          />
        </div>

        {/* INTRO */}
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto 40px auto', 
          textAlign: 'center', 
          padding: '0 20px'
        }}>
          <h2 className="intro-text" style={{ 
            fontSize: '1.2rem', 
            fontStyle: 'italic', 
            color: '#e6c288', 
            letterSpacing: '1px',
            lineHeight: '1.6',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            LADIES AND GENTLEMEN! Step right up to the Theater of the Mind.<br/>
            Select two legends from the carousel below, set the stage with a topic,<br/>
            and witness a conversation that defies time and space!
          </h2>
        </div>

        {/* CAROUSEL (CIRCLES) */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '40px', overflow: 'hidden' }}>
          
          {/* LEFT FADE (Deep Fade) */}
          <div className="carousel-fade" style={{
            position: 'absolute', top: 0, left: 0, height: '100%', zIndex: 2,
            background: 'linear-gradient(to right, rgba(38,11,0,1) 0%, transparent 100%)',
            pointerEvents: 'none'
          }}></div>
          
          {/* RIGHT FADE (Deep Fade) */}
          <div className="carousel-fade" style={{
            position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 2,
            background: 'linear-gradient(to left, rgba(38,11,0,1) 0%, transparent 100%)',
            pointerEvents: 'none'
          }}></div>

          <div 
            className="carousel-container" 
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ overflowX: 'auto', cursor: isDragging ? 'grabbing' : 'grab', padding: '20px 0', width: '100%' }}
          >
            <div style={{ display: 'flex', gap: '30px', width: 'max-content', animation: isDragging ? 'none' : 'drift 80s linear infinite', padding: '0 50px' }}>
              {carouselList.map((char, index) => (
                <div 
                  key={`${char.id}-${index}`} 
                  onClick={() => toggleChar(char.id)}
                  style={{
                    flex: '0 0 auto', 
                    width: '160px',
                    border: selected.includes(char.id) ? '3px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                    padding: '15px',
                    background: selected.includes(char.id) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    color: 'white', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    borderRadius: '12px', 
                    transition: 'transform 0.2s',
                    transform: selected.includes(char.id) ? 'scale(1.05)' : 'scale(1)',
                    backdropFilter: 'blur(5px)',
                    boxShadow: selected.includes(char.id) ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
                    userSelect: 'none'
                  }}
                >
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      marginBottom: '10px', 
                      objectFit: 'cover', 
                      border: '2px solid rgba(255,255,255,0.5)', 
                      pointerEvents: 'none' 
                    }} 
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {char.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MATCHUP CARDS */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          
          <div className="vs-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '40px' }}>
            
            {/* Card 1 */}
            <div style={{ 
              width: '180px', height: '250px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '10px'
            }}>
              {player1 ? (
                <>
                  <img src={player1.avatar} style={{ width: '100%', height: '80%', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }} />
                  <span style={{ marginTop: '15px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{player1.name}</span>
                </>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '5rem', lineHeight: '1' }}>?</span>
              )}
            </div>

            <div style={{ fontSize: '3rem', fontStyle: 'italic', fontWeight: '900', color: '#e6c288', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>VS</div>

            {/* Card 2 */}
            <div style={{ 
              width: '180px', height: '250px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '10px'
            }}>
               {player2 ? (
                <>
                  <img src={player2.avatar} style={{ width: '100%', height: '80%', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }} />
                  <span style={{ marginTop: '15px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{player2.name}</span>
                </>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '5rem', lineHeight: '1' }}>?</span>
              )}
            </div>
          </div>

          {/* TOPIC */}
          <div style={{ 
              margin: '0 auto 20px auto', width: '100%', maxWidth: '700px', aspectRatio: '3 / 1', 
              backgroundImage: "url('/topicframe.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' 
          }}>
            <input 
              className="topic-input"
              type="text" placeholder="ENTER TOPIC" value={topic} onChange={(e) => setTopic(e.target.value)}
              style={{ 
                width: '80%', fontSize: '2.5rem', textAlign: 'center', border: 'none', background: 'transparent', 
                textTransform: 'uppercase', fontWeight: '900', outline: 'none', color: '#3e2723', fontFamily: 'serif',
                textShadow: '0 1px 1px rgba(255,255,255,0.5)'
              }}
            />
          </div>

          <div style={{ marginBottom: '60px' }}>
              <button onClick={setRandomTopic} style={{ background: 'rgba(0,0,0,0.3)', color: '#e6c288', border: '1px solid rgba(226, 194, 136, 0.4)', padding: '10px 20px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Random Topic ↻
            </button>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '60px' }}>
            {!isTalking && !showControls && (
              <button 
                className="action-button"
                onClick={startPerformance} 
                style={{ 
                  padding: '25px 60px', fontSize: '1.8rem', background: 'black', color: '#e6c288', 
                  border: '1px solid #e6c288', cursor: 'pointer', letterSpacing: '3px', borderRadius: '8px', 
                  textTransform: 'uppercase', fontFamily: 'serif', animation: 'pulse 2s infinite', boxShadow: '0 0 20px rgba(0,0,0,0.8)'
                }}
              >
                ☞&nbsp;&nbsp;Begin Performance&nbsp;&nbsp;☜
              </button>
            )}

            {isTalking && (
              <button className="action-button" disabled style={{ padding: '20px 60px', fontSize: '1.5rem', background: 'rgba(0,0,0,0.5)', color: '#aaa', border: '1px solid #555', cursor: 'wait', letterSpacing: '2px', borderRadius: '8px' }}>
                DEBATING...
              </button>
            )}
          </div>

          {/* CHAT */}
          {conversation.length > 0 && (
            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px', paddingLeft: '20px', paddingRight: '20px' }}>
              {conversation.map((line, index) => {
                const isLeft = line.speaker === characters.find(c => c.id === selected[0]).name;
                return (
                  <div key={index} style={{ 
                    display: 'flex', flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'center', 
                    gap: '20px', alignSelf: isLeft ? 'flex-start' : 'flex-end', maxWidth: '90%'
                  }}>
                    <img className="chat-avatar" src={line.avatar} alt={line.speaker} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.5)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }} />
                    <div className="chat-bubble" style={{ 
                      background: isLeft ? 'linear-gradient(135deg, #ffffff 0%, #dcdcdc 100%)' : 'linear-gradient(135deg, #222222 0%, #000000 100%)',
                      color: isLeft ? 'black' : 'white', boxShadow: isLeft ? '5px 5px 15px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(255,255,255,1)' : '5px 5px 15px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.1)',
                      padding: '30px 40px', borderRadius: '30px', borderBottomLeftRadius: isLeft ? '4px' : '30px', borderBottomRightRadius: isLeft ? '30px' : '4px',
                      fontSize: '1.2rem', lineHeight: '1.5', textAlign: 'left'
                    }}>
                      <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>{line.speaker}</strong>
                      {line.text}
                    </div>
                  </div>
                );
              })}

              {showControls && (
                <div style={{ marginTop: '40px', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '20px', justifyContent: 'center', animation: 'fadeIn 0.5s ease' }}>
                  <button className="action-button" onClick={continuePerformance} style={{ padding: '20px 40px', fontSize: '1.2rem', background: 'white', color: '#260b00', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                    CONTINUE DISCUSSION
                  </button>
                  <button className="action-button" onClick={fullReset} style={{ padding: '20px 40px', fontSize: '1.2rem', background: 'transparent', color: 'white', border: '2px solid white', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>
                    RESTART
                  </button>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer style={{ 
        marginTop: '60px', 
        textAlign: 'center',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Full Width Image - Responsive */}
        <img 
          src="/footer.png" 
          alt="Decoration" 
          className="responsive-banner" 
          style={{ opacity: 0.9 }} 
        />
        
        {/* Info Container */}
        <div style={{ padding: '30px 20px' }}>
            <p style={{ fontSize: '0.9rem', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            © {new Date().getFullYear()} 
            <a 
                href="http://www.campdesign.net" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                color: '#e6c288', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px'
                }}
            >
                ❖ A CampDesign Project
            </a>
            </p>
        </div>
      </footer>

    </main>
  );
}