// Comprehensive Thanglish to Tamil Converter
// Real-time conversion as user types

// Common Thanglish to Tamil mappings
const THANGLISH_TAMIL_MAP: Record<string, string> = {
  // Common words
  naan: "நான்",
  neengal: "நீங்கள்",
  neenga: "நீங்கள்",
  ungal: "உங்கள்",
  ungala: "உங்கள்",
  nee: "நீ",
  ung: "உங்க",
  enaku: "எனக்கு",
  yenaku: "எனக்கு",
  epdi: "எப்படி",
  eppadi: "எப்படி",
  enna: "என்ன",
  yenna: "என்ன",
  yen: "என்",
  ya: "யா",
  yaaru: "யாரு",
  yaavaru: "யாவரு",
  yar: "யார்",
  yaarukku: "யாருக்கு",
  enga: "இங்க",
  yenga: "இங்க",
  yenba: "இங்க",

  // Verbs
  varren: "வர்றேன்",
  varuvan: "வருவேன்",
  varuven: "வருவேன்",
  vandu: "வந்து",
  varan: "வரண்",
  varanum: "வரணும்",
  pogum: "போகும்",
  porandhu: "போறந்து",
  poirum: "போயிறும்",
  poirom: "போயிறேன்",
  keten: "கேட்டேன்",
  kekurem: "கேட்கும்",
  kekkuren: "கேட்குறேன்",
  ketkaren: "கேட்கறேன்",
  ketkira: "கேட்கிறேன்",
  seiyyan: "செய்யான்",
  seyyan: "செய்யான்",
  seyyiren: "செய்யிறேன்",
  seyyiran: "செய்யிறேன்",

  // Common phrases
  vanakkam: "வணக்கம்",
  nandri: "நன்ற்றி",
  dhanyavadhal: "நன்ற்றி",
  romba: "ரொம்ப",
  rombha: "ரொம்ப",
  nallaa: "நல்லா",
  nallavum: "நல்லாவும்",
  vali: "வளி",
  vayitu: "வாயிது",
  vayithu: "வாயிது",
  mudiyala: "முடியலா",
  mudiyum: "முடியும்",
  aana: "ஆனா",
  aanalum: "ஆனாலும்",

  // Time
  iniku: "இனிக்கு",
  inikku: "இனிக்கு",
  ippo: "இப்போ",
  inniku: "இன்னிக்கு",
  innikku: "ன்னிக்கு",
  appram: "அப்ரம்",
  apram: "அப்ரம்",
  appuram: "அப்பூரம்",
  mele: "மேலே",
  meelai: "மேலை",
  pochu: "போச்சு",
  poiyaachu: "போயாச்சு",

  // Questions
  yena: "என்ன",
  yenbadhu: "என்பது",
  ethavuthu: "எதவுது",

  // Pronouns and basic words
  avan: "அவன்",
  aval: "அவள்",
  avar: "அவர்",
  ivan: "அவன்",
  ivargal: "�வர்கள்",
  ivarkal: "அவர்கள்",
  adhu: "அது",
  athu: "அது",

  // Common adjectives
  nalla: "நல்லா",
  sema: "சேம",
  chinna: "சின்ன",
  periya: "பெரிய",
  perisa: "பெரிய",

  // Numbers (simplified)
  onnu: "ஒன்னு",
  onru: "ஒன்று",
  moonu: "மூன்று",
  naalu: "நாலு",
  anju: "ஐஞ்சு",
  aaru: "ஆறு",
  yelu: "ஏழு",
  ettu: "எட்டு",
  pathu: "பத்து",

  // Common connectors
  aanaalum: "ஆனாலும்",
  analum: "ஆனாலும்",
  aanal: "ஆனாள்",
  but: "ஆனாள்",

  // More common words
  undan: "உன்டன்",
  udan: "உடன்",
  ponn: "பொன்ன்",
  singam: "சிங்கம்",
  puli: "புலி",

  // Relationship terms
  appan: "அப்பன்",
  thaatha: "தாத்தா",
  paati: "பாட்டி",
  chithappa: "சித்தப்பா",
  chithi: "சித்தி",

  // Food and common items
  saapadu: "சாப்பாடு",
  theeni: "தேயனி",
  neer: "நீர்",
  theer: "தேர்",

  // Action words
  paar: "பார்",
  paaru: "பாறு",
  paarunga: "பாருங்கள்",
  paaren: "பாறேன்",
  paartheenga: "பாற்றேங்கள்",

  // Location/direction
  ange: "அங்கே",
  veetukku: "வீட்டுக்கு",

  // Quality descriptors
  azhagu: "அழகு",

  // Emotions
  kaasu: "காசு",
  kashtam: "கஷ்டம்",
  sowkiyam: "சோகியம்",

  // Basic verbs
  senju: "செஞ்சு",
  pesuvom: "பேசுவோம்",
  pesuvaanga: "பேசுவங்கள்",
  pesuvanga: "பேசுவங்கள்",

  // Question words
  yenaa: "ஏனா",

  // Negation
  illa: "இல்ல",
  ille: "இல்லே",

  // Future tense markers
  poren: "போறேன்",
  varum: "வரும்",
  vaanum: "வாரும்",

  // Past tense markers
  poiten: "போயினேன்",
  poyiten: "போயினேன்",
  vitten: "விட்டேன்",

  // Present tense markers
  irukken: "இருக்கேன்",
  irukku: "இருக்கு",
  vanda: "வந்தா",

  // Common patterns
  ennoda: "என்னோட",
  ungaloda: "உங்களோட",
  yaaroda: "யாரோடா",
  yaaruda: "யாரோடா",
  ennaDa: "என்னடா",

  // More everyday words
  paithiyam: "பைத்தியம்",
  veedu: "வீடு",
  kulirndhal: "குலிரந்தல்",

  // Work/Study
  velai: "வேலை",
  paadam: "பாடம்",
  padikalam: "படிகளம்",

  // Time related
  neram: "நேரம்",
  kaalam: "காலம்",

  // Social
  nanban: "நண்பன்",
  thozhan: "தோழன்",
  thozhar: "தோழர்",
  kuzhandaiyam: "குழந்தையம்",

  // Common phrases
  eppo: "எப்போ",
  yepo: "ஏப்போ",
  ipo: "இப்போ",

  // Question words extended
  yenakku: "எனக்கு",

  // Numbers extended
  oru: "ஒரு",
  rendu: "ரண்டு",
  moondru: "மூன்று",
  naangu: "நான்கு",
  onbadu: "ஒன்று",

  // Family relations
  thambi: "தம்பி",
  thangai: "தங்கை",
  akka: "அக்கா",
  annan: "அண்ணன்",

  // Food
  thayir: "தயிர்",
  curd: "தயிர்",
  milk: "பால்",
  paal: "பால்",
  water: "தண்ணீர்",
  thanni: "தண்ணீர்",
  rice: "அரிசி",
  chor: "அரிசி",
  chicken: "சிக்கன்",
  mutton: "மட்டன்",
  fish: "மீன்",
  meen: "மீன்",
  egg: "முட்டை",
  muttai: "முட்டை",
  sambar: "சாம்பார்",
  rasam: "ரசம்",
  kuzhambu: "குழம்பு",
  thayir_sadam: "தயிர் சாதம்",
  tea: "தேநீர்",
  coffee: "காபி",

  // Common verbs
  panen: "பண்றேன்",
  pananum: "பண்ணணும்",
  panan: "பண்ணண்",
  mudiyathu: "முடியல",
  podum: "போடும்",
  potten: "போட்டேன்",
  vaikiran: "வைக்கிறான்",
  vaanga: "வாங்க",
  ponga: "போங்க",
  vanthurunga: "வந்துருங்க",
  kelu: "கேளு",
  kettu: "கேட்டு",

  // Questions and responses
  ennaDi: "என்னடி",
  ennaSonna: "என்ன சொன்ன",
  yaen: "ஏன்",
  yaenDa: "ஏன்டா",
  yaenDi: "ஏன்டி",
  aama: "ஆமாம்",
  aam: "ஆம்",
  appadi: "அப்படி",
  illai: "இல்ல",
  sari: "சரி",
  correct: "சரி",
  correctThaan: "சரித்தான்",

  // Time and date
  naalaiku: "நாளைக்கு",
  nethi: "நேதி",
  ethukum: "எதுக்கும்",
  yethukum: "எதுக்கும்",
  neram_aagu: "நேரம் ஆகு",
  mani: "மணி",
  "o'clock": "மணிக்கு",
  morning: "காலை",
  kaalai: "காலை",
  evening: "மாலை",
  malai: "மாலை",
  night: "ராத்தி",
  raathiri: "ராத்தி",
  today: "இன்று",
  yesterday: "நேற்று",
  tomorrow: "நாளை",

  // Places and directions
  veetule: "வீட்டுலே",
  office: "ஆபீஸ்",
  office_ku: "ஆபீஸ்கு",
  school: "ஸ்கூல்",
  college: "காலேஜ்",
  hospital: "ஆஸ்பட்டல்",
  hospital_ku: "ஆஸ்பட்டல்கு",
  market: "மார்க்கெட்",
  anga: "அங்க",
  inga: "இங்க",
  eenga: "எங்க",
  veliye: "வெளிய",
  ullae: "உள்ளால",
  theepae: "தீபால",
  left: "இடது",
  right: "வலது",
  straight: "நேராக",
  mela: "மேல",
  keela: "கீழ",

  // People and relationships
  mama: "மாமா",
  periappa: "பெரியப்பா",
  athai: "அத்தை",
  periyamma: "பெரியம்மா",
  mamiyar: "மாமியார்",
  maapilai: "மாப்பிள்ளை",
  ponnu: "பொண்ணு",
  payyan: "பயன்",
  pasanga: "பசங்க",
  ponunga: "பொண்ணுங்க",
  friend: "நண்பன்",
  thozhi: "தோழி",
  neighbours: "அயலார்",

  // Common expressions
  ennaPesa: "என்ன பேச",
  neengaSonne: "நீங்க சொன்ன",
  naanSollraen: "நான் சொல்லறேன்",
  puriyala: "புரியல",
  puriyudhu: "புரியுது",
  therila: "தெரியல",
  theriyum: "தெரியும்",
  thevaiya: "தேவையா",
  thevai_illai: "தேவை இல்ல",
  kashta_padra: "கஷ்டப்படுறா",
  busy_a: "பிஸியா",
  tenshana: "டென்ஷனா",
  hogaya: "ஓகே",
  okay: "ஓகே",
  coming: "வர்றேன்",
  varraen: "வர்றேன்",
  poitaen: "போயிட்டேன்",
  vanjuten: "வந்துட்டேன்",

  // English to Tamil common words
  "hello": "வணக்கம்",
  "hi": "வணக்கம்",
  "bye": "விடை",
  "thank you": "நன்றி",
  "thanks": "நன்றி",
  "welcome": "வரவேற்கிறேன்",
  "sorry": "மன்னிக்கவும்",
  "please": "தயவு செய்து",
  "good": "நல்ல",
  "bad": "கெட்ட",
  "yes": "ஆம்",
  "no": "இல்ல",
  "day": "நாள்",
  "food": "உணவு",
  "home": "வீடு",
  "car": "கார்",
  "bike": "மோட்டார் சைக்கிள்",
  "bus": "பஸ்",
  "train": "ரயில்",
  "phone": "தொலைபேசி",
  "mobile": "மொபைல்",
  "computer": "கணினி",
  "laptop": "லேப்டாப்",
  "book": "புத்தகம்",
  "pen": "பேனா",
  "money": "பணம்",
  "help": "உதவி",
  "love": "காதல்",
  "happy": "மகிழ்ச்சி",
  "sad": "சோகம்",
  "angry": "கோபம்",
  "family": "குடும்பம்",
  "work": "வேலை",
  "study": "படிப்பு",
  "doctor": "மருத்துவர்",
  "teacher": "ஆசிரியர்",
  "student": "மாணவர்",
  "father": "தந்தை",
  "mother": "தாய்",
  "brother": "சகோதரர்",
  "sister": "சகோதரி",
  "time": "நேரம்",
  "clock": "கடிகாரம்",
  "table": "மேசை",
  "chair": "நாற்காலி",
  "door": "கதவு",
  "window": "சாளரம்",
  "room": "அறை",
  "garden": "தோட்டம்",
  "road": "சாலை",
  "city": "நகரம்",
  "village": "கிராமம்",
  "country": "நாடு",
  "india": "இந்தியா",
  "tamil": "தமிழ்",
  "english": "ஆங்கிலம்",
  "language": "மொழி",
  "movie": "திரைப்படம்",
  "song": "பாடல்",
  "music": "இசை",
  "dance": "நடனம்",
  "game": "விளையாட்டு",
  "play": "விளையாடு",
  "win": "வெல்",
  "lose": "தோல்வி",
  "price": "விலை",
  "cost": "செலவு",
  "buy": "வாங்கு",
  "sell": "விற்கும்",
  "shop": "கடை",
  "curry": "கறி",
  "breakfast": "காலை உணவு",
  "lunch": "மத்திய உணவு",
  "dinner": "இரவு உணவு",
}

// English to Tamil mapping
const ENGLISH_TAMIL_MAP: Record<string, string> = {
  "what": "என்ன",
  "where": "எங்கே",
  "when": "எப்போது",
  "why": "ஏன்",
  "how": "எப்படி",
  "who": "யார்",
  "which": "எது",
  "this": "இது",
  "that": "அது",
  "here": "இங்கே",
  "there": "அங்கே",
  "now": "இப்போது",
  "then": "அப்போது",
  "always": "எப்போதும்",
  "never": "ஒருபோதும் இல்லை",
  "sometimes": "சில சமயம்",
  "only": "மட்டும்",
  "also": "மட்டும்",
  "all": "அனைத்து",
  "some": "சில",
  "any": "எதேனும்",
  "more": "அதிக",
  "less": "குறைவு",
  "very": "மிகவும்",
  "much": "அதிக",
  "many": "பல",
  "few": "சில",
  "first": "முதல்",
  "last": "கடைசி",
  "next": "அடுத்த",
  "before": "முன்பு",
  "after": "பிறகு",
  "up": "மேலே",
  "down": "கீழே",
  "in": "உள்ளே",
  "out": "வெளியே",
  "with": "உடன்",
  "without": "இல்லாமல்",
  "for": "காக",
  "from": "இருந்து",
  "to": "வரை",
  "about": "பற்றி",
  "over": "மேல்",
  "under": "கீழ்",
  "between": "இடையே",
  "among": "மத்தியில்",
  "during": "போது",
  "since": "இருந்து",
  "until": "வரை",
  "while": "மட்டும்",
  "can": "முடியும்",
  "cannot": "முடியாது",
  "must": "வேண்டும்",
  "should": "வேண்டும்",
  "would": "ஆகும்",
  "could": "முடியும்",
  "will": "செய்வேன்",
  "may": "முடியும்",
  "might": "முடியும்",
  "have": "உள்ளது",
  "has": "உள்ளது",
  "had": "இருந்தது",
  "do": "செய்",
  "does": "செய்கிறது",
  "did": "செய்தது",
  "go": "போ",
  "goes": "போகிறது",
  "went": "போனாய்",
  "gone": "போய்விட்டாய்",
  "come": "வா",
  "comes": "வருகிறது",
  "came": "வந்தாய்",
  "see": "பார்",
  "sees": "பார்க்கிறது",
  "saw": "பார்த்தாய்",
  "seen": "பார்த்தாய்",
  "take": "எடு",
  "takes": "எடுக்கிறது",
  "took": "எடுத்தாய்",
  "taken": "எடுத்தாய்",
  "give": "கொடு",
  "gives": "கொடுக்கிறது",
  "gave": "கொடுத்தாய்",
  "given": "கொடுத்தாய்",
  "make": "செய்",
  "makes": "செய்கிறது",
  "made": "செய்தாய்",
  "know": "தெரி",
  "knows": "தெரியும்",
  "knew": "தெரிந்தாய்",
  "known": "தெரிந்தாய்",
  "think": "நினை",
  "thinks": "நினைக்கிறாய்",
  "thought": "நினைத்தாய்",
  "say": "சொல்",
  "says": "சொல்கிறாய்",
  "said": "சொன்னாய்",
  "tell": "சொல்",
  "tells": "சொல்கிறாய்",
  "told": "சொன்னாய்",
  "ask": "கேள்",
  "asks": "கேட்கிறாய்",
  "asked": "கேட்டாய்",
  "works": "வேலை செய்கிறாய்",
  "worked": "வேலை செய்தாய்",
  "plays": "விளையாடுகிறாய்",
  "played": "விளையாடினாய்",
  "live": "வாழ்",
  "lives": "வாழ்கிறாய்",
  "lived": "வாழ்ந்தாய்",
  "eat": "சாப்பிடு",
  "eats": "சாப்பிடுகிறாய்",
  "ate": "சாப்பிட்டாய்",
  "drink": "குடி",
  "drinks": "குடிக்கிறாய்",
  "drank": "குடித்தாய்",
  "sleep": "தூங்கு",
  "sleeps": "தூங்குகிறாய்",
  "slept": "தூங்கினாய்",
  "read": "படி",
  "reads": "படிக்கிறாய்",
  "reading": "படிக்கிறாய்",
  "write": "எழுது",
  "writes": "எழுதுகிறாய்",
  "wrote": "எழுதினாய்",
  "sit": "அமர்",
  "sits": "அமர்கிறாய்",
  "sat": "அமர்ந்தாய்",
  "stand": "நில்",
  "stands": "நிற்கிறாய்",
  "stood": "நின்றாய்",
  "speak": "பேசு",
  "speaks": "பேசுகிறாய்",
  "spoke": "பேசினாய்",
  "open": "திற",
  "opens": "திறக்கிறாய்",
  "opened": "திறந்தாய்",
  "close": "மூடு",
  "closes": "மூடுகிறாய்",
  "closed": "மூடினாய்",
  "start": "தொடங்கு",
  "starts": "தொடங்குகிறாய்",
  "started": "தொடங்கினாய்",
  "stop": "நிறுத்து",
  "stops": "நிறுத்துகிறாய்",
  "stopped": "நிறுத்தினாய்",
  "turn": "திரும்பு",
  "turns": "திரும்புகிறாய்",
  "turned": "திரும்பினாய்",
  "call": "அழை",
  "calls": "அழைக்கிறாய்",
  "called": "அழைத்தாய்",
  "helps": "உதவுகிறாய்",
  "helped": "உதவினாய்",
  "try": "முயற்சி",
  "tries": "முயற்சி செய்கிறாய்",
  "tried": "முயற்சி செய்தாய்",
  "need": "தேவை",
  "needs": "தேவைப்படுகிறது",
  "needed": "தேவைப்பட்டது",
  "want": "வேண்டும்",
  "wants": "வேண்டும்",
  "wanted": "வேண்டினாய்",
  "like": "பிடிக்கும்",
  "likes": "பிடிக்கும்",
  "liked": "பிடித்தாய்",
  "loves": "காதலிக்கிறாய்",
  "loved": "காதலித்தாய்",
  "hate": "வெறுக்கிறேன்",
  "hates": "வெறுக்கிறாய்",
  "hated": "வெறுத்தாய்",
  "feel": "உணர்",
  "feels": "உணர்கிறாய்",
  "felt": "உணர்ந்தாய்",
  "seem": "தெரிகிறது",
  "seems": "தெரிகிறது",
  "seemed": "தெரிந்தது",
  "look": "பார்",
  "looks": "பார்க்கிறாய்",
  "looked": "பார்த்தாய்",
  "sound": "ஒலி",
  "sounds": "ஒலிக்கிறது",
  "taste": "ருசி",
  "tastes": "ருசிக்கிறது",
  "smell": "மணம்",
  "smells": "மணக்கிறது",
  "grow": "வளர்",
  "grows": "வளர்கிறது",
  "grew": "வளர்ந்தது",
  "change": "மாற்று",
  "changes": "மாற்றுகிறாய்",
  "changed": "மாற்றினாய்",
  "move": "நகர்",
  "moves": "நகர்கிறாய்",
  "moved": "நகர்ந்தாய்",
  "believe": "நம்பு",
  "believes": "நம்புகிறாய்",
  "believed": "நம்பினாய்",
  "remember": "நினை",
  "remembers": "நினைக்கிறாய்",
  "remembered": "நினைத்தாய்",
  "forget": "மறக்கு",
  "forgets": "மறக்கிறாய்",
  "forgot": "மறந்தாய்",
  "hope": "நம்பிக்கை",
  "hopes": "நம்புகிறாய்",
  "worry": "கவலை",
  "worries": "கவலைப்படுகிறாய்",
  "worried": "கவலைப்பட்டாய்",
  "care": "கவனி",
  "cares": "கவனிக்கிறாய்",
  "cared": "கவனித்தாய்",
  "afraid": "பயந்தாய்",
  "tired": "களைத்துப் போனாய்",
  "bored": "முட்டாளாக இருக்கிறாய்",
  "excited": "உற்சாகமாக இருக்கிறாய்",
  "interested": "ஆர்வமாக இருக்கிறாய்",
  "surprised": "ஆச்சரியப்பட்டாய்",
  "new": "புதிய",
  "old": "பழைய",
  "young": "இளம்",
  "big": "பெரிய",
  "small": "சிறிய",
  "large": "பெரிய",
  "little": "சிறிய",
  "long": "நீளமான",
  "short": "குறுகிய",
  "high": "உயரமான",
  "low": "தாழ்ந்த",
  "hot": "சூடான",
  "cold": "குளிர்ந்த",
  "warm": "சூடான",
  "cool": "குளிர்ந்த",
  "sweet": "இனிப்பான",
  "sour": "புளிப்பான",
  "salty": "உவர்ப்பான",
  "bitter": "கசப்பான",
  "easy": "எளிதான",
  "difficult": "கடினமான",
  "hard": "கடினமான",
  "soft": "மென்மையான",
  "heavy": "கனமான",
  "light": "இலகுவான",
  "bright": "பிரகாசமான",
  "dark": "இருண்ட",
  "clean": "சுத்தமான",
  "dirty": "அழுக்கான",
  "beautiful": "அழகான",
  "ugly": "அழகற்ற",
  "wrong": "தவறான",
  "true": "உண்மையான",
  "false": "பொய்யான",
  "important": "முக்கியமான",
  "interesting": "ஆர்வமான",
  "expensive": "விலையுயர்ந்த",
  "cheap": "விலை மலிந்த",
  "fast": "வேகமான",
  "slow": "மெதுவான",
  "quick": "வேகமான",
  "early": "முற்பகல்",
  "late": "தாமதமான",
  "best": "சிறந்த",
  "worst": "மோசமான",
  "final": "இறுதி",
  "great": "சிறந்த",
  "nice": "நல்ல",
  "fine": "நல்ல",
  "sure": "உறுதியான",
  "clear": "தெளிவான",
  "possible": "சாத்தியமான",
  "impossible": "சாத்தியமற்ற",
  "different": "வேறுபட்ட",
  "same": "ஒரே",
  "real": "உண்மையான",
  "modern": "நவீன",
  "ancient": "பண்டைய",
  "public": "பொது",
  "private": "தனிப்பட்ட",
  "common": "பொதுவான",
  "special": "சிறப்பான",
  "personal": "தனிப்பட்ட",
  "general": "பொதுவான",
  "social": "சமூக",
  "natural": "இயற்கை",
  "human": "மனித",
  "digital": "டிஜிட்டல்",
  "international": "சர்வதேச",
  "national": "தேசிய",
  "local": "உள்ளூர்",
  "global": "உலகளாவிய",
  "online": "ஆன்லைன்",
  "free": "இலவச",
  "paid": "கட்டண",
  "available": "கிடைக்கின்ற",
  "ready": "தயாராக இருக்கிறாய்",
  "busy": "பிஸியாக இருக்கிறாய்",
  "full": "நிரம்பிய",
  "empty": "காலியான",
  "enough": "போதுமான",
  "too": "மிகவும்",
  "almost": "கிட்டத்தட்ட",
  "completely": "முற்றிலும்",
  "really": "உண்மையில்",
  "actually": "உண்மையில்",
  "simply": "எளிமையாக",
  "especially": "குறிப்பாக",
  "usually": "பொதுவாக",
  "often": "அடிக்கடி",
  "again": "மீண்டும்",
  "once": "ஒருமுறை",
  "twice": "இருமுறை",
  "everywhere": "எங்கும்",
  "somewhere": "எங்கோ",
  "anywhere": "எங்கும்",
  "inside": "உள்ளே",
  "outside": "வெளியே",
  "together": "ஒன்றாக",
  "alone": "தனியாக",
  "near": "அருகில்",
  "far": "தொலைவில்",
  "away": "வெகு தொலைவில்",
  "back": "பின்",
  "forward": "முன்",
  "north": "வடக்கு",
  "south": "தெற்கு",
  "east": "கிழக்கு",
  "west": "மேற்கு",
}

// Tamil text patterns for better conversion
const TAMIL_PATTERNS = [
  { pattern: /ku$/g, replacement: "க்கு" },
  { pattern: /kku$/g, replacement: "க்கு" },
  { pattern: /le$/g, replacement: "லே" },
  { pattern: /lai$/g, replacement: "லை" },
  { pattern: /ai$/g, replacement: "ஐ" },
  { pattern: /aal$/g, replacement: "ஆள்" },
  { pattern: /an$/g, replacement: "ன்" },
  { pattern: /um$/g, replacement: "ம்" },
  { pattern: /aaga$/g, replacement: "ஆக" },
]

// Debounce function for real-time conversion
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Main converter class
export class RealTimeConverter {
  private cache: Map<string, string> = new Map()
  private debounceTime: number = 300 // 300ms delay

  constructor(debounceTime: number = 300) {
    this.debounceTime = debounceTime
  }

  // Check if text is Thanglish (mixed Tamil-English script)
  private isThanglish(text: string): boolean {
    const thanglishPatterns = [
      /\b(na?an|nee?|unga|yenga|epdi|enna|yen|yaar|vanakkam|nandri)\b/i,
      /\b(ponen|varen|poran|kitten|senju|panen|iruken|irukku)\b/i,
      /\b(appa|amma|thambi|thangai|chithappa|chithi|mama|athai)\b/i,
      /\b(sapadu|kapi|tea|coffee|bus|car|bike|phone|mobile)\b/i,
    ]

    return thanglishPatterns.some(pattern => pattern.test(text))
  }

  // Check if text is primarily English
  private isEnglish(text: string): boolean {
    const englishWords = text.toLowerCase().match(/\b[a-z]+\b/g)
    if (!englishWords) return false

    const commonEnglishWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
      'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]

    const englishRatio = englishWords.filter(word =>
      commonEnglishWords.includes(word) || word.length > 4
    ).length / englishWords.length

    return englishRatio > 0.6
  }

  // Convert Thanglish to Tamil
  private convertThanglishToTamil(text: string): string {
    const words = text.toLowerCase().split(/\s+/)
    const convertedWords = words.map(word => {
      // Remove punctuation for lookup, add back later
      const cleanWord = word.replace(/[.,!?;:]/g, '')
      const punctuation = word.match(/[.,!?;:]/g)?.[0] || ''

      // Direct mapping lookup
      if (THANGLISH_TAMIL_MAP[cleanWord]) {
        return THANGLISH_TAMIL_MAP[cleanWord] + punctuation
      }

      // Partial matching for words with common variations
      for (const [key, value] of Object.entries(THANGLISH_TAMIL_MAP)) {
        if (cleanWord.includes(key) || key.includes(cleanWord)) {
          return value + punctuation
        }
      }

      // Apply Tamil patterns
      let result = cleanWord
      TAMIL_PATTERNS.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, replacement)
      })

      return result + punctuation
    })

    return convertedWords.join(' ')
  }

  // Convert English to Tamil
  private convertEnglishToTamil(text: string): string {
    const words = text.toLowerCase().split(/\s+/)
    const convertedWords = words.map(word => {
      // Remove punctuation for lookup, add back later
      const cleanWord = word.replace(/[.,!?;:]/g, '')
      const punctuation = word.match(/[.,!?;:]/g)?.[0] || ''

      // Direct mapping lookup
      if (ENGLISH_TAMIL_MAP[cleanWord]) {
        return ENGLISH_TAMIL_MAP[cleanWord] + punctuation
      }

      return cleanWord + punctuation
    })

    return convertedWords.join(' ')
  }

  // Main conversion function
  public convert(text: string): string {
    if (!text || text.trim().length === 0) {
      return text
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim()
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    let result = text

    try {
      // Detect language type and convert accordingly
      if (this.isThanglish(text)) {
        result = this.convertThanglishToTamil(text)
      } else if (this.isEnglish(text)) {
        result = this.convertEnglishToTamil(text)
      }

      // Cache the result
      this.cache.set(cacheKey, result)

      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
          this.cache.delete(firstKey)
        }
      }
    } catch (error) {
      console.error('Conversion error:', error)
      result = text // Return original text on error
    }

    return result
  }

  // Create debounced converter
  public createDebouncedConverter(callback: (original: string, converted: string) => void) {
    return debounce((text: string) => {
      const converted = this.convert(text)
      if (converted !== text) {
        callback(text, converted)
      }
    }, this.debounceTime)
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear()
  }

  // Get conversion statistics
  public getStats(): { cacheSize: number; patterns: number; thanglishWords: number; englishWords: number } {
    return {
      cacheSize: this.cache.size,
      patterns: TAMIL_PATTERNS.length,
      thanglishWords: Object.keys(THANGLISH_TAMIL_MAP).length,
      englishWords: Object.keys(ENGLISH_TAMIL_MAP).length
    }
  }
}

// Global converter instance
export const thanglishConverter = new RealTimeConverter()

// Utility function for quick conversion
export function convertText(text: string): string {
  return thanglishConverter.convert(text)
}
