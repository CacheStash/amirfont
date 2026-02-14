import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from '../../pages/shop/CartItem';
import { ArrowRight } from 'lucide-react';

const CartPage: React.FC = () => {
  const { cart, removeFromCart } = useCart();
  const total = cart.reduce((acc, curr) => acc + curr.price, 0);

  const TicketEdges = () => (
    <div className="flex justify-between w-full px-2 -mx-2 overflow-hidden pointer-events-none select-none">
      {[...Array(30)].map((_, i) => (
        <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full -mt-2 border border-black/5" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EDEBE6] p-6 md:p-20 flex justify-center">
      <div className="w-full max-w-xl bg-white border border-black p-8 md:p-12 relative">
        <div className="text-center mb-10 border-b border-black pb-8">
          <h1 className="text-3xl font-black tracking-[0.3em] uppercase mb-2">Order Summary</h1>
          <p className="text-[10px] tracking-widest text-gray-400">SUBQI STUDIO — TRANSACTION REVIEW</p>
        </div>

        {cart.length > 0 ? (
          <>
            <div className="space-y-2 mb-10">
              {cart.map(item => (
                <CartItem key={item.cartId} item={item} onRemove={removeFromCart} />
              ))}
            </div>
            
            <div className="border-t-4 border-double border-black pt-6 flex justify-between items-end mb-12">
              <span className="text-sm font-black tracking-widest uppercase">Total Investment</span>
              <span className="text-5xl font-normal tracking-tighter">${total}</span>
            </div>

            <Link to="/checkout" className="w-full bg-black text-white py-6 flex items-center justify-center gap-4 hover:invert transition-all">
              <span className="font-black tracking-[0.4em]">PROCEED TO CHECKOUT</span>
              <ArrowRight size={20} />
            </Link>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-6 uppercase tracking-widest">Your cart is empty</p>
            <Link to="/fonts" className="border border-black px-6 py-2 font-bold hover:bg-black hover:text-white transition-all uppercase text-xs">Browse Fonts</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;