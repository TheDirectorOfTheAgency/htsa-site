#!/usr/bin/env python3
# Builds dist/six-week/index.html for hightickethomeservices.com.
# GO-LIVE: change ONLY the next line to the Skool $1,997 Buy-now URL, re-run, deploy.
SIX_WEEK_CHECKOUT_URL = 'https://www.skool.com/high-ticket-home-services-2405/classroom/3d6b9c44'

import re, sys, html, pathlib
DIST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist')
home = (DIST / 'index.html').read_text()
styles = ''.join(re.findall(r'<style id="q-[^"]+">.*?</style>', home, re.S))
links = ''.join(re.findall(r'<link rel="stylesheet" href="[^"]+">', home))

if SIX_WEEK_CHECKOUT_URL == 'TBD':
    href = '#price'; tbd = ' data-checkout="TBD"'
else:
    href = html.escape(SIX_WEEK_CHECKOUT_URL, quote=True); tbd = ''
CTA_TEXT = 'Join the High Ticket Service Academy Six-Week Coaching Program at $1,997'
COURSE_URL = 'https://www.skool.com/high-ticket-home-services-2405/classroom/42b0c716'
NAME = 'High Ticket Service Academy Six-Week Coaching Program'
DESC = ('A six-week coaching program with Marshall Wayne, owner-operator of The Mounting Man: weekly live calls Mondays at 6 PM Central, '
        'done-with-you help, and the full High Ticket Service Academy course. $1,997 paid in full, launch pricing.')
URL = 'https://www.hightickethomeservices.com/six-week/'

css = """
.sw-hero{background:#0C0C0C;color:#fff;padding-top:clamp(56px,10vw,120px)}
.sw-hero h1{font-size:clamp(2.1rem,6.4vw,4rem);line-height:1.05;letter-spacing:-.03em;font-weight:750;max-width:20ch;margin-top:14px}
.sw-hero .eyebrow{color:var(--yellow)}
.sw-sub{color:var(--muted-on-dark);font-size:clamp(1.05rem,2.4vw,1.25rem);line-height:1.6;max-width:62ch;margin-top:20px}
.sw-facts{list-style:none;padding:0;margin:28px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.sw-facts li{border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-size:.95rem;color:#fff;background:#161616}
.sw-facts strong{color:var(--yellow)}
.sw-jump{display:inline-block;margin-top:28px;color:#fff;font-weight:650;text-decoration:underline;text-underline-offset:4px}
.sw-two{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-top:var(--space-6)}
.sw-box{border:1px solid var(--line-dark);border-radius:var(--radius-card);padding:var(--space-6);background:#fff}
.sw-box h3{font-size:var(--font-card);font-weight:650;margin-bottom:var(--space-3);color:var(--ink)}
.sw-box ul,.sw-list{margin:0;padding-left:1.25rem;color:var(--muted);line-height:1.65;display:grid;gap:var(--space-3)}
.sw-list strong,.sw-box strong{color:var(--ink)}
.sw-light{background:#fafafa}
.sw-weeks{list-style:none;counter-reset:wk;padding:0;margin:var(--space-6) 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-5)}
.sw-weeks li{border:1px solid var(--line-dark);border-radius:var(--radius-card);background:#fff;padding:var(--space-5);line-height:1.55;color:var(--muted)}
.sw-weeks b{display:block;font-family:IBM Plex Mono,monospace;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);margin-bottom:8px}
.sw-price{background:#0C0C0C;color:#fff}
.sw-price .eyebrow{color:var(--yellow)}
.sw-card{max-width:640px;margin:var(--space-6) auto 0}
.sw-amt{font-size:clamp(2.6rem,9vw,4rem);font-weight:750;color:var(--yellow);line-height:1;letter-spacing:-.03em}
.sw-amt span{font-size:1.1rem;color:#fff;font-weight:600;letter-spacing:0;margin-left:8px}
.sw-cta{width:100%;justify-content:center;text-align:center;margin-top:var(--space-5);white-space:normal;line-height:1.3}
.sw-note{color:var(--muted-on-dark);line-height:1.6;margin-top:14px}
.sw-fine{color:var(--muted-on-dark);font-size:.9rem;line-height:1.55;margin-top:var(--space-4)}
.sw-agent{margin-top:var(--space-6);padding:var(--space-5);border-left:3px solid var(--yellow);background:#161616;border-radius:var(--radius-card)}
.sw-agent h3{font-weight:650;margin-bottom:8px}
.sw-agent p{color:var(--muted-on-dark);line-height:1.6}
.sw-ways{grid-template-columns:repeat(2,1fr)}
.sw-textlink{color:#fff;font-weight:650;text-decoration:underline;text-underline-offset:4px;margin-top:auto}
.sw-proof .ob__head{margin-bottom:var(--space-6)}
.sw-disclaim{text-align:center;color:var(--muted);max-width:62ch;margin:var(--space-6) auto 0;line-height:1.6}
.sw-back{color:inherit;text-decoration:underline}
@media (max-width:900px){.sw-weeks{grid-template-columns:repeat(2,1fr)}}
@media (max-width:767px){.sw-two,.sw-ways{grid-template-columns:1fr}.sw-weeks{grid-template-columns:1fr}}
"""

