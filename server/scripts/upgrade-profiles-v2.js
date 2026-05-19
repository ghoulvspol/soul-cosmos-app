#!/usr/bin/env node
/**
 * Upgrade seed-profiles.json → seed-profiles-v2.json
 * Expand each English field from ~50 words to ≥100 words
 * Keep fingerprint and soulKeywords unchanged
 */
const fs = require('fs');
const path = require('path');

// ========== EXPANDED ENGLISH SENTENCE POOLS ==========
// Each pool has multiple sentences per key. We combine 2-3 to reach ≥100 words.

const WHO = {
  金: [
    "You carry yourself with a quiet authority that doesn't need validation. There's a stillness in you that people either find deeply calming or slightly intimidating — and you've learned to be okay with both reactions.",
    "Your mind works like a precision instrument — cutting through noise, finding the essential truth in any situation. You don't waste words, and you don't waste moves. Everything you do has intention behind it.",
    "Beneath your composed exterior runs a current of fierce determination. When you commit to something, you commit completely — no half-measures, no backup plans. This all-or-nothing quality is both your greatest strength and your most demanding trait.",
    "You're the person people call when things get serious. Not because you're the loudest voice in the room, but because you're the one who stays calm when everyone else is panicking. Your steadiness is a kind of superpower.",
    "There's a forge inside you — a place where raw experience gets hammered into wisdom. You don't just go through things; you emerge from them sharper, clearer, more defined. Every challenge refines you rather than breaks you.",
    "You move through the world like someone who's already made peace with the hard truths. This gives you an unusual kind of freedom — you're not chasing approval, not running from discomfort, just steadily becoming more yourself.",
    "Your presence has weight. Not the heavy kind — the gravitational kind. People orbit around your certainty, drawn to the rare quality of someone who actually knows what they stand for.",
    "You have a natural instinct for structure and order. Where others see chaos, you see patterns waiting to be organized. This makes you invaluable in any situation that needs someone to cut through the mess and find the way forward.",
  ],
  木: [
    "You're always reaching — toward something bigger, deeper, more alive. Growth isn't just something you do; it's something you are. Even in your quietest moments, there's an expansion happening beneath the surface.",
    "Your resilience is legendary among those who know you well. You've been bent by life more times than you can count, but you've never broken. Instead, you've learned to use pressure as fuel for becoming something more.",
    "There's a natural generosity in how you move through the world. You give without keeping score, support without needing recognition, and grow while helping others find their own upward path.",
    "You're the person who sees potential everywhere — in people, in projects, in seemingly impossible situations. This isn't naivety; it's a genuine gift for recognizing what could be, even when the present looks nothing like the vision.",
    "Your patience is one of your most underrated qualities. You understand, at a deep level, that the best things take time. You can wait for seeds to sprout without losing faith in the planting.",
    "There's something almost wild about your energy — an untamed quality that refuses to be boxed in or diminished. You need space to grow, and you know it. Any environment that tries to contain you will eventually lose you.",
    "You connect people and ideas like a living bridge. Your mind naturally finds the links between seemingly unrelated things, making you a catalyst for innovation and understanding wherever you go.",
    "Your relationship with change is complex but ultimately healthy. You resist it at first — who doesn't? — but then you find the growth edge in it and lean in. You've learned that discomfort is often the price of becoming.",
  ],
  水: [
    "You perceive the world at a frequency most people can't access. Emotions, undercurrents, unspoken tensions — you feel all of it, all the time. This depth of perception is both your gift and your ongoing education.",
    "Your mind moves like water — finding every crack, filling every gap, flowing around obstacles that stop others cold. You're naturally adaptive, which means you can thrive in environments that would drown more rigid souls.",
    "There's an ocean inside you that most people never see. They get the surface — calm, collected, maybe even a little mysterious. But underneath, there are currents of feeling and thought that would astonish them.",
    "You have a rare ability to hold space for contradiction. You can be deeply emotional and perfectly rational at the same time. You can grieve and plan. You can feel everything and still function. This is not common.",
    "Your intuition isn't just a feeling — it's an intelligence. You read rooms, people, and situations with an accuracy that borders on uncanny. Trust this gift. It's trying to show you something important.",
    "You're drawn to depth in everything — conversations, relationships, ideas. Small talk exhausts you. Surface-level anything feels like a waste of your perceptual gifts. You want the real thing or nothing at all.",
    "There's a quiet power in your ability to adapt without losing yourself. Like water, you take the shape of whatever container you're in, but your essence remains unchanged. This flexibility is a rare and valuable trait.",
    "Your emotional landscape is rich and complex — a territory you're still mapping. You feel things others don't notice, which can be overwhelming but also deeply beautiful. Your sensitivity is not weakness; it's advanced perception.",
  ],
  火: [
    "You walk into a room and the energy shifts. This isn't ego — it's just physics. Your presence is warm, immediate, and impossible to ignore. People are drawn to your fire even when they can't explain why.",
    "Your enthusiasm is contagious in the best possible way. When you care about something, you care with your whole body. Your passion isn't performative; it's the real thing, and it lights up everyone around you.",
    "There's a directness about you that cuts through social games. You say what you mean, you mean what you say, and you have little patience for people who can't do the same. This honesty is refreshing — and occasionally terrifying.",
    "You live at full volume. Quiet isn't really your setting — even when you're resting, there's a hum of creative energy running through you. You're always generating ideas, connections, possibilities.",
    "Your courage isn't the absence of fear; it's the decision to move through it. You've walked into scary situations more times than you can count, not because you're reckless, but because you refuse to let fear make your decisions.",
    "You have a natural magnetism that goes beyond physical appearance. It's the way you laugh with your whole body, the way you lean into conversations like they matter, the way you make people feel seen just by paying attention.",
    "Your creative energy is one of your most powerful forces. When you're in flow, you can produce more in an hour than most people do in a day. The challenge is channeling this fire without burning out.",
    "You're the person who makes things happen — not through planning and strategy, but through sheer force of will and the courage to start before you're ready. Your motto might as well be 'we'll figure it out as we go.'",
  ],
  土: [
    "You're the foundation that everyone else builds on. Not the flashiest position, maybe, but absolutely the most essential. Without your steadiness, the people around you would be standing on sand.",
    "Your reliability is not boring — it's sacred. In a world of broken promises and half-commitments, you're the person who shows up, does the work, and keeps their word. This consistency is more rare than you realize.",
    "There's a depth to you that takes time to reveal. You're not a first-impression person — you're a slow-burn person. The people who take the time to really know you discover layers they never expected.",
    "You have a practical wisdom that comes from paying attention. You notice what works, what doesn't, and what needs to change. Your advice is valued because it's grounded in reality, not theory.",
    "Your relationship with comfort is complex. You love stability — it's your natural state. But you also know, deep down, that growth requires discomfort. Your life is a constant negotiation between these two truths.",
    "You carry other people more than they know. You're the one who remembers birthdays, holds things together during crises, and makes sure the basics are covered. This caretaking is beautiful — just make sure someone's taking care of you too.",
    "There's an earthy wisdom in how you approach problems. You don't overthink; you assess, plan, and execute. Your solutions are practical, sustainable, and built to last. You're not interested in quick fixes.",
    "Your patience is structural — not passive. You wait not because you're indecisive, but because you understand timing. You know that premature action can destroy what careful waiting would have perfected.",
  ],
};

