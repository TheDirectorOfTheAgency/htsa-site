#!/usr/bin/env python3
# Homepage two-door merge (Course $497 + Six-Week Coaching $1,997 paid in full). Input: production index.html (b5980e14).
import re, json, html, sys
SRC, OUT = sys.argv[1], sys.argv[2]
s = open(SRC).read()
COURSE = 'https://www.skool.com/high-ticket-home-services-2405/classroom/42b0c716'
SIX = 'https://www.skool.com/high-ticket-home-services-2405/classroom/3d6b9c44'
SIX_CTA = 'Join the High Ticket Service Academy Six-Week Coaching Program at $1,997'
COURSE_CTA = 'Get the High Ticket Service Academy Course, $497'
def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:90])
    s = s.replace(old, new)
def esc(t): return html.escape(t, quote=False)

# --- meta descriptions (4x plain) ---
OLD_DESC = 'Marshall Wayne, owner-operator of The Mounting Man, teaches the high-ticket system behind it. Three ways in: Standard community at $1/month, the Roadmap Course at $497 one-time, or Premium at $1,997/month working with him directly.'
NEW_DESC = 'Marshall Wayne, owner-operator of The Mounting Man, teaches the high-ticket system behind it. Two ways in: the High Ticket Service Academy Course at $497 one-time, or the Six-Week Coaching Program at $1,997 paid in full, working with him for six weeks.'
rep(OLD_DESC, NEW_DESC, s.count(OLD_DESC))

# --- remove the earlier homepage banner + its style ---
s, n1 = re.subn(r'<style id="q-six-week-link">.*?</style>', '', s, flags=re.S); assert n1 == 1
s, n2 = re.subn(r'\n<aside class="sw-home".*?</aside>\n', '\n', s, flags=re.S); assert n2 == 1

# --- hero ---
rep('Here I teach that system to other home service owners, three ways: a $1/month community, a $497 course, or working with me directly at $1,997/month.',
    'Here I teach that system to other home service owners, two ways: a $497 course you work through on your own, or six weeks working with me directly at $1,997 paid in full.')
rep('<p class="hero-cta__note">Checkout is on Skool. Standard and Premium are month to month. Cancel anytime.</p>',
    '<p class="hero-cta__note">Checkout is on Skool. Both are one payment.</p>')
rep('See the three ways in', 'See the two ways in', s.count('See the three ways in'))

# --- Google Ads section tail ---
rep('That\'s money I already spent finding out what works. In Premium, that playbook goes to work in your account. <a href="#premium">See how Premium works →</a>',
    'That\'s money I already spent finding out what works. In the Six-Week Coaching Program, we put that playbook to work in your account. <a href="#six-week">See the six weeks →</a>')

# --- curriculum intro ---
rep('Included in the Roadmap Course and in Premium. Standard is the community, and it doesn\'t include the course.',
    'Included in the High Ticket Service Academy Course and in the Six-Week Coaching Program.')

# --- MoneyPenny portrait: sharp brand still (MoneyPenny Headshot - Glasses.png), srcset for retina ---
rep('<img src="/images/moneypenny-profile.png" width="256" height="256" alt=',
    '<img src="/images/moneypenny-glasses-600.webp" srcset="/images/moneypenny-glasses-300.webp 300w, /images/moneypenny-glasses-600.webp 600w" sizes="256px" width="256" height="256" alt=')

# --- ticket growth CTA ---
rep('<p class="ticket-growth__cta">For the full pricing system, see the three doors below: <a href="#pricing" data-cta-scroll>Standard</a>, <a href="#pricing" data-cta-scroll>The Roadmap Course</a>, or <a href="#pricing" data-cta-scroll>Premium</a>.</p>',
    '<p class="ticket-growth__cta">For the full pricing system, see the two ways in below: <a href="#pricing" data-cta-scroll>the High Ticket Service Academy Course</a> or <a href="#pricing" data-cta-scroll>the Six-Week Coaching Program</a>.</p>')