def esc(t): return html.escape(t, quote=False)

weeks = [
 ("Week 1", "Your luxury persona is chosen and your core service is repackaged with premium naming."),
 ("Week 2", "Your GMB profile is verified, fully optimized, and posting on schedule."),
 ("Week 3", "Your call script, speed-to-lead process, and follow-up sequences are written and running."),
 ("Week 4", "Pixels are installed, retargeting audiences are building, and your omnipresence foundation is in place."),
 ("Week 5", "Your Core 30 site map is built and your highest-value service+city pages are live."),
 ("Week 6", "Your Google Ads are structured, tracking is live, and at least one campaign is running on the pages you built."),
]
faq = [
 ("Will I make what you made?", "My best year with The Mounting Man was $512,022.13. My numbers are my proof, not a promise of yours. Your results depend on your market and your work. What I can promise is the same system I used and my help putting it to work in your business."),
 ("What's the difference between the coaching program and the course?", "The course is the High Ticket Service Academy by itself: every lesson, self-paced, $497. You get Skool access and go through it yourself, with no coaching, no access to me, and no agent delivery. The six-week coaching program is the same course plus six weeks working with me directly, plus the full pack sent to your AI agent, for $1,997."),
 ("Is this done-for-you?", "No. It's done with you. We pick one thing at a time — whatever matters most right now — and work on it together until it's handled. Then we move to the next one."),
 ("How does the AI agent work?", "The agent part is only in the Six-Week Coaching Program. The moment you pay, you get Skool access so you can go through the course yourself. At the same time, MoneyPenny emails your agent the complete academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Once it has the playbook, your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner. The $497 course doesn't include any of this. You get Skool access and work through it yourself."),
 ("What if I don't run Google Ads yet?", "We start with your prices, your brand, and your Google profile. Sales systems and pixels come before ads. The six-week map is built in order for exactly that reason."),
 ("How do the agents find Google Ads waste?", "You give my agents access to your Google Ads account. They go through your spend and search terms and flag clicks and budget that aren't booking jobs. We go over what they find together and decide what to cut, one thing at a time."),
 ("What else can I get help with?", "SEO, AEO, Facebook ads, building your own AI agents, city location pages from your real install data, and creative help — design, image ads, video ads. Anything in the High-Ticket Service Academy or in how I built The Mounting Man."),
 ("What happens after six weeks?", "You leave with a working system. If you want ongoing help after that, an optional continuation is available, and I'll talk it through with you."),
 ("Do you offer discounts?", "No. The price on this page is the price everyone pays."),
]
proof = [("best-day","Best day","Sep 23, 2025","$6,458.10"),("best-week","Best week","Dec 1–7, 2024","$17,456.84"),
         ("best-month","Best month","Dec 2024","$59,798.23"),("best-year","Best year","2024","$512,022.13")]

import json
ld = {"@context":"https://schema.org","@graph":[
  {"@type":"WebPage","@id":URL+"#page","url":URL,"name":NAME,"description":DESC,"isPartOf":{"@id":"https://www.hightickethomeservices.com/#website"}},
  {"@type":"Service","name":NAME,"provider":{"@id":"https://www.hightickethomeservices.com/#org"},"description":DESC,
   "offers":[{"@type":"Offer","name":NAME,"price":"1997","priceCurrency":"USD"},
             {"@type":"Offer","name":"High Ticket Service Academy Course","price":"497","priceCurrency":"USD","url":COURSE_URL}]},
  {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]}]}

page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- SIX_WEEK_CHECKOUT_URL = {esc(SIX_WEEK_CHECKOUT_URL)} (set in build_six_week.py) -->
<title>{NAME} | Marshall Wayne</title><meta name="description" content="{html.escape(DESC)}"><link rel="canonical" href="{URL}">
<meta name="robots" content="index, follow, max-image-preview:large"><meta name="author" content="Marshall Wayne"><meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website"><meta property="og:site_name" content="High-Ticket Service Academy"><meta property="og:url" content="{URL}">
<meta property="og:title" content="{NAME}"><meta property="og:description" content="{html.escape(DESC)}"><meta property="og:image" content="https://www.hightickethomeservices.com/images/og-htsa.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{NAME}"><meta name="twitter:description" content="{html.escape(DESC)}"><meta name="twitter:image" content="https://www.hightickethomeservices.com/images/og-htsa.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{links}{styles}<style id="q-six-week">{css}</style><script src="/meta-pixel.js" defer></script></head>
<body><main>