const LOVE = {
  Fire: [
    "You love like you do everything else — completely, passionately, with your whole chest. When you're in, you're all in. You don't do lukewarm, and you don't do halfway. This intensity is magnetic, but it can also be overwhelming for partners who aren't used to that much real.",
    "Your love language is presence — full, undivided, electric presence. When you're with someone, you're really with them. You make people feel like the most important person in the room, and that's a gift that keeps people coming back.",
    "You need a partner who can match your energy without trying to dim it. Someone who isn't threatened by your fire but inspired by it. The wrong partner will try to contain you; the right one will learn to dance with the flames.",
    "In relationships, you're the initiator — the one who plans the adventure, says the hard thing first, and loves out loud. You show affection through action, not just words. Your partner will never wonder where they stand with you.",
    "Your challenge in love is pacing. You fall fast and hard, which is beautiful until it burns. Learning to let love build slowly doesn't mean loving less — it means loving smarter. The best fires are the ones that last.",
  ],
  Earth: [
    "You love through acts of service — through showing up, following through, and making life easier for the people you care about. You might not write poetry, but you'll remember how they take their coffee and have it ready before they ask.",
    "Your love is built to last. You're not interested in fireworks that fade by morning; you want the slow-burning warmth of a fire that's been tended for years. You understand that real love is a practice, not a feeling.",
    "You need a partner who appreciates substance over spectacle. Someone who notices the quiet things you do — the planning, the supporting, the steady presence. You give so much in the background that it's easy to take for granted.",
    "In relationships, you're the anchor. When life gets chaotic, you're the one who holds things together. Your stability is a gift, but make sure you're not always the strong one. Let your partner be your safe place too.",
    "Your challenge in love is expressing vulnerability. You're so good at being reliable that people forget you also need reassurance, tenderness, and the freedom to not be okay. Let your partner see the unpolished version of you.",
  ],
  Air: [
    "You love through connection — the meeting of minds, the late-night conversations that turn into sunrise, the feeling of being truly understood. For you, intellectual intimacy is just as important as physical closeness.",
    "Your love language is freedom. You give space and need space in return. The right partner will understand that your need for independence isn't a rejection — it's how you stay whole enough to love well.",
    "You're the partner who keeps things interesting. You bring new ideas, new perspectives, and a refusal to let the relationship stagnate. You believe that growing together means growing individually first.",
    "In relationships, you're the communicator — the one who names the thing in the room that no one else will say. You value honesty over comfort, clarity over false peace. This makes you a deeply trustworthy partner.",
    "Your challenge in love is grounding. You can be so busy thinking about the relationship that you forget to actually be in it. Sometimes the most intimate thing you can do is put down the analysis and just hold someone.",
  ],
  Water: [
    "You love like the ocean — vast, deep, and impossible to fully map. Your emotional capacity is enormous, and the people you let in get access to a depth of feeling that most people only read about in novels.",
    "Your love language is attunement. You notice the shift in someone's voice, the tension in their shoulders, the thing they're not saying. You love by understanding, and that understanding makes your partner feel truly seen.",
    "You need a partner who isn't afraid of depth. Someone who can sit with you in the heavy feelings without trying to fix or rush through them. You need emotional safety like you need air — without it, you can't thrive.",
    "In relationships, you're the nurturer — the one who creates emotional safety, holds space for vulnerability, and loves with a tenderness that heals. Your presence alone can calm a storm.",
    "Your challenge in love is boundaries. You absorb your partner's emotions so completely that you can lose track of where they end and you begin. Learning to love deeply without losing yourself is your lifelong practice.",
  ],
};