# --- shared copy ---
GET = [
 ('Six weeks with me.', 'Weekly live calls, Mondays at 6 PM Central, one hour each, plus help between calls.'),
 ('The HTSA curriculum delivered to your AI agent.', 'The moment you pay, you get Skool access to the academy so you can go through the course yourself and learn. At the same time, MoneyPenny emails your agent (Grok Bot, Muse, ChatGPT, or similar) the full academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner, instead of you working through every lesson by hand.'),
 ('A private Notion workspace', 'for your business — your plan, deliverables, and progress in one place.'),
 ('Done-with-you help on what matters most:', 'branding, SEO, AEO (showing up in AI answers), Google Ads, Facebook ads, building your own AI agents, city location pages from your real install data, and creative help (design, image ads, video ads).'),
]
WEEKS = [
 ('Week 1', 'Your luxury persona is chosen and your core service is repackaged with premium naming.'),
 ('Week 2', 'Your GMB profile is verified, fully optimized, and posting on schedule.'),
 ('Week 3', 'Your call script, speed-to-lead process, and follow-up sequences are written and running.'),
 ('Week 4', 'Pixels are installed, retargeting audiences are building, and your omnipresence foundation is in place.'),
 ('Week 5', 'Your Core 30 site map is built and your highest-value service+city pages are live.'),
 ('Week 6', 'Your Google Ads are structured, tracking is live, and at least one campaign is running on the pages you built.'),
]
FINE = 'Launch pricing reflects where the High Ticket Service Academy coaching program is today. The price goes up as member results come in. Results shown are my own. My numbers are my proof, not a promise of yours, and your results depend on your market and your work. This program is done with you, not done for you.'
AGENT = 'The moment you pay for the six-week program, you get Skool access so you can learn the academy yourself. At the same time, MoneyPenny emails your agent the full academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner, instead of you grinding through every lesson by hand.'

# --- replace the Premium section with the Six-Week section ---
i = s.find('<section id="premium" class="premium section">'); assert i > 0
j = s.find('</section>', i) + len('</section>')
six = ('<section id="six-week" class="hw section">'
 '<div class="container"><div class="hw__head"><p class="eyebrow hw__kicker">The Six-Week Coaching Program</p>'
 '<h2 class="section-title">Six weeks. Your system built the way I built The Mounting Man.</h2>'
 '<p class="hw__sub">I built a TV mounting business to a $512,022.13 year with no employees. I do the installs. AI agents handle much of the back office. The High Ticket Service Academy six-week coaching program is where we set up your agents and your whole system the same way — so you cut waste and charge what the job is worth. My numbers are my proof, not a promise of yours.</p></div>'
 '<div class="hw__block"><h3 class="hw__title">What you get</h3><ul class="hw__list">'
 + ''.join(f'<li><strong>{esc(a)}</strong> {esc(b)}</li>' for a, b in GET) +
 '</ul></div>'
 '<div class="hw__block"><h3 class="hw__title">Six weekly outcomes</h3><p class="hw__note">By the end of each week, something real exists or is live.</p><ol class="hw__weeks">'
 + ''.join(f'<li><b>{w}</b>{esc(t)}</li>' for w, t in WEEKS) +
 '</ol></div>'
 '<div class="hw__agent"><h3>Your agent and the academy</h3><p>' + esc(AGENT) + '</p></div>'
 '<p class="jump"><a href="#pricing" data-cta-scroll>See the two ways in ↓</a> · <a href="/six-week/">Full six-week page</a></p>'
 '</div></section>')
s = s[:i] + six + s[j:]

