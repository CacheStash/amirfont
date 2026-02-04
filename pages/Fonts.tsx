import React from 'react';

const Fonts: React.FC = () => {
  // Data dummy untuk placeholder, nantinya bisa diambil dari config asli
  const fonts = [
    { name: 'Roboto Flex', styles: '12 Styles', price: '$49' },
    { name: 'Recursive', styles: 'Variable', price: '$55' },
    { name: 'Space Mono', styles: '4 Styles', price: '$30' },
    { name: 'Inter', styles: '18 Styles', price: 'Free' },
    { name: 'Coming Soon', styles: 'Variable', price: 'TBA' },
    { name: 'WIP Display', styles: 'Display', price: 'TBA' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-12 border-b-[3px] border-black pb-8">
        <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">Fonts Collection</h2>
        <p className="font-mono text-sm text-gray-600 uppercase tracking-widest">
          Retail & Custom Typefaces for Digital Era
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {fonts.map((font, idx) => (
          <div key={idx} className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group">
            <div className="h-48 bg-gray-100 mb-6 flex items-center justify-center bg-grid-pattern border border-gray-300 relative overflow-hidden">
               <span className="text-4xl font-black group-hover:scale-110 transition-transform duration-500">{font.name}</span>
            </div>
            <div className="flex justify-between items-end border-t border-black pt-4">
              <div>
                <h3 className="text-xl font-bold uppercase">{font.name}</h3>
                <span className="text-xs font-mono text-gray-500 uppercase">{font.styles}</span>
              </div>
              <span className="text-lg font-bold">{font.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fonts;