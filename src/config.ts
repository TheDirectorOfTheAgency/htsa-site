/** Q sets this to E.164, e.g. "+16125551212". null renders "Number coming soon". */
export const PHONE_E164: string | null = null;

export const SKOOL_URL =
  "https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311";

export const SKOOL_CTA = "ENTER THE SKOOL FOYER";

/** The repo has no separate calendar URL. Booking CTAs use the existing Skool door. */
export const BOOKING_URL = SKOOL_URL;

export const BOOKING_CTA = "Book a call with Marshall";

export const PROOF = [
  { figure: "$6,458.10", label: "Best day, 2025-09-23" },
  { figure: "$59,632.98", label: "Best month, 2024-12" },
  { figure: "$512,022.13", label: "Best year, 2024" },
] as const;

// Mr. Wayne's sales video (Vimeo "High Ticket Home Service Academy", 22 min). Empty string shows the placeholder slot.
export const HERO_VIMEO_ID = "806355796";

/** BrightLocal heat map screenshots. Drop PNGs in public/heatmaps/ and set src (e.g. "/heatmaps/tv-mounting.png"). Empty src shows a placeholder frame. */
export const HEATMAPS: { keyword: string; caption: string; src: string }[] = [
  { keyword: "TV mounting service Minneapolis", caption: "#1 at all 81 grid points", src: "/heatmaps/tv-mounting-minneapolis.webp" },
  { keyword: "Corporate TV mounting", caption: "#1 at all 81 grid points", src: "/heatmaps/corporate-tv-mounting.webp" },
  { keyword: "Samsung Frame installation", caption: "#1 at all 81 grid points", src: "/heatmaps/samsung-frame-installation.webp" },
  { keyword: "Mantel mount installation", caption: "#1 at all 81 grid points", src: "/heatmaps/mantel-mount-installation.webp" },
  { keyword: "TV mounting service", caption: "#1 across the core metro, 29 of 81 grid points", src: "/heatmaps/tv-mounting.webp" },
  { keyword: "TV mounting service near me", caption: "#1 across the core metro. Orange spots are zip codes we don't chase.", src: "/heatmaps/tv-mounting-near-me.webp" },
];