# --- pricing section: two doors + comparison ---
i = s.find('<section id="pricing" class="doors section">'); assert i > 0
j = s.find('</section>', i) + len('</section>')
pricing = ('<section id="pricing" class="doors section"><div class="container"><p class="eyebrow doors__kicker">Two ways in</p>'
 '<h2 class="section-title doors__title">Charge what the job is worth.</h2>'
 '<p class="doors__sub">The high-ticket system I used to build a service business, now in two ways to get it.</p>\n'
 '<div class="doors__intro"><h3>Two ways in. Start where you are.</h3><p>Some owners want the map and the quiet to work it themselves. Some want me in their corner while they build. Both are good ways to grow.</p>'
 '<ul class="doors__pick"><li>If you want me working on your business with you for six weeks: <strong>the Six-Week Coaching Program, $1,997 paid in full.</strong></li>'
 '<li>If you want the whole system and you\'d rather work it on your own: <strong>the High Ticket Service Academy Course, $497 once.</strong></li></ul></div>\n'
 '<div class="doors__grid doors__grid--two">\n'
 '<article class="door door--feature"><p class="door__name eyebrow">With coaching · done with you</p><p class="door__price">$1,997 paid in full.</p>'
 '<h3 class="door__head">High Ticket Service Academy Six-Week Coaching Program</h3>'
 '<p class="door__subhead">Six weeks working with me directly, plus the full course. This is the only option that includes access to me.</p>'
 f'<a class="btn-primary door__cta" href="{SIX}" data-door="sixweek">{SIX_CTA}</a><p class="door__micro">Checkout is on Skool. One payment.</p>'
 '<p class="door__included">Weekly live calls, Mondays at 6 PM Central, one hour each, plus help between calls.</p>'
 '<p class="door__label">What you get</p><ul class="door__list door__list--tight">'
 '<li>Six weeks with me: weekly live calls plus help between calls.</li>'
 '<li>Skool access the moment you pay, and the full pack emailed to your AI agent at the same time so it can start building out The Mounting Man playbook, often within a day or two.</li>'
 '<li>A private Notion workspace for your plan, deliverables, and progress.</li>'
 '<li>Done-with-you help on what matters most: branding, SEO, AEO, Google Ads, Facebook ads, your own AI agents, city pages, and creative.</li>'
 '</ul><p class="door__micro"><a href="#six-week" style="color:inherit;text-decoration:underline">See the six weeks, week by week ↑</a></p>'
 '<p class="door__fine"><strong style="color:#fff">This is launch pricing.</strong> ' + esc(FINE) + '</p></article>\n'
 '<article class="door"><p class="door__name eyebrow">Course only · on your own</p><p class="door__price">$497 one-time. Lifetime access.</p>'
 '<h3 class="door__head">High Ticket Service Academy Course</h3>'
 '<p class="door__subhead">The full system, without a call with me.</p>'
 f'<a class="btn-primary door__cta" href="{COURSE}" data-door="course">{COURSE_CTA}</a><p class="door__micro">Checkout is on Skool. One payment. On Skool it\'s called The Roadmap Course.</p>'
 '<ul class="door__list"><li>The full system I use to win high-ticket jobs, from pricing to Google Ads to SEO, start to finish.</li><li>How I moved from cheap jobs to the work wealthier clients book, step by step.</li><li>Pay once and keep it for life. No monthly bill.</li><li>Work through it at your own pace, on your own schedule.</li><li>Built for owners who want the plan and are ready to do the work themselves.</li><li>You get Skool access and go through the course yourself. No agent mail, no agent-to-agent delivery, and no agent implementation help. That\'s only in the six-week program.</li><li>Just so you know: this course doesn\'t include access to me. That means no coaching, no calls, no DMs, and no Q&amp;A.</li></ul></article>\n'
 '</div>\n'
 '<div class="compare"><h3>How the two compare</h3>'
 '<div class="compare__wrap compare__wrap--two" tabindex="0" role="region" aria-label="How the two compare"><table><thead><tr><th scope="col"><span class="sr-only">Feature</span></th>'
 '<th scope="col">Six-Week Coaching Program<br><span>$1,997 paid in full</span></th><th scope="col">High Ticket Service Academy Course<br><span>$497 one-time</span></th></tr></thead><tbody>\n'
 '<tr><th scope="row">What it is</th><td>The full course plus six weeks working with me</td><td>The full course, self-paced, lifetime access</td></tr>\n'
 '<tr><th scope="row">Full course (intro, beginners track, Modules 0–6)</th><td>Yes</td><td>Yes</td></tr>\n'
 '<tr><th scope="row">Weekly live calls with me (Mondays, 6 PM Central)</th><td>Yes, for six weeks</td><td>No</td></tr>\n'
 '<tr><th scope="row">Skool course access</th><td>Yes, the moment you pay</td><td>Yes. You go through it yourself</td></tr>\n'
 '<tr><th scope="row">Full pack sent to your AI agent by agent mail, so it starts implementing (often within a day or two)</th><td>Yes</td><td>No. Human only, no agent delivery or agent help</td></tr>\n'
 '<tr><th scope="row">Done-with-you help: branding, SEO, AEO, Google Ads, Facebook ads, your own AI agents, city pages, creative</th><td>Yes</td><td>No</td></tr>\n'
 '<tr><th scope="row">Access to me</th><td>Yes, six focused weeks</td><td>No (course only, no coaching)</td></tr>\n'
 '<tr><th scope="row">How you pay</th><td>One payment</td><td>One payment</td></tr>\n'
 '</tbody></table></div></div>\n'
 '</div></section>')
s = s[:i] + pricing + s[j:]

