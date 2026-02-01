'use client';
import { useState } from 'react';
import { characters } from './utils/characters';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState('');

  const toggleChar = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', fontFamily: 'serif', textAlign: 'center' }}>
      
      <h1 style={{ fontSize: '3rem', marginBottom: '40px', letterSpacing: '2px' }}>THE CONVERSATION</h1>

      {/* CHARACTER SELECTION */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontStyle: 'italic', marginBottom: '20px' }}>SELECT TWO THINKERS</h3>
        
        {/* THE GRID: 3 Columns, Auto-Rows */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          maxWidth: '500px',
          margin: '0 auto' 
        }}>
          {characters.map(char => (
            <button 
              key={char.id}
              onClick={() => toggleChar(char.id)}
              style={{
                border: selected.includes(char.id) ? '2px solid black' : '1px solid #ccc',
                padding: '15px',
                background: selected.includes(char.id) ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <img 
                src={char.avatar} 
                alt={char.name} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover' }} 
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{char.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* TOPIC INPUT */}
      <div style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '30px 0', margin: '40px 0' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>...VS...</p>
        <input 
          type="text" 
          placeholder="What is the topic?" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ padding: '10px', width: '60%', fontSize: '1rem', textAlign: 'center' }}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <button style={{ 
          padding: '15px 40px', 
          fontSize: '1.2rem', 
          background: 'black', 
          color: 'white', 
          border: 'none', 
          cursor: 'pointer',
          letterSpacing: '1px'
        }}>
          BEGIN PERFORMANCE
        </button>

        <button style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
          RANDOM TOPIC ↻
        </button>
      </div>

    </main>
  );
}
