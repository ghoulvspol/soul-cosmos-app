// server/scripts/generate-more-templates.js
// 在已有 5000 条基础上，再生成 5000 条新模板（不重复）
// 扩展句子片段池，增加更多维度的组合变体
const fs = require('fs');
const path = require('path');

// ========== 扩展中文片段池 ==========
const ZH = {
  whoYouAre: {
    金: [
      '你是一块淬炼过的铁——外表冷静，内里却燃着火。',
      '你像一把藏在鞘中的剑——不露锋芒，但关键时刻从不含糊。',
      '你的内心有一座熔炉，表面结着冰，底下是滚烫的钢水。',
      '你是沉默的利刃——不需要出鞘，气场已经说明一切。',
      '你像秋天的风——清冷、锐利，带着收割一切的决心。',
      '你是暗夜里的指南针——不动声色，但方向从不偏离。',
      '你的存在像一面镜子——照出别人的软弱，也映出自己的坚硬。',
      '你是那种不动则已、一动惊人的人。沉默是你的铠甲，行动是你的武器。',
      '你像老银匠手里的锤子——每一下都精准，从不浪费力气。',
      '你是冰川下的火山——表面千年不化，底下随时可能喷发。',
    ],
    木: [
      '你是一棵正在生长的树——根越扎越深，枝叶越来越广。',
      '你像春天的竹林——表面温和，内里有破土而出的力量。',
      '你是那种越挫越勇的人，逆境对你来说只是养分。',
      '你的生命力像野草一样顽强——给点阳光就灿烂，给点雨水就疯长。',
      '你是深山里的古树——见过风雨，所以不慌不忙。',
      '你像藤蔓——柔软但有方向，总能找到向上攀爬的路。',
      '你是春天的第一场雨——润物无声，但万物因你而醒。',
      '你的韧性是天生的——别人看到困难，你看到的是生长的缝隙。',
      '你像竹子——前四年只长三厘米，第五年一天长三十厘米。',
      '你是森林里的老橡树——不争不抢，但所有鸟都来你这里筑巢。',
    ],
    水: [
      '你像深海——表面平静，底下藏着整个世界的秘密。',
      '你是溪流——遇到石头不会硬碰，而是绕过去，最终到达大海。',
      '你的智慧像水一样——无形，却能适应任何容器。',
      '你是那种能看透人心的人，不是因为你刻意观察，而是因为你天生敏感。',
      '你是月光下的湖面——安静、深邃、倒映着整片天空。',
      '你像潮汐——有进有退，但永远不会真正消失。',
      '你是那种在人群中安静、独处时爆发的人。你的力量藏在沉默里。',
      '你像雨后的空气——清新、通透，让人不自觉地深呼吸。',
      '你是暗流——表面看不到，但水面下的方向由你决定。',
      '你像一面湖——风来了起波澜，风走了又归于平静。你的底色是安宁。',
    ],
    火: [
      '你是一团不灭的火——走到哪里，哪里就被点亮。',
      '你像夏天的太阳——热情直接，照到谁谁就暖。',
      '你的感染力是天生的——不需要刻意表现，存在本身就是焦点。',
      '你是燃烧型的人——要么不做，要做就全力以赴。',
      '你是篝火——围在你身边的人都觉得暖，但靠太近会被灼伤。',
      '你像闪电——一瞬间照亮整片天空，然后归于黑暗。你的出场总是惊艳的。',
      '你是那种走到哪里都自带聚光灯的人——不是刻意，是天赋。',
      '你像火山——大部分时间很平静，但爆发的时候，全世界都知道。',
      '你是夜空中最亮的星——不是因为你在最高处，而是因为你最亮。',
      '你是那种让人一见难忘的人——你的能量场太大了。',
    ],
    土: [
      '你是一座山——不说话，但所有人都知道你在那儿。',
      '你像大地一样——承载万物，却不邀功。',
      '你是那种别人可以依靠的人——稳重、踏实、说到做到。',
      '你的力量不在于速度，在于持久。你是一场马拉松，不是百米冲刺。',
      '你是老房子的地基——看不到，但没有你什么都撑不住。',
      '你像城墙——保护着里面的人，风吹雨打都不倒。',
      '你是那种做了很多但不说的人——你的善良是沉默的。',
      '你像古井——越深越清，越久越有味道。',
      '你是团队里的定海神针——别人慌的时候，看你一眼就安心了。',
      '你是大地的脊梁——不显山不露水，但承重能力无人能及。',
    ],
  },
  howYouLove: {
    Fire: [
      '你爱得像火——热烈、直接、不留余地。你的浪漫是行动，不是语言。',
      '你的爱是燃烧型的——一旦认定，就全情投入。但也容易灼伤自己。',
      '你在感情里是主动的那个——不怕付出，不怕受伤，怕的是没有回应。',
      '你谈恋爱像打仗——全力以赴，不给自己留退路。',
      '你的爱像烟花——绚烂、短暂、让人目眩神迷。',
      '你是那种会为爱冲昏头脑的人——但清醒后也不后悔。',
    ],
    Earth: [
      '你爱得实在——不说情话，但会记住她喜欢的咖啡温度。',
      '你的浪漫藏在细节里——生日礼物提前三个月准备，纪念日从不忘记。',
      '你是关系里的定海神针——对方慌的时候，你就是那个说"没事，有我在"的人。',
      '你表达爱的方式是行动——修水管、搬重物、默默把事情做好。',
      '你的爱像老酒——越陈越香，不会因为时间而变淡。',
      '你是那种用十年证明一件事的人——你的爱是慢热型的。',
    ],
    Air: [
      '你爱自由——你需要的是一个伴侣，不是一个牢笼。',
      '你在关系里最看重的是精神连接——能聊到天亮的人比好看的脸更吸引你。',
      '你的爱是平等的——不喜欢控制别人，也不喜欢被控制。',
      '你谈恋爱像交朋友——轻松、愉快、没有太多戏剧性。',
      '你的爱像风——来去自由，但从不缺席重要的时刻。',
      '你是那种给对方空间也给自己空间的人——距离产生美。',
    ],
    Water: [
      '你爱得深沉——不说出口，但每个眼神都在说我爱你。',
      '你在感情里是给予型的——总是付出更多，有时候忘了自己也需要被爱。',
      '你的爱像潮汐——有进有退，但永远不会真正离开。',
      '你需要的是一个能读懂你沉默的人，而不是需要你解释的人。',
      '你的爱像深海——表面看不到波澜，底下是整个世界。',
      '你是那种分手后还会默默关注对方的人——不是放不下，是太深情。',
    ],
  },
  whereYouThrive: {
    ENTJ: '你的天赋是把混乱变成秩序。你适合做领导者——不是因为你喜欢权力，而是因为你看到别人看不到的可能性。',
    INTJ: '你的天赋是深度思考加果断执行。你适合做战略家——在别人还在讨论的时候，你已经在行动了。',
    ENTP: '你的天赋是看到连接——把看似不相关的事物串联起来。你适合做创新者。',
    INTP: '你的天赋是拆解复杂问题。你适合做研究者——在别人觉得无聊的地方，你发现了乐趣。',
    ENFJ: '你的天赋是激励他人。你适合做教练、导师、或任何需要点燃别人热情的角色。',
    INFJ: '你的天赋是洞察人心。你适合做咨询师、作家、或任何需要理解人性的工作。',
    ENFP: '你的天赋是创造可能性。你适合做创业者——不是因为你擅长执行，而是因为你擅长想象。',
    INFP: '你的天赋是把感受变成文字。你适合做创作者——写作、音乐、艺术，任何需要表达内心的领域。',
    ISTJ: '你的天赋是把事情做到极致。你适合做工程师、会计师、或任何需要精确和耐心的工作。',
    ISFJ: '你的天赋是照顾他人。你适合做教育者、医护、或任何需要温暖和细心的职业。',
    ESTJ: '你的天赋是组织和管理。你适合做项目经理——把一盘散沙变成一支军队。',
    ESFJ: '你的天赋是营造和谐。你适合做HR、活动策划、或任何需要协调人际关系的角色。',
    ISTP: '你的天赋是动手解决问题。你适合做技术专家——在别人还在纸上谈兵的时候，你已经修好了。',
    ISFP: '你的天赋是感受美。你适合做设计师、摄影师、或任何需要审美直觉的工作。',
    ESTP: '你的天赋是抓住机会。你适合做销售、谈判、或任何需要快速反应的角色。',
    ESFP: '你的天赋是感染他人。你适合做表演者、主持人、或任何需要舞台魅力的职业。',
  },
  yourShadows: {
    金: [
      '你有一个温柔的陷阱——太想扛住一切，忘了自己也需要被照顾。学会示弱，是你最好的礼物。',
      '你的锋利是把双刃剑——用好了是果断，用过了是冷漠。注意刀口的方向。',
      '你太追求完美——当结果不如意时，你会比任何人都自责。放过自己吧。',
      '你的控制欲有时候让人窒息——不是所有人都需要你的保护。',
    ],
    木: [
      '你太相信"只要努力就能成功"，有时候忘了方向比速度更重要。停下来想想，不丢人。',
      '你的成长欲太强——有时候会忽略身边人的感受，只顾着往上长。',
      '你太容易心软——别人一示弱你就妥协，结果自己吃亏。',
      '你有一种隐性的固执——表面上听建议，实际上还是按自己的来。',
    ],
    水: [
      '你太容易共情，别人的情绪像水一样灌进你心里。学会建一道堤坝，不是冷漠，是自保。',
      '你有一个习惯——用忙碌逃避安静。停下来的时候，那些被你忽略的感受会一起涌上来。',
      '你太会读人心了——有时候读到的不是你想看到的。',
      '你的敏感是天赋也是诅咒——感受力太强，容易内耗。',
    ],
    火: [
      '你燃烧得太快——热情来得快去得也快。学会慢下来，让火变成炉火，不是野火。',
      '你太在意别人的目光——有时候做决定不是因为你想，而是因为你想被看到。',
      '你的脾气来得快去得也快——但留下的人不一定都能释怀。',
      '你有一种隐性的自恋——不是坏的那种，是太相信自己的判断了。',
    ],
    土: [
      '你太固执——认准了就不回头。但有时候，退一步不是认输，是智慧。',
      '你太安于现状——舒适区待久了，会忘了外面还有更大的世界。',
      '你太实在了——有时候需要学会包装自己，酒香也怕巷子深。',
      '你的沉默有时候会被误解为冷漠——其实你只是不知道怎么表达。',
    ],
  },
  yourSeason: {
    'under-20': [
      '你正处于探索期——什么都想试，什么都新鲜。别急着做决定，先多看看这个世界。',
      '你现在像一张白纸——所有的颜色都在等你选择。不要怕画错，年轻就是试错的资本。',
    ],
    '20-25': [
      '你正在从"什么都想要"变成"知道自己要什么"。这个转变不舒服，但很必要。',
      '你正处在人生的播种期——现在的每一个选择，都在为未来铺路。',
    ],
    '26-30': [
      '你正在收获前几年种下的东西。有些果实甜，有些不如意。接受不完美，继续走。',
      '你正站在一个十字路口——旧的路走到了尽头，新的路还没完全显现。这是转型期。',
    ],
    '31-35': [
      '你正处在人生的黄金期——既有经验又有精力。是时候做那件你一直想做的事了。',
      '你正在经历一次安静的蜕变——旧的你正在褪色，新的你正在显现。',
    ],
    '36-40': [
      '你正站在一个十字路口——旧的路走到了尽头，新的路还没完全显现。这是转型期。',
      '你已经走过了很长的路。现在不是冲刺的时候，是整理行囊、享受风景的时候。',
    ],
    'over-40': [
      '你已经走过了很长的路。现在不是冲刺的时候，是整理行囊、享受风景的时候。',
      '你的人生进入了收获季——前半生的积累正在开花结果。',
    ],
  },
  theFullPicture: {
    金: [
      '你是寒铁中的火种——表面冷静理性，内里热烈坚定。世界需要你的沉默力量。',
      '你是月光下的利刃——优雅、精准、不露声色。',
      '你是深秋的风——清冷中带着丰收的气息。',
    ],
    木: [
      '你是大地上的新芽——看似柔弱，却有穿透岩石的力量。你的成长，无人能挡。',
      '你是春天的承诺——每一朵花都是你给世界的礼物。',
      '你是深山里的溪流——安静地流，但从不停止。',
    ],
    水: [
      '你是深海中的光——表面平静，内里波澜壮阔。你的深度，是这个世界最稀缺的品质。',
      '你是月光下的潮汐——温柔却有力量，来去之间改变着海岸线。',
      '你是雨后的彩虹——经历过风雨，才能展现最美的颜色。',
    ],
    火: [
      '你是暗夜中的火炬——不需要理由，存在本身就是照亮。你的热情，是给世界的礼物。',
      '你是盛夏的果实——饱满、热烈、让人忍不住想靠近。',
      '你是夜空中最亮的星——不是因为你最高，而是因为你最亮。',
    ],
    土: [
      '你是大地之锚——在所有人都在漂的时候，你是那个让一切安稳下来的力量。',
      '你是老树的根——看不到，但没有你，上面的繁华都是空中楼阁。',
      '你是四季的轮回——沉稳、有序、从不缺席。',
    ],
  },
};