const THRIVE = {
  ENTJ: [
    "You thrive in environments that reward strategic thinking and decisive action. You're built for leadership — not because you crave power, but because you see the most efficient path forward when everyone else is lost in the details.",
    "Your gift is turning vision into execution, chaos into order, and potential into results. You need a stage big enough for your ambition and a team that can keep up with your pace. When you find that, you become nearly unstoppable.",
  ],
  INTJ: [
    "You thrive when you're solving complex problems that others have given up on. Your mind works like a chess engine — always thinking several moves ahead, always finding the angle no one else considered.",
    "You need autonomy, intellectual challenge, and the freedom to execute your vision without interference. Micromanagement is your kryptonite. Give you a hard problem and the space to solve it, and you'll produce something brilliant.",
  ],
  ENTP: [
    "You thrive at the intersection of ideas — where disciplines collide and new possibilities emerge. You're a natural innovator, not because you're the most technically skilled, but because you see connections that others miss entirely.",
    "You need variety, intellectual stimulation, and the freedom to pivot when something more interesting appears. Routine is your enemy. The best environments for you are the ones that reward curiosity as much as execution.",
  ],
  INTP: [
    "You thrive in deep, focused exploration of ideas that fascinate you. Your mind is a laboratory where complex concepts get taken apart, examined, and reassembled in new configurations.",
    "You need time, space, and minimal social demands to do your best work. Open offices are your personal hell. Give you a quiet room, a hard problem, and unlimited coffee, and you'll emerge with something no one else could have built.",
  ],
  ENFJ: [
    "You thrive when you're helping others reach their potential. Your gift is seeing the best in people and creating environments where that best can emerge. You're a natural mentor, coach, and catalyst for growth.",
    "You need to feel like your work matters — not in an abstract sense, but in a 'someone's life is better because of what I did today' sense. This need for impact drives everything you choose.",
  ],
  INFJ: [
    "You thrive in roles that combine deep understanding with meaningful impact. You're drawn to work that matters — the kind that changes lives, shifts perspectives, or brings hidden truths to light.",
    "You need purpose like others need oxygen. Without it, you wither. But when you find the thing that lets you use your rare combination of empathy and vision, you become one of the most effective people in any room.",
  ],
  ENFP: [
    "You thrive in environments that value creativity, connection, and possibility. You're at your best when you're generating ideas, inspiring others, and exploring new territory.",
    "Routine kills your spirit; novelty feeds it. You need a workplace that understands that your best ideas come at weird times, in weird places, and often in the middle of three other conversations.",
  ],
  INFP: [
    "You thrive when your work aligns with your values. You're not motivated by money or status — you're motivated by meaning. When you find the thing that lets you express your inner world while making a difference, you become unstoppable.",
    "You need authenticity in your environment. Anything that feels performative or hollow will drain you fast. But give you work that resonates with your soul, and you'll pour everything into it.",
  ],
  ISTJ: [
    "You thrive in structured environments where quality and precision matter. You're the person who makes sure nothing falls through the cracks, who builds systems that actually work, and who delivers on every promise.",
    "Your reliability is your brand. People know that when you say something will get done, it gets done. This consistency is more valuable than any amount of flash or charisma.",
  ],
  ISFJ: [
    "You thrive when you're caring for others in tangible, practical ways. You're the one who creates order from chaos, remembers the details that matter, and makes everyone feel welcome and valued.",
    "Your quiet dedication is the backbone of every team you join. You don't need the spotlight — you need to know that what you do makes a real difference to real people.",
  ],
  ESTJ: [
    "You thrive in environments that need organization, leadership, and results. You're a natural project manager — the person who sees the big picture and the small details simultaneously.",
    "You turn scattered efforts into coordinated success. Your ability to create structure from chaos is rare and deeply needed. You're at your best when you're running the show.",
  ],
  ESFJ: [
    "You thrive in community-oriented environments where relationships matter. You're the social glue that holds groups together, the one who remembers everyone's name and makes sure no one feels left out.",
    "Your warmth is a structural asset. You create the kind of environment where people actually want to show up. That's not a soft skill — that's a superpower.",
  ],
  ISTP: [
    "You thrive when you're hands-on with a problem that needs solving. You're a natural troubleshooter — the person who can diagnose what's broken and fix it with elegant efficiency.",
    "You need autonomy, tools, and the freedom to work your way. Step-by-step instructions feel like a cage. You'd rather figure it out yourself, and you usually do — faster than anyone expected.",
  ],
  ISFP: [
    "You thrive in environments that value aesthetics, authenticity, and personal expression. You have an instinct for beauty — in design, in words, in how things are arranged.",
    "Your creative sensibility elevates everything you touch. You don't just make things work; you make them beautiful. This is a rarer and more valuable gift than most people realize.",
  ],
  ESTP: [
    "You thrive in fast-paced environments that reward quick thinking and bold action. You're a natural negotiator, performer, and crisis manager. You come alive when the stakes are real and the timeline is tight.",
    "You need action, not meetings. Your best work happens in the moment — responding, adapting, seizing. Planning has its place, but execution is where you shine.",
  ],
  ESFP: [
    "You thrive when you're connecting with people and bringing energy to a room. You're a natural entertainer, host, and vibe curator. Your ability to make people feel comfortable and alive is a genuine gift.",
    "You need an audience — not because you're vain, but because you draw energy from human connection. The more people you can reach, the more alive you feel.",
  ],
};