# --- FAQ (visible) ---
FAQ = [
 ("Do I have to be in TV mounting?", "No. TV mounting is my trade, so that's where my proof comes from. The system is pricing, Google, ads, and AI for the office, and it's built for home service owners in any trade."),
 ("Which one should I start with?", "Start where you are. If you want the whole system and like to work on your own, the High Ticket Service Academy Course is $497 once. If you want me working on your business with you for six weeks, the Six-Week Coaching Program is $1,997 paid in full."),
 ("What's the difference between the coaching program and the course?", "The course is the High Ticket Service Academy by itself: every lesson, self-paced, $497. You get Skool access and go through it yourself, with no coaching, no access to me, and no agent delivery. The six-week coaching program is the same course plus six weeks working with me directly, plus the full pack sent to your AI agent, for $1,997."),
 ("Will I make what you made?", "My best year with The Mounting Man was $512,022.13. My numbers are my proof, not a promise of yours. Your results depend on your market and your work. What I can promise is the same system I used and my help putting it to work in your business."),
 ("What happens in the six weeks?", "Each week ends with something real in your business: your positioning and premium service names, then your Google Business Profile, then your call script and follow-up, then pixels and retargeting, then your city and service pages, then your Google Ads. We have a live call every Monday at 6 PM Central, and you get help between calls."),
 ("How does the AI agent work?", "The agent part is only in the Six-Week Coaching Program. The moment you pay, you get Skool access so you can go through the course yourself. At the same time, MoneyPenny emails your agent the complete academy pack by agent mail, and it can start implementing right away. If you already have Facebook, Muse is a free and easy way in. Once it has the playbook, your agent can start replicating how The Mounting Man runs, often within a day or two, sometimes sooner. The $497 course doesn't include any of this. You get Skool access and work through it yourself."),
 ("How do the agents find Google Ads waste?", "You give my agents access to your Google Ads account. They go through your spend and search terms and flag clicks and budget that aren't booking jobs. We go over what they find together and decide what to cut, one thing at a time."),
 ("Do I have to hand over control of my Google Ads?", "No. Any change to your account is one we agree on together, and you approve it before it happens."),
 ("What if I don't run Google Ads yet?", "We start with your prices, your brand, and your Google profile. Sales systems and pixels come before ads. The six-week map is built in order for exactly that reason."),
 ("Is this done-for-you?", "No. It's done with you. We pick one thing at a time, whatever matters most for your business right now, and work on it together until it's handled. Then we move to the next one."),
 ("What else can I get help with?", "SEO, AEO (showing up when people ask AI for a recommendation), Facebook ads, building your own AI agents, city location pages from your real install data, and creative help: design, image ads, video ads. Anything in the High-Ticket Service Academy or in how I built The Mounting Man."),
 ("What happens after six weeks?", "You leave with a working system. If you want ongoing help after that, an optional continuation is available, and I'll talk it through with you."),
 ("Is there a contract or a monthly bill?", "No. Both are one payment: $497 for the course, $1,997 for the six-week coaching program."),
 ("Do I need to apply or book a call first?", "No. You can join directly."),
 ("What happens when I click a join button?", "You go to Skool, where HTSA lives, and check out there. The course and the six-week coaching program each have their own page in the Skool classroom."),
 ("Do you offer discounts or trials?", "No. The price on this page is the price everyone pays."),
]
i = s.find('<div class="faq__list" data-astro-cid-z6gx6xcw>'); assert i > 0
i += len('<div class="faq__list" data-astro-cid-z6gx6xcw>')
j = s.find('</div>', s.rfind('</details>', i, s.find('<section id="meet-moneypenny"')))
items = ''.join(f'<details class="faq__item" data-astro-cid-z6gx6xcw> <summary class="faq__question" data-astro-cid-z6gx6xcw>{esc(q)}</summary> <p class="faq__answer" data-astro-cid-z6gx6xcw>{esc(a)}</p> </details>' for q, a in FAQ)
s = s[:i] + '\n' + items + '\n' + s[j:]

# --- final section ---
i = s.find('<div class="final__grid">'); assert i > 0
j = s.find('<div class="final__ask">', i)
final = ('<div class="final__grid final__grid--two">'
 f'<div class="final__card final__card--feature"><p class="final__name">Six-Week Coaching Program</p><p class="final__price">$1,997 paid in full. Six weeks working with me.</p><a class="btn-primary" href="{SIX}" data-door="sixweek">{SIX_CTA}</a></div> '
 f'<div class="final__card"><p class="final__name">High Ticket Service Academy Course</p><p class="final__price">$497 one-time. The full course, on your own.</p><a class="btn-primary" href="{COURSE}" data-door="course">{COURSE_CTA}</a></div> '
 '</div> <p class="final__micro">Checkout is on Skool. Both are one payment.</p> ')
