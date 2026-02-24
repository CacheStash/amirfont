import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

const Checkout: React.FC = () => {

  
  const { cart, clearCart } = useCart();
  const [user, setUser] = React.useState<User | null>(null);
  const orderId = React.useMemo(() => `SQ-${Math.floor(100000 + Math.random() * 900000)}`, []);
  const [loading, setLoading] = React.useState(false);
const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(''); 
  const [address, setAddress] = React.useState('');
  const [isPaid, setIsPaid] = React.useState(false);
  const [subscribe, setSubscribe] = React.useState(true);
  const [purchasedItems, setPurchasedItems] = React.useState<any[]>([]);
  const [successfulOrderId, setSuccessfulOrderId] = React.useState<string | null>(null);

  // AUTH & PRE-FILL: Menggunakan getSession agar lebih instan dibanding getUser
  React.useEffect(() => {
    const fetchBuyerProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('fontbuyer')
        .select('full_name, address')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setName(data.full_name || '');
        setAddress(data.address || '');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setEmail(session.user.email || '');
        fetchBuyerProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setEmail(session.user.email || '');
        fetchBuyerProfile(session.user.id);
      } else {
        setUser(null);
        setEmail('');
        setName('');
        setAddress('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const total = cart.reduce((acc, curr) => acc + curr.price, 0);
 



  const handlePurchaseSuccess = async (finalOrderId: string) => {
    setLoading(true);
    try {
      // 1. Kirim data ke Worker API (Worker akan handle bypass RLS & Resetter Password)
      // Karena cart bisa berisi banyak item, kita kirimkan sebagai metadata atau loop
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
          email,
          name,
          address,
          fontName: cart.map(i => i.name).join(', '),
          type: 'full', // FIXED: Gunakan 'full' untuk pembelian sukses
          metadata: { 
            order_id: finalOrderId, // FIXED: Gunakan finalOrderId (ID PayPal) agar sinkron dengan tombol download
            cart_items: cart 
          }
        })
      });

      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "API_CHECKOUT_FAILED");


    

     if (subscribe) {
        const { error: subError } = await supabase
          .from('fontsubscribers')
          .upsert(
            { 
              email: email.toLowerCase().trim(), 
              source: 'checkout_purchase',
              status: 'active' 
            }, 
            { onConflict: 'email' }
          )
          .select(); // Tambahkan select() untuk memaksa verifikasi status insert
        
        if (subError) console.error("SUBSCRIBE_DB_ERROR:", subError);
      }

      // FIXED: Alur baru - Jangan redirect, tapi tampilkan unduhan di tempat
      
      setIsPaid(true);
      setPurchasedItems([...cart]);
      clearCart();
      setSuccessfulOrderId(finalOrderId);
      
    } catch (err: any) {
      alert("ERROR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

   const handleSecureDownload = async (fileName: string, type: 'trial' | 'full' = 'full') => {
    const { data: { session } } = await supabase.auth.getSession();
    

    const targetOrder = successfulOrderId || orderId;

    if (!fileName || fileName === 'null' || fileName === 'undefined') {
      return alert("DOWNLOAD_ERROR: FILE_PATH_NOT_CONFIGURED. CHECK FONT DATABASE.");
    }

    try {
      // FIXED: Masukkan targetOrder ke URL agar Worker bisa memverifikasi Guest via DB
      const url = `/api/download-zip?file=${encodeURIComponent(fileName)}&order=${encodeURIComponent(targetOrder)}&type=${type}&email=${encodeURIComponent(email)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': session ? `Bearer ${session.access_token}` : '' }
      });
      
      if (!res.ok) throw new Error("UNAUTHORIZED_OR_FILE_NOT_FOUND");

      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      
      // FIXED: Bersihkan nama file dari timestamp agar sama dengan format Dashboard
     const cleanName = fileName.replace(/^\d+-/, '').split('.')[0];
      const nameSuffix = type === 'trial' ? '_Trial' : '';
      a.download = `SQ_${cleanName}${nameSuffix}.zip`;
      
      document.body.appendChild(a); // Tambahkan ke body untuk kompabilitas browser
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
    } catch (e: any) {
      alert("DOWNLOAD_FAILED: " + e.message);
    }
  };

  const handleFreeTrial = async () => {
    // 1. Validasi format email ketat (name@domain.com)
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("PLEASE ENTER A VALID EMAIL ADDRESS (E.G. NAME@DOMAIN.COM)");
      return;
    }

    setLoading(true);
    try {
      // 1. Kirim data ke Worker API (Worker bypasses RLS)
      // Kita gunakan orderId sebagai password resetter
      const response = await fetch('/api/claim-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          address,
          type: 'trial',
          metadata: { 
            order_id: orderId,
            cart_items: cart // WAJIB: Agar Worker bisa mengambil font_id (UUID) asli dari keranjang
          }
        })
      });

      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "API_TRIAL_FAILED");

      

if (subscribe) {
        const { error: subError } = await supabase
          .from('fontsubscribers')
          .upsert(
            { 
              email: email.toLowerCase().trim(), 
              source: 'checkout_trial',
              status: 'active' 
            }, 
            { onConflict: 'email' }
          )
          .select();
        
        if (subError) console.error("SUBSCRIBE_TRIAL_DB_ERROR:", subError.message);
      }

    
      setPurchasedItems([...cart]);
      setIsPaid(true);
      clearCart();
      setSuccessfulOrderId(orderId);
      
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
    <PayPalScriptProvider options={{ clientId: "AXw6xL6HBIWZRoBSnsigTHBPaYB70tTFMJHv3o4tA_AP9BEsH81uyOLGYWnWonxP9kn59OjE9Tyo5ABW", currency: "USD", intent: "capture",locale: "en_US" }}>
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
  {/* Mengubah UNPAID menjadi FREE jika total 0 */}
                  <span className={isPaid ? "text-green-600 font-black" : "text-red-600 font-black animate-pulse"}>
                    {isPaid ? "PAID" : (total === 0 ? "FREE" : "UNPAID")}
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

            {/* 00. MANDATORY PURCHASER INFO */}
            {!isPaid && (
              <div className="mb-10 p-6 border border-black bg-[#FF5C00] text-black">
                <label className="block text-[10px] font-black tracking-[0.2em] mb-4 italic">00. PROVIDE_PURCHASER_INFO*</label>
                
                <div className="flex flex-col gap-1 overflow-hidden border border-black bg-white mb-4">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 font-mono font-bold outline-none border-b border-black text-sm placeholder:text-black/30"
                    placeholder="FULL NAME"
                    required
                  />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 font-mono font-bold outline-none border-b border-black text-sm placeholder:text-black/30"
                    placeholder="EMAIL@DOMAIN.COM WILL BE YOUR USERNAME TO YOUR ACCOUNT DASHBOARD"
                    required
                  />
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-4 font-mono font-bold outline-none text-sm placeholder:text-black/30 min-h-[80px] resize-none"
                    placeholder="COMPLETE ADDRESS (STREET, CITY, ZIP CODE)"
                    required
                  />
                </div>

                {/* CUSTOM CHECKBOX SUBSCRIBE */}
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={subscribe}
                      onChange={() => setSubscribe(!subscribe)}
                      className="sr-only"
                    />
                    {/* Outer White Box */}
                    <div className="w-5 h-5 border border-black bg-white flex items-center justify-center">
                      {/* Inner Black Square (When Checked) */}
                      {subscribe && <div className="w-3 h-3 bg-black" />}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest group-hover:underline">
                    SUBSCRIBE TO NEWSLETTER & NEW RELEASES
                  </span>
                </label>

                {/* CLAIM BUTTON FOR TRIAL */}
                {total === 0 && name && address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <button 
                    onClick={handleFreeTrial}
                    disabled={loading}
                    className="w-full mt-6 bg-black text-white py-5 text-sm font-black tracking-[0.2em] hover:bg-white hover:text-black border border-black transition-all disabled:opacity-50 animate-in slide-in-from-top-2"
                  >
                    {loading ? "PROCESSING..." : "CLAIM FREE DEMO ACCESS"}
                  </button>
                )}

                <p className="text-[9px] mt-4 opacity-60 italic leading-tight">
                  * DATA IS SECURE. YOUR ACCOUNT WILL BE UPDATED AUTOMATICALLY.<br/>
                  PASSWORD RESET KEY = YOUR ORDER ID.
                </p>
              </div>
            )}

            {/* INSTANT DOWNLOAD AFTER PAYMENT */}
            {isPaid && (
              <div className="mb-12 p-8 border-4 border-double border-green-600 bg-green-50 text-center animate-in zoom-in-95">
                <h4 className="text-2xl font-black text-green-600 mb-2 italic">PAYMENT_SUCCESSFUL</h4>
                <p className="text-[10px] font-bold mb-6 text-black/60 uppercase tracking-widest">
                  ACCESS GRANTED. {purchasedItems.length} FONT(S) ADDED TO YOUR LIBRARY.
                </p>
                <div className="flex flex-col gap-3">
                  {/* FIXED: Gunakan purchasedItems (karena cart sudah kosong) */}
                  {purchasedItems.map((item) => (
                    <button 
                      key={item.cartId}
                     onClick={() => handleSecureDownload(
                        item.price === 0 
                          ? (item.trialFileUrl || 'null') 
                          : (item.font_files?.[0] || 'null'), 
                        item.price === 0 ? 'trial' : 'full'
                      )}
                      className="bg-black text-white px-8 py-5 font-black tracking-[0.2em] hover:bg-green-600 transition-all flex items-center justify-center gap-4"
                    >
                      DOWNLOAD_{item.name.replace(/\s+/g, '_')}_ZIP
                    </button>
                  ))}

                  {/* FIXED: Pindah button "Go To My Library" ke sini */}
                  <Link 
                    to="/user/auth"
                    className="w-full mt-4 bg-transparent border-2 border-black text-black py-5 text-center text-sm font-black tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4 group"
                  >
                    LOGIN TO ACCESS FULL LIBRARY <Plus size={18} className="group-hover:rotate-90 transition-transform"/>
                  </Link>
                </div>
              </div>
            )}
            

            {/* Dual Payment Gateway Section */}
            <div className="w-full flex flex-col gap-10 print:hidden">
              <div className="w-full">
                {/* GLOBAL PAYMENT (PAYPAL) - FULL WIDTH */}
                <div className={`flex flex-col gap-4 p-6 border-2 border-black border-dashed bg-black/5 relative ${total === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                  <div className="absolute -top-3 left-4 bg-[#EDEBE6] px-2 text-[10px] font-black tracking-widest border border-black">
                    PAYMENT GATEWAY (USD)
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-black/40 px-2">PAYPAL / CREDIT CARD</span>
                  
                  <div className={`relative z-0 transition-all w-full flex justify-center ${(loading || !name || !address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="w-full max-w-[750px]">
                    <PayPalButtons 
                      style={{ layout: "vertical", shape: "rect", label: "pay", height: 55 }}
                      // FIXED: Validasi email sebelum popup PayPal muncul
                    onClick={(data, actions) => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(email)) {
                        alert("PLEASE PROVIDE A VALID RECEIVER EMAIL (BLOCK 00) BEFORE PROCEEDING TO PAYMENT.");
                        return actions.reject();
                      }
                      return actions.resolve();
                    }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          amount: { 
                            currency_code: "USD",
                            // FIXED: PayPal API mewajibkan string dengan 2 digit desimal (misal: "25.00")
                            value: total.toFixed(2) 
                          },
                          description: `Subqi Studio Font Purchase - Order ${orderId}`
                        }]
                      });
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        const details = await actions.order?.capture();
                        if (details && details.status === "COMPLETED") {
                          // PANGGIL LOGIKA AUTO-REGISTER SETELAH DANA TERKUNCI
                          await handlePurchaseSuccess(orderId);
                          alert(`TRANSACTION SUCCESSFUL! WELCOME, ${details?.payer?.name?.given_name || 'BUYER'}.`);
                        }
                      } catch (captureError) {
                        console.error("Capture Error:", captureError);
                        alert("PAYMENT_CAPTURE_FAILED. YOUR FUNDS WERE NOT DEDUCTED. PLEASE TRY AGAIN.");
                      }
                    }}
                    // FIXED: Menangkap error teknis (Client ID salah, koneksi, atau kartu ditolak)
                    onError={(err) => {
                      console.error("PayPal Gateway Error:", err);
                      alert("PAYPAL_GATEWAY_ERROR: COULD NOT INITIALIZE TRANSACTION. CHECK YOUR EMAIL FORMAT OR PAYMENT METHOD.");
                    }}
                    />
                  </div>
                </div>
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
      </div>
    </PayPalScriptProvider>
  );
};

export default Checkout;