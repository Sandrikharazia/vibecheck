import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Plus, 
  Heart, 
  Filter, 
  LayoutDashboard, 
  Compass,
  X,
  ChevronRight,
  Trash2,
  Sparkles,
  Map as MapIcon,
  Navigation,
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight
} from 'lucide-react';
import { Event, Category, CATEGORIES } from './types';

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'discover' | 'dashboard' | 'saved' | 'map'>('discover');
  const [events, setEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [directionsEventId, setDirectionsEventId] = useState<number | null>(null);
  const [startLocation, setStartLocation] = useState<string>('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchSavedEvents();
    }
  }, [selectedCategory, searchQuery, user]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedEvents = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/saved-events?userId=${user.id}`);
      const data = await res.json();
      setSavedEvents(data.map((e: Event) => e.id));
    } catch (err) {
      console.error("Failed to fetch saved events", err);
    }
  };

  const toggleSave = async (eventId: number) => {
    if (!user) return;
    try {
      await fetch('/api/saved-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId })
      });
      fetchSavedEvents();
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete event');
      
      if (directionsEventId === eventId) {
        setDirectionsEventId(null);
      }
      
      await fetchEvents();
      await fetchSavedEvents();
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const filteredEvents = view === 'saved' 
    ? events.filter(e => savedEvents.includes(e.id))
    : events;

  const handleGetDirections = (eventId: number) => {
    if (!startLocation) {
      setPendingEventId(eventId);
      setIsLocationModalOpen(true);
    } else {
      setDirectionsEventId(eventId);
    }
  };

  const activeDirectionsEvent = events.find(e => e.id === directionsEventId);

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('discover')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform duration-300">
                <Sparkles size={22} />
              </div>
              <span className="text-2xl font-display font-bold tracking-tight text-zinc-900">VibeCheck</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 p-1 rounded-xl border border-zinc-200/50">
              <button 
                onClick={() => setView('discover')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'discover' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Compass size={18} />
                Discover
              </button>
              <button 
                onClick={() => setView('saved')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Heart size={18} />
                Saved
              </button>
              <button 
                onClick={() => setView('map')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <MapIcon size={18} />
                Map
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-zinc-900">{user.email}</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{user.role}</span>
              </div>
              <button 
                onClick={() => setUser(null)}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <Plus size={18} />
                  New Event
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-zinc-900 mb-4"
          >
            {view === 'discover' && "Find your next experience"}
            {view === 'saved' && "Your saved events"}
            {view === 'dashboard' && "Manage your events"}
          </motion.h1>
          <p className="text-zinc-500 text-lg max-w-2xl">
            {view === 'discover' && "Discover the best events happening in your city. From tech meetups to art galleries."}
            {view === 'saved' && "Keep track of the events you're interested in attending."}
            {view === 'dashboard' && "Track your published events and see how they're performing."}
          </p>
        </div>

        {/* Filters & Search */}
        {view === 'discover' && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" 
                placeholder="Search events, venues, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event Content */}
        {view === 'map' ? (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
            {/* Sidebar with Cards */}
            <div className="w-full lg:w-[380px] overflow-y-auto pr-2 space-y-4 custom-scrollbar flex flex-col">
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-2 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-500" />
                <h3 className="font-display font-bold text-white text-lg flex items-center gap-2 mb-1">
                  <MapPin size={20} className="text-indigo-400" />
                  Live Map Explorer
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">Select an event to calculate the best route in real-time.</p>
                
                {activeDirectionsEvent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-zinc-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Routing To</span>
                      <button 
                        onClick={() => setDirectionsEventId(null)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{activeDirectionsEvent.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-2 py-1 bg-indigo-500/20 rounded-md border border-indigo-500/30">
                        <span className="text-[10px] font-bold text-indigo-300">EST. 12 MIN</span>
                      </div>
                      <div className="px-2 py-1 bg-emerald-500/20 rounded-md border border-emerald-500/30">
                        <span className="text-[10px] font-bold text-emerald-300">FASTEST</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                {filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isSaved={savedEvents.includes(event.id)}
                    view={view}
                    isActive={directionsEventId === event.id}
                    onToggleSave={() => toggleSave(event.id)}
                    onGetDirections={() => handleGetDirections(event.id)}
                    onDelete={view === 'dashboard' && user.role === 'admin' ? () => deleteEvent(event.id) : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-zinc-200 shadow-2xl bg-zinc-100 relative group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={directionsEventId || 'default'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  <iframe 
                    src={directionsEventId && activeDirectionsEvent 
                      ? `https://maps.google.com/maps?q=${activeDirectionsEvent.lat},${activeDirectionsEvent.lng}&saddr=${encodeURIComponent(startLocation)}&daddr=${activeDirectionsEvent.lat},${activeDirectionsEvent.lng}&output=embed`
                      : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000936.785932994!2d-101.8859652318073!3d39.507655143000356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sge!4v1773566490725!5m2!1sen!2sge"
                    }
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale-[0.1] contrast-[1.05]"
                  ></iframe>
                </motion.div>
              </AnimatePresence>
              
              {/* Overlay UI */}
              <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 pointer-events-auto flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tighter">System Online</span>
                  </div>
                  {directionsEventId && (
                    <>
                      <div className="w-px h-4 bg-zinc-200" />
                      <button 
                        onClick={() => {
                          setDirectionsEventId(null);
                          setStartLocation('');
                        }}
                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-tighter transition-colors"
                      >
                        Clear Route
                      </button>
                    </>
                  )}
                </div>

                {directionsEventId && activeDirectionsEvent && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 pointer-events-auto max-w-[240px]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Navigation size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Route</p>
                        <h4 className="font-bold text-sm truncate">{activeDirectionsEvent.title}</h4>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">From</span>
                        <span className="font-bold truncate ml-4">{startLocation}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Destination</span>
                        <span className="font-bold truncate ml-4">{activeDirectionsEvent.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Travel Mode</span>
                        <span className="font-bold">Driving</span>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                          "Directions are calculated from your specified starting point."
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {!directionsEventId && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="bg-zinc-900/10 backdrop-blur-[2px] w-full h-full flex items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-zinc-100 flex flex-col items-center gap-4 max-w-xs text-center pointer-events-auto">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Navigation size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">Ready to Navigate?</h4>
                        <p className="text-xs text-zinc-500 mt-1">Select an event from the sidebar to generate directions on this map.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[400px] bg-zinc-200 rounded-2xl animate-pulse" />
                ))
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isSaved={savedEvents.includes(event.id)}
                    view={view}
                    onToggleSave={() => toggleSave(event.id)}
                    onDelete={view === 'dashboard' && user.role === 'admin' ? () => deleteEvent(event.id) : undefined}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900">No events found</h3>
                  <p className="text-zinc-500">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateEventModal 
            onClose={() => setIsCreateModalOpen(false)} 
            onSuccess={() => {
              setIsCreateModalOpen(false);
              fetchEvents();
            }}
          />
        )}
      </AnimatePresence>

      {/* Location Prompt Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <LocationPromptModal 
            onClose={() => {
              setIsLocationModalOpen(false);
              setPendingEventId(null);
            }}
            onConfirm={(location) => {
              setStartLocation(location);
              if (pendingEventId) {
                setDirectionsEventId(pendingEventId);
              }
              setIsLocationModalOpen(false);
              setPendingEventId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={24} />
              <span className="text-xl font-display font-bold text-zinc-900">VibeCheck</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-500">
              <a href="#" className="hover:text-zinc-900">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-900">Terms of Service</a>
              <a href="#" className="hover:text-zinc-900">Contact Us</a>
            </div>
            <p className="text-sm text-zinc-400">© 2026 VibeCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const EventCard: React.FC<{ 
  event: Event, 
  isSaved: boolean, 
  view: 'discover' | 'dashboard' | 'saved' | 'map',
  isActive?: boolean,
  onToggleSave: () => void | Promise<void>,
  onGetDirections?: () => void,
  onDelete?: () => void | Promise<void>
}> = ({ event, isSaved, view, isActive, onToggleSave, onGetDirections, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        borderColor: isActive ? '#6366f1' : '#e4e4e7',
        backgroundColor: isActive ? '#f8fafc' : '#ffffff'
      }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -4 }}
      className={`group rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ${isActive ? 'ring-2 ring-indigo-500/20' : ''}`}
    >
      <div className="relative h-52 overflow-hidden">
        <img 
          src={event.image_url} 
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-zinc-600 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-lg"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-90 shadow-lg ${
              isSaved 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-zinc-600 hover:bg-white'
            }`}
          >
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className="absolute bottom-4 left-4">
          <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
            {event.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 text-indigo-600 text-[11px] font-black uppercase tracking-tighter mb-3">
          <Calendar size={14} />
          {new Date(event.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
        <h3 className="text-xl font-display font-bold text-zinc-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-6">
          <MapPin size={14} className="shrink-0 text-zinc-400" />
          <span className="line-clamp-1 font-medium">{event.location}</span>
        </div>
        
        <div className="flex items-center justify-between pt-5 border-t border-zinc-100">
          <div className="flex items-center gap-3">
            {view === 'map' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onGetDirections?.();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 transition-all shadow-md ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-indigo-200' 
                    : 'bg-zinc-900 text-white hover:bg-indigo-600 shadow-zinc-200'
                }`}
              >
                <Navigation size={14} />
                {isActive ? 'Routing...' : 'Get Route'}
              </button>
            ) : onDelete ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 font-bold text-xs flex items-center gap-1.5 hover:text-red-600 transition-colors uppercase tracking-tight"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : view === 'saved' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className="text-zinc-400 font-bold text-xs flex items-center gap-1.5 hover:text-red-500 transition-colors uppercase tracking-tight"
              >
                <X size={14} />
                Unsave
              </button>
            ) : (
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/32/32`}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-zinc-400">
                  +12
                </div>
              </div>
            )}
          </div>
          <button className="text-zinc-900 font-bold text-xs flex items-center gap-1 group/btn uppercase tracking-tight">
            Details
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AuthScreen({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (isLogin && res.status === 404) {
          setError("Account not found. Please sign up first.");
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      } else {
        onAuth(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-zinc-200 overflow-hidden relative z-10"
      >
        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold text-zinc-900">VibeCheck</h2>
            <p className="text-zinc-500 mt-2 text-center">
              {isLogin ? "Welcome back! Please login to continue." : "Join the community and start exploring."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2"
              >
                <X size={16} />
                {error}
              </motion.div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Login Now" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
            <p className="text-zinc-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-indigo-600 font-bold hover:underline"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LocationPromptModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (location: string) => void }) {
  const [location, setLocation] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
              <Navigation size={28} />
            </div>
            <h2 className="text-2xl font-display font-bold text-zinc-900">Where are you now?</h2>
            <p className="text-zinc-500 text-sm text-center mt-2">
              Enter your current city or address to calculate the best route to the event.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (location.trim()) onConfirm(location);
          }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Starting Point</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. London, UK or My Location"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 border border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Get Route
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function CreateEventModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'Networking' as Category,
    image_url: '',
    lat: 51.5074,
    lng: -0.1278
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error("Failed to create event", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-display font-bold text-zinc-900">Create New Event</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Event Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Summer Tech Mixer"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Date & Time</label>
                <input 
                  required
                  type="datetime-local" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Location</label>
                <input 
                  required
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Downtown Innovation Hub"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Latitude</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.lat}
                  onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Longitude</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.lng}
                  onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Description</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Tell people what your event is about..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Image URL (Optional)</label>
              <input 
                type="url" 
                value={formData.image_url}
                onChange={e => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting}
                type="submit"
                className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={20} />
                    Publish Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

