import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

const Checkout: React.FC = () => {
  const { cart } = useCart();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);
  const total = cart.reduce((acc, curr) => acc + curr.price, 0);
  const orderId = `SQ-${Math.floor(100000 + Math.random() * 900000)}`;


  const [isPaid, setIsPaid] = React.useState(false);

const handleFreeTrial = async () => {
    if (!user) {
      alert("PLEASE LOGIN TO CLAIM YOUR FREE DEMO.");
      return;
    }

    setLoading(true);
    try {
      // Masukkan setiap item di cart ke tabel font_history
      const historyEntries = cart.map(item => ({
        user_id: user.id,
        font_id: item.fontId,
        download_type: 'trial'
      }));

      const { error } = await supabase.from('font_history').insert(historyEntries);
      
      if (error) throw error;

      setIsPaid(true);
      alert("DEMO FONTS ADDED TO YOUR LIBRARY! CHECK YOUR DASHBOARD.");
    } catch (err: any) {
      alert("ERROR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const TicketEdges = () => (
    <div className="flex justify-between w-full overflow-hidden pointer-events-none select-none -mt-[1px]">
      {[...Array(60)].map((_, i) => (
        <div 
          key={i} 
          className="w-8 h-8 bg-[#EDEBE6] rounded-full border border-black -mt-4 shrink-0" 
        />
      ))}
    </div>
  );

  return (
    /* FIX 1: Gunakan clientId (camelCase) */
    <PayPalScriptProvider options={{ clientId: "AW3HtSermytFGmhSTbMNpacFkkEyTYo19CRismstFmSUT2drz6TBj8nAH18pg4YWPj0esy4-MIzAGhki", currency: "USD", intent: "capture" }}>
      <div className="min-h-screen bg-[#EDEBE6] py-12 px-3 md:px-8 flex flex-col items-center uppercase font-mono print:p-0 print:bg-white text-black text-left">
        
        {/* HEADER TOOLS */}
        <div className="w-full max-w-full mb-8 flex justify-between items-center text-[10px] font-bold print:hidden">
          <Link to="/cart" className="flex items-center gap-2 hover:underline">
            <ArrowLeft size={14} /> BACK TO SUMMARY
          </Link>
          
          <Link 
            to="/fonts" 
            className="flex items-center gap-2 bg-transparent hover:bg-black hover:text-white px-3 py-1.5 border border-black transition-all"
          >
            <Plus size={14} /> BROWSE MORE FONTS
          </Link>
        </div>

        {/* THE RECEIPT STRIP */}
        <div className="w-full bg-white border-x border-black relative flex flex-col items-center overflow-hidden print:border-none">
          
          <div className="absolute top-0 left-0 w-full z-20 flex">
            <TicketEdges />
          </div>

          <div className="w-full p-8 md:p-16 pt-24 pb-20">
            {/* Header Struk */}
            <div className="flex flex-col items-center text-center border-b border-black border-dashed pb-12 mb-12">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 italic">SUBQI STUDIO</h1>
              <p className="text-xs md:text-sm font-bold tracking-widest leading-none">JAKARTA — INDONESIA / TERMINAL 01</p>
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
                <div className="flex justify-between md:justify-end md:gap-10">
                  
                  <span>STATUS</span> 
  <span className={isPaid ? "text-green-600 font-black" : "text-red-600 font-black animate-pulse"}>
    {isPaid ? "PAID" : "UNPAID"}
  </span>

                </div>
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

              {/* ACCOUNT RECOMMENDATION NOTICE */}
            {!user && (
              <div className="mb-10 p-5 border-2 border-black bg-yellow-400 font-bold text-[11px] leading-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                  <Plus size={14} className="rotate-45" /> HIGHLY_RECOMMENDED:
                </p>
                <p className="normal-case text-sm md:text-base font-normal">
                  Please <Link to="/user/auth" className="font-black underline decoration-2 underline-offset-2">Create an Account</Link> before finishing. 
                  Your download links will be stored in your personal dashboard as a permanent backup if your files are lost.
                </p>
              </div>
            )}

            {/* Dual Payment Gateway Section */}
            <div className="w-full flex flex-col gap-10 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                
                {/* BLOCK 01: DYNAMICAL BLOCK (TRIAL OR MIDTRANS) */}
                <div className="flex flex-col gap-4 p-6 border-2 border-black border-dashed bg-black/5 relative group">
                  <div className="absolute -top-3 left-4 bg-[#EDEBE6] px-2 text-[10px] font-black tracking-widest border border-black">
                    {total === 0 ? "01. TRIAL ACCESS" : "01. LOCAL (IDN)"}
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-black/40">
                    {total === 0 ? "NO PAYMENT REQUIRED" : "QRIS / VIRTUAL ACCOUNT / GOPAY"}
                  </span>
                  
                  {isPaid ? (
                    <Link 
                      to="/user/dashboard"
                      className="w-full bg-green-600 text-white py-5 text-center text-sm font-black tracking-[0.2em] hover:invert transition-all"
                    >
                      GO TO MY LIBRARY
                    </Link>
                  ) : (
                    <button 
                      onClick={total === 0 ? handleFreeTrial : () => alert("Midtrans Coming Soon...")}
                      disabled={loading}
                      className="w-full bg-black text-white py-5 text-sm font-black tracking-[0.2em] hover:invert transition-all disabled:opacity-50"
                    >
                      {total === 0 ? (loading ? "PROCESSING..." : "CLAIM FREE DEMO") : "PAY WITH MIDTRANS"}
                    </button>
                  )}
                </div>

                {/* BLOCK 02: GLOBAL PAYMENT (PAYPAL) */}
                <div className={`flex flex-col gap-4 p-6 border-2 border-black border-dashed bg-black/5 relative ${total === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                  <div className="absolute -top-3 left-4 bg-[#EDEBE6] px-2 text-[10px] font-black tracking-widest border border-black">
                    02. GLOBAL (USD)
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-black/40">PAYPAL / CREDIT CARD / APPLE PAY</span>
                  
                  <div className="relative z-0">
                    <PayPalButtons 
                      style={{ layout: "vertical", shape: "rect", label: "pay", height: 50 }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            amount: { 
                              currency_code: "USD",
                              value: total.toString() 
                            },
                            description: `Font Purchase - Order ${orderId}`
                          }]
                        });
                      }}
                      onApprove={async (data, actions) => {
  const details = await actions.order?.capture();
  setIsPaid(true); // Mengubah status menjadi PAID di struk
  alert(`TRANSACTION SUCCESSFUL, ${details?.payer?.name?.given_name}!`);
}}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 border-t border-black border-dotted pt-8">
                <div className="flex gap-4 opacity-50 grayscale scale-75 md:scale-100">
                  <span className="text-[10px] border border-black px-2 py-0.5 font-bold">VISA</span>
                  <span className="text-[10px] border border-black px-2 py-0.5 font-bold">MASTERCARD</span>
                  <span className="text-[10px] border border-black px-2 py-0.5 font-bold">QRIS</span>
                  <span className="text-[10px] border border-black px-2 py-0.5 font-bold">PAYPAL</span>
                </div>
                <p className="text-[9px] text-center max-w-sm leading-relaxed opacity-60 italic">
                  * SELECT YOUR PREFERRED GATEWAY. ALL TRANSACTIONS ARE ENCRYPTED AND SECURE.
                </p>
              </div>
            </div>
          </div>

          {/* Lubang karcis bawah */}
          <div className="absolute bottom-0 left-0 w-full z-20 rotate-180 flex">
            <TicketEdges />
          </div>
        </div>
        
        <div className="mt-12 text-[10px] opacity-20 print:hidden font-bold">** END OF RECEIPT **</div>
      </div>
    </PayPalScriptProvider>
  );
};

export default Checkout;