// server/scripts/generate-seed-templates.js
// 组合式模板生成器：从句子片段池中按标签组合拼接，瞬间生成 5000 条画像模板
// 成本：$0，耗时：<1s
const fs = require('fs');
const path = require('path');

// ========== 中文片段池 ==========
const ZH = {
  whoYouAre: {
    金: [
      '你是一块淬炼过的铁——外表冷静，内里却燃着火。',
      '你像一把藏在鞘中的剑——不露锋芒，但关键时刻从不含糊。',
      '你的内心有一座熔炉，表面结着冰，底下是滚烫的钢水。',
      '你是沉默的利刃——不需要出鞘，气场已经说明一切。',
    ],
    木: [
      '你是一棵正在生长的树——根越扎越深，枝叶越来越广。',
      '你像春天的竹林——表面温和，内里有破土而出的力量。',
      '你是那种越挫越勇的人，逆境对你来说只是养分。',
      '你的生命力像野草一样顽强——给点阳光就灿烂，给点雨水就疯长。',
    ],
    水: [
      '你像深海——表面平静，底下藏着整个世界的秘密。',
      '你是溪流——遇到石头不会硬碰，而是绕过去，最终到达大海。',
      '你的智慧像水一样——无形，却能适应任何容器。',
      '你是那种能看透人心的人，不是因为你刻意观察，而是因为你天生敏感。',
    ],
    火: [
      '你是一团不灭的火——走到哪里，哪里就被点亮。',
      '你像夏天的太阳——热情直接，照到谁谁就暖。',
      '你的感染力是天生的——不需要刻意表现，存在本身就是焦点。',
      '你是燃烧型的人——要么不做，要做就全力以赴。',
    ],
    土: [
      '你是一座山——不说话，但所有人都知道你在那儿。',
      '你像大地一样——承载万物，却不邀功。',
      '你是那种别人可以依靠的人——稳重、踏实、说到做到。',
      '你的力量不在于速度，在于持久。你是一场马拉松，不是百米冲刺。',
    ],
  },
  howYouLove: {
    Fire: [
      '你爱得像火——热烈、直接、不留余地。你的浪漫是行动，不是语言。',
      '你的爱是燃烧型的——一旦认定，就全情投入。但也容易灼伤自己。',
      '你在感情里是主动的那个——不怕付出，不怕受伤，怕的是没有回应。',
      '你谈恋爱像打仗——全力以赴，不给自己留退路。',
    ],
    Earth: [
      '你爱得实在——不说情话，但会记住她喜欢的咖啡温度。',
      '你的浪漫藏在细节里——生日礼物提前三个月准备，纪念日从不忘记。',
      '你是关系里的定海神针——对方慌的时候，你就是那个说"没事，有我在"的人。',
      '你表达爱的方式是行动——修水管、搬重物、默默把事情做好。',
    ],
    Air: [
      '你爱自由——你需要的是一个伴侣，不是一个牢笼。',
      '你在关系里最看重的是精神连接——能聊到天亮的人比好看的脸更吸引你。',
      '你的爱是平等的——不喜欢控制别人，也不喜欢被控制。',
      '你谈恋爱像交朋友——轻松、愉快、没有太多戏剧性。',
    ],
    Water: [
      '你爱得深沉——不说出口，但每个眼神都在说我爱你。',
      '你在感情里是给予型的——总是付出更多，有时候忘了自己也需要被爱。',
      '你的爱像潮汐——有进有退，但永远不会真正离开。',
      '你需要的是一个能读懂你沉默的人，而不是需要你解释的人。',
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
    金: '你有一个温柔的陷阱——太想扛住一切，忘了自己也需要被照顾。学会示弱，是你最好的礼物。',
    木: '你太相信"只要努力就能成功"，有时候忘了方向比速度更重要。停下来想想，不丢人。',
    水: '你太容易共情，别人的情绪像水一样灌进你心里。学会建一道堤坝，不是冷漠，是自保。',
    火: '你燃烧得太快——热情来得快去得也快。学会慢下来，让火变成炉火，不是野火。',
    土: '你太固执——认准了就不回头。但有时候，退一步不是认输，是智慧。',
  },
  yourSeason: {
    '20-25': '你正处于探索期——什么都想试，什么都新鲜。别急着做决定，先多看看这个世界。',
    '26-30': '你正在从"什么都想要"变成"知道自己要什么"。这个转变不舒服，但很必要。',
    '31-35': '你正在收获前几年种下的东西。有些果实甜，有些不如意。接受不完美，继续走。',
    '36-40': '你正站在一个十字路口——旧的路走到了尽头，新的路还没完全显现。这是转型期。',
    'over-40': '你已经走过了很长的路。现在不是冲刺的时候，是整理行囊、享受风景的时候。',
    'under-20': '你的人生才刚刚开始。所有的迷茫都是正常的，所有的试错都有价值。',
  },
  theFullPicture: {
    金: '你是寒铁中的火种——表面冷静理性，内里热烈坚定。世界需要你的沉默力量。',
    木: '你是大地上的新芽——看似柔弱，却有穿透岩石的力量。你的成长，无人能挡。',
    水: '你是深海中的光——表面平静，内里波澜壮阔。你的深度，是这个世界最稀缺的品质。',
    火: '你是暗夜中的火炬——不需要理由，存在本身就是照亮。你的热情，是给世界的礼物。',
    土: '你是大地之锚——在所有人都在漂的时候，你是那个让一切安稳下来的力量。',
  },
};

// ========== 英文片段池 ==========
const EN = {
  whoYouAre: {
    金: [
      "You're forged like steel that keeps its warmth — calm on the surface, fire underneath.",
      "You're a blade in its sheath — quiet, but never dull. When you strike, it counts.",
      "There's a furnace inside you that the world rarely sees. Cool exterior, molten core.",
      "You don't need to prove anything. Your silence speaks louder than most people's words.",
    ],
    木: [
      "You're a tree still growing — roots deeper, branches wider, reaching for something most people can't see.",
      "You're like bamboo — gentle on the surface, but with the power to break through concrete.",
      "Your resilience is your superpower. Setbacks don't break you; they feed you.",
      "You grow like wild grass — give you a little sun and you bloom, give you rain and you flourish.",
    ],
    水: [
      "You're like the deep ocean — calm on the surface, holding the world's secrets underneath.",
      "You're a river — you don't fight the rocks, you flow around them. You always reach the sea.",
      "Your wisdom is water-shaped — formless, but it fits every vessel it enters.",
      "You see through people — not because you try, but because you were born with that kind of sight.",
    ],
    火: [
      "You're an unquenchable fire — wherever you go, things light up.",
      "You're the summer sun — warm, direct, impossible to ignore.",
      "Your charisma is effortless. You don't perform; you just exist, and the room tilts toward you.",
      "You're all-or-nothing. Either you don't start, or you burn all the way through.",
    ],
    土: [
      "You're a mountain — silent, but everyone knows you're there.",
      "You're like the earth — carrying everything, never asking for credit.",
      "You're the person others lean on — steady, reliable, true to your word.",
      "Your strength isn't speed. It's endurance. You're a marathon, not a sprint.",
    ],
  },
  howYouLove: {
    Fire: [
      "You love like fire — fierce, direct, no holding back. Your romance is action, not words.",
      "Your love burns bright and hot. Once you're in, you're all in. But be careful not to burn yourself.",
      "You're the one who makes the first move — unafraid of giving, unafraid of getting hurt.",
      "You love like you mean it — no games, no half-measures.",
    ],
    Earth: [
      "You love with substance. No poetry, but you remember her coffee order three months later.",
      "Your romance lives in details — the birthday gift planned months ahead, the anniversary never forgotten.",
      "You're the anchor in a relationship — when the other person panics, you're the one saying 'I've got this.'",
      "You express love through actions — fixing the sink, carrying the heavy things, making life easier without being asked.",
    ],
    Air: [
      "You love freedom. You need a partner, not a cage.",
      "What you value most in a relationship is mental connection — someone you can talk to until 3am beats a pretty face every time.",
      "Your love is equal — no controlling, no being controlled. Partnership, not possession.",
      "You date like you make friends — easy, fun, no drama.",
    ],
    Water: [
      "You love deeply and silently. Every look says what words can't.",
      "You're the giver in relationships — always giving more, sometimes forgetting you need love too.",
      "Your love is like the tide — it ebbs and flows, but it never truly leaves.",
      "You need someone who reads your silence, not someone who needs you to explain.",
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
    金: "You carry a gentle trap — wanting to hold everything together so much that you forget to rest. Learning to say 'I need help' is your gift this season.",
    木: "You believe too hard that effort equals success. Sometimes direction matters more than speed. Stop and think — it's not weakness.",
    水: "You absorb others' emotions like a sponge. Build a dam — not out of coldness, but self-preservation.",
    火: "You burn too fast — passion arrives quickly and leaves just as quickly. Learn to slow down. Turn wildfire into hearthfire.",
    土: "You're too stubborn — once you've decided, you don't look back. But sometimes stepping back isn't surrender. It's wisdom.",
  },
  yourSeason: {
    '20-25': "You're in exploration mode — everything is new, everything is exciting. Don't rush to decide. See the world first.",
    '26-30': "You're shifting from 'wanting everything' to 'knowing what you want.' The transition is uncomfortable but necessary.",
    '31-35': "You're harvesting what you planted years ago. Some fruit is sweet, some isn't. Accept the imperfection and keep walking.",
    '36-40': "You're at a crossroads — the old road has ended, the new one hasn't fully appeared. This is transformation.",
    'over-40': "You've walked a long road. This isn't the time to sprint. It's time to pack light and enjoy the scenery.",
    'under-20': "Your life is just beginning. All the confusion is normal. All the trial and error has value.",
  },
  theFullPicture: {
    金: "A quiet fire wrapped in steel — that's who you are. Steady on the outside, fiercely alive within. The world needs your grounded presence.",
    木: "A sprout on solid ground — fragile-looking, but with the power to split rock. Your growth is unstoppable.",
    水: "Light in the deep ocean — calm on the surface, vast within. Your depth is the rarest quality in this world.",
    火: "A torch in the dark — no reason needed, your existence is the light. Your fire is a gift to the world.",
    土: "The earth's anchor — while everyone drifts, you're the one who steadies everything.",
  },
};

// ========== 生成模板 ==========
function pick(arr, seed) {
  return arr[seed % arr.length];
}

function generateTemplate(combo) {
  const t = combo.tags;
  const seed = parseInt(combo.id.replace('seed_', ''), 10);

  // 为每个维度选择片段
  const zhWho = pick(ZH.whoYouAre[t.riZhuWuXing] || ZH.whoYouAre['火'], seed);
  const zhLove = pick(ZH.howYouLove[t.dominantElement] || ZH.howYouLove['Fire'], seed + 1);
  const zhThrive = ZH.whereYouThrive[t.mbti] || '你的天赋在于看到别人忽略的连接。在创造和搭建新事物的时候，你是最闪亮的。';
  const zhShadow = ZH.yourShadows[t.riZhuWuXing] || ZH.yourShadows['火'];
  const zhSeason = ZH.yourSeason[t.ageGroup] || ZH.yourSeason['26-30'];
  const zhFull = ZH.theFullPicture[t.riZhuWuXing] || ZH.theFullPicture['火'];

  const enWho = pick(EN.whoYouAre[t.riZhuWuXing] || EN.whoYouAre['火'], seed + 2);
  const enLove = pick(EN.howYouLove[t.dominantElement] || EN.howYouLove['Fire'], seed + 3);
  const enThrive = EN.whereYouThrive[t.mbti] || 'Your gift is seeing connections others miss. You shine brightest when creating, imagining, building something new.';
  const enShadow = EN.yourShadows[t.riZhuWuXing] || EN.yourShadows['火'];
  const enSeason = EN.yourSeason[t.ageGroup] || EN.yourSeason['26-30'];
  const enFull = EN.theFullPicture[t.riZhuWuXing] || EN.theFullPicture['火'];

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
const combosPath = path.join(__dirname, '..', 'templates', 'tag-combinations.json');
const combos = JSON.parse(fs.readFileSync(combosPath, 'utf-8'));

// 加入 ageGroup
const enriched = combos.map(c => {
  const ageGroups = ['under-20', '20-25', '26-30', '31-35', '36-40', 'over-40'];
  c.tags.ageGroup = ageGroups[parseInt(c.id.replace('seed_', ''), 10) % ageGroups.length];
  return c;
});

const templates = enriched.map(generateTemplate);

// 合并已有种子模板
const existingPath = path.join(__dirname, '..', 'templates', 'seed-profiles.json');
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
  console.log(`Loaded ${existing.length} existing seed templates`);
} catch {}

const merged = [...existing, ...templates];
const outPath = path.join(__dirname, '..', 'templates', 'seed-profiles.json');
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
console.log(`Generated ${templates.length} templates, merged total: ${merged.length}`);
console.log(`Written to: ${outPath}`);
