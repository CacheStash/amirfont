import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Mail, Megaphone, ShieldCheck, Trash2, ArrowLeft, Calendar } from 'lucide-react';

const UserMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('font_messages')
      .select('*')
      // User hanya melihat pesan yang ditujukan KE mereka (recipient_id)
      // atau pesan BROADCAST (recipient_id is null)
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
    setLoading(false);
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("AUTH_SESSION_MISSING");
      
      // Ambil ID Admin secara dinamis dari tabel fontadmin
      const { data: admin, error: adminErr } = await supabase
        .from('fontadmin')
        .select('id')
        .limit(1)
        .single();

      if (adminErr || !admin) throw new Error("ADMIN_NOT_FOUND_IN_fontadmin_TABLE");

      const { error } = await supabase.from('font_messages').insert([{
        sender_id: user.id,
        recipient_id: admin.id, // ID Admin dari fontadmin
        subject,
        content,
        message_type: 'support'
      }]);

      if (error) throw error;
      alert("MESSAGE_DISPATCHED_TO_ADMIN");
      setSubject(''); setContent(''); setShowForm(false); fetchMessages();
    } catch (err: any) {
      alert("SEND_ERROR: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("DELETE_MESSAGE?")) return;
    await supabase.from('font_messages').delete().eq('id', id);
    setMessages(messages.filter(m => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  return (
    <div className="space-y-8 font-mono uppercase">
      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
        {!selectedMessage && (
          <>
            <div>
              <h2 className="text-4xl font-black italic">INBOX</h2>
              <p className="text-[10px] opacity-40">Support replies & Official updates</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-black text-white px-6 py-2 text-[10px] font-black border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {showForm ? 'CLOSE' : 'NEW_TICKET'}
            </button>
          </>
        )}
      </div>

      {selectedMessage ? (
        /* DETAIL VIEW */
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-2">
          <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50">
            <button onClick={() => setSelectedMessage(null)} className="flex items-center gap-2 font-black text-[10px]">
              <ArrowLeft size={14} /> BACK
            </button>
            <button onClick={() => handleDelete(selectedMessage.id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
          </div>
          <div className="p-8 space-y-4">
            <span className="text-[10px] font-black opacity-40 flex items-center gap-2"><Calendar size={12}/> {new Date(selectedMessage.created_at).toLocaleString()}</span>
            <h3 className="text-2xl font-black italic">{selectedMessage.subject}</h3>
            <p className="text-sm font-bold leading-relaxed pt-4 border-t border-black/10 whitespace-pre-wrap">{selectedMessage.content}</p>
          </div>
        </div>
      ) : showForm ? (
        /* FORM VIEW */
        <form onSubmit={handleSendSupport} className="border-2 border-black p-6 bg-white space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <input type="text" placeholder="SUBJECT" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-black p-3 text-xs font-bold outline-none focus:bg-yellow-50" required />
          <textarea placeholder="MESSAGE..." rows={5} value={content} onChange={e => setContent(e.target.value)} className="w-full border border-black p-3 text-xs font-bold outline-none focus:bg-yellow-50 resize-none" required />
          <button disabled={sending} className="w-full bg-black text-white p-3 font-black text-[10px] flex justify-center gap-2">
            <Send size={14} /> {sending ? 'SENDING...' : 'DISPATCH'}
          </button>
        </form>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {loading ? <div className="animate-pulse font-black text-xs">LOADING_MAIL...</div> : 
           messages.length === 0 ? <div className="p-20 border-2 border-dashed border-black text-center opacity-20 font-bold">INBOX_EMPTY</div> : (
            messages.map(m => (
              <div 
                key={m.id} 
                onClick={() => setSelectedMessage(m)}
                className={`border-2 border-black p-5 flex items-center justify-between group cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-1 ${m.message_type === 'broadcast' ? 'bg-yellow-400' : 'bg-white hover:bg-black hover:text-white'}`}
              >
                <div className="overflow-hidden space-y-1">
                  <div className="flex gap-3 items-center">
                    <span className="text-[9px] font-black uppercase flex items-center gap-1">
                      {m.message_type === 'broadcast' ? <Megaphone size={10}/> : <ShieldCheck size={10}/>} {m.message_type}
                    </span>
                  </div>
                  <h4 className="text-sm font-black truncate">{m.subject}</h4>
                  <p className="text-[10px] font-bold opacity-50 truncate">{m.content.substring(0, 60)}...</p>
                </div>
                <button onClick={(e) => handleDelete(m.id, e)} className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserMessages;