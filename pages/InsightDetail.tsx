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
      readTime: "10 MIN READ",
      content: (
        <div className="space-y-8 text-justify">
          <p className="text-xl md:text-3xl font-medium leading-tight normal-case">
            Typographic hierarchy is much more than just varying font sizes; it is the strategic arrangement of text to signify importance and guide the viewer's eye through a composition. Without a clear hierarchy, every piece of information competes for attention, leading to visual fatigue and a failure in communication.
          </p>
          
          <p className="normal-case">
            The first level of hierarchy is usually the primary headline. This element serves as the "hook," intended to capture attention from a distance or at a glance. In brutalist and minimalist design, this is often achieved through extreme scale or high-contrast weights, creating an undeniable focal point that establishes the subject matter immediately.
          </p>

          <div className="py-6 flex justify-center">
            <div className="max-w-xl w-full">
              
              <img 
                src="https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop" 
                alt="Typographic Hierarchy Example" 
                className="w-full border border-black grayscale shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest text-center">Source: Unsplash — Graphic Design Systems</p>
            </div>
          </div>

          <p className="normal-case">
            Once the headline has done its job, the second level—subheaders and pull quotes—takes over. These elements provide context and organize the content into digestible sections. By utilizing different styles such as italics, different colors, or slightly reduced weights, designers can create a logical flow that allows readers to scan the document efficiently before committing to the full text.
          </p>

          <p className="normal-case">
            The third level is the body copy. While levels one and two are about "showing," level three is purely about "reading." In this stage, legibility is the absolute priority. This involves careful consideration of leading (line spacing), tracking (overall character spacing), and line length. If the body text is too dense or the lines are too long, the reader's cognitive load increases, making the information harder to retain.
          </p>

          <p className="normal-case">
            White space, or negative space, is the silent partner of typographic hierarchy. It acts as a visual "buffer," allowing the type to breathe and preventing elements from crashing into one another. Strategic use of white space can actually make smaller text feel more important by isolating it from the surrounding noise, proving that scale is not the only way to indicate priority.
          </p>

          <p className="normal-case">
            Consistency across multi-page systems or complex digital interfaces is what separates professional typography from amateur work. Every level of hierarchy should have a set of "rules"—consistent margins, consistent font choices, and consistent spacing. This creates a "visual grammar" that the user learns as they interact with the design, making the navigation of information intuitive and seamless.
          </p>

          <p className="normal-case pb-10">
            In conclusion, mastering hierarchy is about understanding human psychology and reading patterns. Whether it is the F-pattern for web scanning or the Z-pattern for printed advertisements, typography must be engineered to satisfy the brain's desire for order. When done correctly, the reader won't even notice the hierarchy; they will simply find the information easy to navigate and pleasant to consume.
          </p>
        </div>
      )
    },
    "02": {
      category: "Technical / Precision",
      title: "Optical Kerning: Why Your Eyes Beat Algorithms",
      date: "JANUARY 28, 2026",
      readTime: "8 MIN READ",
      content: (
        <div className="space-y-8 text-justify">
          <p className="text-xl md:text-2xl font-medium normal-case">
            Kerning—the adjustment of space between individual character pairs—is often the final 5% of a design that makes a 100% difference in quality. While modern software offers sophisticated automated kerning, the human eye remains the ultimate judge of typographic rhythm.
          </p>

          <p className="normal-case">
            To understand kerning, one must first differentiate it from tracking. Tracking is the uniform adjustment of space across a whole range of characters, while kerning is surgical. It addresses specific "trouble pairs" where the shapes of the letters create awkward gaps or unintended overlaps that the computer's mathematical metrics fail to perceive correctly.
          </p>

          <div className="py-6 flex justify-center">
            <div className="max-w-md w-full">
              [Image showing kerning examples with letter pairs like AV, Ta, and Ly]
              <img 
                src="https://images.unsplash.com/photo-1558478551-1a378f63328e?q=80&w=1000&auto=format&fit=crop" 
                alt="Kerning Pairs Detail" 
                className="w-full border border-black grayscale shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest text-center">Source: Unsplash — Modern Minimalist Type</p>
            </div>
          </div>

          <p className="normal-case">
            Most fonts come with "Metric Kerning" tables built in by the type designer. These work well for body text where the characters are small. However, when you scale type up for a display headline, the mathematical distances between letters like 'A' and 'V' begin to look cavernous. This is because our eyes perceive the volume of empty space between letters, not just the distance between their bounding boxes.
          </p>

          <p className="normal-case">
            Software solutions like Adobe Illustrator’s "Optical Kerning" attempt to solve this by analyzing the shapes of the letters and re-distributing space. While this is often a significant improvement over metrics, it is still an algorithm. It cannot account for the "visual weight" or the emotional tone of the typeface, which is why manual adjustment is still required in high-end branding.
          </p>

          <p className="normal-case">
            One of the most effective tricks used by professional typographers is the "Upside Down" method. By flipping your headline upside down, you force your brain to stop reading the words and start seeing the letters as abstract shapes. This makes it much easier to spot "rivers" of white space or tight clusters that disrupt the overall typographic grayness of the line.
          </p>

          <p className="normal-case">
            The goal of kerning is "evenness." You want the letters to look as if they were poured into a container, filling the space with a consistent density. If one pair is too tight, it creates a "hot spot" of tension; if one pair is too loose, it creates a "leak" where the word appears to fall apart. Achieving this balance requires patience and a trained eye.
          </p>

          <p className="normal-case pb-10">
            Ultimately, kerning is about respect for the reader and the craft. It shows an attention to detail that signals professionalism and authority. In a world of fast-paced digital production, taking the time to manually kern a headline is a statement of quality—proving that while technology provides the tools, the human spirit provides the precision.
          </p>
        </div>
      )
    },
    "03": {
      category: "Trend / Technology",
      title: "The Variable Revolution: Fluid Type for the Web",
      date: "DECEMBER 12, 2025",
      readTime: "9 MIN READ",
      content: (
        <div className="space-y-8 text-justify">
          <p className="text-xl md:text-3xl font-medium leading-tight normal-case">
            Variable fonts represent the most significant leap in font technology since the invention of the OpenType format. They allow a single font file to behave like an entire family, offering infinite variations along defined axes like weight, width, and slant.
          </p>

          <p className="normal-case">
            In the traditional workflow, if a designer wanted to use Light, Regular, Semibold, and Bold versions of a font on a website, they would have to load four separate files. This increased the site's weight and slowed down loading times. Variable fonts consolidate all these styles into one file, reducing HTTP requests and drastically improving web performance.
          </p>

          <div className="py-6 flex justify-center">
            <div className="max-w-lg w-full">
              
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" 
                alt="Variable Font Axes Animation" 
                className="w-full border border-black grayscale shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="text-[10px] opacity-40 italic mt-2 uppercase tracking-widest text-center">Source: Unsplash — Digital Architecture</p>
            </div>
          </div>

          <p className="normal-case">
            Beyond performance, the real power of variable fonts lies in "Fluid Typography." Instead of having a font jump from 400 weight to 700 weight at a specific breakpoint, designers can use CSS to animate the font weight smoothly based on the screen size or user interaction. This creates a level of responsiveness that was previously impossible in web design.
          </p>

          <p className="normal-case">
            The "Weight" (wght) axis is the most common, but many variable fonts also include "Width" (wdth) for condensed or extended versions, and "Optical Sizing" (opsz). Optical sizing automatically adjusts the letterforms for different sizes—making them thicker and more legible at small sizes, and more delicate and detailed at large display sizes.
          </p>

          <p className="normal-case">
            Implementation of variable fonts also opens the door to "Dynamic Typography." Imagine a website where the font weight responds to the ambient light in the room, or where the slant of the letters changes as the user scrolls down the page. This turns typography into an interactive element, rather than just a static carrier of information.
          </p>

          <p className="normal-case">
            However, with great power comes great responsibility. The ability to use any weight between 1 and 1000 can lead to a lack of discipline. Designers must still establish "design tokens" and stay within a defined range to maintain brand consistency. The technology should enhance the design system, not replace the need for clear typographic rules.
          </p>

          <p className="normal-case pb-10">
            As we move further into a multi-device future, variable fonts will become the industry standard. They bridge the gap between the technical requirements of the web and the creative demands of high-end design. For Subqi Studio, this technology is the key to creating typefaces that are as resilient as they are beautiful.
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