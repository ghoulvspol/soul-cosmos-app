// server/monthly-engine.js

function generateMonthlyForecast(userTags, date) {
  const month = date.getMonth();
  const theme = getMonthlyTheme(month);

  return {
    month: `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
    forecast: {
      theme: theme.zh,
      themeEn: theme.en,
      focus: theme.focus,
      focusEn: theme.focusEn,
    },
  };
}

function getMonthlyTheme(month) {
  const themes = [
    { zh: '新年伊始，适合制定年度目标和愿景。', en: 'New year energy — set intentions and annual goals.', focus: '规划', focusEn: 'Planning' },
    { zh: '关系成为主题，深化现有连接或清理不再服务你的关系。', en: 'Relationships are the theme. Deepen or release.', focus: '关系', focusEn: 'Relationships' },
    { zh: '行动力最强的月份，大胆推进搁置已久的计划。', en: 'Peak action energy. Push forward on stalled plans.', focus: '行动', focusEn: 'Action' },
    { zh: '内在世界需要关注，适合疗愈和自我反思。', en: 'Inner world needs attention. Heal and reflect.', focus: '疗愈', focusEn: 'Healing' },
    { zh: '创造力和表达欲高涨，是展示才华的好时机。', en: 'Creativity and expression peak. Show your gifts.', focus: '创造', focusEn: 'Creation' },
    { zh: '家庭和根基成为焦点，修缮居住环境或处理家族事务。', en: 'Home and roots take focus. Fix your space or family matters.', focus: '根基', focusEn: 'Foundation' },
    { zh: '社交圈扩大，新的人脉和合作机会涌现。', en: 'Social circle expands. New connections and collaborations emerge.', focus: '社交', focusEn: 'Social' },
    { zh: '深度工作月，适合推进需要专注力的长期项目。', en: 'Deep work month. Push long-term projects requiring focus.', focus: '专注', focusEn: 'Focus' },
    { zh: '学习和成长能量最强，适合充电和拓展视野。', en: 'Learning energy peaks. Recharge and expand horizons.', focus: '学习', focusEn: 'Learning' },
    { zh: '事业运势上升，适合争取晋升或启动新项目。', en: 'Career fortune rises. Seek promotion or launch projects.', focus: '事业', focusEn: 'Career' },
    { zh: '财富主题突出，审视财务状况并做好年终规划。', en: 'Wealth theme prominent. Review finances and plan year-end.', focus: '财富', focusEn: 'Wealth' },
    { zh: '年度收尾，感恩过去一年的收获，为新年做准备。', en: 'Year-end closure. Gratitude for the year, preparation for the next.', focus: '感恩', focusEn: 'Gratitude' },
  ];
  return themes[month];
}

module.exports = { generateMonthlyForecast };
