import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const menuItems = ['Fonts', 'License', 'About', 'Contact', 'Policy', 'FAQ', 'Insights'];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const { error } = await supabase
        .from('fontsubscribers')
        .insert([{ 
          email: email.toLowerCase(), 
          source: 'footer_subscription',
          status: 'active' 
        }]);

      if (error) {
        if (error.code === '23505') throw new Error("EMAIL_ALREADY_SUBSCRIBED");
        throw error;
      }

      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      alert(err.message === "EMAIL_ALREADY_SUBSCRIBED" 
        ? "YOU ARE ALREADY IN OUR SYSTEM!" 
        : "SUBSCRIPTION_FAILED. PLEASE TRY AGAIN.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <footer className="w-full bg-[#FF5C00] border-t border-black font-mono uppercase text-black mt-[-1px]">
      {/* BARIS SATU: NEWSLETTER (TALL & FULLWIDTH) */}
      <div className="w-full py-24 px-6 md:px-12 border-b border-black">
        <div className="max-w-full flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-3 text-center lg:text-left">
            <h3 className="text-4xl md:text-7xl font-black italic tracking-tighter leading-none">
              STAY_IN_THE_LOOP
            </h3>
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] opacity-80">
              {status === 'success' ? 'THANK_YOU_FOR_JOINING_THE_TRIBE' : 'GET NOTIFIED ON NEW RELEASES & EXCLUSIVE DEALS'}
            </p>
          </div>

          <form 
            onSubmit={handleSubscribe} 
            className="w-full max-w-2xl flex border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER_YOUR_EMAIL_ADDRESS"
              className="w-full p-5 bg-transparent outline-none font-bold text-sm md:text-base placeholder:text-black/20"
              required
              disabled={status === 'loading'}
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="bg-black text-white px-8 md:px-12 font-black text-xs md:text-sm hover:bg-[#FF5C00] hover:text-black transition-all border-l border-black uppercase disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? 'WAITING...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* BARIS KEDUA: 4 KOLOM (NO VERTICAL GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 p-8 md:p-12 text-[11px] font-bold leading-relaxed">
        
        {/* KOLOM 1: NAV MENU (EXCEPT LOGIN) */}
        <div className="flex flex-col gap-3">
          <span className="opacity-40 tracking-[0.2em] mb-2 italic">DIRECTORY</span>
          {menuItems.map((item) => (
            <Link 
              key={item} 
              to={`/${item.toLowerCase()}`} 
              className="hover:underline tracking-widest w-fit"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* KOLOM 2: GAP */}
        <div className="hidden md:block"></div>

        {/* KOLOM 3: SOCIALS */}
        <div className="flex flex-col gap-3">
          <span className="opacity-40 tracking-[0.2em] mb-2 italic">SOCIAL_CHANNELS</span>
          <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="hover:underline w-fit">BEHANCE</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:underline w-fit">INSTAGRAM</a>
          <a href="mailto:hello@subqi.com" className="hover:underline w-fit">EMAIL_INQUIRY</a>
        </div>

        {/* KOLOM 4: COPYRIGHT & LOCATION */}
        <div className="flex flex-col gap-1 md:text-right">
          <span className="opacity-40 tracking-[0.2em] mb-2 italic">LEGAL_AND_HQ</span>
          <span className="tracking-tighter text-sm md:text-base font-black italic">© SUBQI STUDIO 2026</span>
          <span className="opacity-80">SLEMAN, YOGYAKARTA</span>
          <span className="opacity-80">INDONESIA</span>
          <div className="mt-6 flex md:justify-end gap-3 opacity-20 grayscale scale-90 origin-right">
             <span className="border border-black px-1">VISA</span> 
             <span className="border border-black px-1">MC</span> 
             <span className="border border-black px-1">PAYPAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;