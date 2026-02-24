import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Mail, User, Megaphone, CheckCircle } from 'lucide-react';

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inbox' | 'broadcast'>('inbox');

  // Form State for Broadcast
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('font_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return alert("Isi subjek dan konten!");
    
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('font_messages').insert([{
      sender_id: user?.id,
      recipient_id: null, // Broadcast target
      subject,
      content,
      message_type: 'broadcast'
    }]);

    if (error) alert(error.message);
    else {
      alert("BROADCAST_SENT_SUCCESSFULLY");
      setSubject('');
      setContent('');
      fetchMessages();
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
        <div className="flex border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button onClick={() => setTab('inbox')} className={`px-4 py-2 text-[10px] font-black ${tab === 'inbox' ? 'bg-black text-white' : 'bg-white'}`}>INBOX</button>
          <button onClick={() => setTab('broadcast')} className={`px-4 py-2 text-[10px] font-black ${tab === 'broadcast' ? 'bg-black text-white' : 'bg-white'}`}>BROADCAST</button>
        </div>
      </div>

      {tab === 'inbox' ? (
        <div className="space-y-4">
          {loading ? <div className="animate-pulse font-black text-xs">SCANNING_MESSAGES...</div> : messages.filter(m => m.message_type === 'support').length === 0 ? (
            <div className="p-20 border-2 border-dashed border-black text-center opacity-30 font-bold">NO_MESSAGES_FOUND</div>
          ) : (
            <div className="grid gap-4">
              {messages.filter(m => m.message_type === 'support').map(m => (
                <div key={m.id} className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black bg-black text-white px-2 py-1 flex items-center gap-1">
                      <User size={10} /> FROM: {m.sender_id.split('-')[0]}
                    </span>
                    <span className="text-[10px] font-black opacity-40">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-xl font-black italic">{m.subject}</h3>
                  <p className="mt-4 text-xs font-bold opacity-70 leading-relaxed border-l-4 border-black pl-4">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl border-2 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-4">
            <Megaphone size={24} />
            <h3 className="text-2xl font-black italic">DISPATCH_NEWSLETTER</h3>
          </div>
          <form onSubmit={handleBroadcast} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black mb-1">NEWSLETTER_SUBJECT</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold" placeholder="E.G. NEW FONT RELEASED!" required />
            </div>
            <div>
              <label className="block text-[10px] font-black mb-1">MESSAGE_CONTENT</label>
              <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold resize-none" placeholder="WRITE YOUR UPDATE HERE..." required />
            </div>
            <button disabled={sending} className="w-full bg-black text-white p-4 font-black hover:bg-green-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 uppercase">
              {sending ? 'DISPATCHING...' : <><Send size={18} /> SEND_TO_ALL_USERS</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;