// ========== 扩展英文片段池 ==========
const EN = {
  whoYouAre: {
    金: [
      "You're forged like steel that keeps its warmth — calm on the surface, fire underneath.",
      "You're a blade in its sheath — quiet, but never dull. When you strike, it counts.",
      "There's a furnace inside you that the world rarely sees. Cool exterior, molten core.",
      "You don't need to prove anything. Your silence speaks louder than most people's words.",
      "You're autumn wind — sharp, clean, carrying the scent of everything you've harvested.",
      "You're a compass in the dark — still, but never losing direction.",
      "Your presence is a mirror — reflecting others' softness and your own steel.",
      "You're the kind who moves once and moves decisively. Silence is your armor; action is your weapon.",
      "You're a silversmith's hammer — every strike precise, never wasted.",
      "You're a glacier over a volcano — frozen surface, molten depths waiting to erupt.",
    ],
    木: [
      "You're a tree still growing — roots deeper, branches wider, reaching for something most people can't see.",
      "You're like bamboo — gentle on the surface, but with the power to break through concrete.",
      "Your resilience is your superpower. Setbacks don't break you; they feed you.",
      "You grow like wild grass — give you a little sun and you bloom, give you rain and you flourish.",
      "You're an ancient tree in the mountains — weathered, unhurried, knowing every season has its purpose.",
      "You're like a vine — soft but directional, always finding the way up.",
      "You're the first rain of spring — quiet, but everything blooms because of you.",
      "Your tenacity is innate — where others see obstacles, you see cracks to grow through.",
      "You're bamboo — four years underground, then thirty centimeters a day.",
      "You're the old oak in the forest — not competing, but every bird nests in your branches.",
    ],
    水: [
      "You're like the deep ocean — calm on the surface, holding the world's secrets underneath.",
      "You're a river — you don't fight the rocks, you flow around them. You always reach the sea.",
      "Your wisdom is water-shaped — formless, but it fits every vessel it enters.",
      "You see through people — not because you try, but because you were born with that kind of sight.",
      "You're a moonlit lake — quiet, deep, reflecting the entire sky.",
      "You're like the tide — ebbing and flowing, but never truly vanishing.",
      "You're the kind who's quiet in crowds but explosive in solitude. Your power hides in silence.",
      "You're like air after rain — fresh, clear, making everyone breathe deeper.",
      "You're an undercurrent — invisible on the surface, but you set the direction below.",
      "You're a lake — ruffled by wind, calm again when it passes. Your baseline is peace.",
    ],
    火: [
      "You're an unquenchable fire — wherever you go, things light up.",
      "You're the summer sun — warm, direct, impossible to ignore.",
      "Your charisma is effortless. You don't perform; you just exist, and the room tilts toward you.",
      "You're all-or-nothing. Either you don't start, or you burn all the way through.",
      "You're a campfire — everyone around you feels warm, but get too close and you'll burn.",
      "You're lightning — one flash lights up the whole sky, then darkness. Your entrances are always stunning.",
      "You're the kind who carries a spotlight everywhere — not on purpose, it's just天赋.",
      "You're a volcano — mostly calm, but when you erupt, the whole world knows.",
      "You're the brightest star in the night sky — not because you're highest, but because you burn brightest.",
      "You're unforgettable — your energy field is just too big.",
    ],
    土: [
      "You're a mountain — silent, but everyone knows you're there.",
      "You're like the earth — carrying everything, never asking for credit.",
      "You're the person others lean on — steady, reliable, true to your word.",
      "Your strength isn't speed. It's endurance. You're a marathon, not a sprint.",
      "You're a building's foundation — invisible, but without you nothing stands.",
      "You're like a city wall — protecting those inside, standing through every storm.",
      "You're the kind who does a lot but says little — your kindness is silent.",
      "You're an old well — the deeper you go, the clearer you become.",
      "You're the anchor in a team — when others panic, one look at you calms them.",
      "You're the spine of the earth — unassuming, but carrying everything.",
    ],
  },
  howYouLove: {
    Fire: [
      "You love like fire — fierce, direct, no holding back. Your romance is action, not words.",
      "Your love burns bright and hot. Once you're in, you're all in. But be careful not to burn yourself.",
      "You're the one who makes the first move — unafraid of giving, unafraid of getting hurt.",
      "You love like you mean it — no games, no half-measures.",
      "Your love is like fireworks — dazzling, intense, leaving everyone breathless.",
      "You're the kind who falls hard and fast — but you never regret it, even when it hurts.",
    ],
    Earth: [
      "You love with substance. No poetry, but you remember her coffee order three months later.",
      "Your romance lives in details — the birthday gift planned months ahead, the anniversary never forgotten.",
      "You're the anchor in a relationship — when the other person panics, you're the one saying 'I've got this.'",
      "You express love through actions — fixing the sink, carrying the heavy things, making life easier without being asked.",
      "Your love is like aged wine — the longer it lasts, the better it gets.",
      "You're the kind who proves love over ten years — your love is slow-burn, not instant fire.",
    ],
    Air: [
      "You love freedom. You need a partner, not a cage.",
      "What you value most in a relationship is mental connection — someone you can talk to until 3am beats a pretty face every time.",
      "Your love is equal — no controlling, no being controlled. Partnership, not possession.",
      "You date like you make friends — easy, fun, no drama.",
      "Your love is like the wind — free, present, never missing the moments that matter.",
      "You're the kind who gives space and needs space — distance makes the heart grow fonder.",
    ],
    Water: [
      "You love deeply and silently. Every look says what words can't.",
      "You're the giver in relationships — always giving more, sometimes forgetting you need love too.",
      "Your love is like the tide — it ebbs and flows, but it never truly leaves.",
      "You need someone who reads your silence, not someone who needs you to explain.",
      "Your love is like the deep ocean — no visible waves, but an entire world underneath.",
      "You're the kind who still checks on an ex months later — not hung up, just deeply wired.",
    ],
  },
  whereYouThrive: {
    ENTJ: 'Your gift is turning chaos into order. You\'re built to lead — not because you want power, but because you see possibilities others miss.',
    INTJ: 'Your gift is deep thinking plus decisive action. You\'re built to be the strategist — while others discuss, you execute.',
    ENTP: 'Your gift is seeing connections. You\'re built to innovate — linking things that seem unrelated into something brilliant.',
    INTP: 'Your gift is deconstructing complexity. You\'re built to be the researcher — where others see tedium, you find delight.',
    ENFJ: 'Your gift is inspiring others. You\'re built to be the coach, the mentor, the one who lights other people\'s fire.',
    INFJ: 'Your gift is reading people. You\'re built for counseling, writing, or any work that requires understanding human nature.',
    ENFP: 'Your gift is creating possibility. You\'re built to be the entrepreneur — not the executor, but the visionary.',
    INFP: 'Your gift is turning feeling into form. You\'re built to be the creator — writing, music, art, anything that expresses the inner world.',
    ISTJ: 'Your gift is precision. You\'re built for engineering, accounting, or any work that demands accuracy and patience.',
    ISFJ: 'Your gift is nurturing. You\'re built for education, healthcare, or any role that needs warmth and attention.',
    ESTJ: 'Your gift is organizing. You\'re built to be the project manager — turning scattered pieces into a unified force.',
    ESFJ: 'Your gift is creating harmony. You\'re built for HR, event planning, or any role that coordinates people.',
    ISTP: 'Your gift is hands-on problem solving. You\'re built to be the technical expert — you fix things while others are still talking.',
    ISFP: 'Your gift is sensing beauty. You\'re built for design, photography, or any work that needs aesthetic instinct.',
    ESTP: 'Your gift is seizing opportunity. You\'re built for sales, negotiation, or any role that needs quick reflexes.',
    ESFP: 'Your gift is energizing others. You\'re built for performance, hosting, or any role that needs stage presence.',
  },
  yourShadows: {
    金: [
      "You carry a gentle trap — wanting to hold everything together so much that you forget to rest. Learning to say 'I need help' is your gift this season.",
      "Your sharpness is a double-edged sword — wielded well it's decisiveness, overused it's coldness. Watch where the blade points.",
      "You're a perfectionist — when results fall short, you're harder on yourself than anyone. Give yourself a break.",
      "Your need for control can suffocate — not everyone needs your protection.",
    ],
    木: [
      "You believe too hard that effort equals success. Sometimes direction matters more than speed. Stop and think — it's not weakness.",
      "Your growth instinct is so strong you sometimes ignore how others feel while you're reaching upward.",
      "You're too soft-hearted — the moment someone shows weakness, you cave. You end up吃亏.",
      "You have a quiet stubbornness — you listen to advice on the surface, but underneath you do it your way.",
    ],
    水: [
      "You absorb others' emotions like a sponge. Build a dam — not out of coldness, but self-preservation.",
      "You have a habit of outrunning stillness. When you stop, the feelings you've been avoiding surface all at once.",
      "You read people too well — sometimes what you read isn't what you wanted to see.",
      "Your sensitivity is both gift and curse — the feeling is so strong, it drains you from within.",
    ],
    火: [
      "You burn too fast — passion arrives quickly and leaves just as quickly. Learn to slow down. Turn wildfire into hearthfire.",
      "You care too much about how others see you — sometimes your decisions aren't yours, they're performances.",
      "Your temper flares fast and fades fast — but the people left behind don't always recover as quickly.",
      "You have a quiet narcissism — not the bad kind, just a deep trust in your own judgment.",
    ],
    土: [
      "You're too stubborn — once you've decided, you don't look back. But sometimes stepping back isn't surrender. It's wisdom.",
      "You're too comfortable — the comfort zone expands until you forget there's a bigger world outside.",
      "You're too honest — sometimes you need to package yourself. Good wine still fears the dark alley.",
      "Your silence gets mistaken for coldness — you're not冷漠, you just don't know how to express it.",
    ],
  },
  yourSeason: {
    'under-20': [
      "You're in exploration mode — everything is new, everything is exciting. Don't rush to decide. See the world first.",
      "You're a blank canvas — every color is waiting for your choice. Don't fear mistakes; youth is the capital for trial.",
    ],
    '20-25': [
      "You're shifting from 'wanting everything' to 'knowing what you want.' The transition is uncomfortable but necessary.",
      "You're in the planting season — every choice you make now is paving the road to your future.",
    ],
    '26-30': [
      "You're harvesting what you planted years ago. Some fruit is sweet, some isn't. Accept the imperfection and keep walking.",
      "You're at a crossroads — the old road has ended, the new one hasn't fully appeared. This is transformation.",
    ],
    '31-35': [
      "You're in life's golden hour — experience and energy in perfect balance. It's time to do the thing you've always wanted.",
      "You're undergoing a quiet metamorphosis — the old you is fading, the new you is emerging.",
    ],
    '36-40': [
      "You're at a crossroads — the old road has ended, the new one hasn't fully appeared. This is transformation.",
      "You've walked a long road. This isn't the time to sprint. It's time to pack light and enjoy the scenery.",
    ],
    'over-40': [
      "You've walked a long road. This isn't the time to sprint. It's time to pack light and enjoy the scenery.",
      "Your life has entered harvest season — the seeds of the first half are finally blooming.",
    ],
  },
  theFullPicture: {
    金: [
      "A quiet fire wrapped in steel — that's who you are. Steady on the outside, fiercely alive within. The world needs your grounded presence.",
      "A blade under moonlight — elegant, precise, never announcing itself.",
      "Autumn wind — sharp and carrying the scent of everything you've gathered.",
    ],
    木: [
      "A sprout on solid ground — fragile-looking, but with the power to split rock. Your growth is unstoppable.",
      "Spring's promise — every bloom is your gift to the world.",
      "A mountain stream — quiet, but it never stops flowing.",
    ],
    水: [
      "Light in the deep ocean — calm on the surface, vast within. Your depth is the rarest quality in this world.",
      "Moonlit tide — gentle yet powerful, reshaping the shoreline with every movement.",
      "A rainbow after the storm — you had to go through the rain to show your most beautiful colors.",
    ],
    火: [
      "A torch in the dark — no reason needed, your existence is the light. Your fire is a gift to the world.",
      "Summer fruit — full, warm, impossible to resist.",
      "The brightest star — not because you're highest, but because you burn hottest.",
    ],
    土: [
      "The earth's anchor — while everyone drifts, you're the one who steadies everything.",
      "A tree's roots — invisible, but without them, all the beauty above is just air.",
      "The cycle of seasons — steady, ordered, never缺席.",
    ],
  },
};