const SHADOWS = {
  金: [
    "Your shadow is control. You like things done your way because your way is usually right — but this can make the people around you feel like they're always being evaluated. Learning to let others lead, even imperfectly, is one of your most important growth edges.",
    "You have a tendency to bottle things up until you can't anymore. Your composure is admirable, but it can become a prison if you never let anyone see the cracks. Vulnerability isn't weakness — it's the price of genuine connection.",
    "Your standards are punishingly high — for yourself and for others. This keeps your quality high but your relationships tense. Not everything needs to be perfect. Sometimes good enough really is good enough.",
    "You can be so focused on the goal that you forget the journey. Your intensity is a gift, but it can also isolate you. Make sure you're not building walls and calling them boundaries.",
  ],
  木: [
    "Your shadow is overextension. You say yes to everything because you see potential everywhere — but your energy is finite. You can't grow in every direction at once. Learning to prune is just as important as learning to grow.",
    "You have a savior complex that sometimes masquerades as generosity. You can't fix everyone, and trying will leave you depleted. Help where you can, but don't set yourself on fire to keep others warm.",
    "Your optimism can become denial when you refuse to see what's not working. Not every seed will sprout, and not every situation has a growth opportunity hidden in it. Sometimes the wisest thing is to walk away.",
    "You resist endings even when they're necessary. You keep investing in things long past their expiration date because letting go feels like failure. It's not. It's making room for what's next.",
  ],
  水: [
    "Your shadow is absorption. You take on everyone's emotions, everyone's problems, everyone's pain — until you can't tell where you end and they begin. This isn't compassion; it's enmeshment. Build the dam.",
    "You have a tendency to retreat when things get hard instead of engaging. Your instinct is to go quiet, go deep, go alone — but sometimes the healing happens in the conversation, not the solitude.",
    "Your perceptiveness can become paranoia if you're not careful. You notice everything, which means you also notice the things that aren't there. Not every shift in someone's mood is about you.",
    "You can be so adaptable that you lose your own shape. You become whoever the situation needs you to be, which is useful until you forget who you actually are. Hold onto your core.",
  ],
  火: [
    "Your shadow is burnout disguised as passion. You go so hard and so fast that you don't notice the fire consuming your own fuel. Rest isn't laziness — it's maintenance. Your flame needs tending, not just feeding.",
    "You can be so focused on being seen that you forget to see others. Your natural magnetism is a gift, but it can become a spotlight that blinds you to the people standing in your shadow.",
    "Your impatience is your Achilles' heel. You want results now, progress now, answers now — but some things genuinely can't be rushed. Learning to wait without losing enthusiasm is your work.",
    "You sometimes mistake intensity for depth. A burning fire is impressive, but a deep well sustains. Make sure your relationships have roots, not just sparks.",
  ],
  土: [
    "Your shadow is stagnation disguised as stability. You can stay in a situation long after it's stopped serving you because change feels threatening. Comfort zones are cozy, but nothing grows there.",
    "You can be so cautious that you miss opportunities. Your risk assessment is excellent, but sometimes the biggest risk is not taking one. Fortune favors the bold — and you have more boldness than you give yourself credit for.",
    "Your stubbornness is legendary. Once you've made up your mind, it takes an earthquake to change it. This determination is an asset, but rigidity is not the same as strength. Bend before you break.",
    "You sometimes suppress your own needs in favor of being dependable. You're so busy being the rock for everyone else that you forget rocks need care too. Let someone be strong for you.",
  ],
};

