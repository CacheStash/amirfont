import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

const Checkout: React.FC = () => {
  const { cart } = useCart();
  const total = cart.reduce((acc, curr) => acc + curr.price, 0);
  const orderId = `SQ-${Math.floor(100000 + Math.random() * 900000)}`;

  // FIX POINT 1: Outline mengikuti lubang karcis
  const TicketEdges = () => (
    <div className="flex justify-between w-full overflow-hidden pointer-events-none select-none -mt-[1px]">
      {[...Array(40)].map((_, i) => (
        <div 
          key={i} 
          className="w-8 h-8 bg-[#EDEBE6] rounded-full border border-black -mt-4 shrink-0" 
        />
      ))}
    </div>
  );

  // FIX POINT 3: Fungsi Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#EDEBE6] py-12 px-3 md:px-8 flex flex-col items-center uppercase font-mono print:p-0 print:bg-white">
      {/* Back Button & Tools (Hidden when printing) */}
      <div className="w-full max-w-full mb-8 flex justify-between items-center text-[10px] font-bold print:hidden">
        <Link to="/cart" className="flex items-center gap-2 hover:underline">
          <ArrowLeft size={14} /> BACK TO SUMMARY
        </Link>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1 hover:bg-black hover:text-white px-2 py-1 border border-transparent hover:border-black transition-all"
          >
            <Printer size={14} /> PRINT RECEIPT / PDF
          </button>
        </div>
      </div>

      {/* THE RECEIPT STRIP */}
      {/* FIX POINT 1 & 2: Hapus shadow, border hanya samping dan bawah */}
      <div className="w-full bg-white border-x border-b border-black relative flex flex-col items-center print:border-none">
        
        {/* lubang karcis sebagai border atas */}
        <div className="absolute top-0 left-0 w-full z-20 flex">
          <TicketEdges />
        </div>

        <div className="w-full p-8 md:p-16 pt-24 pb-20">
          {/* Header Struk */}
          <div className="flex flex-col items-center text-center border-b border-black border-dashed pb-12 mb-12">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">SUBQI STUDIO</h1>
            <p className="text-xs md:text-sm font-bold tracking-widest">JAKARTA — INDONESIA / TERMINAL 01</p>
            <div className="mt-8 px-4 py-1 border border-black text-xs font-bold bg-black text-white">
              OFFICIAL PAYMENT RECEIPT
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[10px] md:text-xs mb-12 border-b border-black border-dashed pb-12">
            <div className="space-y-2">
              <div className="flex justify-between"><span>ORDER ID</span> <span>{orderId}</span></div>
              <div className="flex justify-between"><span>DATE</span> <span>{new Date().toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span>TIME</span> <span>{new Date().toLocaleTimeString()}</span></div>
            </div>
            <div className="space-y-2 md:text-right">
              <div className="flex justify-between md:justify-end md:gap-10"><span>CASHIER</span> <span>SYSTEM_WEB_01</span></div>
              <div className="flex justify-between md:justify-end md:gap-10"><span>STATUS</span> <span className="text-red-600 font-black animate-pulse">UNPAID</span></div>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="space-y-6 mb-12">
            {cart.map((item) => (
              <div key={item.cartId} className="flex flex-col gap-2">
                <div className="flex justify-between text-lg md:text-2xl font-black">
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </div>
                <div className="flex justify-between text-[9px] md:text-[11px] opacity-60 italic">
                  <span>{item.tier} • {item.usages.join(', ')}</span>
                  <span>QTY: 1</span>
                </div>
                <div className="border-b border-black border-dotted w-full opacity-20"></div>
              </div>
            ))}
          </div>

          {/* Final Total */}
          <div className="border-y-4 border-double border-black py-8 flex justify-between items-center mb-12">
            <span className="text-xl md:text-2xl font-black tracking-[0.2em]">GRAND TOTAL</span>
            <span className="text-6xl md:text-8xl font-normal tracking-tighter">${total}</span>
          </div>

          {/* FIX POINT 4: Payment Gateway Section */}
          <div className="flex flex-col items-center gap-8 print:hidden">
            <div className="w-full max-w-md p-6 border-2 border-black border-dashed bg-black/5 flex flex-col items-center gap-6">
              <span className="text-xs font-black tracking-widest">SECURE CHECKOUT</span>
              
              {/* Ini adalah tombol trigger untuk payment gateway nanti */}
              <button 
                className="w-full bg-black text-white py-6 text-xl font-black hover:bg-gray-800 transition-all flex items-center justify-center gap-4 group"
                onClick={() => alert("Payment Gateway Integration Started...")}
              >
                PAY NOW
              </button>
              
              <div className="flex gap-4 opacity-50 grayscale">
                <span className="text-[10px] border border-black px-2 py-0.5">VISA</span>
                <span className="text-[10px] border border-black px-2 py-0.5">MASTERCARD</span>
                <span className="text-[10px] border border-black px-2 py-0.5">QRIS</span>
              </div>
            </div>
            
            <p className="text-[9px] text-center max-w-sm leading-relaxed opacity-60 italic">
              * CLICKING "PAY NOW" WILL REDIRECT YOU TO OUR SECURE PAYMENT PARTNER.
            </p>
          </div>
        </div>

        {/* Bottom Edges */}
        <div className="absolute bottom-0 left-0 w-full z-20 rotate-180">
          <TicketEdges />
        </div>
      </div>
      
      <div className="mt-12 text-[10px] opacity-20 print:hidden">** END OF RECEIPT **</div>
    </div>
  );
};

export default Checkout;