// ========== 工具函数 ==========
function pick(arr, seed) {
  return arr[seed % arr.length];
}

function generateTemplate(combo) {
  const t = combo.tags;
  const seed = parseInt(combo.id.replace('new_', ''), 10);

  const zhWho = pick(ZH.whoYouAre[t.riZhuWuXing] || ZH.whoYouAre['火'], seed);
  const zhLove = pick(ZH.howYouLove[t.dominantElement] || ZH.howYouLove['Fire'], seed + 1);
  const zhThrive = ZH.whereYouThrive[t.mbti] || '你的天赋在于看到别人忽略的连接。在创造和搭建新事物的时候，你是最闪亮的。';
  const zhShadow = pick(ZH.yourShadows[t.riZhuWuXing] || ZH.yourShadows['火'], seed + 2);
  const zhSeason = pick(ZH.yourSeason[t.ageGroup] || ZH.yourSeason['26-30'], seed + 3);
  const zhFull = pick(ZH.theFullPicture[t.riZhuWuXing] || ZH.theFullPicture['火'], seed + 4);

  const enWho = pick(EN.whoYouAre[t.riZhuWuXing] || EN.whoYouAre['火'], seed + 5);
  const enLove = pick(EN.howYouLove[t.dominantElement] || EN.howYouLove['Fire'], seed + 6);
  const enThrive = EN.whereYouThrive[t.mbti] || 'Your gift is seeing connections others miss. You shine brightest when creating, imagining, building something new.';
  const enShadow = pick(EN.yourShadows[t.riZhuWuXing] || EN.yourShadows['火'], seed + 7);
  const enSeason = pick(EN.yourSeason[t.ageGroup] || EN.yourSeason['26-30'], seed + 8);
  const enFull = pick(EN.theFullPicture[t.riZhuWuXing] || EN.theFullPicture['火'], seed + 9);

  return {
    id: combo.id,
    fingerprint: t,
    matchAccuracy: 'exact',
    zh: {
      whoYouAre: zhWho,
      howYouLove: zhLove,
      whereYouThrive: zhThrive,
      yourShadows: zhShadow,
      yourSeason: zhSeason,
      theFullPicture: zhFull,
    },
    en: {
      whoYouAre: enWho,
      howYouLove: enLove,
      whereYouThrive: enThrive,
      yourShadows: enShadow,
      yourSeason: enSeason,
      theFullPicture: enFull,
    },
  };
}