const SEASON = {
  'under-20': [
    "You're in the season of becoming — when everything is possible and nothing is fixed. This is the time to try on different versions of yourself, to make mistakes that teach, and to collect experiences that will shape the person you're growing into.",
    "Don't rush to define yourself. The most interesting people are the ones who stayed curious the longest. Your messiness is not a flaw — it's the raw material of an extraordinary life being assembled in real time.",
  ],
  '20-25': [
    "You're in the season of emergence — when the blueprint of your life is still being drawn. This is the decade of firsts: first real job, first serious relationship, first time you realize your parents were just figuring it out too.",
    "The uncertainty you feel isn't a bug; it's a feature. It means you're paying attention. The people who have it all figured out at 23 are usually the ones having a crisis at 33. Your confusion is a sign of depth.",
  ],
  '26-30': [
    "You're in the season of definition — when the vague outlines of who you are start getting filled in with real choices. This is when you learn the difference between what you want and what you were told to want.",
    "The discomfort of this decade is the growing pain of becoming actual you. Every hard decision you make now — the job you take, the relationship you leave, the boundary you set — is a brick in the foundation of the person you're building.",
  ],
  '31-35': [
    "You're in the season of harvest — when the seeds you planted in your twenties start producing fruit. Some of it is sweeter than expected; some of it is bittersweet.",
    "This is the decade of reckoning with your choices and finding peace with the path you've chosen, even if it looks nothing like the plan. The beauty of this season is that you finally have enough experience to trust yourself.",
  ],
  '36-40': [
    "You're in the season of reclamation — when you start taking back the parts of yourself you abandoned to fit in. This is the decade of 'I don't care what they think' — not from bitterness, but from genuine self-knowledge.",
    "You're not starting over; you're starting from experience. Everything you've been through — every failure, every heartbreak, every unexpected detour — has been composting into wisdom. Now it's ready to bloom.",
  ],
  'over-40': [
    "You're in the season of mastery — when everything you've learned starts compounding into wisdom. This is the decade of effortless competence, of knowing exactly who you are and what you want.",
    "Finally giving yourself permission to want it without apology. The freedom of this season is real and hard-earned. You've survived enough to know what matters, and you're done wasting time on anything that doesn't.",
  ],
};

