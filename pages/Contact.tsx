import React, { useState } from 'react';
import { Plus, Send, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Shared Bullet Style
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 ${className}`}>
    {children}
  </div>
);

const Contact: React.FC = () => {
  const [subject, setSubject] = useState("");

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            Let’s Keep <br className="hidden md:block" /> It Human
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 tracking-widest normal-case">
            No bots. No corporate jargon. Just us.
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: [600px] | [1fr] | [250px]
          ========================== */}

          {/* SECTION 1: Intro Text */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start bg-transparent">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Personal <br/> Connection
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 italic">
                Since I’m a one-man show, you won't get a templated response from a support department.
              </p>
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">
                  When you reach out, you’re talking directly to me. Whether you have a technical glitch or just want to share what you’re building, I’m listening.
                </p>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 2: The Form */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 How Can <br/> I Help?
               </h3>
            </div>
            <div className="p-0 md:border-r border-black flex flex-col">
              <form className="flex flex-col w-full h-full">
                
                {/* Input Email */}
                <div className="border-b border-black p-6 md:p-10">
                  <label className="block text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 text-gray-500 uppercase">Your Email Address</label>
                  <input 
                    type="email" 
                    placeholder="NAME@YOURDOMAIN.COM"
                    className="w-full bg-transparent border-none outline-none text-xl md:text-3xl font-normal tracking-tight p-0 placeholder:text-gray-300 uppercase"
                  />
                </div>

                {/* Dropdown Subject */}
                <div className="border-b border-black p-6 md:p-10">
                  <label className="block text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 text-gray-500 uppercase">Subject of Inquiry</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-lg md:text-2xl font-normal tracking-tight p-0 appearance-none cursor-pointer uppercase"
                  >
                    <option value="" disabled>Select an option...</option>
                    <option value="support">Font Support: Technical issues or glyph help.</option>
                    <option value="upgrade">License Upgrades: Expanding your seat count.</option>
                    <option value="custom">Custom Projects: Unique brand collaborations.</option>
                    <option value="hello">Say Hello: Just a friendly greeting.</option>
                  </select>
                  
                  {/* Context Text based on selection */}
                  <div className="mt-4 min-h-[1.5em]">
                    {subject === "support" && <p className="text-xs normal-case italic text-gray-400">Having trouble with an installation or a glyph? Let’s fix it.</p>}
                    {subject === "upgrade" && <p className="text-xs normal-case italic text-gray-400">Need more seats for your growing team? I’ve got you.</p>}
                    {subject === "custom" && <p className="text-xs normal-case italic text-gray-400">Want a unique voice for your brand? Let’s collaborate.</p>}
                    {subject === "hello" && <p className="text-xs normal-case italic text-gray-400">Honestly, sometimes a friendly "Hi" from another part of the world is the best part of my day.</p>}
                  </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 p-6 md:p-10 min-h-[300px]">
                  <label className="block text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 text-gray-500 uppercase">Your Message</label>
                  <textarea 
                    placeholder="TELL ME EVERYTHING..."
                    className="w-full h-full bg-transparent border-none outline-none text-lg md:text-xl font-normal tracking-tight p-0 placeholder:text-gray-300 resize-none normal-case leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button className="group w-full p-10 bg-black text-white hover:bg-red-600 transition-colors duration-500 flex items-center justify-between">
                  <span className="text-3xl md:text-5xl font-normal tracking-tighter uppercase">Send Message</span>
                  <Send size={40} className="group-hover:translate-x-2 transition-transform duration-500" strokeWidth={1} />
                </button>
              </form>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 3: The Note */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Fast <br/> Service
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-6">
              <BrutalBox className="bg-white/5">
                <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">
                  Note: For faster service, please check our <Link to="/faq" className="text-black font-bold underline hover:no-underline transition-all">License FAQ</Link> before sending a message. Most questions are already answered there.
                </p>
              </BrutalBox>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

        </main>

        {/* FOOTER SPACER */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default Contact;