<section class="section sw-hero"><div class="container">
<p class="eyebrow">High Ticket Service Academy · Six-Week Coaching Program</p>
<h1>Six weeks. Your system built the way I built The Mounting Man.</h1>
<p class="sw-sub">I built a TV mounting business to a $512,022.13 year with no employees. I do the installs. AI agents handle much of the back office. The High Ticket Service Academy six-week coaching program is where we set up your agents and your whole system the same way — so you cut waste and charge what the job is worth. My numbers are my proof, not a promise of yours.</p>
<ul class="sw-facts"><li><strong>$1,997</strong> paid in full</li><li>Includes access to me</li><li>Weekly live calls, Mondays at 6 PM Central, one hour each</li></ul>
<a class="sw-jump" href="#price">See the price and what's included ↓</a>
</div></section>

<section class="section"><div class="container">
<p class="eyebrow">Fit</p><h2 class="section-title">Who this is for, and who it isn't.</h2>
<div class="sw-two">
<div class="sw-box"><h3>Who this is for</h3><ul>
<li>Home-service owners who are done chasing cheap jobs and want to run a premium operation.</li>
<li>Owners who will do the work — read the lessons, update their profile, launch their ads, take the calls.</li>
<li>Owners who want me in their corner while they build, not a course they never open.</li></ul></div>
<div class="sw-box"><h3>Who this isn't for</h3><ul>
<li>Owners who want someone else to run their business for them. This is done with you, not done for you.</li>
<li>Owners who aren't ready to raise prices, invest in ads, or show up on live calls.</li>
<li>Owners who just want the map. That's the High Ticket Service Academy Course by itself at $497: the full course, self-paced, with no coaching program and no access to me.</li></ul></div>
</div></div></section>

<section class="section sw-light"><div class="container">
<p class="eyebrow">What you get</p><h2 class="section-title">Six weeks building it with me.</h2>
<ul class="sw-list" style="margin-top:var(--space-6);max-width:70ch">
<li><strong>Six weeks with Marshall.</strong> Weekly live calls, Mondays at 6 PM Central, one hour each, plus async help between calls.</li>
<li><strong>The HTSA curriculum delivered to your AI agent.</strong> The moment you pay, you get Skool access to the academy so you can go through the course yourself and learn. At the same time, MoneyPenny emails your agent (Grok Bot, Muse, ChatGPT, or similar) the full academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner, instead of you working through every lesson by hand.</li>
<li><strong>A private Notion workspace</strong> for your business — your plan, deliverables, and progress in one place.</li>
<li><strong>Done-with-you help on what matters most:</strong> branding, SEO, AEO (showing up in AI answers), Google Ads, Facebook ads, building your own AI agents, city location pages from your real install data, and creative help (design, image ads, video ads).</li>
</ul></div></section>

<section class="section"><div class="container">
<p class="eyebrow">Six weekly outcomes</p><h2 class="section-title">By the end of each week, something real exists or is live.</h2>
<ol class="sw-weeks">{''.join(f'<li><b>{w}</b>{esc(t)}</li>' for w,t in weeks)}</ol>
</div></section>

<section class="ob section sw-proof"><div class="container"><div class="ob__head"><p class="eyebrow ob__eyebrow">Proof (my results, not yours)</p>
<h2 class="section-title">These are my numbers.</h2><p class="ob__blurb">I built The Mounting Man with no employees. I do the installs myself. AI agents handle much of the back office. These are my numbers:</p></div>
<div class="ob__grid" style="--cols:4">{''.join(f'<figure class="ob__card"><a href="/proof/{f}.webp" target="_blank" rel="noopener" aria-label="Open full-size {k.lower()} Square sales report"><img src="/proof/{f}.webp" alt="The Mounting Man Square sales report, {k.lower()}: {d}, Total Collected {v}" loading="lazy" width="900" height="1125"></a><figcaption><span class="ob__kw">{k}: {v}</span><span class="ob__cap">{d}</span></figcaption></figure>' for f,k,d,v in proof)}</div>
<p class="sw-disclaim">My numbers are my proof, not a promise of yours. Your results depend on your market, your trade, and your work.</p>
</div></section>