const FULL_PICTURE = {
  金: [
    "You are clarity in a world of noise — a steady, precise force that cuts through confusion and finds the truth. Your strength isn't loud, but it's undeniable.",
    "You're the person everyone trusts to make the hard call, to hold the line, to say the thing that needs saying. Your path isn't about being soft; it's about being so thoroughly yourself that your certainty becomes a gift to everyone around you.",
  ],
  木: [
    "You are growth incarnate — always reaching, always becoming, always finding the light even in the darkest soil. Your life is a story of resilience, of turning setbacks into springboards.",
    "You don't just survive; you expand. And in your expansion, you give everyone around you permission to grow too. Your roots run deeper than anyone knows, and that's exactly what keeps you standing when the wind picks up.",
  ],
  水: [
    "You are depth in a world of surfaces — a still, clear pool that reflects the sky and holds the moon. Your power lies not in force but in perception; not in speaking but in understanding.",
    "You feel what others can't name, see what others miss, and hold space for truths that haven't been spoken yet. Your sensitivity is not weakness — it's the most advanced form of intelligence. Trust your depths.",
  ],
  火: [
    "You are warmth and light — the person who makes a room brighter just by being in it. Your energy is generous, your passion is real, and your courage to live out loud is a gift to everyone who's too afraid to try.",
    "You don't dim yourself to make others comfortable; you shine so brightly that you give them permission to shine too. Your fire is not a performance — it's the truest thing about you.",
  ],
  土: [
    "You are the ground beneath everyone's feet — steady, nourishing, and absolutely essential. Your strength isn't dramatic, but it's the kind that holds up buildings.",
    "You're the person people lean on, the one who makes stability look easy, the quiet hero who keeps the world from falling apart. Your power is in your presence, and your presence is a gift that most people don't even realize they're receiving.",
  ],
};

// ========== HELPER FUNCTIONS ==========
function pick(arr, seed) {
  return arr[seed % arr.length];
}

