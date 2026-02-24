import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Mail, Megaphone, ShieldCheck } from 'lucide-react';

const UserMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil pesan: Milik user OR Broadcast (recipient_id IS NULL)
    const { data } = await supabase
      .from('font_messages')
      .select('*')
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
    setLoading(false);
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('font_messages').insert([{
      sender_id: user?.id,
      recipient_id: '6783856d-e448-47bc-ae55-520e7f7e9f3b', // GANTI DENGAN UUID ADMIN LO
      subject,
      content,
      message_type: 'support'
    }]);

    if (!error) {
      alert("MESSAGE_SENT_TO_ADMIN");
      setSubject('');
      setContent('');
      setShowForm(false);
      fetchMessages();
    }
    setSending(false);
  };

  return (
    <div className="space-y-8 font-mono uppercase">
      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black italic">INBOX</h2>
          <p className="text-[10px] opacity-40">Support replies & Official updates</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-6 py-2 text-[10px] font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all border border-black"
        >
          {showForm ? 'CLOSE_FORM' : 'NEW_SUPPORT_TICKET'}
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSendSupport} className="space-y-4">
            <input 
              type="text" placeholder="SUBJECT" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-black p-3 text-xs font-bold outline-none focus:bg-yellow-50" required
            />
            <textarea 
              placeholder="YOUR MESSAGE..." rows={4} value={content} onChange={e => setContent(e.target.value)}
              className="w-full border border-black p-3 text-xs font-bold outline-none focus:bg-yellow-50 resize-none" required
            />
            <button disabled={sending} className="w-full bg-black text-white p-3 font-black text-[10px] flex justify-center items-center gap-2">
              <Send size={14} /> {sending ? 'SENDING...' : 'DISPATCH_MESSAGE'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? <div className="animate-pulse font-black text-xs">FETCHING_MESSAGES...</div> : messages.length === 0 ? (
          <div className="p-20 border-2 border-dashed border-black text-center opacity-20 font-bold italic">NO_MESSAGES_YET</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${m.message_type === 'broadcast' ? 'bg-yellow-400' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black flex items-center gap-1 uppercase">
                  {m.message_type === 'broadcast' ? <Megaphone size={12}/> : <ShieldCheck size={12}/>} 
                  {m.message_type === 'broadcast' ? 'OFFICIAL_BROADCAST' : 'ADMIN_REPLY'}
                </span>
                <span className="text-[9px] font-bold opacity-40">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-xl font-black italic">{m.subject}</h3>
              <p className="mt-4 text-xs font-bold leading-relaxed">{m.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserMessages;