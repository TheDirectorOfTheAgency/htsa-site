export interface CurriculumModule {
  number: number;
  title: string;
  summary: string;
  lessons: string[];
}

export interface CurriculumTrack {
  title: string;
  lessons: string[];
}

/** Tracks that sit above the six core modules. */
export const BEFORE_MODULES: CurriculumTrack[] = [
  {
    title: "Intro",
    lessons: [
      "Welcome!",
      "How The Mounting Man Runs (Owner-Operator Model)",
      "My Origin Story (How I Got Here)",
      "High Ticket (Premium Priced) Positioning",
      "AI vs. The Trades: The Battle for the Future",
    ],
  },
  {
    title: "Beginners track",
    lessons: [
      "For Beginners",
      "Low Barrier to Entry Services",
      "Tools I Use",
      "Basic Questions When Booking A Job",
      "Basic On-Site Practices",
      "Task Rabbit",
      "Angi's List (Angi)",
    ],
  },
];

export const CURRICULUM: CurriculumModule[] = [
  {
    number: 1,
    title: "Positioning (James Bond or Average Joe)",
    summary:
      "Pricing and positioning pull the craft out of the cheap-job pile: choose the luxury icon or the relatable pro you can actually be, wrap the work you already do so people buy the story, and keep every touchpoint consistent so the price matches the person they hired.",
    lessons: [
      "Why Luxury Positioning Matters",
      "Archetypes: Luxury Icon vs. Relatable Pro",
      "Building the Persona",
      "Wrapping Services in Luxury Packaging",
      "Visual & Verbal Consistency",
      "Implementation",
    ],
  },
  {
    number: 2,
    title: "Google My Business Domination",
    summary:
      "SEO for a local trade lives in the map pack: a real brand name, a profile pointed at the work that pays, reviews that name the job, and posts that work like a billboard, so the right customer finds you before they scroll.",
    lessons: [
      "The Mission: Why GMB Rules Local Search",
      "Core Setup",
      "Profile Optimization",
      "Reviews That Sell",
      "Posting: Turning GMB Into a Billboard",
      "Tracking & Scaling",
      "Advanced Tactics: The Secret Weapons",
    ],
  },
  {
    number: 3,
    title: "Core 30 (High Level SEO Strategy)",
    summary:
      "SEO keeps that map pack backed by a real site: the Core 30 gives every service and city you claim its own page, written for a buyer, linked together, cited around the web, and filled with photos from the job.",
    lessons: [
      "What is the Core 30?",
      "Why the Core 30 Works",
      "The Core 30 Site Map Blueprint",
      "Copywriting Formula for Each Page",
      "Internal Linking Strategy",
      "Backlinks & Citations",
      "Visual Authority with Photos & Media",
      "Tracking & Iteration",
    ],
  },
  {
    number: 4,
    title: "Paid Traffic Foundations",
    summary:
      "Ads are the faucet you can open this week while search compounds: Google for people already looking, campaigns matched to how they search, retargeting and Facebook so you feel local, and the math to know when a campaign is worth turning up.",
    lessons: [
      "Why Paid Traffic Matters",
      "Google Ads as Your Core Engine",
      "Example Campaign Breakdowns",
      "Retargeting Foundations",
      "Omnipresence: Becoming the Local Celebrity",
      "Omnipresence: Expanding to Facebook/Instagram",
      "Paid Traffic ROI Math",
      "Next Steps and Scaling",
    ],
  },
  {
    number: 5,
    title: "Retargeting & Omnipresence",
    summary:
      "Ads stay with the people who already looked: follow them on Google, YouTube, and Facebook with simple creative and a modest budget until your trade feels like the only name in town.",
    lessons: [
      "Why Retargeting is the Secret Sauce",
      "The Retargeting Platforms You Need",
      "Creative That Converts in Retargeting",
      "The Omnipresence Effect",
      "Setting Budgets & Scaling Smart",
      "Real-World Examples & Templates",
    ],
  },
  {
    number: 6,
    title: "Conversion & Sales Systems",
    summary:
      "The close, the systems, and the AI bots are what keep you on the tools: answer first, let the script and the proof do the selling, hand the office follow-up to a bot, and tie the profit math together so the work still pays when you are on a job.",
    lessons: [
      "The Psychology of the Close",
      "The High-Ticket Call Script",
      "Speed-to-Lead: The Golden Rule",
      "Sales Assets That Sell For You",
      "Upsell & Ascension Strategy",
      "Systematizing Sales",
      "Profit Math: Tying It Together",
    ],
  },
];