function expandField(pool, key, seed) {
  const arr = pool[key] || pool['火'] || Object.values(pool)[0];
  const keys = Object.keys(pool);
  // Pick 3 different sentences from the pool (same key + adjacent keys)
  const s1 = pick(arr, seed);
  const altKey1 = keys[(keys.indexOf(key) + 1) % keys.length] || key;
  const altKey2 = keys[(keys.indexOf(key) + 2) % keys.length] || key;
  const s2 = pick(pool[altKey1] || arr, seed + 100);
  const s3 = pick(pool[altKey2] || arr, seed + 200);
  // Ensure no duplicates
  const parts = [s1];
  if (s2 !== s1) parts.push(s2);
  if (s3 !== s1 && s3 !== s2) parts.push(s3);
  return parts.join(' ');
}

function expandArray(arr, seed) {
  if (Array.isArray(arr)) {
    const extensions = [
      "The world needs what you bring — don't hold it back. Your particular combination of gifts is rare, and the more you lean into them, the more magnetic you become.",
      "This isn't just what you do; it's who you are at your core. Stop apologizing for it and start building a life that lets it shine fully.",
      "Lean into this — it's where your magic lives. Not everyone has what you have, and that's not arrogance, it's fact. Use it generously.",
      "The more you honor this part of yourself, the more alive you'll feel. This is your natural habitat — the place where effort becomes flow.",
      "Don't let anyone convince you this isn't valuable. Your gifts are specific, rare, and deeply needed. Trust that and act accordingly.",
      "This is where you come alive — where work stops feeling like work and starts feeling like purpose. Build your life around this truth.",
    ];
    const ext = extensions[seed % extensions.length];
    return arr.join(' ') + ' ' + ext;
  }
  return arr;
}

function upgradeProfile(template, index) {
  const fp = template.fingerprint || {};
  const seed = index;

  // Build upgraded English fields
  const en = {
    whoYouAre: expandField(WHO, fp.riZhuWuXing || '火', seed),
    howYouLove: expandField(LOVE, fp.dominantElement || 'Fire', seed + 10),
    whereYouThrive: expandArray(THRIVE[fp.mbti] || THRIVE['ENFP'], seed + 15),
    yourShadows: expandField(SHADOWS, fp.riZhuWuXing || '火', seed + 20),
    yourSeason: expandArray(SEASON[fp.ageGroup] || SEASON['26-30'], seed + 25),
    theFullPicture: expandArray(FULL_PICTURE[fp.riZhuWuXing] || FULL_PICTURE['火'], seed + 30),
  };

  // Keep existing zh unchanged
  const zh = template.zh || {};

  return {
    id: template.id,
    fingerprint: fp,
    matchAccuracy: template.matchAccuracy || 'exact',
    soulKeywords: template.soulKeywords || [],
    zh,
    en,
  };
}

// ========== MAIN ==========
const inputPath = path.join(__dirname, '..', 'templates', 'seed-profiles.json');
const outputPath = path.join(__dirname, '..', 'templates', 'seed-profiles-v2.json');

console.log('Reading existing templates...');
const existing = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`Found ${existing.length} templates`);

console.log('Upgrading English fields...');
const upgraded = existing.map((t, i) => upgradeProfile(t, i));

// Validate word counts
let underCount = 0;
let totalFields = 0;
for (const t of upgraded) {
  for (const field of ['whoYouAre', 'howYouLove', 'whereYouThrive', 'yourShadows', 'yourSeason', 'theFullPicture']) {
    totalFields++;
    const wc = (t.en[field] || '').split(/\s+/).length;
    if (wc < 80) underCount++;
  }
}

console.log(`Writing ${outputPath}...`);
fs.writeFileSync(outputPath, JSON.stringify(upgraded, null, 2));

console.log(`\nDone!`);
console.log(`Total templates: ${upgraded.length}`);
console.log(`Fields under 80 words: ${underCount}/${totalFields} (${(underCount/totalFields*100).toFixed(1)}%)`);
console.log(`Output: ${outputPath}`);
