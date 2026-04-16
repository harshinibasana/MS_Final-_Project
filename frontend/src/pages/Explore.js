import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsAPI, expensesAPI, miscAPI } from '../utils/api';
import {
  Search, Star, MapPin, X, Sparkles, ChevronRight, Ticket,
  Phone, ExternalLink, ChevronLeft, Navigation, Heart,
  TrendingUp, DollarSign, Users, Calendar, Check, Info,
  AlertCircle, Zap, Route, Loader, Globe, Clock, Plus,
  ChevronDown, ChevronUp as ChevUp, Eye, Filter
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addDays, isSameMonth, isSameDay,
  isWithinInterval, parseISO, startOfDay
} from 'date-fns';
import './Explore.css';

const GMAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

// ─── STATIC DESTINATIONS ─────────────────────────────────────────────────────
const DESTINATIONS = [
  { id:'eiffel', name:'Eiffel Tower', country:'France', city:'Paris', category:'landmark', tags:['iconic','romantic','paris','tower'], description:"Standing 330m tall, the Eiffel Tower was built by Gustave Eiffel for the 1889 World's Fair and is one of the world's most visited monuments.", coverImage:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80', rating:4.7, reviewCount:241800, entryFee:{adult:26,child:13,currency:'EUR',isFree:false,notes:'Book online to skip queues. Summit costs extra.'}, openNow:true, hours:'09:30–23:45 daily', address:'Champ de Mars, 5 Av. Anatole France, 75007 Paris', phone:'+33 892 70 12 39', website:'https://www.toureiffel.paris', visitDuration:'2–3 hours', bestTime:'April–June, September–October', tips:['Book 2 weeks in advance','Visit at sunset','Night illuminations every hour after dark'], lat:48.8584, lng:2.2945, isFeatured:true, nearbyPlaces:['Champ de Mars Park','Trocadéro Gardens','Seine River Cruise'] },
  { id:'colosseum', name:'Colosseum', country:'Italy', city:'Rome', category:'landmark', tags:['ancient','history','rome','architecture'], description:'Completed in 80 AD, the Colosseum is the largest ancient amphitheatre ever built and one of the greatest works of Roman engineering.', coverImage:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900&q=80', rating:4.8, reviewCount:198400, entryFee:{adult:16,child:0,currency:'EUR',isFree:false,notes:'Combo ticket includes Roman Forum & Palatine Hill.'}, openNow:true, hours:'09:00–19:00', address:'Piazza del Colosseo, 1, 00184 Roma', phone:'+39 06 3996 7700', website:'https://colosseo.it', visitDuration:'2–4 hours', bestTime:'March–May, September–October', tips:['Buy combo ticket','Early morning avoids crowds'], lat:41.8902, lng:12.4922, isFeatured:true, nearbyPlaces:['Roman Forum','Palatine Hill','Arch of Constantine'] },
  { id:'fuji', name:'Mount Fuji', country:'Japan', city:'Fujinomiya', category:'mountain', tags:['mountain','hiking','japan','nature','volcano'], description:"Japan's highest peak at 3,776m. UNESCO World Heritage Site with a near-perfect symmetrical cone.", coverImage:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80', rating:4.9, reviewCount:87200, entryFee:{adult:1000,child:0,currency:'JPY',isFree:false,notes:'Climbing fee July–Sept only (~$7 USD).'}, openNow:false, hours:'Climbing: July 1–Sept 10', address:'Kitayama, Fujinomiya, Shizuoka, Japan', website:'https://www.fujisan-climb.jp', visitDuration:'Full day', bestTime:'July–August', tips:['Sunrise from summit is life-changing','Bring warm layers'], lat:35.3606, lng:138.7274, isFeatured:true, nearbyPlaces:['Fuji Five Lakes','Chureito Pagoda','Hakone'] },
  { id:'machu-picchu', name:'Machu Picchu', country:'Peru', city:'Cusco Region', category:'landmark', tags:['inca','history','hiking','andes','ancient'], description:'A 15th-century Inca citadel at 2,430m. UNESCO World Heritage Site and one of the most dramatic archaeological sites on Earth.', coverImage:'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=900&q=80', rating:4.9, reviewCount:156200, entryFee:{adult:45,child:20,currency:'USD',isFree:false,notes:'Book in advance — very limited daily capacity.'}, openNow:true, hours:'06:00–18:00 daily', address:'Aguas Calientes, Cusco Region, Peru', website:'https://machupicchu.gob.pe', visitDuration:'Full day', bestTime:'May–September', tips:['Book weeks ahead','Acclimatise in Cusco first'], lat:-13.1631, lng:-72.545, isFeatured:true, nearbyPlaces:['Huayna Picchu','Sun Gate','Inca Bridge'] },
  { id:'grand-canyon', name:'Grand Canyon', country:'United States', city:'Arizona', category:'park', tags:['canyon','nature','usa','hiking','views'], description:'446km long, 1,800m deep — the Colorado River carved this natural wonder over millions of years.', coverImage:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=900&q=80', rating:4.9, reviewCount:220400, entryFee:{adult:35,child:0,senior:20,currency:'USD',isFree:false,notes:'Per vehicle, valid 7 days.'}, openNow:true, hours:'South Rim: 24 hours', address:'Grand Canyon National Park, AZ 86023', phone:'+1 928-638-7888', website:'https://www.nps.gov/grca', visitDuration:'Full day+', bestTime:'March–May, September–November', tips:['Stay hydrated','Mather Point is the classic sunrise spot'], lat:36.0544, lng:-112.1401, isFeatured:true, nearbyPlaces:['Bright Angel Trail','Desert View','Mather Point'] },
  { id:'santorini', name:'Santorini', country:'Greece', city:'Santorini', category:'landmark', tags:['island','romantic','views','sunset','greece'], description:'Volcanic archipelago in the Aegean famous for blue-domed churches and spectacular caldera sunsets.', coverImage:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=900&q=80', rating:4.8, reviewCount:94700, entryFee:{adult:0,currency:'EUR',isFree:true,notes:'Free to explore. Cable car €6.'}, openNow:true, hours:'Always accessible', address:'Santorini, South Aegean, Greece', website:'https://www.santorini.gr', visitDuration:'3–5 days', bestTime:'May–June, September', tips:['Stay in Oia','Book sunset spots ahead'], lat:36.3932, lng:25.4615, isFeatured:true, nearbyPlaces:['Oia Village','Red Beach','Akrotiri'] },
  { id:'angkor-wat', name:'Angkor Wat', country:'Cambodia', city:'Siem Reap', category:'temple', tags:['temple','history','architecture','cambodia','sunrise'], description:"World's largest religious monument built in the 12th century. UNESCO World Heritage Site.", coverImage:'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80', rating:4.9, reviewCount:134500, entryFee:{adult:37,child:0,currency:'USD',isFree:false,notes:'1-day $37 | 3-day $62. Photo ID required.'}, openNow:true, hours:'05:00–18:00', address:'Angkor Archaeological Park, Siem Reap', website:'https://www.angkorwat.org', visitDuration:'1–3 days', bestTime:'November–March', tips:['Arrive before sunrise','Ta Prohm is a must'], lat:13.4125, lng:103.8667, isFeatured:true, nearbyPlaces:['Bayon Temple','Ta Prohm','Angkor Thom'] },
  { id:'louvre', name:'Louvre Museum', country:'France', city:'Paris', category:'museum', tags:['art','museum','paris','culture','mona-lisa'], description:"World's largest art museum with 380,000 objects including the Mona Lisa.", coverImage:'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80', rating:4.7, reviewCount:189200, entryFee:{adult:17,child:0,currency:'EUR',isFree:false,notes:'Free for EU under 26 and all under 18.'}, openNow:true, hours:'09:00–18:00. Wed & Fri until 21:45. Closed Tuesdays.', address:'Rue de Rivoli, 75001 Paris', phone:'+33 1 40 20 53 17', website:'https://www.louvre.fr', visitDuration:'3–6 hours', bestTime:'Weekday mornings', tips:['Book online','Arrive at opening'], lat:48.8606, lng:2.3376, isFeatured:true, nearbyPlaces:["Tuileries Garden","Palais Royal","Musée d'Orsay"] },
  { id:'petra', name:'Petra', country:'Jordan', city:"Ma'an", category:'landmark', tags:['ancient','desert','archaeology','jordan'], description:'Rose-red city carved into sandstone cliffs. UNESCO World Heritage Site, capital of the Nabataean Kingdom.', coverImage:'https://images.unsplash.com/photo-1579606032821-4d81bf07de9a?w=900&q=80', rating:4.8, reviewCount:112800, entryFee:{adult:50,child:0,currency:'JOD',isFree:false,notes:'~$70 USD. Free under 12.'}, openNow:true, hours:'06:00–18:00', address:"Petra Archaeological Park, Ma'an, Jordan", website:'https://www.visitpetra.jo', visitDuration:'Full day', bestTime:'March–May, September–November', tips:['Petra by Night is magical','The Monastery: 850 steps, worth it'], lat:30.3285, lng:35.4444, isFeatured:true, nearbyPlaces:['The Treasury','The Monastery','High Place of Sacrifice'] },
  { id:'sagrada', name:'Sagrada Família', country:'Spain', city:'Barcelona', category:'landmark', tags:['architecture','gaudi','barcelona','church'], description:"Gaudí's unfinished masterpiece since 1882 — Spain's most visited monument.", coverImage:'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900&q=80', rating:4.8, reviewCount:165400, entryFee:{adult:26,child:0,currency:'EUR',isFree:false,notes:'Book months ahead — sells out fast.'}, openNow:true, hours:'09:00–18:00 Mon–Sat', website:'https://www.sagradafamilia.org', visitDuration:'1–2 hours', bestTime:'Spring or autumn weekdays', tips:['Book months ahead','Evening visits for stained-glass'], lat:41.4036, lng:2.1744, isFeatured:true, nearbyPlaces:["Park Güell",'Casa Batlló','La Rambla'] },
  { id:'banff', name:'Banff National Park', country:'Canada', city:'Banff, Alberta', category:'park', tags:['nature','mountains','hiking','canada','lake'], description:"Canada's first national park — turquoise glacial lakes and world-class skiing.", coverImage:'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=900&q=80', rating:4.8, reviewCount:86300, entryFee:{adult:10.5,child:0,currency:'CAD',isFree:false,notes:'Daily pass $21.50.'}, openNow:true, hours:'Open year-round', address:'Banff, Alberta T1L 1K2, Canada', phone:'+1 403-762-1550', website:'https://www.pc.gc.ca/banff', visitDuration:'3–7 days', bestTime:'June–August or December–March', tips:['Moraine Lake needs timed-entry','Icefields Parkway is unmissable'], lat:51.4968, lng:-115.9281, isFeatured:true, nearbyPlaces:['Lake Louise','Moraine Lake','Icefields Parkway'] },
  { id:'great-reef', name:'Great Barrier Reef', country:'Australia', city:'Cairns, QLD', category:'beach', tags:['snorkeling','diving','nature','ocean','coral'], description:"World's largest coral reef system — 2,300km of the Coral Sea. UNESCO World Heritage Site.", coverImage:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=80', rating:4.9, reviewCount:74200, entryFee:{adult:7.5,child:4,currency:'AUD',isFree:false,notes:'Environmental charge. Boat tours extra from Cairns.'}, openNow:true, hours:'Tours year-round', address:'Coral Sea, Queensland, Australia', website:'https://www.gbrmpa.gov.au', visitDuration:'Full day+', bestTime:'June–October', tips:['Book a liveaboard','Use reef-safe sunscreen'], lat:-18.2871, lng:147.6992, isFeatured:true, nearbyPlaces:['Cairns Esplanade','Daintree Rainforest','Cape Tribulation'] },
  { id:'neuschwanstein', name:'Neuschwanstein Castle', country:'Germany', city:'Schwangau, Bavaria', category:'castle', tags:['castle','fairy-tale','germany','history','architecture'], description:"The iconic 19th-century Romanesque Revival palace that inspired Disney's Sleeping Beauty Castle. One of Germany's most visited landmarks.", coverImage:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=900&q=80', rating:4.7, reviewCount:132400, entryFee:{adult:15,child:0,currency:'EUR',isFree:false,notes:'Book timed-entry online. Guided tours only.'}, openNow:true, hours:'09:00–18:00 (Apr–Oct), 10:00–16:00 (Nov–Mar)', address:'Neuschwansteinstr. 20, 87645 Schwangau, Germany', website:'https://www.neuschwanstein.de', visitDuration:'2–3 hours', bestTime:'May–September', tips:['Book tickets weeks ahead','Marienbrücke bridge offers iconic view','Take the steep shuttle bus'], lat:47.5576, lng:10.7498, isFeatured:true, nearbyPlaces:['Hohenschwangau Castle','Alpsee Lake','Füssen Old Town'] },
  { id:'kyoto-temples', name:'Kyoto Old City', country:'Japan', city:'Kyoto', category:'cultural', tags:['culture','temples','japan','tradition','geisha'], description:"Japan's ancient capital with over 1,600 Buddhist temples, 400 Shinto shrines, and 17 UNESCO World Heritage Sites.", coverImage:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80', rating:4.8, reviewCount:198000, entryFee:{adult:0,currency:'JPY',isFree:true,notes:'Free to walk; individual temples charge ¥500–¥1,000.'}, openNow:true, hours:'Open year-round; temples 09:00–17:00', address:'Kyoto City, Kyoto Prefecture, Japan', website:'https://kyoto.travel', visitDuration:'3–5 days', bestTime:'March–April (cherry blossoms), Nov (autumn leaves)', tips:['Rent a bicycle to temple-hop','Visit Fushimi Inari at dawn','Gion District for evening strolls'], lat:35.0116, lng:135.7681, isFeatured:true, nearbyPlaces:['Fushimi Inari','Arashiyama','Gion District'] },
  { id:'patagonia', name:'Patagonia – Torres del Paine', country:'Chile', city:'Magallanes Region', category:'adventure', tags:['hiking','adventure','nature','trekking','wilderness'], description:"A national park at the tip of South America featuring dramatic granite spires, glaciers, turquoise lakes and world-class trekking routes.", coverImage:'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=900&q=80', rating:4.9, reviewCount:45600, entryFee:{adult:21000,child:5000,currency:'CLP',isFree:false,notes:'~$21 USD. Book camping well in advance.'}, openNow:true, hours:'Open year-round (best Oct–Apr)', address:'Torres del Paine National Park, Magallanes, Chile', website:'https://www.parquetorresdelpaine.cl', visitDuration:'4–10 days', bestTime:'November–March', tips:['Book the W-trek huts months ahead','Weather changes fast — layer up','Bus from Puerto Natales'], lat:-50.9423, lng:-73.4068, isFeatured:true, nearbyPlaces:['Grey Glacier','Mirador Las Torres','Puerto Natales'] },
  { id:'inca-trail', name:'Inca Trail Trek', country:'Peru', city:'Cusco Region', category:'adventure', tags:['hiking','adventure','inca','trekking','peru'], description:"The world's most famous trekking route — 43km through Andean cloud forest to the Sun Gate overlooking Machu Picchu.", coverImage:'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=900&q=80', rating:4.9, reviewCount:67800, entryFee:{adult:200,child:100,currency:'USD',isFree:false,notes:'Limited to 500 people/day. Book months ahead.'}, openNow:true, hours:'Guided 4-day treks; February closed', address:'Inca Trail, Cusco Region, Peru', website:'https://incatrailperu.com', visitDuration:'4 days', bestTime:'May–September', tips:['Book 6 months ahead','Acclimatise in Cusco first (2+ days)','Bring good rain gear'], lat:-13.1631, lng:-72.545, isFeatured:true, nearbyPlaces:['Machu Picchu','Ollantaytambo','Cusco City'] },
  { id:'edinburgh-castle', name:'Edinburgh Castle', country:'Scotland', city:'Edinburgh', category:'castle', tags:['castle','scotland','history','medieval','highlands'], description:"Dominating Edinburgh's skyline from volcanic rock, this fortress has shaped Scotland's history for over 3,000 years.", coverImage:'https://images.unsplash.com/photo-1506377585622-bedcbb5a8252?w=900&q=80', rating:4.6, reviewCount:89400, entryFee:{adult:16,child:9.6,currency:'GBP',isFree:false,notes:'Book online for discount. Crown Jewels included.'}, openNow:true, hours:'09:30–18:00 (Apr–Sep), 09:30–17:00 (Oct–Mar)', address:'Castlehill, Edinburgh EH1 2NG, Scotland', website:'https://www.edinburghcastle.scot', visitDuration:'2–3 hours', bestTime:'April–October', tips:['Avoid Aug (Fringe Festival crowds) — book ahead','Arrive early to beat queues',"One O'Clock Gun fires daily at 1pm",'Half Moon Battery for best city views'], lat:55.9486, lng:-3.1999, isFeatured:true, nearbyPlaces:['Royal Mile','Holyrood Palace',"Arthur's Seat"] },
];

const CATEGORIES = ['all','landmark','museum','beach','mountain','park','temple','castle','cultural','adventure'];
const CAT_ICONS  = { landmark:'🏛️',museum:'🎨',beach:'🏖️',mountain:'⛰️',park:'🌳',temple:'⛩️',castle:'🏰',cultural:'🎭',adventure:'🧗',other:'📍' };
const NEARBY_TYPES = [
  {type:'restaurant',label:'Restaurants',emoji:'🍽️'},{type:'lodging',label:'Hotels & Motels',emoji:'🏨'},
  {type:'cafe',label:'Cafes',emoji:'☕'},{type:'tourist_attraction',label:'Attractions',emoji:'📸'},
  {type:'shopping_mall',label:'Shopping',emoji:'🛍️'},{type:'bar',label:'Bars',emoji:'🍺'},
  {type:'pharmacy',label:'Pharmacy',emoji:'💊'},{type:'atm',label:'ATM / Bank',emoji:'🏧'},
];
const STATUS_COLORS = {planning:'#3B82F6',active:'#22c55e',completed:'#8B5CF6',cancelled:'#EF4444'};
const CAT_EXP_COLORS = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6','#EC4899','#14B8A6','#F97316'];

function starColor(r){ return r>=4.8?'#22c55e':r>=4.5?'#84cc16':r>=4.0?'#eab308':'#f97316'; }
function Hl({text,q}){
  if(!q?.trim()||!text) return text;
  const i=text.toLowerCase().indexOf(q.toLowerCase());
  if(i===-1) return text;
  return <>{text.slice(0,i)}<mark className="hl">{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>;
}

// ─── MAPS LOADER ─────────────────────────────────────────────────────────────
let _mp=null;
function loadMaps(){
  if(!GMAPS_KEY) return Promise.reject('no-key');
  if(window.google?.maps) return Promise.resolve(window.google.maps);
  if(_mp) return _mp;
  _mp=new Promise((res,rej)=>{
    const cb='__gmCB__';
    window[cb]=()=>{delete window[cb];res(window.google.maps);};
    const s=document.createElement('script');
    s.src=`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=${cb}`;
    s.async=true; s.onerror=()=>rej('fail');
    document.head.appendChild(s);
  });
  return _mp;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Explore(){
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── TABS: explore | community | calendar ──
  const [mainTab, setMainTab] = useState('explore');

  // ── SEARCH ──
  const [query, setQuery]         = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [suggs, setSuggs]         = useState({static:[],live:[]});
  const [showSugg, setShowSugg]   = useState(false);
  const [mode, setMode]           = useState('static');  // 'static' | 'live'
  const [liveRes, setLiveRes]     = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);

  // ── DETAIL PANEL ──
  const [selected, setSelected] = useState(null);
  const [saved, setSaved]       = useState([]);
  const [panelTab, setPanelTab] = useState('overview');

  // ── MAPS ──
  const [maps, setMaps]     = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const hiddenDiv = useRef(document.createElement('div'));
  const plSvc = useRef(null);
  const acSvc = useRef(null);

  // ── COMMUNITY ──
  const [commTrips, setCommTrips]   = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commSearch, setCommSearch] = useState('');
  const [commFilter, setCommFilter] = useState('all');
  const [commSelected, setCommSelected] = useState(null);

  // ── CALENDAR ──
  const [calMonth, setCalMonth]       = useState(new Date());
  const [myTrips, setMyTrips]         = useState([]);
  const [calSelected, setCalSelected] = useState(null);
  const [calExpenses, setCalExpenses] = useState({});
  const [calMiscExp, setCalMiscExp]       = useState({});
  const [calExpLoading, setCalExpLoading] = useState(false);

  const debRef    = useRef(null);
  const searchRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    loadMaps().then(gm=>{
      plSvc.current=new gm.places.PlacesService(hiddenDiv.current);
      acSvc.current=new gm.places.AutocompleteService();
      setMaps(gm);
    }).catch(()=>{});
    if('geolocation' in navigator)
      navigator.geolocation.getCurrentPosition(p=>setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{});
  },[]);

  useEffect(()=>{
    if(mainTab==='community') loadCommunity();
    if(mainTab==='calendar')  loadMyTrips();
  },[mainTab]);

  const loadCommunity = ()=>{
    setCommLoading(true);
    tripsAPI.getCommunity({destination:commSearch,status:commFilter})
      .then(r=>setCommTrips(r.data.trips||[]))
      .catch(()=>setCommTrips([]))
      .finally(()=>setCommLoading(false));
  };
  const loadMyTrips = async () => {
    setCalExpLoading(true);
    try {
      const res = await tripsAPI.getAll();
      const trips = res.data.trips || [];
      setMyTrips(trips);
      // Fetch regular expenses + misc for every trip in parallel
      const [expResults, miscResults] = await Promise.all([
        Promise.all(trips.map(t =>
          expensesAPI.getByTrip(t._id)
            .then(r => ({ tripId: t._id, expenses: r.data.expenses || [] }))
            .catch(() => ({ tripId: t._id, expenses: [] }))
        )),
        Promise.all(trips.map(t =>
          miscAPI.getByTrip(t._id)
            .then(r => ({ tripId: t._id, items: r.data.items || [] }))
            .catch(() => ({ tripId: t._id, items: [] }))
        )),
      ]);
      const expMap = {};
      expResults.forEach(({ tripId, expenses }) => { expMap[tripId] = expenses; });
      setCalExpenses(expMap);
      const miscMap = {};
      miscResults.forEach(({ tripId, items }) => { miscMap[tripId] = items; });
      setCalMiscExp(miscMap);
    } catch (e) {
      setMyTrips([]);
    } finally {
      setCalExpLoading(false);
    }
  };

  // ── Static filter — always runs, never goes to 0 unless no match ──────────
  const staticFiltered = DESTINATIONS.filter(d=>{
    const catOk = activeCat==='all' || d.category===activeCat;
    if(!catOk) return false;
    const q = query.trim().toLowerCase();
    if(!q) return true;
    return d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) || d.tags.some(t=>t.toLowerCase().includes(q));
  });

  // ── Autocomplete ──────────────────────────────────────────────────────────
  useEffect(()=>{
    clearTimeout(debRef.current);
    const q=query.trim();
    if(!q){setSuggs({static:[],live:[]});setShowSugg(false);return;}
    debRef.current=setTimeout(()=>{
      const ql=q.toLowerCase();
      const st=DESTINATIONS.filter(d=>
        d.name.toLowerCase().includes(ql)||d.city.toLowerCase().includes(ql)||
        d.country.toLowerCase().includes(ql)||d.tags.some(t=>t.toLowerCase().includes(ql))
      ).slice(0,4);
      if(maps&&acSvc.current){
        acSvc.current.getPlacePredictions({input:q},(preds,s)=>{
          setSuggs({static:st,live:s==='OK'?(preds||[]).slice(0,5):[]});
          setShowSugg(true);
        });
      } else {
        setSuggs({static:st,live:[]});
        setShowSugg(st.length>0);
      }
    },200);
  },[query,maps]);

  useEffect(()=>{
    const h=e=>{if(!searchRef.current?.contains(e.target))setShowSugg(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const clearAll=()=>{
    setQuery(''); setSuggs({static:[],live:[]}); setShowSugg(false);
    setMode('static'); setLiveRes([]); setActiveCat('all'); setSelected(null);
  };

  const liveSearch=q=>{
    if(!q.trim()||!maps||!plSvc.current){return;}
    setLoadingLive(true); setLiveRes([]);
    plSvc.current.textSearch({query:q},(res,s)=>{
      setLoadingLive(false);
      if(s==='OK'&&res?.length){setLiveRes(res.slice(0,20));setMode('live');}
      else setMode('static');
    });
  };

  const getDetails=(pid,cb)=>{
    if(!plSvc.current)return;
    plSvc.current.getDetails({placeId:pid,fields:['name','formatted_address','rating','user_ratings_total','photos','types','geometry','opening_hours','price_level','formatted_phone_number','website','reviews']},(r,s)=>cb(s==='OK'?r:null));
  };

  const openStatic=d=>{setSelected({type:'static',data:d});setPanelTab('overview');setShowSugg(false);};
  const openLivePred=p=>{
    setQuery(p.structured_formatting?.main_text||p.description);
    setShowSugg(false);
    getDetails(p.place_id,r=>{if(r){setLiveRes([r]);setMode('live');setSelected({type:'live',data:r});setPanelTab('overview');}});
  };
  const openLive=p=>{
    setSelected({type:'live',data:p});setPanelTab('overview');
    if(p.place_id&&plSvc.current) getDetails(p.place_id,r=>{if(r)setSelected({type:'live',data:r});});
  };
  const toggleSaved=(id,e)=>{e?.stopPropagation();setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);};

  const displayList = mode==='live' ? liveRes : staticFiltered;

  return (
    <div className="explore-root">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <div className="explore-hero">
        <div className="ehero-bg"/>
        <div className="ehero-content">
          <div className="ehero-label"><Sparkles size={12}/> DISCOVER THE WORLD</div>
          <h1>Where do you want<br/>to go?</h1>
          <p>Search any city or landmark • See live places, nearby restaurants & hotels • Community trip plans</p>

          {!GMAPS_KEY&&(
            <div className="no-key-banner">
              <Info size={14}/> Add <code>REACT_APP_GOOGLE_MAPS_KEY</code> to <code>frontend/.env</code> for live search, nearby places & maps.
            </div>
          )}

          {/* ── SEARCH BOX ── */}
          <div className="esearch-wrap" ref={searchRef}>
            <div className="esearch-box">
              <Search size={18} className="esb-icon"/>
              <input className="esb-input"
                placeholder="Search Paris, temple, mountain, country..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){setShowSugg(false);liveSearch(query);setMainTab('explore');}}}
                onFocus={()=>{if(suggs.static.length||suggs.live.length)setShowSugg(true);}}
              />
              {query&&<button className="esb-clear" onClick={clearAll} title="Clear search"><X size={15}/></button>}
              <button className="esb-btn" onClick={()=>{setShowSugg(false);liveSearch(query);setMainTab('explore');}}>
                {loadingLive?<Loader size={15} className="spin"/>:<Search size={15}/>} Search
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSugg&&(suggs.static.length>0||suggs.live.length>0)&&(
              <div className="acdrop">
                {suggs.static.length>0&&<>
                  <div className="acdrop-section">⭐ Featured Destinations</div>
                  {suggs.static.map(d=>(
                    <div key={d.id} className="acdrop-item" onClick={()=>{setQuery(d.name);openStatic(d);setMainTab('explore');}}>
                      <div className="acdrop-thumb" style={{backgroundImage:`url(${d.coverImage})`}}/>
                      <div className="acdrop-info">
                        <div className="acdrop-name"><Hl text={d.name} q={query}/></div>
                        <div className="acdrop-sub"><MapPin size={9}/> {d.city}, {d.country} · {CAT_ICONS[d.category]} {d.category}</div>
                      </div>
                      <span className="acdrop-rating" style={{color:starColor(d.rating)}}>★{d.rating}</span>
                      <ChevronRight size={12}/>
                    </div>
                  ))}
                </>}
                {suggs.live.length>0&&<>
                  <div className="acdrop-section">🔍 Live Places</div>
                  {suggs.live.map(p=>(
                    <div key={p.place_id} className="acdrop-item live" onClick={()=>openLivePred(p)}>
                      <div className="acdrop-live-icon"><MapPin size={15} color="var(--coral)"/></div>
                      <div className="acdrop-info">
                        <div className="acdrop-name"><Hl text={p.structured_formatting?.main_text||p.description} q={query}/></div>
                        <div className="acdrop-sub">{p.structured_formatting?.secondary_text||''}</div>
                      </div>
                      <ChevronRight size={12}/>
                    </div>
                  ))}
                </>}
              </div>
            )}
          </div>

          {/* ── CATEGORY PILLS ── */}
          <div className="ecat-pills">
            {CATEGORIES.map(c=>(
              <button key={c} className={`ecat-pill ${activeCat===c?'active':''}`}
                onClick={()=>{setActiveCat(c);setMode('static');setLiveRes([]);setMainTab('explore');}}>
                {c!=='all'&&<span>{CAT_ICONS[c]}</span>}
                {c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
          </div>

          {/* ── MAIN TABS ── */}
          <div className="explore-main-tabs">
            {[['explore','🌍 Destinations'],['community','👥 Community Plans'],['calendar','📅 Trip Calendar']].map(([v,l])=>(
              <button key={v} className={`emt-btn ${mainTab===v?'active':''}`} onClick={()=>setMainTab(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════ */}
      <div className={`explore-body ${selected&&mainTab==='explore'?'panel-open':''}`}>

        {/* ── EXPLORE TAB ─────────────────────────────────────────────── */}
        {mainTab==='explore'&&(
          <div className="egrid-col">
            {/* Grid header */}
            <div className="egrid-header">
              <span className="egrid-count">
                {loadingLive ? 'Searching...'
                  : mode==='live' ? `${liveRes.length} live results for "${query}"`
                  : activeCat!=='all' ? `${staticFiltered.length} of ${DESTINATIONS.length} - ${CAT_ICONS[activeCat]} ${activeCat}`
                  : `${staticFiltered.length} destination${staticFiltered.length!==1?'s':''}`
                }
              </span>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {mode==='live'&&<button className="egrid-clear" onClick={()=>{setMode('static');setLiveRes([]);}}><X size={11}/> Show curated</button>}
                {activeCat!=='all'&&<button className="egrid-clear" onClick={()=>setActiveCat('all')}><X size={11}/> {activeCat}</button>}
                {query&&<button className="egrid-clear" onClick={clearAll}><X size={11}/> Clear</button>}
              </div>
            </div>

            {loadingLive?(
              <div className="egrid-loading"><Loader size={36} className="spin"/><p>Searching live places...</p></div>
            ):displayList.length===0?(
              <div className="egrid-empty">
                <Search size={48} opacity={0.15}/>
                <h3>No destinations found</h3>
                <p>{activeCat!=='all'?`No ${activeCat} spots match your search.`:'Try a different keyword or press Enter to search live.'}</p>
                <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:12}}>
                  {activeCat!=='all'&&<button className="btn btn-ghost btn-sm" onClick={()=>setActiveCat('all')}>All Categories</button>}
                  <button className="btn btn-primary btn-sm" onClick={clearAll}>Show All Destinations</button>
                  {maps&&query&&<button className="btn btn-ghost btn-sm" onClick={()=>liveSearch(query)}>Search "{query}" Live</button>}
                </div>
              </div>
            ):(
              <div className={`egrid ${selected?'compact':''}`}>
                {mode==='live'
                  ?displayList.map((p,i)=><LiveCard key={p.place_id||i} place={p} i={i} compact={!!selected} query={query} isSelected={selected?.type==='live'&&selected?.data?.place_id===p.place_id} onOpen={()=>openLive(p)}/>)
                  :displayList.map((d,i)=><StaticCard key={d.id} d={d} i={i} compact={!!selected} query={query} isSelected={selected?.type==='static'&&selected?.data?.id===d.id} isSaved={saved.includes(d.id)} onOpen={()=>openStatic(d)} onSave={e=>toggleSaved(d.id,e)}/>)
                }
              </div>
            )}
          </div>
        )}

        {/* ── COMMUNITY TAB ───────────────────────────────────────────── */}
        {mainTab==='community'&&(
          <div className="comm-col">
            <CommunityPanel
              trips={commTrips} loading={commLoading}
              search={commSearch} setSearch={setCommSearch}
              filter={commFilter} setFilter={setCommFilter}
              onRefresh={()=>loadCommunity()}
              onSelect={setCommSelected} selected={commSelected}
              currentUserId={user?.id||user?._id}
            />
          </div>
        )}

        {/* ── CALENDAR TAB ────────────────────────────────────────────── */}
        {mainTab==='calendar'&&(
          <div className="cal-col">
            <TripCalendar trips={myTrips} month={calMonth} setMonth={setCalMonth} selected={calSelected} setSelected={setCalSelected} navigate={navigate} expensesByTrip={calExpenses} miscByTrip={calMiscExp} expLoading={calExpLoading}/>
          </div>
        )}

        {/* ── DETAIL PANEL ─────────────────────────────────────────────── */}
        {selected&&mainTab==='explore'&&(
          <div className="epanel-col">
            {selected.type==='static'
              ?<StaticPanel dest={selected.data} tab={panelTab} setTab={setPanelTab} isSaved={saved.includes(selected.data.id)} onSave={e=>toggleSaved(selected.data.id,e)} onClose={()=>setSelected(null)} userLoc={userLoc} maps={maps} plSvc={plSvc}/>
              :<LivePanel place={selected.data} tab={panelTab} setTab={setPanelTab} onClose={()=>setSelected(null)} userLoc={userLoc} maps={maps} plSvc={plSvc}/>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STATIC CARD
// ──────────────────────────────────────────────────────────────────────────────
function StaticCard({d,i,isSelected,isSaved,compact,query,onOpen,onSave}){
  return(
    <div className={`dcard ${isSelected?'selected':''} ${compact?'compact':''}`} style={{animationDelay:`${i*.04}s`}} onClick={onOpen}>
      <div className="dcard-img" style={{backgroundImage:`url(${d.coverImage})`}}>
        <div className="dcard-overlay"/>
        <span className="dcard-cat">{CAT_ICONS[d.category]} {d.category}</span>
        {d.isFeatured&&<span className="dcard-feat">⭐</span>}
        <button className={`dcard-save ${isSaved?'active':''}`} onClick={onSave}><Heart size={14} fill={isSaved?'#E8614D':'none'} color={isSaved?'#E8614D':'white'}/></button>
        {d.openNow!==undefined&&<span className={`dcard-open ${d.openNow?'open':'closed'}`}><span className="dot"/>{d.openNow?'Open':'Closed'}</span>}
        <div className="dcard-loc"><MapPin size={10}/> {d.city}, {d.country}</div>
      </div>
      <div className="dcard-body">
        <h3><Hl text={d.name} q={query}/></h3>
        <div className="dcard-row">
          <span className="dcard-rating" style={{color:starColor(d.rating)}}><Star size={11} fill={starColor(d.rating)} color={starColor(d.rating)}/>{d.rating} <span className="dcard-rc">({(d.reviewCount/1000).toFixed(0)}K)</span></span>
          <span className="dcard-fee"><Ticket size={10}/>{d.entryFee?.isFree?<span className="fee-free">Free</span>:<span>{d.entryFee?.currency} {d.entryFee?.adult}</span>}</span>
        </div>
        {!compact&&<div className="dcard-tags">{d.tags?.slice(0,3).map(t=><span key={t}>#{t}</span>)}</div>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// LIVE CARD
// ──────────────────────────────────────────────────────────────────────────────
function LiveCard({place,i,compact,query,isSelected,onOpen}){
  const photo=place.photos?.[0]?.getUrl?.({maxWidth:400});
  const type=place.types?.[0]?.replace(/_/g,' ')||'place';
  return(
    <div className={`dcard live-card ${isSelected?'selected':''} ${compact?'compact':''}`} style={{animationDelay:`${i*.04}s`}} onClick={onOpen}>
      <div className="dcard-img" style={{backgroundImage:photo?`url(${photo})`:'linear-gradient(135deg,#0A4D6E,#1A7FA8)'}}>
        <div className="dcard-overlay"/>
        <span className="dcard-cat live-badge">🔴 {type}</span>
        {place.opening_hours&&<span className={`dcard-open ${place.opening_hours.open_now?'open':'closed'}`}><span className="dot"/>{place.opening_hours.open_now?'Open':'Closed'}</span>}
        <div className="dcard-loc"><MapPin size={10}/>{place.formatted_address?.split(',').slice(-2).join(',').trim()}</div>
      </div>
      <div className="dcard-body">
        <h3><Hl text={place.name} q={query}/></h3>
        <div className="dcard-row">
          {place.rating&&<span className="dcard-rating" style={{color:starColor(place.rating)}}><Star size={11} fill={starColor(place.rating)} color={starColor(place.rating)}/>{place.rating} <span className="dcard-rc">({place.user_ratings_total?.toLocaleString()})</span></span>}
          {place.price_level!=null&&<span className="dcard-fee">{'$'.repeat(place.price_level||1)}</span>}
        </div>
        {!compact&&<div className="dcard-addr">{place.formatted_address?.split(',').slice(0,2).join(',')}</div>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STATIC DETAIL PANEL
// ──────────────────────────────────────────────────────────────────────────────
function StaticPanel({dest:d,tab,setTab,isSaved,onSave,onClose,userLoc,maps,plSvc}){
  const mapRef=useRef(null);
  const mapInst=useRef(null);
  const [routeInfo,setRouteInfo]=useState(null);
  useEffect(()=>{setRouteInfo(null);mapInst.current=null;},[d.id]);
  useEffect(()=>{
    if(tab!=='map'||!maps||!mapRef.current||mapInst.current)return;
    const c={lat:d.lat,lng:d.lng};
    const map=new maps.Map(mapRef.current,{zoom:14,center:c,mapTypeControl:false,streetViewControl:false});
    new maps.Marker({position:c,map,title:d.name,animation:maps.Animation.DROP});
    mapInst.current=map;
    if(userLoc){
      const ds=new maps.DirectionsService();
      const dr=new maps.DirectionsRenderer({map});
      ds.route({origin:userLoc,destination:c,travelMode:'DRIVING'},(res,s)=>{
        if(s==='OK'){dr.setDirections(res);const l=res.routes[0].legs[0];setRouteInfo({distance:l.distance.text,duration:l.duration.text});}
      });
    }
  },[tab,maps,d,userLoc]);

  return(
    <div className="dp">
      <div className="dp-hero" style={{backgroundImage:`url(${d.coverImage})`}}>
        <div className="dp-hero-ov"/>
        <div className="dp-hero-top">
          <button className="dp-back" onClick={onClose}><ChevronLeft size={17}/> Back</button>
          <button className={`dp-save-btn ${isSaved?'saved':''}`} onClick={onSave}><Heart size={15} fill={isSaved?'#E8614D':'none'} color={isSaved?'#E8614D':'currentColor'}/></button>
        </div>
      </div>
      <div className="dp-id">
        <div className="dp-cat-chip">{CAT_ICONS[d.category]} {d.category}</div>
        <h2>{d.name}</h2>
        <div className="dp-id-loc"><MapPin size={12}/> {d.city}, {d.country}</div>
        <div className="dp-id-rating">
          {[1,2,3,4,5].map(s=><Star key={s} size={13} fill={s<=Math.round(d.rating)?starColor(d.rating):'#e2e8f0'} color={s<=Math.round(d.rating)?starColor(d.rating):'#e2e8f0'}/>)}
          <span style={{color:starColor(d.rating),fontWeight:700,marginLeft:5}}>{d.rating}</span>
          <span className="dp-rcount"> {d.reviewCount?.toLocaleString()} reviews</span>
        </div>
        {d.openNow!==undefined&&<div className={`dp-status-row ${d.openNow?'open':'closed'}`}><span className="dp-status-dot"/>{d.openNow?'Open Now':'Closed'} <span className="dp-hours-inline">{d.hours}</span></div>}
      </div>
      <div className="dp-tabs">
        {[['overview','📊 Overview'],['fees','🎟️ Fees'],['nearby','📍 Nearby'],['map','🗺️ Map'],['tips','💡 Tips'],['info','ℹ️ Info']].map(([v,l])=>(
          <button key={v} className={`dp-tab ${tab===v?'active':''}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      <div className="dp-body">
        {tab==='overview'&&<>
          <div className="dp-qs">
            <div className="dp-qs-item"><Clock size={13}/><div><div className="dqs-l">Duration</div><div className="dqs-v">{d.visitDuration}</div></div></div>
            <div className="dp-qs-item"><Calendar size={13}/><div><div className="dqs-l">Best Time</div><div className="dqs-v">{d.bestTime?.split(',')[0]}</div></div></div>
            <div className="dp-qs-item"><Users size={13}/><div><div className="dqs-l">Reviews</div><div className="dqs-v">{(d.reviewCount/1000).toFixed(0)}K+</div></div></div>
          </div>
          <p className="dp-desc">{d.description}</p>
          <div className="dp-tag-row">{d.tags?.map(t=><span key={t} className="dp-tag">#{t}</span>)}</div>
          {d.nearbyPlaces?.length>0&&<div className="dp-section"><h4>📍 Nearby Highlights</h4><div className="dp-nearby">{d.nearbyPlaces.map(p=><div key={p} className="dp-nearby-chip" onClick={()=>setTab('nearby')}><Navigation size={9}/> {p} <ChevronRight size={9}/></div>)}</div></div>}
        </>}
        {tab==='fees'&&<>
          <div className="dp-fee-card">
            <div className="dp-fc-head"><Ticket size={18}/><span>Entry Tickets</span>{d.entryFee?.isFree&&<span className="dp-free-badge">FREE</span>}</div>
            {d.entryFee?.isFree
              ?<div className="dp-free-row"><Check size={16} color="var(--sage)"/> Free entry for all visitors!</div>
              :<div className="dp-fee-rows">
                {d.entryFee?.adult>0&&<div className="dp-fr"><span>👤 Adult</span><span className="dp-fr-price">{d.entryFee.currency} {d.entryFee.adult}</span></div>}
                {d.entryFee?.child>0?<div className="dp-fr"><span>🧒 Child</span><span className="dp-fr-price">{d.entryFee.currency} {d.entryFee.child}</span></div>:<div className="dp-fr muted"><span>🧒 Child</span><span className="dp-fr-free">Free</span></div>}
                {d.entryFee?.senior>0&&<div className="dp-fr"><span>👴 Senior</span><span className="dp-fr-price">{d.entryFee.currency} {d.entryFee.senior}</span></div>}
              </div>
            }
            {d.entryFee?.notes&&<div className="dp-fee-note"><AlertCircle size={12}/> {d.entryFee.notes}</div>}
          </div>
        </>}
        {tab==='nearby'&&<NearbyTab lat={d.lat} lng={d.lng} name={d.name} maps={maps} plSvc={plSvc}/>}
        {tab==='map'&&(
          <div className="dp-map-tab">
            {routeInfo&&(
              <div className="route-info-bar">
                <Route size={14}/>
                <div>
                  <div className="route-label">From your location</div>
                  <div className="route-details">🚗 {routeInfo.duration} · {routeInfo.distance}</div>
                </div>
              </div>
            )}
            {/* Google Maps — shown if API key configured */}
            {maps && <div ref={mapRef} className="dp-map-canvas" style={{marginBottom:10}}/>}
            {/* OpenStreetMap — always works, no API key needed */}
            <div className="dp-map-osm">
              <iframe
                title={d.name}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${d.lng-0.012},${d.lat-0.009},${d.lng+0.012},${d.lat+0.009}&layer=mapnik&marker=${d.lat},${d.lng}`}
                className="dp-map-canvas"
                loading="lazy"
                allowFullScreen
              />
              <div className="osm-actions">
                <a href={`https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" className="dp-route-btn"><ExternalLink size={12}/> Google Maps</a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><Route size={12}/> Directions</a>
                <a href={`https://maps.apple.com/?ll=${d.lat},${d.lng}&q=${encodeURIComponent(d.name)}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><MapPin size={12}/> Apple Maps</a>
                <a href={`https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=15/${d.lat}/${d.lng}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><ExternalLink size={12}/> OpenStreetMap</a>
              </div>
            </div>
          </div>
        )}

        {tab==='tips'&&<>
          <div className="dp-tips-head"><Zap size={14} color="var(--coral)"/> Insider Tips</div>
          {d.tips?.map((tip,i)=><div key={i} className="dp-tip"><span className="dp-tip-num">{i+1}</span><p>{tip}</p></div>)}
          <div className="dp-section"><h4>🗓️ Best Time to Visit</h4><p className="dp-best">{d.bestTime}</p></div>
        </>}
        {tab==='info'&&<>
          {d.address&&<div className="dp-ir"><MapPin size={13}/><div><div className="dp-il">Address</div><div className="dp-iv">{d.address}</div></div></div>}
          {d.phone&&<div className="dp-ir"><Phone size={13}/><div><div className="dp-il">Phone</div><a href={`tel:${d.phone}`} className="dp-ilink">{d.phone}</a></div></div>}
          {d.website&&<div className="dp-ir"><Globe size={13}/><div><div className="dp-il">Website</div><a href={d.website} target="_blank" rel="noreferrer" className="dp-ilink">{d.website.replace('https://','').replace('http://','')} <ExternalLink size={9}/></a></div></div>}
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" className="dp-route-btn"><Route size={13}/> Get Directions</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><MapPin size={13}/> View on Map</a>
        </>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// LIVE PANEL
// ──────────────────────────────────────────────────────────────────────────────
function LivePanel({place,tab,setTab,onClose,userLoc,maps,plSvc}){
  const mapRef=useRef(null); const mapInst=useRef(null); const [routeInfo,setRouteInfo]=useState(null);
  const photo=place.photos?.[0]?.getUrl?.({maxWidth:900});
  const latRaw=place.geometry?.location?.lat; const lngRaw=place.geometry?.location?.lng;
  const lat=typeof latRaw==='function'?latRaw():latRaw;
  const lng=typeof lngRaw==='function'?lngRaw():lngRaw;
  useEffect(()=>{mapInst.current=null;setRouteInfo(null);},[place.place_id]);
  useEffect(()=>{
    if(tab!=='map'||!maps||!mapRef.current||mapInst.current||!lat||!lng)return;
    const c={lat,lng};
    const map=new maps.Map(mapRef.current,{zoom:15,center:c,mapTypeControl:false,streetViewControl:false});
    new maps.Marker({position:c,map,title:place.name,animation:maps.Animation.DROP});
    mapInst.current=map;
    if(userLoc){
      const ds=new maps.DirectionsService(); const dr=new maps.DirectionsRenderer({map});
      ds.route({origin:userLoc,destination:c,travelMode:'DRIVING'},(res,s)=>{
        if(s==='OK'){dr.setDirections(res);const l=res.routes[0].legs[0];setRouteInfo({distance:l.distance.text,duration:l.duration.text});}
      });
    }
  },[tab,maps,place,lat,lng,userLoc]);

  return(
    <div className="dp">
      <div className="dp-hero" style={{backgroundImage:photo?`url(${photo})`:'linear-gradient(135deg,#0A4D6E,#1A7FA8)'}}>
        <div className="dp-hero-ov"/>
        <div className="dp-hero-top">
          <button className="dp-back" onClick={onClose}><ChevronLeft size={17}/> Back</button>
          <span className="live-indicator">🔴 Live</span>
        </div>
      </div>
      <div className="dp-id">
        <div className="dp-cat-chip">{place.types?.[0]?.replace(/_/g,' ')||'place'}</div>
        <h2>{place.name}</h2>
        <div className="dp-id-loc"><MapPin size={12}/> {place.formatted_address}</div>
        {place.rating&&<div className="dp-id-rating">{[1,2,3,4,5].map(s=><Star key={s} size={13} fill={s<=Math.round(place.rating)?starColor(place.rating):'#e2e8f0'} color={s<=Math.round(place.rating)?starColor(place.rating):'#e2e8f0'}/>)}<span style={{color:starColor(place.rating),fontWeight:700,marginLeft:5}}>{place.rating}</span><span className="dp-rcount"> {place.user_ratings_total?.toLocaleString()} reviews</span></div>}
        {place.opening_hours&&<div className={`dp-status-row ${place.opening_hours.open_now?'open':'closed'}`}><span className="dp-status-dot"/>{place.opening_hours.open_now?'Open Now':'Closed'}</div>}
      </div>
      <div className="dp-tabs">
        {[['overview','📊 Overview'],['nearby','📍 Nearby'],['map','🗺️ Map'],['info','ℹ️ Info']].map(([v,l])=>(
          <button key={v} className={`dp-tab ${tab===v?'active':''}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      <div className="dp-body">
        {tab==='overview'&&<>
          <div className="dp-tag-row">{place.types?.slice(0,6).map(t=><span key={t} className="dp-tag">#{t.replace(/_/g,' ')}</span>)}</div>
          {place.reviews?.slice(0,3).map((r,i)=>(
            <div key={i} className="live-review">
              <div className="live-review-header">
                <img src={r.profile_photo_url} alt="" className="live-review-avatar" onError={e=>e.target.style.display='none'}/>
                <div><div className="live-review-author">{r.author_name}</div><div className="live-review-stars">{'★'.repeat(r.rating)}</div></div>
                <span className="live-review-time">{r.relative_time_description}</span>
              </div>
              <p className="live-review-text">{r.text?.slice(0,200)}{r.text?.length>200?'...':''}</p>
            </div>
          ))}
        </>}
        {tab==='nearby'&&lat&&lng&&<NearbyTab lat={lat} lng={lng} name={place.name} maps={maps} plSvc={plSvc}/>}
        {tab==='map'&&(
          <div className="dp-map-tab">
            {routeInfo&&(
              <div className="route-info-bar">
                <Route size={14}/>
                <div>
                  <div className="route-label">From your location</div>
                  <div className="route-details">🚗 {routeInfo.duration} · {routeInfo.distance}</div>
                </div>
              </div>
            )}
            {/* Google Maps — shown if API key configured */}
            {maps && <div ref={mapRef} className="dp-map-canvas" style={{marginBottom:10}}/>}
            {/* OpenStreetMap — always works, no API key needed */}
            {lat && lng ? (
              <div className="dp-map-osm">
                <iframe
                  title={place.name}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.012},${lat-0.009},${lng+0.012},${lat+0.009}&layer=mapnik&marker=${lat},${lng}`}
                  className="dp-map-canvas"
                  loading="lazy"
                  allowFullScreen
                />
                <div className="osm-actions">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer" className="dp-route-btn"><ExternalLink size={12}/> Google Maps</a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><Route size={12}/> Directions</a>
                  <a href={`https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(place.name||'')}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><MapPin size={12}/> Apple Maps</a>
                  <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><ExternalLink size={12}/> OpenStreetMap</a>
                </div>
              </div>
            ) : (
              <div className="map-no-key">
                <MapPin size={32}/>
                <h4>No coordinates available</h4>
                <p>Location data not provided for this place</p>
              </div>
            )}
          </div>
        )}

        {tab==='info'&&<>
          {place.formatted_address&&<div className="dp-ir"><MapPin size={13}/><div><div className="dp-il">Address</div><div className="dp-iv">{place.formatted_address}</div></div></div>}
          {place.formatted_phone_number&&<div className="dp-ir"><Phone size={13}/><div><div className="dp-il">Phone</div><a href={`tel:${place.formatted_phone_number}`} className="dp-ilink">{place.formatted_phone_number}</a></div></div>}
          {place.website&&<div className="dp-ir"><Globe size={13}/><div><div className="dp-il">Website</div><a href={place.website} target="_blank" rel="noreferrer" className="dp-ilink">{place.website.replace('https://','').replace('http://','')} <ExternalLink size={9}/></a></div></div>}
          {lat&&lng&&<>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noreferrer" className="dp-route-btn"><Route size={13}/> Get Directions</a>
            <a href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`} target="_blank" rel="noreferrer" className="dp-route-btn secondary"><MapPin size={13}/> View on Google Maps</a>
          </>}
        </>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NEARBY TAB — OpenStreetMap Overpass API via GET (no CORS issues)
// ──────────────────────────────────────────────────────────────────────────────

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const OSM_TAGS = {
  restaurant:         [{k:'amenity',v:'restaurant'},{k:'amenity',v:'fast_food'},{k:'amenity',v:'cafe'},{k:'amenity',v:'food_court'}],
  lodging:            [{k:'tourism',v:'hotel'},{k:'tourism',v:'motel'},{k:'tourism',v:'hostel'},{k:'tourism',v:'guest_house'}],
  cafe:               [{k:'amenity',v:'cafe'},{k:'amenity',v:'coffee_shop'},{k:'amenity',v:'juice_bar'}],
  tourist_attraction: [{k:'tourism',v:'attraction'},{k:'tourism',v:'museum'},{k:'tourism',v:'viewpoint'},{k:'historic',v:'monument'},{k:'tourism',v:'theme_park'}],
  shopping_mall:      [{k:'shop',v:'mall'},{k:'shop',v:'supermarket'},{k:'shop',v:'department_store'},{k:'amenity',v:'marketplace'}],
  bar:                [{k:'amenity',v:'bar'},{k:'amenity',v:'pub'},{k:'amenity',v:'nightclub'}],
  pharmacy:           [{k:'amenity',v:'pharmacy'},{k:'amenity',v:'hospital'},{k:'amenity',v:'clinic'}],
  atm:                [{k:'amenity',v:'atm'},{k:'amenity',v:'bank'}],
};

function buildOverpassQuery(lat, lng, type, radius = 2500) {
  const tags = OSM_TAGS[type] || [{k:'amenity',v:type}];
  const union = tags.map(({k,v}) =>
    `node["${k}"="${v}"](around:${radius},${lat},${lng});`
  ).join('\n');
  return `[out:json][timeout:25];\n(\n${union}\n);\nout 30;`;
}

function parseOverpassResults(elements) {
  return elements
    .map(el => {
      const t = el.tags || {};
      return {
        id: String(el.id),
        name: t.name || t['name:en'] || '',
        address: [t['addr:housenumber'], t['addr:street'], t['addr:city']].filter(Boolean).join(' '),
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || '',
        hours: t.opening_hours || '',
        cuisine: t.cuisine || '',
        stars: t.stars || '',
        lat: el.lat,
        lng: el.lon,
      };
    })
    .filter(p => p.name.trim() !== '');
}

async function fetchNearbyOSM(lat, lng, type) {
  const query = buildOverpassQuery(lat, lng, type);
  const encoded = encodeURIComponent(query);
  let lastErr;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const url = `${mirror}?data=${encoded}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 14000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return parseOverpassResults(json.elements || []);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All mirrors failed');
}


// ──────────────────────────────────────────────────────────────────────────────
// NEARBY TAB

// ── Google Places nearbySearch (used when API key is present) ──────────────
function fetchNearbyGoogle(maps, lat, lng, type) {
  return new Promise((resolve) => {
    try {
      const svc = new maps.places.PlacesService(document.createElement('div'));
      const gpType = GP_TYPE_MAP[type] || type;
      svc.nearbySearch(
        { location: new maps.LatLng(lat, lng), radius: 2000, type: gpType },
        (results, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && results?.length) {
            resolve(results.map(p => ({
              id: p.place_id,
              name: p.name,
              address: p.vicinity || '',
              lat: typeof p.geometry?.location?.lat === 'function'
                ? p.geometry.location.lat() : p.geometry?.location?.lat,
              lng: typeof p.geometry?.location?.lng === 'function'
                ? p.geometry.location.lng() : p.geometry?.location?.lng,
              rating: p.rating,
              ratingCount: p.user_ratings_total,
              placeId: p.place_id,
              isOpen: p.opening_hours?.open_now,
              phone: '',
              website: '',
              hours: '',
            })));
          } else {
            resolve(null); // fall back to OSM
          }
        }
      );
    } catch {
      resolve(null);
    }
  });
}

// Uses Google Places API (nearbySearch) when maps key is present
// Falls back to OpenStreetMap Overpass API otherwise
// ──────────────────────────────────────────────────────────────────────────────

// Google Places type map
const GP_TYPE_MAP = {
  restaurant:         'restaurant',
  lodging:            'lodging',
  cafe:               'cafe',
  tourist_attraction: 'tourist_attraction',
  shopping_mall:      'shopping_mall',
  bar:                'bar',
  pharmacy:           'pharmacy',
  atm:                'bank',
};

function NearbyTab({ lat, lng, name, maps, plSvc }) {
  const [activeType, setActiveType] = useState('restaurant');
  const [places, setPlaces]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [source, setSource]         = useState(''); // 'google' | 'osm'
  const cacheRef = useRef({});

  const load = async (type) => {
    if (!lat || !lng) { setError('no-coords'); return; }
    const key = `${lat},${lng},${type}`;
    if (cacheRef.current[key]) {
      const cached = cacheRef.current[key];
      setPlaces(cached.places);
      setSource(cached.source);
      setError(cached.places.length === 0 ? 'none' : '');
      return;
    }
    setLoading(true); setPlaces([]); setError(''); setSource('');
    try {
      let results = null;
      let usedSource = 'osm';

      // Try Google Places first if maps API is loaded
      if (maps) {
        results = await fetchNearbyGoogle(maps, lat, lng, type);
        if (results !== null) usedSource = 'google';
      }

      // Fall back to Overpass OSM
      if (results === null) {
        results = await fetchNearbyOSM(lat, lng, type);
        usedSource = 'osm';
      }

      cacheRef.current[key] = { places: results, source: usedSource };
      setPlaces(results);
      setSource(usedSource);
      if (results.length === 0) setError('none');
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeType); }, [activeType, lat, lng, maps]);

  const typeInfo = NEARBY_TYPES.find(t => t.type === activeType) || {};
  const gmapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(typeInfo.label || activeType)}/@${lat},${lng},15z`;
  const placeGmapsUrl = (p) => p.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${p.placeId}`
    : p.lat && p.lng
      ? `https://www.google.com/maps?q=${p.lat},${p.lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent((p.name||'') + ' near ' + name)}`;

  return (
    <div className="nearby-tab">
      <div className="nearby-header">
        <div>
          <h4>Nearby Places</h4>
          <p className="nearby-sub">
            Around {name}
            {source === 'google' && <span className="nb-source-badge nb-google">✦ Google</span>}
            {source === 'osm'    && <span className="nb-source-badge nb-osm">OSM</span>}
          </p>
        </div>
        <a className="nb-gmaps-btn" href={gmapsUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={12}/> Open in Maps
        </a>
      </div>

      {/* Category Pills */}
      <div className="nearby-pills">
        {NEARBY_TYPES.map(({ type, label, emoji }) => (
          <button key={type}
            className={`nearby-pill ${activeType === type ? 'active' : ''}`}
            onClick={() => setActiveType(type)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="nearby-loading">
          <Loader size={28} className="spin"/>
          <p>Finding {typeInfo.label?.toLowerCase() || 'places'} near {name}…</p>
          <p className="nearby-loading-sub">{maps ? 'Using Google Places' : 'Querying OpenStreetMap'}</p>
        </div>
      )}

      {/* No coords */}
      {!loading && error === 'no-coords' && (
        <div className="nearby-error-box">
          <div className="neb-icon">📍</div>
          <h5>No location data</h5>
          <p>Coordinates are not available for this location.</p>
        </div>
      )}

      {/* Network error */}
      {!loading && error === 'network' && (
        <div className="nearby-error-box">
          <div className="neb-icon">⚠️</div>
          <h5>Couldn't load nearby places</h5>
          <p>Check your connection or Google Maps API key.</p>
          <div className="neb-actions">
            <button className="nb-retry-btn" onClick={() => { delete cacheRef.current[`${lat},${lng},${activeType}`]; load(activeType); }}>
              <Loader size={12}/> Try Again
            </button>
            <a className="nb-maps-fallback" href={gmapsUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={12}/> Open Google Maps
            </a>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && error === 'none' && (
        <div className="nearby-empty">
          <div style={{ fontSize: 36, marginBottom: 10 }}>{typeInfo.emoji}</div>
          <p>No {typeInfo.label?.toLowerCase()} found nearby.</p>
          <a className="nb-maps-fallback" href={gmapsUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13}/> Search on Google Maps
          </a>
        </div>
      )}

      {/* Results */}
      {!loading && !error && places.length > 0 && (
        <>
          <div className="nearby-count">
            {places.length} {typeInfo.label?.toLowerCase()}{places.length !== 1 ? 's' : ''} found nearby
          </div>
          <div className="nearby-list">
            {places.map((p, i) => (
              <a key={p.id || i} href={placeGmapsUrl(p)} target="_blank" rel="noreferrer"
                className="nearby-item nearby-item-link">
                {/* Photo (Google) or emoji (OSM) */}
                {p.photo
                  ? <img src={p.photo} alt={p.name} className="ni-photo"/>
                  : <div className="ni-emoji-icon">{typeInfo.emoji || '📍'}</div>
                }
                <div className="ni-info">
                  <h5 className="ni-name">{p.name}</h5>
                  {p.address && <div className="ni-addr"><MapPin size={10}/> {p.address}</div>}
                  <div className="ni-badges">
                    {p.rating != null && (
                      <span className="ni-badge ni-rating">
                        ⭐ {p.rating.toFixed(1)}
                        {p.ratingCount && <span className="ni-rc"> ({p.ratingCount.toLocaleString()})</span>}
                      </span>
                    )}
                    {p.openNow != null && (
                      <span className={`ni-badge ${p.openNow ? 'ni-open' : 'ni-closed'}`}>
                        <span className="ni-status-dot"/>
                        {p.openNow ? 'Open' : 'Closed'}
                      </span>
                    )}
                    {p.priceLevel != null && <span className="ni-badge ni-price">{'$'.repeat(p.priceLevel || 1)}</span>}
                    {p.cuisine && <span className="ni-badge">🍴 {p.cuisine.replace(/;/g, ', ')}</span>}
                    {p.hours && !p.openNow && <span className="ni-badge ni-hours"><Clock size={9}/> {p.hours.split(';')[0]}</span>}
                  </div>
                </div>
                <div className="ni-arrow"><ExternalLink size={13}/></div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS_C = {planning:'#3B82F6',active:'#22c55e',completed:'#8B5CF6',cancelled:'#EF4444'};

function CommunityPanel({trips,loading,search,setSearch,filter,setFilter,onRefresh,onSelect,selected,currentUserId}){
  const [localSearch,setLocalSearch]=useState(search);
  const debRef=useRef(null);
  const handleSearch=v=>{
    setLocalSearch(v);
    clearTimeout(debRef.current);
    debRef.current=setTimeout(()=>{setSearch(v);onRefresh();},400);
  };

  const filtered=trips.filter(t=>{
    if(filter==='all')return true;
    return t.status===filter;
  });

  return(
    <div className="comm-panel">
      <div className="comm-header">
        <div>
          <h2>🌍 Community Travel Plans</h2>
          <p>See where other travellers are going — browse their routes, budgets & tips</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}><Search size={14}/> Refresh</button>
      </div>

      <div className="comm-toolbar">
        <div className="comm-search-wrap">
          <Search size={15} className="css-icon"/>
          <input className="comm-search" placeholder="Search by destination, country or trip title..." value={localSearch} onChange={e=>handleSearch(e.target.value)}/>
          {localSearch&&<button className="css-clear" onClick={()=>handleSearch('')}><X size={13}/></button>}
        </div>
        <div className="comm-filters">
          {['all','planning','active','completed'].map(s=>(
            <button key={s} className={`comm-filter-btn ${filter===s?'active':''}`} style={filter===s&&s!=='all'?{background:STATUS_COLORS_C[s],borderColor:STATUS_COLORS_C[s],color:'white'}:{}} onClick={()=>setFilter(s)}>
              {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}
              <span className="cf-count">{s==='all'?trips.length:trips.filter(t=>t.status===s).length}</span>
            </button>
          ))}
        </div>
      </div>

      {loading&&<div className="comm-loading"><Loader size={32} className="spin"/><p>Loading community trips...</p></div>}
      {!loading&&filtered.length===0&&(
        <div className="comm-empty">
          <Users size={48} opacity={0.15}/>
          <h3>No community trips found</h3>
          <p>{localSearch?`No results for "${localSearch}"`:'Other users haven\'t shared trips yet. Be the first!'}</p>
        </div>
      )}
      {!loading&&filtered.length>0&&(
        <div className="comm-grid">
          {filtered.map(t=><CommTripCard key={t._id} trip={t} isSelected={selected?._id===t._id} onSelect={()=>onSelect(selected?._id===t._id?null:t)} currentUserId={currentUserId}/>)}
        </div>
      )}

      {/* Selected trip detail */}
      {selected&&(
        <div className="comm-detail">
          <div className="cd-header">
            <div>
              <h3>{selected.title}</h3>
              <div className="cd-meta"><MapPin size={12}/> {selected.destination}{selected.country?`, ${selected.country}`:''} · <span style={{color:STATUS_COLORS_C[selected.status]}}>{selected.status}</span></div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>onSelect(null)}><X size={14}/></button>
          </div>

          {/* Traveller info */}
          <div className="cd-traveller">
            <div className="cd-traveller-av">{selected.user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="cd-traveller-name">{selected.user?.name}</div>
              <div className="cd-traveller-email">{selected.user?.email}</div>
            </div>
            <span className={`cd-status-badge`} style={{background:STATUS_COLORS_C[selected.status]+'20',color:STATUS_COLORS_C[selected.status],marginLeft:'auto'}}>{selected.status}</span>
          </div>

          <div className="cd-stats">
            <div className="cd-stat"><Calendar size={14}/><div><div className="cds-l">Dates</div><div className="cds-v">{selected.startDate?format(new Date(selected.startDate),'MMM d'):''} – {selected.endDate?format(new Date(selected.endDate),'MMM d, yyyy'):''}</div></div></div>
            {selected.totalBudget>0&&<div className="cd-stat"><DollarSign size={14}/><div><div className="cds-l">Budget</div><div className="cds-v">${selected.totalBudget.toLocaleString()} {selected.currency}</div></div></div>}
            {selected.totalSpent>0&&<div className="cd-stat"><TrendingUp size={14}/><div><div className="cds-l">Spent</div><div className="cds-v">${selected.totalSpent.toLocaleString()}</div></div></div>}
          </div>

          {/* Expense breakdown */}
          {selected.byCategory&&Object.keys(selected.byCategory).length>0&&(
            <div className="cd-expenses">
              <h4>💰 Expense Breakdown</h4>
              {Object.entries(selected.byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt],i)=>(
                <div key={cat} className="cd-exp-row">
                  <span className="cd-exp-cat">{cat}</span>
                  <div className="cd-exp-bar-bg"><div className="cd-exp-bar" style={{width:`${selected.totalSpent?Math.round((amt/selected.totalSpent)*100):0}%`,background:CAT_EXP_COLORS[i%CAT_EXP_COLORS.length]}}/></div>
                  <span className="cd-exp-amt">${amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {selected.description&&<p className="cd-desc">{selected.description}</p>}
          {selected.tags?.length>0&&<div className="cd-tags">{selected.tags.map(t=><span key={t}>#{t}</span>)}</div>}
        </div>
      )}
    </div>
  );
}

function CommTripCard({trip:t,isSelected,onSelect}){
  const days=t.startDate&&t.endDate?Math.ceil((new Date(t.endDate)-new Date(t.startDate))/86400000):null;
  return(
    <div className={`comm-trip-card ${isSelected?'selected':''}`} onClick={onSelect}>
      <div className="ctc-top">
        <div className="ctc-avatar">{t.user?.name?.[0]?.toUpperCase()}</div>
        <div className="ctc-user-info"><div className="ctc-user-name">{t.user?.name}</div><div className="ctc-user-email">{t.user?.email}</div></div>
        <span className="ctc-status" style={{background:STATUS_COLORS_C[t.status]+'20',color:STATUS_COLORS_C[t.status]}}>{t.status}</span>
      </div>
      <div className="ctc-body">
        <h4>{t.title}</h4>
        <div className="ctc-dest"><MapPin size={11}/> {t.destination}{t.country?`, ${t.country}`:''}</div>
        <div className="ctc-meta">
          {t.startDate&&<span><Calendar size={10}/> {format(new Date(t.startDate),'MMM d, yyyy')}</span>}
          {days&&<span>📅 {days} days</span>}
          {t.totalBudget>0&&<span><DollarSign size={10}/> ${t.totalBudget.toLocaleString()}</span>}
        </div>
        {t.totalSpent>0&&t.totalBudget>0&&(
          <div className="ctc-budget-bar">
            <div className="ctc-budget-fill" style={{width:`${Math.min(100,Math.round((t.totalSpent/t.totalBudget)*100))}%`,background:t.totalSpent>t.totalBudget?'#EF4444':'#22c55e'}}/>
          </div>
        )}
        {t.expenseCount>0&&<div className="ctc-expenses">{t.expenseCount} expenses · ${t.totalSpent?.toLocaleString()} spent</div>}
      </div>
      {isSelected&&<div className="ctc-expand-hint">Click to collapse ↑</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

const TRIP_PALETTE = [
  '#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6',
  '#EC4899','#14B8A6','#F97316','#3B82F6','#EF4444',
  '#22c55e','#A855F7','#06b6d4','#84cc16','#f43f5e',
];

const MISC_EMOJI = { tip:'💵', souvenir:'🎁', emergency:'🚨', laundry:'👕', communication:'📱', postage:'📮', parking:'🅿️', toll:'🛣️', fee:'🏷️', donation:'❤️', other:'💼' };
const CAT_EMOJI = {
  accommodation:'🏨', transport:'🚗', food:'🍽️',
  activities:'🎯', shopping:'🛍️', health:'💊', visa:'📄', other:'💸',
};

function fmt$(n) {
  if (!n && n !== 0) return '$0';
  return n >= 1000 ? '$' + (n/1000).toFixed(1) + 'k' : '$' + Math.round(n);
}

// UTC-safe date string from an expense.date value
function getExpDateStr(expDate) {
  if (!expDate) return null;
  const s = typeof expDate === 'string' ? expDate : new Date(expDate).toISOString();
  return s.slice(0, 10); // "2025-03-15" always from the T12:00:00Z stored value
}

function TripCalendar({ trips, month, setMonth, selected, setSelected, navigate, expensesByTrip = {}, miscByTrip = {}, expLoading = false }) {

  const [tripColors, setTripColors]   = useState({});
  const [savingColor, setSavingColor] = useState(null);
  const [pickerOpen, setPickerOpen]   = useState(null);
  const [dayPopup, setDayPopup]       = useState(null);

  useEffect(() => {
    const map = {};
    trips.forEach((t, i) => {
      map[t._id] = (t.color && t.color !== '#0A4D6E') ? t.color : TRIP_PALETTE[i % TRIP_PALETTE.length];
    });
    setTripColors(map);
  }, [trips]);

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('.cal-color-picker-wrap')) setPickerOpen(null);
      if (!e.target.closest('.cal-day-popup') && !e.target.closest('.is-clickable')) setDayPopup(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const getColor = (tripId, idx) => tripColors[tripId] || TRIP_PALETTE[(idx || 0) % TRIP_PALETTE.length];

  const handleColorChange = async (tripId, color) => {
    setTripColors(prev => ({ ...prev, [tripId]: color }));
    setPickerOpen(null);
    setSavingColor(tripId);
    try { await tripsAPI.update(tripId, { color }); } catch {}
    finally { setSavingColor(null); }
  };

  // Calendar grid
  const start = startOfWeek(startOfMonth(month));
  const end   = endOfWeek(endOfMonth(month));
  const days  = [];
  let d = start;
  while (d <= end) { days.push(d); d = addDays(d, 1); }

  const tripsOnDay = (day) => trips.filter(t => {
    if (!t.startDate || !t.endDate) return false;
    try {
      // Compare date strings directly — timezone-safe, fully inclusive
      const dayStr   = format(day, 'yyyy-MM-dd');
      const startStr = t.startDate.slice(0, 10);
      const endStr   = t.endDate.slice(0, 10);
      return dayStr >= startStr && dayStr <= endStr;
    } catch { return false; }
  });

  const expensesOnDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const result = [];
    trips.forEach((t, i) => {
      // Regular expenses
      const tripExps = (expensesByTrip[t._id] || []).filter(e => {
        try { return getExpDateStr(e.date) === dayStr; } catch { return false; }
      });
      // Misc expenses — normalise shape so popup renders same way
      const tripMisc = (miscByTrip[t._id] || [])
        .filter(m => { try { return getExpDateStr(m.date) === dayStr; } catch { return false; } })
        .map(m => ({ ...m, category: m.type || 'other', title: m.title, isMisc: true }));
      const allExps = [...tripExps, ...tripMisc];
      if (allExps.length > 0) {
        const total = allExps.reduce((s, e) => s + (e.amount || 0), 0);
        result.push({ trip: t, color: getColor(t._id, i), expenses: allExps, total });
      }
    });
    return result;
  };

  const handleDayClick = (day, dayTrips) => {
    const dayExps = expensesOnDay(day);
    if (dayTrips.length === 0 && dayExps.length === 0) return;
    setDayPopup({ day, trips: dayTrips, expenses: dayExps });
    if (dayTrips.length > 0) setSelected(dayTrips[0]);
  };

  // Monthly summary
  const getMonthSummary = () => {
    const monthStr = format(month, 'yyyy-MM');
    return trips.map((t, i) => {
      const exps = (expensesByTrip[t._id] || []).filter(e => {
        try { const ds = getExpDateStr(e.date); return ds ? ds.slice(0,7) === monthStr : false; } catch { return false; }
      });
      const miscForMonth = (miscByTrip[t._id] || []).filter(m => {
        try { const ds = getExpDateStr(m.date); return ds ? ds.slice(0,7) === monthStr : false; } catch { return false; }
      });
      const total = [...exps, ...miscForMonth].reduce((s, e) => s + (e.amount || 0), 0);
      return { trip: t, color: getColor(t._id, i), total, count: exps.length };
    }).filter(x => x.total > 0);
  };

  // Weekly totals for right-side panel
  const getWeeklyTotals = () => {
    const weeks = [];
    let weekStart = startOfWeek(startOfMonth(month));
    const monthEnd = endOfMonth(month);
    while (weekStart <= monthEnd) {
      const weekEnd = endOfWeek(weekStart);
      const weekLabel = format(weekStart, 'MMM d') + ' – ' + format(weekEnd, 'MMM d');
      const byTrip = trips.map((t, i) => {
        const exps = (expensesByTrip[t._id] || []).filter(e => {
          try {
            const ds = getExpDateStr(e.date);
            if (!ds) return false;
            const ed = parseISO(ds);
            return ed >= weekStart && ed <= weekEnd;
          } catch { return false; }
        });
        const total = exps.reduce((s, e) => s + (e.amount || 0), 0);
        return { trip: t, color: getColor(t._id, i), total, count: exps.length };
      }).filter(x => x.total > 0);
      const weekTotal = byTrip.reduce((s, x) => s + x.total, 0);
      if (weekTotal > 0 || (weekStart <= new Date() && weekStart >= startOfMonth(month))) {
        weeks.push({ weekStart, weekEnd, weekLabel, byTrip, weekTotal });
      }
      weekStart = addDays(weekEnd, 1);
    }
    return weeks;
  };

  const monthSummary = getMonthSummary();
  const weeklyTotals = getWeeklyTotals();
  const grand = monthSummary.reduce((s, x) => s + x.total, 0);

  return (
    <div className="cal-outer">
      <div className="cal-main-col">

        {/* HEADER */}
        <div className="cal-header">
          <div>
            <h2>📅 Trip Calendar</h2>
            <p>Click a colour dot to change • Click any day for expenses</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/trips/new')}>
            <Plus size={14}/> New Trip
          </button>
        </div>

        {/* LEGEND */}
        {trips.length > 0 && (
          <div className="cal-legend">
            {trips.map((t, i) => {
              const color = getColor(t._id, i);
              const tripTotal = (expensesByTrip[t._id] || []).reduce((s, e) => s + (e.amount || 0), 0);
              return (
                <div key={t._id} className="cal-legend-item">
                  <div className="cal-color-picker-wrap">
                    <button
                      className={'cal-legend-dot-btn' + (savingColor === t._id ? ' saving' : '')}
                      style={{ background: color }}
                      onClick={() => setPickerOpen(pickerOpen === t._id ? null : t._id)}
                      title="Click to change colour"
                    >
                      {savingColor === t._id && <Loader size={8} className="spin" style={{ color: 'white' }}/>}
                    </button>
                    {pickerOpen === t._id && (
                      <div className="cal-color-popup">
                        <div className="ccp-label">Choose colour</div>
                        <div className="ccp-swatches">
                          {TRIP_PALETTE.map(c => (
                            <button key={c}
                              className={'ccp-swatch' + (color === c ? ' selected' : '')}
                              style={{ background: c }}
                              onClick={() => handleColorChange(t._id, c)}
                            />
                          ))}
                        </div>
                        <div className="ccp-custom">
                          <label>Custom:</label>
                          <input type="color" value={color}
                            onChange={e => setTripColors(prev => ({ ...prev, [t._id]: e.target.value }))}
                            onBlur={e => handleColorChange(t._id, e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="cal-legend-text" onClick={() => setSelected(t)}>
                    <span className="cal-legend-name">{t.title}</span>
                    <span className="cal-legend-status" style={{ color: STATUS_COLORS_C[t.status] }}>{t.status}</span>
                  </div>
                  {tripTotal > 0 && (
                    <span className="cal-legend-spent" style={{ background: color + '18', color }}>
                      {fmt$(tripTotal)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* EXPENSE LOADING */}
        {expLoading && (
          <div className="cal-exp-loading">
            <Loader size={14} className="spin"/>
            <span>Loading expenses…</span>
          </div>
        )}

        {/* MONTHLY SUMMARY */}
        {!expLoading && monthSummary.length > 0 && (
          <div className="cal-month-summary">
            <div className="cms-header">
              <span className="cms-label">Spending — {format(month, 'MMMM yyyy')}</span>
              <span className="cms-grand-amt">{fmt$(grand)}</span>
            </div>
            <div className="cms-bar">
              {monthSummary.map(x => (
                <div key={x.trip._id} className="cms-bar-seg"
                  style={{ flex: grand > 0 ? x.total / grand : 1, background: x.color }}
                  title={x.trip.title + ': ' + fmt$(x.total)}
                />
              ))}
            </div>
            <div className="cms-trips">
              {monthSummary.map(x => (
                <div key={x.trip._id} className="cms-trip">
                  <div className="cms-dot" style={{ background: x.color }}/>
                  <span className="cms-name">{x.trip.title}</span>
                  <span className="cms-count">{x.count} expense{x.count !== 1 ? 's' : ''}</span>
                  <span className="cms-amt" style={{ color: x.color }}>{fmt$(x.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MONTH NAV */}
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft size={18}/></button>
          <span className="cal-month-label">{format(month, 'MMMM yyyy')}</span>
          <button className="cal-nav-btn" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18}/></button>
          <button className="cal-today-btn" onClick={() => setMonth(new Date())}>Today</button>
        </div>

        {/* CALENDAR GRID */}
        <div className="cal-grid">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(dow => (
            <div key={dow} className="cal-dow">{dow}</div>
          ))}
          {days.map((day, idx) => {
            const dayTrips = tripsOnDay(day);
            const dayExps  = expensesOnDay(day);
            const dayTotal = dayExps.reduce((s, g) => s + g.total, 0);
            const isToday  = isSameDay(day, new Date());
            const isOther  = !isSameMonth(day, month);
            const isSel    = selected && selected.startDate &&
              isSameDay(day, parseISO(selected.startDate.slice(0, 10)));
            const hasTrips = dayTrips.length > 0;
            const hasExps  = dayExps.length > 0;
            const clickable = (hasTrips || hasExps) && !isOther;
            const cls = ['cal-day',
              isOther  ? 'other-month' : '',
              isToday  ? 'today'        : '',
              hasTrips ? 'has-trips'    : '',
              hasExps  ? 'has-expenses' : '',
              isSel    ? 'selected'     : '',
              clickable ? 'is-clickable': '',
            ].filter(Boolean).join(' ');

            return (
              <div key={idx} className={cls} onClick={() => clickable && handleDayClick(day, dayTrips)}>
                <span className="cal-day-num">{format(day, 'd')}</span>

                {dayTrips.slice(0, 2).map(t => (
                  <div key={t._id} className="cal-trip-chip"
                    style={{ background: getColor(t._id) }}
                    title={t.title}
                  >
                    {t.title.slice(0, 10)}{t.title.length > 10 ? '\u2026' : ''}
                  </div>
                ))}
                {dayTrips.length > 2 && <div className="cal-more">+{dayTrips.length - 2}</div>}

                {hasExps && !isOther && (
                  <div className="cal-exp-dots">
                    <div className="cal-exp-bar-row">
                      {dayExps.map(g => {
                        const pct = dayTotal > 0 ? (g.total / dayTotal) * 100 : 100 / dayExps.length;
                        return (
                          <div key={g.trip._id} className="cal-exp-dot"
                            style={{ background: g.color, flex: pct + ' 0 0' }}
                            title={g.trip.title + ': ' + fmt$(g.total)}
                          />
                        );
                      })}
                    </div>
                    <div className="cal-exp-total">
                      <span className="cal-exp-total-label">{fmt$(dayTotal)}</span>
                      <div className="cal-exp-total-dots">
                        {dayExps.map(g => (
                          <div key={g.trip._id} className="cal-exp-total-dot"
                            style={{ background: g.color }}
                            title={g.trip.title + ': ' + fmt$(g.total)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DAY POPUP */}
        {dayPopup && (
          <div className="cal-day-popup">
            <div className="cdp-header">
              <div>
                <h4>{format(dayPopup.day, 'EEEE, MMMM d yyyy')}</h4>
                <p>
                  {dayPopup.trips.length > 0 && (dayPopup.trips.length + ' trip' + (dayPopup.trips.length !== 1 ? 's' : '') + ' active')}
                  {dayPopup.expenses.length > 0 && ' \u00b7 ' + fmt$(dayPopup.expenses.reduce((s, g) => s + g.total, 0)) + ' total'}
                </p>
              </div>
              <button className="cdp-close" onClick={() => setDayPopup(null)}>
                <X size={16}/>
              </button>
            </div>

            {dayPopup.expenses.length > 0 ? (
              <div className="cdp-expenses">
                <div className="cdp-exp-title">Expenses this day</div>
                {dayPopup.expenses.map(g => (
                  <div key={g.trip._id} className="cdp-trip-block">
                    <div className="cdp-trip-header" style={{ borderLeftColor: g.color }}>
                      <div className="cdp-trip-dot" style={{ background: g.color }}/>
                      <span className="cdp-trip-name">{g.trip.title}</span>
                      <span className="cdp-trip-total" style={{ color: g.color }}>{fmt$(g.total)}</span>
                    </div>
                    <div className="cdp-exp-list">
                      {g.expenses.map(e => (
                        <div key={e._id} className="cdp-exp-row">
                          <div className="cdp-exp-left">
                            {e.receipt ? (
                              <a href={e.receipt} target="_blank" rel="noreferrer"
                                className="cdp-receipt-thumb" title="View receipt">
                                <img src={e.receipt} alt="receipt"/>
                                <span className="cdp-receipt-icon">🧾</span>
                              </a>
                            ) : (
                              <span className="cdp-exp-emoji">{e.isMisc ? (MISC_EMOJI[e.category] || '💼') : (CAT_EMOJI[e.category] || '💸')}</span>
                            )}
                          </div>
                          <div className="cdp-exp-info">
                            <span className="cdp-exp-name">{e.title}</span>
                            <span className="cdp-exp-cat-tag">{e.isMisc ? `💼 misc · ${e.category}` : e.category}</span>
                            {e.notes && <span className="cdp-exp-notes">{e.notes}</span>}
                          </div>
                          <span className="cdp-exp-amt" style={{ color: g.color }}>
                            ${e.amount ? e.amount.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="cdp-exp-bars">
                      {g.expenses.map(e => (
                        <div key={e._id} className="cdp-bar-wrap">
                          <div className="cdp-bar"
                            style={{
                              width: (g.total > 0 ? Math.round((e.amount / g.total) * 100) : 0) + '%',
                              background: g.color,
                            }}
                          />
                          <span className="cdp-bar-label">
                            {e.title ? (e.title.slice(0, 16) + (e.title.length > 16 ? '\u2026' : '')) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cdp-no-exp">No expenses recorded for this day</div>
            )}

            {dayPopup.trips.length > 0 && (
              <div className="cdp-trips">
                <div className="cdp-trips-title">Active trips</div>
                {dayPopup.trips.map(t => (
                  <Link key={t._id} to={'/trips/' + t._id} className="cdp-trip-link"
                    style={{ borderLeftColor: getColor(t._id) }}
                  >
                    <div className="cdp-tl-dot" style={{ background: getColor(t._id) }}/>
                    <div className="cdp-tl-info">
                      <span className="cdp-tl-title">{t.title}</span>
                      <span className="cdp-tl-dest">{t.destination}</span>
                    </div>
                    <ChevronRight size={14} className="cdp-tl-arrow"/>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELECTED TRIP */}
        {selected && !dayPopup && (
          <div className="cal-selected-trip"
            style={{ borderLeftColor: getColor(selected._id) || STATUS_COLORS_C[selected.status] }}
          >
            <div className="cst-header">
              <div className="cst-color-bar" style={{ background: getColor(selected._id) || STATUS_COLORS_C[selected.status] }}/>
              <h3>{selected.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={14}/></button>
            </div>
            <div className="cst-body">
              <div className="cst-row"><MapPin size={13}/> {selected.destination}{selected.country ? ', ' + selected.country : ''}</div>
              <div className="cst-row">
                <Calendar size={13}/>
                {selected.startDate ? format(new Date(selected.startDate), 'MMM d') : ''} {' \u2013 '}
                {selected.endDate ? format(new Date(selected.endDate), 'MMM d, yyyy') : ''}
              </div>
              {selected.totalBudget > 0 && (
                <div className="cst-row"><DollarSign size={13}/> Budget: ${selected.totalBudget.toLocaleString()} {selected.currency}</div>
              )}
              {(expensesByTrip[selected._id] || []).length > 0 && (
                <div className="cst-row" style={{ color: getColor(selected._id) }}>
                  <TrendingUp size={13}/>
                  Spent: {fmt$((expensesByTrip[selected._id] || []).reduce((s, e) => s + e.amount, 0))}
                </div>
              )}
              <span className="cst-status"
                style={{ background: STATUS_COLORS_C[selected.status] + '20', color: STATUS_COLORS_C[selected.status] }}
              >{selected.status}</span>
            </div>
            <Link to={'/trips/' + selected._id} className="btn btn-primary btn-sm"
              style={{ marginTop: 12, display: 'inline-flex', gap: 6 }}
            >
              <Eye size={14}/> View Trip Details
            </Link>
          </div>
        )}

        {trips.length === 0 && (
          <div className="cal-empty">
            <Calendar size={48} opacity={0.15}/>
            <h3>No trips planned yet</h3>
            <p>Create your first trip to see it on the calendar!</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/trips/new')}>
              <Plus size={14}/> Plan a Trip
            </button>
          </div>
        )}
      </div>

      {/* WEEKLY EXPENSES — right side panel */}
      {weeklyTotals.length > 0 && (
        <div className="cal-weekly-panel">
          <div className="cwp-header">
            <h4>Weekly Spending</h4>
            <span className="cwp-month">{format(month, 'MMMM yyyy')}</span>
          </div>
          <div className="cwp-list">
            {weeklyTotals.map((w, i) => (
              <div key={i} className="cwp-week">
                <div className="cwp-week-label">{w.weekLabel}</div>
                {w.weekTotal > 0 ? (
                  <>
                    {/* Total bar */}
                    <div className="cwp-total-row">
                      <span className="cwp-total-amt">{fmt$(w.weekTotal)}</span>
                      <span className="cwp-total-label">total</span>
                    </div>
                    {/* Per-trip breakdown */}
                    <div className="cwp-bar-stack">
                      {w.byTrip.map(x => {
                        const pct = w.weekTotal > 0 ? Math.round((x.total / w.weekTotal) * 100) : 0;
                        return (
                          <div key={x.trip._id} className="cwp-bar-seg"
                            style={{ width: pct + '%', background: x.color }}
                            title={x.trip.title + ': ' + fmt$(x.total) + ' (' + pct + '%)'}
                          />
                        );
                      })}
                    </div>
                    <div className="cwp-trip-rows">
                      {w.byTrip.map(x => (
                        <div key={x.trip._id} className="cwp-trip-row">
                          <div className="cwp-dot" style={{ background: x.color }}/>
                          <span className="cwp-name">{x.trip.title}</span>
                          <span className="cwp-amt" style={{ color: x.color }}>{fmt$(x.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="cwp-zero">No expenses</div>
                )}
              </div>
            ))}
          </div>
          {grand > 0 && (
            <div className="cwp-footer">
              <span>Month total</span>
              <strong>{fmt$(grand)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
