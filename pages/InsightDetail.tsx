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
            The first level of hierarchy is usually the primary headline. This element serves as the "hook," intended to capture attention from a distance or at a glance. In brutalist and minimalist design, this is often achieved through extreme scale or high-contrast weights, creating an undeniable focal point that establishes the subject matter immediately. It is the anchor that holds the entire layout together.
          </p>

          <p className="normal-case">
            Once the headline has done its job, the second level—subheaders and pull quotes—takes over. These elements provide context and organize the content into digestible sections. By utilizing different styles such as italics, different colors, or slightly reduced weights, designers can create a logical flow that allows readers to scan the document efficiently before committing to the full text. This level acts as a bridge between the curiosity of the headline and the depth of the body.
          </p>

          <p className="normal-case">
            The third level is the body copy. While levels one and two are about "showing," level three is purely about "reading." In this stage, legibility is the absolute priority. This involves careful consideration of leading (line spacing), tracking (overall character spacing), and line length. If the body text is too dense or the lines are too long, the reader's cognitive load increases, making the information harder to retain and ultimately causing them to abandon the content.
          </p>

          <p className="normal-case">
            White space, or negative space, is the silent partner of typographic hierarchy. It acts as a visual "buffer," allowing the type to breathe and preventing elements from crashing into one another. Strategic use of white space can actually make smaller text feel more important by isolating it from the surrounding noise, proving that scale is not the only way to indicate priority. It is the absence of content that often provides the most clarity.
          </p>

          <p className="normal-case">
            Color and texture also play significant roles in establishing order. A bold red subheader will naturally pull the eye faster than a black one, even if they are the same size. Similarly, using a serif font for headlines and a sans-serif for body text—or vice-versa—creates a textural contrast that helps the brain categorize different types of information instantly. This interplay of form and color is essential for complex information design.
          </p>

          <p className="normal-case">
            Consistency across multi-page systems or complex digital interfaces is what separates professional typography from amateur work. Every level of hierarchy should have a set of "rules"—consistent margins, consistent font choices, and consistent spacing. This creates a "visual grammar" that the user learns as they interact with the design, making the navigation of information intuitive. When a system is consistent, the user feels a sense of security and trust in the content.
          </p>

          <p className="normal-case pb-10">
            In conclusion, mastering hierarchy is about understanding human psychology and reading patterns. Whether it is the F-pattern for web scanning or the Z-pattern for printed advertisements, typography must be engineered to satisfy the brain's desire for order. When done correctly, the reader won't even notice the hierarchy; they will simply find the information easy to navigate and pleasant to consume. It is the ultimate invisible art of the designer.
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
            To understand kerning, one must first differentiate it from tracking. Tracking is the uniform adjustment of space across a whole range of characters, while kerning is surgical. It addresses specific "trouble pairs" where the shapes of the letters create awkward gaps or unintended overlaps that the computer's mathematical metrics fail to perceive correctly. It is a game of millimeters that defines the professionalism of a layout.
          </p>

          <p className="normal-case">
            Most fonts come with "Metric Kerning" tables built in by the type designer. These work well for body text where the characters are small. However, when you scale type up for a display headline, the mathematical distances between letters like 'A' and 'V' begin to look cavernous. This is because our eyes perceive the volume of empty space between letters, not just the physical distance between their bounding boxes. The larger the type, the more apparent these discrepancies become.
          </p>

          <p className="normal-case">
            Software solutions like Adobe Illustrator’s "Optical Kerning" attempt to solve this by analyzing the shapes of the letters and re-distributing space based on perceived volume. While this is often a significant improvement over metrics for many fonts, it is still just an algorithm. It cannot account for the "visual weight" or the specific emotional tone of the typeface, which is why manual adjustment is still required in high-end branding and logotype design.
          </p>

          <p className="normal-case">
            One of the most effective tricks used by professional typographers to check their work is the "Upside Down" method. By flipping your headline or logotype upside down, you force your brain to stop reading the words and start seeing the letters as abstract shapes. This cognitive shift makes it much easier to spot "rivers" of white space or tight clusters that disrupt the overall typographic grayness of the line.
          </p>

          <p className="normal-case">
            The goal of kerning is "evenness." You want the letters to look as if they were poured into a container, filling the space with a consistent density. If one pair is too tight, it creates a "hot spot" of tension; if one pair is too loose, it creates a "leak" where the word appears to fall apart. Achieving this balance requires infinite patience and a trained eye that understands the relationship between ink and air.
          </p>

          <p className="normal-case">
            Spacing is also heavily influenced by the background color and the weight of the font itself. Light text on a dark background (knockout type) tends to "glow" or bleed into the dark space, requiring slightly looser kerning to remain legible. Conversely, very heavy black fonts often need tighter kerning to maintain their structural impact. These are nuances that an algorithm can guess, but only a designer can feel.
          </p>

          <p className="normal-case pb-10">
            Ultimately, kerning is about respect for the reader and the craft. It shows an attention to detail that signals professionalism and authority. In a world of fast-paced digital production, taking the time to manually kern a headline is a statement of quality—proving that while technology provides the tools, the human spirit provides the precision. It is the mark of a designer who truly cares about the architecture of letters.
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
            In the traditional web workflow, if a designer wanted to use Light, Regular, Semibold, and Bold versions of a font, they would have to load four separate files. This increased the site's weight and slowed down loading times, especially on mobile connections. Variable fonts consolidate all these styles into one single file, reducing HTTP requests and drastically improving web performance without sacrificing design diversity.
          </p>

          <p className="normal-case">
            Beyond performance, the real power of variable fonts lies in "Fluid Typography." Instead of having a font jump abruptly from a 400 weight to a 700 weight at a specific screen breakpoint, designers can use CSS to animate the font weight smoothly. This allows the typography to respond dynamically to the viewport size, creating a level of seamless responsiveness that was previously impossible in web design. It is typography that acts like a liquid.
          </p>

          <p className="normal-case">
            The "Weight" (wght) axis is the most common, but many variable fonts also include axes for "Width" (wdth) and "Optical Sizing" (opsz). Optical sizing is particularly revolutionary for the web; it automatically adjusts the letterforms for different sizes—making them thicker and more legible at small sizes, and more delicate and detailed at large display sizes. This ensures the typeface looks its best regardless of the device.
          </p>

          <p className="normal-case">
            Variable fonts also enable "Dynamic Typography" that responds to external data. Imagine a website where the font weight increases as the user scrolls, or where the slant of the letters changes based on the orientation of a mobile device. This turns typography into an interactive element, rather than just a static carrier of information, allowing for much more expressive and engaging user experiences.
          </p>

          <p className="normal-case">
            From a developer's perspective, variable fonts simplify CSS management. Instead of managing multiple `font-family` declarations or specific file paths for every weight, you simply manipulate the `font-variation-settings` property. This makes the code cleaner, more maintainable, and much easier to experiment with during the design-in-browser phase of a project.
          </p>

          <p className="normal-case">
            However, with this great power comes a need for typographic discipline. The ability to use any weight between 1 and 1000 can lead to a lack of visual hierarchy if not managed carefully. Designers must still establish "design tokens" and stay within defined ranges to maintain brand consistency. The technology is a tool to enhance the design system, not a reason to abandon the fundamental rules of type.
          </p>

          <p className="normal-case pb-10">
            As we move further into a multi-device future, variable fonts will become the industry standard. They bridge the gap between the technical requirements of the web and the creative demands of high-end design. For Subqi Studio, this technology is the key to creating typefaces that are as resilient as they are beautiful, ensuring our work remains relevant in an ever-evolving digital landscape.
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