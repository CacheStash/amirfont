import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock } from 'lucide-react';

const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

const InsightDetail: React.FC = () => {
  const { id } = useParams();

  const INSIGHTS_CONTENT: Record<string, any> = {
    "01": {
      category: "Philosophy / Story",
      title: "The Art of the Slow Curve",
      date: "FEBRUARY 15, 2026",
      readTime: "6 MIN READ",
      content: (
        <div className="space-y-12">
          <p className="text-xl md:text-3xl font-medium leading-tight">
            In the quiet corners of my Sleman studio, the digital world feels miles away. Before a single anchor point is ever clicked in a vector software, there is the paper.
          </p>
          <p>
            This ritual of hand-sketching isn't just about nostalgia; it's where the soul of the typeface is born. Digital tools are precise, but often they are too perfect, too cold. Hand-drawn curves carry the subtle imperfections of a human hand—what I call the "slow curve"—that allows a letterform to actually breathe.
          </p>
          <div className="border-y border-black py-10 my-10 italic text-2xl md:text-5xl tracking-tighter normal-case">
            "Slowing down the process isn't a delay; it is the deliberate act of embedding human intent into every anchor point."
          </div>
          <p>
            When you sketch, you debate every serif, every terminal, and every junction with the lead of a pencil. By the time I move to digital execution, the character is already 'alive'. The computer is merely a tool for refinement, not the source of the idea. This ensures that even when scaled to a massive billboard, the typeface retains that vital human heartbeat.
          </p>
        </div>
      )
    },
    "02": {
      category: "Technical / Licensing",
      title: "Choosing the Right Seat",
      date: "JANUARY 28, 2026",
      readTime: "4 MIN READ",
      content: (
        <div className="space-y-8">
          <p className="text-xl md:text-2xl font-medium">
            Licensing is often the most overlooked part of design, but it shouldn't be a source of creative anxiety. 
          </p>
          <p>
            At Subqi Studio, we’ve stripped away the complex legalese to focus on three simple paths: Solo, Team, and Studio. Whether you are a lone freelancer crafting a brand identity or a large agency managing global campaigns, the goal remains the same: ensuring legal safety without compromising creative freedom.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
             <div className="border border-black p-6 bg-black text-white uppercase">
                <h4 className="text-xs font-black mb-2 tracking-widest">Solo Tier</h4>
                <p className="text-[10px] opacity-70 normal-case">Perfect for individual creators and small-scale projects. Permanent and straightforward.</p>
             </div>
             <div className="border border-black p-6 bg-white text-black uppercase">
                <h4 className="text-xs font-black mb-2 tracking-widest">Studio Tier</h4>
                <p className="text-[10px] opacity-70 normal-case">Built for agencies requiring multi-user access and enterprise-level protection.</p>
             </div>
          </div>
          <p>
            Choosing the right "seat" today prevents a legal headache tomorrow. We believe that when you respect the craft by licensing correctly, you are directly fueling the creation of future typefaces.
          </p>
        </div>
      )
    },
    "03": {
      category: "Life / Routine",
      title: "Finding Peace in the Noise",
      date: "DECEMBER 12, 2025",
      readTime: "5 MIN READ",
      content: (
        <div className="space-y-12">
          <p className="text-xl md:text-3xl font-medium leading-tight">
            Maintaining creative focus in an era of constant digital notifications requires more than just discipline; it requires a sanctuary.
          </p>
          <p>
            Living and working in Yogyakarta offers a specific kind of tranquility that directly influences the architecture of my type. Designing a full character set—often spanning hundreds of glyphs—requires a level of "deep work" that is impossible to achieve in a state of distraction.
          </p>
          <p>
            I’ve found that my most successful typefaces are those where I was most present in the silence. My routine involves long periods of disconnect, allowing the eyes and the mind to rest, ensuring that when I return to the screen, every curve is seen with absolute clarity. Ketenangan (tranquility) is as much a design material as the pixels themselves.
          </p>
        </div>
      )
    }
  };

  const article = id ? INSIGHTS_CONTENT[id] : null;
  if (!article) return <Navigate to="/insights" />;

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* VIBRANT BACKGROUND ORBS - Posisi Sinkron dengan Insights.tsx */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />
      <div className="w-full relative z-10">
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent">
          <Link to="/insights" className="inline-flex items-center gap-2 text-[10px] font-normal hover:underline mb-12">
            <ArrowLeft size={14} /> BACK_TO_LAB
          </Link>
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85]">{article.title}</h2>
        </header>

        <main className="px-3 md:px-8 max-w-full mx-auto">
          <div className="w-full border border-black bg-white relative z-10 mb-20">
            <div className="border-b border-black p-6 md:p-10 bg-white flex flex-col md:flex-row justify-between gap-4">
               <span className="text-[10px] font-black tracking-[0.3em] text-orange-600 uppercase">{article.category}</span>
               <div className="flex gap-6 text-[10px] font-bold opacity-40">
                  <span className="flex items-center gap-2"><Calendar size={12}/> {article.date}</span>
                  <span className="flex items-center gap-2"><Clock size={12}/> {article.readTime}</span>
               </div>
            </div>
            <div className="p-6 md:p-14 space-y-10 normal-case text-gray-800 leading-relaxed text-base md:text-xl">
              <div className="flex gap-6 items-start">
                <PlusBullet />
                <div className="w-full">{article.content}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InsightDetail;