// ========== 主程序 ==========
const WU_XING = ['金', '木', '水', '火', '土'];
const SUN_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ZIWEI_STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const GENDERS = ['male', 'female'];
const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'];
const YIN_YANG = ['阳', '阴'];
const GE_JUS = ['建禄格', '食神格', '正印格', '正财格', '正官格', '伤官配印', '伤官格', '偏财格', '偏官格', '偏印格', '比劫格', '杂气格'];
const AGE_GROUPS = ['under-20', '20-25', '26-30', '31-35', '36-40', 'over-40'];

// 加载已有模板
const existingPath = path.join(__dirname, '..', 'templates', 'seed-profiles.json');
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
const existingKeys = new Set(existing.map(t => {
  const f = t.fingerprint || {};
  return [f.riZhuWuXing, f.sunSign, f.mainStar, f.mbti, f.gender].join('|');
}));

console.log(`Existing: ${existing.length} templates, ${existingKeys.size} unique keys`);

// 生成新组合（不重复）
const target = 5000;
const newCombos = [];
let attempts = 0;
while (newCombos.length < target && attempts < target * 10) {
  attempts++;
  const wx = WU_XING[Math.floor(Math.random() * WU_XING.length)];
  const sun = SUN_SIGNS[Math.floor(Math.random() * SUN_SIGNS.length)];
  const star = ZIWEI_STARS[Math.floor(Math.random() * ZIWEI_STARS.length)];
  const mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
  const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
  const key = `${wx}|${sun}|${star}|${mbti}|${gender}`;

  if (existingKeys.has(key)) continue;
  existingKeys.add(key);

  const yy = YIN_YANG[Math.floor(Math.random() * YIN_YANG.length)];
  const moon = SUN_SIGNS[Math.floor(Math.random() * SUN_SIGNS.length)];
  const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
  const hex = Math.floor(Math.random() * 64) + 1;
  const geju = GE_JUS[Math.floor(Math.random() * GE_JUS.length)];
  const wxDom = WU_XING[Math.floor(Math.random() * WU_XING.length)];
  const wxLack = WU_XING.filter(w => w !== wxDom)[Math.floor(Math.random() * 4)];
  const ageGroup = AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)];

  newCombos.push({
    id: `new_${String(newCombos.length).padStart(4, '0')}`,
    tags: {
      riZhuWuXing: wx, riZhuYinYang: yy, geJu: geju,
      wuXingDominant: wxDom, wuXingLack: wxLack,
      sunSign: sun, moonSign: moon, dominantElement: element,
      mainStar: star, hexagramNumber: hex,
      mbti: mbti, gender: gender, ageGroup: ageGroup,
    },
  });
}

console.log(`Generated ${newCombos.length} new unique combinations (${attempts} attempts)`);

// 生成模板
const newTemplates = newCombos.map(generateTemplate);

// 合并
const merged = [...existing, ...newTemplates];
fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
console.log(`Total templates: ${merged.length}`);
console.log(`Written to: ${existingPath}`);
