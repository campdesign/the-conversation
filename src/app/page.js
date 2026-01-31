'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useConversation } from './hooks/useConversation';
import { characters } from './utils/characters';

const RANDOM_TOPICS = [
  "Does free will actually exist?",
  "Is art more important than science?",
  "Can a machine ever truly have a soul?",
  "Is true happiness attainable?",
  "Does power always corrupt?",
  "What is the meaning of dreams?",
  "Is chaos necessary for order?",
  "Is the internet good for humanity?"
];

export default function Home() {
  const { messages, isConversing, status, startConversation, sendUserMessage } = useConversation();
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [topic, setTopic] = useState("");
  const [userTextInput, setUserTextInput] = useState(""); // For when YOU speak
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const toggleSelection = (charId) => {
    if (selectedIds.includes(charId)) {
      setSelectedIds(selectedIds.filter(id => id !== charId));
    } else {
      if (selectedIds.length < 2) setSelectedIds([...selectedIds, charId]);
    }
  };

  const handleStart = () => {
    if (selectedIds.length !== 2) return;
    if (!topic.trim()) return alert("Please enter a topic.");
    const personA = characters.find(c => c.id === selectedIds[0]);
    const personB = characters.find(c => c.id === selectedIds[1]);
    startConversation(personA, personB, topic);
  };

  // Pick a random topic
  const randomizeTopic = () => {
    const random = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setTopic(random);
  };

  // Submit your own text
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userTextInput.trim()) return;
    sendUserMessage(userTextInput);
    setUserTextInput("");
  };

  const getChar = (id) => characters.find(c => c.id === id);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-serif flex flex-col items-center p-6 md:p-12">
      
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] uppercase mb-4">The Conversation</h1>
        <div className="w-24 h-[1px] bg-neutral-400 mx-auto"></div>
      </header>

      {/* --- SETUP SCREEN --- */}
      {!isConversing && messages.length === 0 && (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
          <p className="text-neutral-500 italic mb-8 tracking-widest text-sm">SELECT TWO THINKERS</p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {characters.map((char) => {
              const isSelected = selectedIds.includes(char.id);
              const selectionIndex = selectedIds.indexOf(char.id); 
              return (
                <button 
                  key={char.id}
                  onClick={() => toggleSelection(char.id)}
                  className={`group relative flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                >
                  <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 shadow-lg transition-all ${isSelected ? 'border-neutral-900 ring-4 ring-neutral-200' : 'border-transparent grayscale'}`}>
                    <Image src={char.avatar} alt={char.name} fill className="object-cover" />
                  </div>
                  <span className={`mt-3 text-xs uppercase tracking-widest font-bold ${isSelected ? 'text-neutral-900' : 'text-neutral-400'}`}>{char.name}</span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-neutral-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">{selectionIndex + 1}</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className={`w-full max-w-xl transition-all duration-500 ${selectedIds.length === 2 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
            <div className="bg-white p-8 shadow-xl border border-neutral-200 text-center relative">
              <div className="flex justify-center items-center gap-4 mb-6 text-sm text-neutral-500 uppercase tracking-widest">
                 <span>{selectedIds[0] ? getChar(selectedIds[0]).name : '...'}</span>
                 <span className="text-neutral-300 mx-2">VS</span>
                 <span>{selectedIds[1] ? getChar(selectedIds[1]).name : '...'}</span>
              </div>

              {/* TOPIC INPUT + RANDOM BUTTON */}
              <div className="relative mb-6">
                <input 
                  type="text" 
                  placeholder="What is the topic?" 
                  className="w-full text-center p-3 text-xl border-b border-neutral-300 outline-none placeholder:italic placeholder:text-neutral-300 bg-transparent"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <button 
                  onClick={randomizeTopic}
                  className="absolute right-0 top-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900"
                >
                  Random ↻
                </button>
              </div>
              
              <button 
                onClick={handleStart} 
                className="w-full py-4 bg-neutral-900 text-white text-sm tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all"
              >
                Begin Performance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHAT SCREEN --- */}
      {(isConversing || messages.length > 0) && (
        <div className="w-full max-w-3xl flex flex-col gap-6 pb-40">
          <div className="text-center text-neutral-400 text-xs uppercase tracking-widest mb-8 border-b border-neutral-200 pb-4">
            {getChar(selectedIds[0]).name} <span className="mx-2">&times;</span> {getChar(selectedIds[1]).name}
          </div>
          
          {messages.map((msg) => {
            const isLeft = msg.speaker === getChar(selectedIds[0]).name;
            const currentSpeaker = characters.find(c => c.name === msg.speaker);

            return (
              <div key={msg.id} className={`flex w-full items-end gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="relative w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-full overflow-hidden border border-neutral-300 shadow-sm mb-1">
                   {currentSpeaker && <Image src={currentSpeaker.avatar} alt={msg.speaker} fill className="object-cover" />}
                </div>
                <div className={`max-w-[80%] md:max-w-[70%] p-6 rounded-2xl text-lg md:text-xl leading-relaxed shadow-sm ${isLeft ? 'bg-white text-neutral-800 rounded-bl-none border border-neutral-100' : 'bg-neutral-900 text-neutral-100 rounded-br-none'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* STATUS INDICATORS */}
          {status === 'waitingForUser' ? (
             // HUMAN INPUT BOX
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4">
               <form onSubmit={handleUserSubmit} className="relative shadow-2xl rounded-full overflow-hidden flex bg-white border border-neutral-300">
                 <input 
                   autoFocus
                   type="text" 
                   className="w-full p-4 pl-6 text-lg outline-none" 
                   placeholder="Your turn. Speak..." 
                   value={userTextInput}
                   onChange={(e) => setUserTextInput(e.target.value)}
                 />
                 <button type="submit" className="bg-neutral-900 text-white px-8 font-bold uppercase tracking-wider text-sm hover:bg-neutral-700">
                   Send
                 </button>
               </form>
             </div>
          ) : (
            // AI THINKING INDICATOR
            isConversing && status !== 'idle' && (
              <div className="text-center mt-4 text-neutral-400 text-xs tracking-widest animate-pulse">
                Thinking...
              </div>
            )
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
}