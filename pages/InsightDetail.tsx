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
      category: "Design / Hierarchy",
      title: "Typographic Hierarchy: The Science of Visual Order",
      date: "FEBRUARY 15, 2026",
      readTime: "7 MIN READ",
      content: (
        <div className="space-y-12">
          <p className="text-xl md:text-3xl font-medium leading-tight">
            Visual hierarchy is the most powerful tool in a designer's arsenal. It tells the reader where to look first, what is important, and what to read next.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1516383274235-5f42d6c6426d?q=80&w=2070&auto=format&fit=crop" 
            alt="Typographic Layout" 
            className="w-full border border-black grayscale"
          />
          <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest">Image Source: Unsplash.com — Collaborative Space Content</p>
          <h3 className="text-3xl font-black underline">The Three-Level Approach</h3>
          <p>
            1. **Level One**: Usually your headline. This must be the most dominant element, often achieved through massive scale or heavy weights. 
            <br/><br/>
            2. **Level Two**: Subheaders and quotes. These help scan the content and provide context to the main title. 
            <br/><br/>
            3. **Level Three**: Body text. The core information. Here, legibility is the only priority.
          </p>
        </div>
      )
    },
    "02": {
      category: "Technical / Precision",
      title: "Optical Kerning: Why Your Eyes Beat Algorithms",
      date: "JANUARY 28, 2026",
      readTime: "5 MIN READ",
      content: (
        <div className="space-y-8">
          <p className="text-xl md:text-2xl font-medium">
            Kerning is the process of adjusting the spacing between characters in a proportional font, usually to achieve a visually pleasing result.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop" 
            alt="Letter Spacing" 
            className="w-full border border-black grayscale"
          />
          <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest">Image Source: Unsplash.com — Abstract Geometrics</p>
          <p>
            Most modern software uses **Metric Kerning**, which relies on the built-in tables provided by the font creator. However, when working with large headlines, these tables can fail. **Optical Kerning** calculates the space between characters based on their visual shapes. For "trouble" combinations like 'AV', 'Te', or 'Wa', trusting your eyes (or the software's optical engine) is essential for professional results.
          </p>
        </div>
      )
    },
    "03": {
      category: "Trend / Technology",
      title: "The Variable Revolution: Fluid Type for the Web",
      date: "DECEMBER 12, 2025",
      readTime: "8 MIN READ",
      content: (
        <div className="space-y-12">
          <p className="text-xl md:text-3xl font-medium leading-tight">
            Variable fonts are an evolution of the OpenType font specification that enables many variations of a typeface to be incorporated into a single file.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop" 
            alt="Digital Typography axes" 
            className="w-full border border-black grayscale"
          />
          <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest">Image Source: Unsplash.com — Neon Data Visualization</p>
          <p>
            Instead of loading separate files for Light, Regular, Bold, and Black, a **Variable Font (VF)** uses "Axes" (Weight, Width, Slant) to generate any variation along a spectrum. This dramatically reduces HTTP requests, improves site speed, and gives designers unprecedented control over responsive typography—allowing the font to "flex" perfectly across different screen sizes.
          </p>
        </div>
      )
    }
  };

  const article = id ? INSIGHTS_CONTENT[id] : null;
  if (!article) return <Navigate to="/insights" />;

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* VIBRANT BACKGROUND ORBS - Fixed Back-Layering & Pointer-Events */}
      <div className="grain-orb-base orb-top-right !-z-10 pointer-events-none" />
      <div className="grain-orb-base orb-bottom-left !-z-10 pointer-events-none" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20 !-z-10 pointer-events-none" />
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