s = s[:i] + final + s[j:]

# --- JSON-LD ---
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
d = json.loads(m.group(1))
for n in d['@graph']:
    if n.get('@type') == 'WebPage': n['description'] = NEW_DESC
    if n.get('@type') == 'Service':
        n['name'] = 'High Ticket Service Academy'
        n['offers'] = [
          {"@type":"Offer","name":"High Ticket Service Academy Six-Week Coaching Program","price":"1997","priceCurrency":"USD","url":SIX},
          {"@type":"Offer","name":"High Ticket Service Academy Course","price":"497","priceCurrency":"USD","url":COURSE}]
    if n.get('@type') == 'FAQPage':
        n['mainEntity'] = [{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q, a in FAQ]
s = s[:m.start(1)] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]

# --- styles ---
css = ('<style id="q-home-two">'
 '.hw{background:#fafafa;border-bottom:1px solid var(--line-dark)}.hw__head{max-width:62ch}.hw__kicker{color:var(--muted)}'
 '.hw__sub{color:var(--muted);line-height:1.65;margin-top:var(--space-4)}'
 '.hw__block{margin-top:var(--space-8)}.hw__title{font-size:var(--font-card);font-weight:650;color:var(--ink);margin-bottom:var(--space-4)}'
 '.hw__note{color:var(--muted);margin:-8px 0 var(--space-5);line-height:1.5}'
 '.hw__list{margin:0;padding-left:1.25rem;color:var(--muted);line-height:1.65;display:grid;gap:var(--space-3);max-width:70ch}.hw__list strong{color:var(--ink)}'
 '.hw__weeks{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-5)}'
 '.hw__weeks li{border:1px solid var(--line-dark);border-radius:var(--radius-card);background:#fff;padding:var(--space-5);line-height:1.55;color:var(--muted)}'
 '.hw__weeks b{display:block;font-family:IBM Plex Mono,monospace;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);margin-bottom:8px}'
 '.hw__agent{margin-top:var(--space-7);padding:var(--space-5);border:1px solid var(--line-dark);border-left:3px solid var(--yellow);border-radius:var(--radius-card);background:#fff;max-width:70ch}'
 '.hw__agent h3{font-weight:650;margin-bottom:8px;color:var(--ink)}.hw__agent p{color:var(--muted);line-height:1.6}'
 '.hw__agent--dark{background:#161616;border-color:var(--line);border-left-color:var(--yellow);margin-inline:auto;max-width:960px}.hw__agent--dark h3{color:#fff}.hw__agent--dark p{color:var(--muted-on-dark)}'
 '.doors__grid--two{grid-template-columns:repeat(2,minmax(0,1fr));max-width:960px;margin-inline:auto}'
 '.compare__wrap--two table{min-width:0}.compare__wrap--two thead th{width:auto}.compare__wrap--two tbody th{width:28%}.compare__wrap--two td{color:var(--muted-on-dark)}.compare__wrap--two td:nth-of-type(1){color:#fff}@media (max-width:600px){.compare__wrap--two table,.compare__wrap--two thead,.compare__wrap--two tbody{display:block;width:100%}.compare__wrap--two tr{display:grid;grid-template-columns:1fr 1fr}.compare__wrap--two thead th:first-child{display:none}.compare__wrap--two thead th,.compare__wrap--two tbody th{width:auto}.compare__wrap--two tbody th{grid-column:1/-1;padding-bottom:4px;border-bottom:0}.compare__wrap--two tbody td{padding-top:4px}}.final__grid--two{grid-template-columns:repeat(2,minmax(0,1fr));max-width:860px;margin-inline:auto}'
 '.final__grid--two .btn-primary{white-space:normal;text-align:center;justify-content:center;line-height:1.3}'
 '.door__cta{white-space:normal;line-height:1.3}'
 '@media (max-width:900px){.hw__weeks{grid-template-columns:repeat(2,minmax(0,1fr))}}'
 '@media (max-width:900px){.doors__grid--two,.final__grid--two{grid-template-columns:1fr;max-width:640px}}@media (max-width:767px){.hw__weeks{grid-template-columns:1fr}}'
 '</style>')
rep('</head>', css + '</head>')
open(OUT, 'w').write(s)
print('ok', len(s))