<section id="price" class="section sw-price"><div class="container">
<p class="eyebrow">Price</p><h2 class="section-title" style="color:#fff">{NAME}</h2>
<div class="door door--feature sw-card">
<p class="sw-amt">$1,997<span>paid in full</span></p>
<p class="sw-note">This is <strong style="color:#fff">launch pricing</strong>. The price goes up as member results come in.</p>
<p class="sw-note">Includes access to me: weekly live calls, Mondays at 6 PM Central, one hour each, plus help between calls.</p>
<a class="btn-primary sw-cta" href="{href}"{tbd} data-door="sixweek">{CTA_TEXT}</a>
<p class="sw-fine">Launch pricing reflects where the High Ticket Service Academy coaching program is today. The price goes up as member results come in. Results shown are my own. My numbers are my proof, not a promise of yours, and your results depend on your market and your work. This program is done with you, not done for you.</p>
<div class="sw-agent"><h3>Your agent and the academy</h3><p>The moment you pay for the six-week program, you get Skool access so you can learn the academy yourself. At the same time, MoneyPenny emails your agent the full academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner, instead of you grinding through every lesson by hand.</p></div>
</div></div></section>

<section id="two-ways" class="doors section"><div class="container">
<p class="eyebrow doors__kicker">Two ways in</p><h2 class="section-title doors__title">Pick the one that fits.</h2>
<div class="doors__grid sw-ways">
<article class="door door--feature"><p class="door__name eyebrow">With coaching</p><p class="door__price">$1,997</p><h3 class="door__head">High Ticket Service Academy Six-Week Coaching Program</h3>
<p class="door__subhead">The full course plus six weeks of coaching with me: weekly live calls (Mondays at 6 PM Central, one hour each), help between calls, and your AI agent gets the academy on day one so it can start building The Mounting Man playbook out. This is the only option that includes access to me.</p>
<p class="door__micro" style="margin-top:18px"><a class="sw-textlink" href="#price">See the price and join ↑</a></p></article>
<article class="door"><p class="door__name eyebrow">Course only</p><p class="door__price">$497</p><h3 class="door__head">High Ticket Service Academy Course</h3>
<p class="door__subhead">The course by itself. Every module and lesson, self-paced, lifetime access. You get Skool access and go through it yourself. No coaching, no access to me, and no agent delivery or agent help. (Sold in Skool today as The Roadmap Course.)</p>
<a class="btn-primary door__cta" style="margin-top:18px" href="{COURSE_URL}" data-door="course">Get the High Ticket Service Academy Course, $497</a><p class="door__micro">Checkout is on Skool. One payment.</p></article>
</div>
<div class="compare"><h3>How the two compare</h3>
<div class="compare__wrap compare__wrap--two" tabindex="0" role="region" aria-label="How the two compare"><table><thead><tr><th scope="col"><span class="sr-only">Feature</span></th>
<th scope="col">High Ticket Service Academy Six-Week Coaching Program<br><span>$1,997</span></th><th scope="col">High Ticket Service Academy Course<br><span>course only</span></th></tr></thead><tbody>
<tr><th scope="row">Price</th><td><strong>$1,997</strong> paid in full (six weeks)</td><td>$497 one-time</td></tr>
<tr><th scope="row">Curriculum</th><td>Full system + agent delivery</td><td>Full course, lifetime access</td></tr>
<tr><th scope="row">Access to Marshall</th><td><strong>Yes — six focused weeks</strong></td><td>No (course only, no coaching)</td></tr>
<tr><th scope="row">Skool course access</th><td>Yes, the moment you pay</td><td>Yes. You go through it yourself</td></tr>
<tr><th scope="row">Agent delivery</th><td><strong>Full pack to your AI agent by agent mail; it starts implementing, often within a day or two</strong></td><td>No. Human only, no agent delivery or agent help</td></tr>
</tbody></table></div></div>
</div></section>

<section class="faq section"><div class="container faq__inner"><h2 class="section-title">Questions</h2><div class="faq__list">
{''.join(f'<details class="faq__item"><summary class="faq__question">{esc(q)}</summary><p class="faq__answer">{esc(a)}</p></details>' for q,a in faq)}
</div></div></section>
</main>
<footer class="footer"><div class="container footer__inner"><p class="footer__brand">High-Ticket Service Academy (HTSA)</p>
<p class="footer__note">Taught by Marshall Wayne, owner-operator of The Mounting Man in the Twin Cities.</p>
<p class="footer__note"><a class="sw-back" href="/">Back to the main page</a> · <a class="footer__link" href="https://www.skool.com/high-ticket-home-services-2405/about">HTSA on Skool</a></p>
<nav class="footer__links" aria-label="Footer"><a href="/privacy">Privacy</a></nav><p class="footer__copy">&copy; 2026 High-Ticket Service Academy. All rights reserved.</p></div></footer>
</body></html>
"""
out = DIST / 'six-week' / 'index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print('wrote', out, 'checkout =', SIX_WEEK_CHECKOUT_URL)
