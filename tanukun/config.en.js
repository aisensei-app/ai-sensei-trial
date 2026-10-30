/* =========================================================
   タヌくん 設定の英語（英語のときだけ、config.js の文を上書きする。i18n.js が重ねる）
   ・書いた所だけが入れかわります（絵・数字などはそのまま）
   ・配列（memories・lines など）は、同じ順番の所に重ねます（1つ目は1つ目に）
   ・{name} は呼び名（名前なしのときは、呼びかけは消えて、文の途中は you）
   ========================================================= */
(window.TANU_CONFIG_I18N = window.TANU_CONFIG_I18N || {}).en = {

  parts: { navel: { label: 'Belly button', items: [{ name: 'Outie' }] } },

  bellyWords: { words: ['Pon!', 'Poko!'], pull: 'Boiiing!' },

  timeOfDay: {
    bands: [
      { wake: 'Munch munch… gulp! Okay, let\'s play!' },
      {},
      { wake: 'Nnn~… stretch! Okay, let\'s play!' },
      { wake: 'Fwaa~… I can still play!' },
      { wake: 'Fwa…? Oh, it\'s {name}!\nYou woke me up' }
    ]
  },

  friendship: {
    rewards: [
      'I\'ll call you by name more often',
      'Something\'s reaction seems to have changed…?',
      'New lines unlocked!',
      'Something\'s reaction changed even more…?',
      'You might get to see a special side of me…?'
    ],
    teasers: [
      'We might get even closer tomorrow…?',
      'We might get even closer tomorrow…?',
      'I wonder what face I\'ll show you tomorrow…?',
      'Something special is coming soon…?',
      'Just a little more until something special…?',
      'Looks like there are still secrets…?',
      'Come see me again tomorrow'
    ]
  },

  memories: [
    { title: 'Nice to Meet You',
      lines: ['…Ehehe. {name}\'s hands are so gentle', 'I feel like we could become really close', 'Let\'s be friends from now on!'] },
    { title: 'Sharing a Snack',
      lines: ['This is the tastiest nut in the whole forest', '…Here, half for you!', 'It tastes even better with {name}'] },
    { title: 'Sunbathing',
      lines: ['It\'s so warm and cozy today~', 'The spot next to me is free, y\'know?', '…Being with {name} makes me sleepy'] },
    { title: 'Under the Starry Sky',
      lines: ['Look, so many stars…', 'Hey, {name}. …Will you always come here?', '…Never mind, it\'s nothing!'] },
    { title: 'I Love You',
      lines: ['{name}, got a sec…?', 'Thank you for always coming to see me',
              { text: '…I love you! Hug me tight!' }] }
  ],

  clear: {
    hashtag: 'TanukunClear',
    memory: {
      title: 'Together Forever',
      lines: ['{name}, will you… accept this?', 'I\'ve wanted to give it to you for so long',
              { text: 'My heart is full of {name}' },
              { text: '…Come here. Let\'s stay together forever' }]
    }
  },

  report: {
    hashtag: 'Tanukun',
    labels:   { head: 'Head', chest: 'Chest', belly: 'Belly', tail: 'Tail', crotch: '???' },
    comments: { head: 'Thanks for the pats~♪', chest: 'Too much chest…!', belly: 'All belly~!',
                tail: 'My tail\'s fluffy, right?', crotch: 'Th-the secret spot, again…!', even: 'You touched me all over~' }
  },

  notice: {
    title: 'Welcome to Tanu-kun!',
    text: 'This app contains <b>slightly mature content</b> (flustered, teasing reactions).\n' +
          'Recommended for ages <b>15 and up</b>.\n\n' +
          'Illustrations are made with AI.\n' +
          'Your progress is saved only on this device and is never sent anywhere.',
    ok: 'Got it! Let\'s play'
  }
};
