import { useEffect, useState } from 'react';
import api from './api';

export default function App() {
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('onestep_user') || 'null'));
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [booking, setBooking] = useState({ categoryId: '', address: '', preferredDate: '', notes: '' });

  async function load() {
    try {
      const [s, r] = await Promise.all([
        api.get('/services'),
        user ? api.get('/requests/mine') : Promise.resolve({ data: { requests: [] } })
      ]);
      setServices(s.data.services);
      setRequests(r.data.requests);
    } catch (e) { setMessage(e.response?.data?.error || 'Unable to load application data'); }
  }
  useEffect(() => { load(); }, [user]);

  async function auth(e) {
    e.preventDefault(); setMessage('');
    try {
      if (mode === 'register') await api.post('/auth/register', form);
      const result = await api.post('/auth/login', { email: form.email, password: form.password });
      localStorage.setItem('onestep_token', result.data.token);
      localStorage.setItem('onestep_user', JSON.stringify(result.data.user));
      setUser(result.data.user);
      setMessage('Welcome to OneStep!');
    } catch (e) { setMessage(e.response?.data?.error || 'Account request failed'); }
  }

  async function book(e) {
    e.preventDefault(); setMessage('');
    try {
      await api.post('/requests', { ...booking, preferredDate: new Date(booking.preferredDate).toISOString() });
      setBooking({ categoryId: '', address: '', preferredDate: '', notes: '' });
      setMessage('Your service request was submitted.');
      await load();
    } catch (e) { setMessage(e.response?.data?.error || 'Booking failed'); }
  }

  function logout() {
    localStorage.removeItem('onestep_token');
    localStorage.removeItem('onestep_user');
    setUser(null); setRequests([]); setMessage('You have logged out.');
  }

  return <main className="shell">
    <nav><div className="brand">OneStep<span>.</span></div><div className="nav-right">
      {user ? <><span className="welcome">Hi, {user.name}</span><button className="button secondary" onClick={logout}>Log out</button></> : <span className="tag">Home services, made simple</span>}
    </div></nav>
    <section className="hero">
      <div><p className="eyebrow">YOUR HOME. OUR PRIORITY.</p><h1>Trusted help for<br/><em>every corner</em> of home.</h1>
      <p className="sub">Book verified home-service professionals for repairs, cleaning and everyday care.</p></div>
      <div className="hero-art"><div className="sun"></div><div className="house">⌂</div><div className="art-label">Care starts here</div></div>
    </section>
    {message && <div className="notice">{message}</div>}
    <section className="section"><div className="section-head"><div><p className="eyebrow">WHAT DO YOU NEED?</p><h2>Explore services</h2></div><span className="muted">{services.length} services available</span></div>
      <div className="cards">{services.map((s, i) => <article className="service-card" key={s.id}><div className="service-icon">{['🔧','💡','🧹','❄️','🎨'][i % 5]}</div><h3>{s.name}</h3><p>{s.description}</p><strong>From ₹{Number(s.basePrice).toLocaleString('en-IN')}</strong></article>)}</div>
    </section>
    <section className="work-grid">
      <div className="panel"><p className="eyebrow">BOOK IN MINUTES</p><h2>Request a service</h2>
        {user ? <form onSubmit={book} className="form">
          <label>Service<select required value={booking.categoryId} onChange={e=>setBooking({...booking,categoryId:e.target.value})}><option value="">Choose a service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Service address<textarea required minLength="8" value={booking.address} onChange={e=>setBooking({...booking,address:e.target.value})} placeholder="House number, street, area, city"/></label>
          <label>Preferred date and time<input required type="datetime-local" value={booking.preferredDate} onChange={e=>setBooking({...booking,preferredDate:e.target.value})}/></label>
          <label>Additional notes<textarea value={booking.notes} onChange={e=>setBooking({...booking,notes:e.target.value})} placeholder="Describe the issue (optional)"/></label>
          <button className="button" type="submit">Submit service request →</button>
        </form> : <p className="muted">Create an account or log in to book a service.</p>}
      </div>
      <div className="panel auth-panel"><p className="eyebrow">{user ? 'YOUR ACCOUNT' : 'GET STARTED'}</p><h2>{user ? 'Your requests' : (mode === 'login' ? 'Welcome back' : 'Create account')}</h2>
        {user ? <div className="request-list">{requests.length ? requests.map(r=><div className="request" key={r.id}><div><strong>{r.category.name}</strong><p>{r.address}</p><small>{new Date(r.preferredDate).toLocaleString()}</small></div><span className="status">{r.status}</span></div>) : <p className="muted">Your service requests will appear here.</p>}</div> :
        <form onSubmit={auth} className="form">
          {mode === 'register' && <label>Full name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
          <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Password<input required type="password" minLength="10" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
          {mode === 'register' && <label>Phone (optional)<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>}
          <button className="button" type="submit">{mode === 'login' ? 'Log in' : 'Create account'} →</button>
          <button className="link-button" type="button" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New to OneStep? Create an account' : 'Already registered? Log in'}</button>
        </form>}
      </div>
    </section>
    <footer>© {new Date().getFullYear()} OneStep Home Services · Reliable care, one step at a time.</footer>
  </main>;
}
