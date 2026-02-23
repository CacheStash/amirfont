import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = React.useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic subscribe bisa disambungkan ke Supabase fontsubscribers nanti
    alert("SUCCESSFULLY SUBSCRIBED!");
    setEmail('');
  };

  return (
    <footer className="w-full bg-[#FF5C00] border-t-2 border-black font-mono uppercase text-black">
      {/* BARIS SATU: NEWSLETTER (FULLWIDTH & TALL) */}
      <div className="w-full py-24 px-6 md:px-12 border-b border-black">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
              STAY_IN_THE_LOOP
            </h3>
            <p className="text-[10px] font-bold tracking-widest opacity-70">
              GET NOTIFIED ON NEW RELEASES & EXCLUSIVE DEALS
            </p>
          </div>

          <form 
            onSubmit={handleSubscribe} 
            className="w-full max-w-2xl flex border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER_YOUR_EMAIL_ADDRESS"
              className="w-full p-5 bg-transparent outline-none font-bold text-sm placeholder:text-black/20"
              required
            />
            <button 
              type="submit" 
              className="bg-black text-white px-10 font-black text-xs hover:bg-[#FF5C00] hover:text-black transition-all border-l-2 border-black uppercase"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* BARIS KEDUA: 4 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 p-8 md:p-12 text-[10px] font-bold leading-relaxed">
        
        {/* KOLOM 1: MENUS */}
        <div className="flex flex-col gap-3">
          <Link to="/fonts" className="hover:underline tracking-widest">FONTS_COLLECTION</Link>
          <Link to="/about" className="hover:underline tracking-widest">ABOUT_STUDIO</Link>
          <Link to="/license" className="hover:underline tracking-widest">EULA_LICENSING</Link>
          <Link to="/terms" className="hover:underline tracking-widest">TERMS_CONDITIONS</Link>
          <Link to="/contact" className="hover:underline tracking-widest">CONTACT_SUPPORT</Link>
        </div>

        {/* KOLOM 2: GAP */}
        <div className="hidden md:block"></div>

        {/* KOLOM 3: SOCIALS */}
        <div className="flex flex-col gap-3">
          <span className="opacity-40 tracking-[0.2em] mb-1 italic">SOCIAL_CHANNELS</span>
          <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="hover:underline">BEHANCE</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:underline">INSTAGRAM</a>
          <a href="mailto:hello@subqi.com" className="hover:underline">EMAIL_INQUIRY</a>
        </div>

        {/* KOLOM 4: COPYRIGHT & LOCATION */}
        <div className="flex flex-col gap-1 md:text-right">
          <span className="tracking-tighter italic">© SUBQI STUDIO 2026</span>
          <span className="opacity-60">SLEMAN, YOGYAKARTA</span>
          <span className="opacity-60 uppercase">Indonesia</span>
          <div className="mt-4 pt-4 border-t border-black/10 flex md:justify-end gap-4 opacity-30 grayscale">
             <span>VISA</span> <span>MC</span> <span>PAYPAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;