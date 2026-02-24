import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Mail, User, Megaphone, Trash2, ArrowLeft, Calendar, AtSign } from 'lucide-react';

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
    // Join dengan fontbuyer untuk dapatkan full_name
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('font_messages')
      .select(`
        *,
        sender:fontbuyer (
          full_name,
          email
        )
      `)
      .or(`recipient_id.eq.${user.id},message_type.eq.support`) // Admin melihat pesan untuknya ATAU semua tipe support
      .order('created_at', { ascending: false });
    
    if (data) setMessages(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("PERMANENTLY_DELETE_MESSAGE?")) return;
    
    const { error } = await supabase.from('font_messages').delete().eq('id', id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('font_messages').insert([{
      sender_id: user?.id,
      recipient_id: null,
      subject,
      content,
      message_type: 'broadcast'
    }]);

    if (!error) {
      alert("BROADCAST_DISPATCHED");
      setSubject(''); setContent(''); fetchMessages();
    }
    setSending(false);
  };

  return (
    <div className="space-y-8 font-mono uppercase">
      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black italic">MAIL_CENTER</h2>
          <p className="text-[10px] opacity-40">Manage support & dispatch newsletters</p>
        </div>
        {!selectedMessage && (
          <div className="flex border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setTab('inbox')} className={`px-4 py-2 text-[10px] font-black ${tab === 'inbox' ? 'bg-black text-white' : 'bg-white'}`}>INBOX</button>
            <button onClick={() => setTab('broadcast')} className={`px-4 py-2 text-[10px] font-black ${tab === 'broadcast' ? 'bg-black text-white' : 'bg-white'}`}>BROADCAST</button>
          </div>
        )}
      </div>

      {selectedMessage ? (
        /* DETAIL VIEW */
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-center">
            <button onClick={() => setSelectedMessage(null)} className="flex items-center gap-2 font-black text-[10px] hover:underline">
              <ArrowLeft size={14} /> BACK_TO_LIST
            </button>
            <button onClick={() => handleDelete(selectedMessage.id)} className="text-red-600 hover:bg-red-50 p-2 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2 border-b border-black pb-6">
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <User size={12}/> FROM: {selectedMessage.sender?.full_name || 'UNKNOWN_BUYER'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <AtSign size={12}/> EMAIL: {selectedMessage.sender?.email || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black opacity-40">
                <Calendar size={12}/> DATE: {new Date(selectedMessage.created_at).toLocaleString()}
              </div>
              <h3 className="text-3xl font-black italic break-words">{selectedMessage.subject}</h3>
            </div>
            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap py-4">{selectedMessage.content}</p>
          </div>
        </div>
      ) : tab === 'inbox' ? (
        /* LIST VIEW */
        <div className="space-y-2">
          {loading ? <div className="animate-pulse font-black text-xs">SCANNING...</div> : 
           messages.filter(m => m.message_type === 'support').length === 0 ? (
            <div className="p-20 border-2 border-dashed border-black text-center opacity-20 font-bold">EMPTY_INBOX</div>
          ) : (
            messages.filter(m => m.message_type === 'support').map(m => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMessage(m)}
                className="border-2 border-black p-4 bg-white flex items-center justify-between group cursor-pointer hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-[2px]"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 group-hover:bg-white group-hover:text-black">
                      {m.sender?.full_name || 'BUYER'}
                    </span>
                    <span className="text-[9px] font-bold opacity-40 group-hover:text-white/40">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-black truncate">{m.subject}</h4>
                  <p className="text-[10px] font-bold opacity-40 truncate group-hover:text-white/60">{m.content.substring(0, 80)}...</p>
                </div>
                <button onClick={(e) => handleDelete(m.id, e)} className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* BROADCAST FORM */
        <div className="max-w-2xl border-2 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleBroadcast} className="space-y-6">
            <h3 className="text-2xl font-black italic flex items-center gap-3 border-b-2 border-black pb-4">
              <Megaphone /> DISPATCH_NEWSLETTER
            </h3>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold" placeholder="SUBJECT" required />
            <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold resize-none" placeholder="CONTENT..." required />
            <button disabled={sending} className="w-full bg-black text-white p-4 font-black flex justify-center items-center gap-2 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              {sending ? 'SENDING...' : <><Send size={18} /> BROADCAST_NOW</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;