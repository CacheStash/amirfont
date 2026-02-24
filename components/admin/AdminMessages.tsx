import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Mail, User, Megaphone, Trash2, ArrowLeft, Calendar, AtSign, History } from 'lucide-react';

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inbox' | 'broadcast'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Form State for Broadcast
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Admin menarik SEMUA data tanpa filter recipient_id agar history broadcast muncul
      const { data, error } = await supabase
        .from('font_messages')
        .select(`
          *,
          sender:fontbuyer (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setMessages(data);
    } catch (err: any) {
      console.error("ADMIN_FETCH_ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("HAPUS_PERMANEN? Pesan akan hilang dari database dan semua user.")) return;
    
    const { error } = await supabase.from('font_messages').delete().eq('id', id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } else {
      alert("DELETE_ERROR: " + error.message);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('font_messages').insert([{
        sender_id: user?.id,
        recipient_id: null, // NULL = Semua User
        subject,
        content,
        message_type: 'broadcast'
      }]);

      if (error) throw error;
      
      alert("BROADCAST_DISPATCHED");
      setSubject('');
      setContent('');
      fetchMessages(); // Refresh riwayat broadcast
    } catch (err: any) {
      alert("BROADCAST_ERROR: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 font-mono uppercase text-black">
      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black italic">MAIL_CENTER</h2>
          <p className="text-[10px] opacity-40 italic">Manage support tickets & system-wide broadcasts</p>
        </div>
        {!selectedMessage && (
          <div className="flex border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <button 
              onClick={() => setTab('inbox')} 
              className={`px-4 py-2 text-[10px] font-black transition-all ${tab === 'inbox' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              INBOX_SUPPORT
            </button>
            <button 
              onClick={() => setTab('broadcast')} 
              className={`px-4 py-2 text-[10px] font-black transition-all ${tab === 'broadcast' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              BROADCAST_HUB
            </button>
          </div>
        )}
      </div>

      {selectedMessage ? (
        /* --- DETAIL VIEW --- */
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-center text-[10px] font-black">
            <button onClick={() => setSelectedMessage(null)} className="flex items-center gap-2 hover:underline cursor-pointer">
              <ArrowLeft size={14} /> BACK_TO_LIST
            </button>
            <button onClick={() => handleDelete(selectedMessage.id)} className="text-red-600 hover:bg-red-50 p-2 flex items-center gap-2 transition-all">
              <Trash2 size={14} /> DELETE_PERMANENTLY
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2 border-b border-black pb-6">
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <User size={12}/> FROM: {selectedMessage.sender?.full_name || 'SYSTEM'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <AtSign size={12}/> MAIL: {selectedMessage.sender?.email || 'OFFICIAL'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <Calendar size={12}/> DATE: {new Date(selectedMessage.created_at).toLocaleString()}
              </div>
              <h3 className="text-3xl font-black italic break-words mt-4">{selectedMessage.subject}</h3>
            </div>
            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap py-4">{selectedMessage.content}</p>
          </div>
        </div>
      ) : tab === 'inbox' ? (
        /* --- INBOX SUPPORT LIST --- */
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse font-black text-xs italic">STREAMING_INCOMING_MESSAGES...</div>
          ) : messages.filter(m => m.message_type === 'support').length === 0 ? (
            <div className="p-20 border-2 border-dashed border-black text-center opacity-20 font-bold italic">INBOX_EMPTY</div>
          ) : (
            messages.filter(m => m.message_type === 'support').map(m => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMessage(m)}
                className="border-2 border-black p-4 bg-white flex items-center justify-between group cursor-pointer hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[2px]"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 group-hover:bg-white group-hover:text-black">
                      {m.sender?.full_name?.split(' ')[0] || 'BUYER'}
                    </span>
                    <span className="text-[9px] font-bold opacity-40 group-hover:text-white/40">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-black truncate uppercase">{m.subject}</h4>
                  <p className="text-[10px] font-bold opacity-40 truncate group-hover:text-white/60">{m.content.substring(0, 80)}...</p>
                </div>
                <button onClick={(e) => handleDelete(m.id, e)} className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* --- BROADCAST HUB & HISTORY --- */
        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Dispatcher Form */}
          <div className="md:col-span-2 border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h3 className="text-xl font-black italic flex items-center gap-3 border-b-2 border-black pb-3">
              <Megaphone size={20} /> DISPATCHER
            </h3>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="text-[9px] font-black block mb-1">SUBJECT</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold text-xs" required />
              </div>
              <div>
                <label className="text-[9px] font-black block mb-1">CONTENT</label>
                <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold text-xs resize-none" required />
              </div>
              <button disabled={sending} className="w-full bg-black text-white p-4 font-black flex justify-center items-center gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none transition-all">
                {sending ? 'SENDING...' : <><Send size={16} /> BROADCAST_MESSAGE</>}
              </button>
            </form>
          </div>

          {/* Broadcast History */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xl font-black italic flex items-center gap-3 opacity-40">
              <History size={20} /> PREVIOUS_DISPATCHES
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.filter(m => m.message_type === 'broadcast').length === 0 ? (
                <div className="p-10 border-2 border-dashed border-black text-center opacity-20 font-bold italic text-xs">NO_HISTORY_FOUND</div>
              ) : (
                messages.filter(m => m.message_type === 'broadcast').map(m => (
                  <div key={m.id} className="border-2 border-black p-4 bg-gray-50 flex justify-between items-center group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-hidden">
                      <p className="text-[9px] font-black opacity-30">{new Date(m.created_at).toLocaleString()}</p>
                      <h4 className="text-xs font-black truncate">{m.subject}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedMessage(m)} className="text-[9px] font-black bg-black text-white px-2 py-1 hover:bg-white hover:text-black border border-black transition-all">OPEN</button>
                      <button onClick={(e) => handleDelete(m.id, e)} className="text-red-600 hover:scale-110 transition-all"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;