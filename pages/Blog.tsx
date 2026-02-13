import React from 'react';

const Blog: React.FC = () => {
  const posts = [
    { title: "Brand Typography: What Is It?", date: "OCT 24, 2025", category: "Education" },
    { title: "The Making of Roboto Flex", date: "SEP 12, 2025", category: "Behind The Scenes" },
    { title: "Variable Fonts in 2026", date: "AUG 05, 2025", category: "Trend" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
       <div className="mb-12 border-b-[3px] border-black pb-8">
      <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter mb-4">Blog</h2>
        <p className="font-mono text-sm font-bold text-gray-600 uppercase tracking-widest">
             Thoughts on Type, Design, and Code.
        </p>
      </div>

      <div className="flex flex-col gap-0 border-t-[3px] border-black">
        {posts.map((post, idx) => (
          <div key={idx} className="group flex flex-col md:flex-row justify-between items-start md:items-center py-8 border-b border-black hover:bg-gray-50 cursor-pointer transition-colors px-2">
            <div>
              <span className="inline-block px-2 py-1 bg-black text-white text-[10px] font-mono font-bold uppercase mb-4">
                {post.category}
              </span>
              <h3 className="text-2xl md:text-4xl font-normal uppercase tracking-tight group-hover:translate-x-2 transition-transform">
                {post.title}
              </h3>
            </div>
            <span className="font-mono text-xs text-gray-500 mt-2 md:mt-0">{post.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;