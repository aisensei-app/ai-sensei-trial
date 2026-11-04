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
    labels:   { head: 'Head', chest: 'Chest', belly: 'Belly', tail: 'Tail', thigh: 'Thighs', sole: 'Soles', crotch: '???' },
    comments: { head: 'Thanks for the pats~♪', chest: 'Too much chest…!', belly: 'All belly~!',
                tail: 'My tail\'s fluffy, right?', thigh: 'My thighs tickle~!', sole: 'My paw pads are squishy, right~♪', crotch: 'Th-the secret spot, again…!', even: 'You touched me all over~' }
  },

  rules: [
    { title: 'For ages 15 and up',
      text: 'This app contains slightly mature content (flustered, teasing reactions). Recommended for ages 15 and up.' },
    { title: 'About the illustrations',
      text: 'Illustrations are made with AI.' },
    { title: 'About your progress',
      text: 'Your friendship level, album, fortunes, letters, and other progress are saved only in this phone\'s browser.\n' +
            'Clearing the browser data also erases your progress (adding the app to your home screen makes this less likely).' },
    { title: 'What we count',
      text: 'To make the app better, we count things like how many days people play, which screens are opened, and which buttons are pressed in "A note from Tanu-kun", anonymously.\n' +
            'Your name and progress are never sent. For letters to Tanu-kun, we only count how many you wrote and over how many days (never the text or what it\'s about).' },
    { title: 'About letters & feedback',
      text: '<b>Letters to Tanu-kun are kept only on this phone.</b> They\'re never sent to the creator or anyone else, so write freely.\n' +
            'Only what you write in "💡 Feedback for the creator" (in Settings) reaches the creator via Google Forms. It\'s read by the creator and an AI that helps sort it, and used to improve the app (it\'s never published as is).\n' +
            '<b>In feedback, please don\'t write your name, address, school, contact info, or anything that could identify you.</b> It arrives anonymously, so the creator can\'t reply to each person, and it can\'t be deleted after sending.',
      textLocal: 'Letters to Tanu-kun are kept only on this phone. They\'re never sent to the creator or anyone else, so write freely.' },
    { title: 'Tanu-kun\'s replies',
      text: 'Tanu-kun\'s replies are chosen from words prepared in advance, by looking at the words in your letter right on this phone (the text is never sent anywhere).\n' +
            'If something is troubling you or you\'re having a hard time, please also talk to an adult you trust or a support service, not just in a letter.' },
    { title: 'Google services',
      text: 'Feedback for the creator is sent using Google Forms, so Google\'s Privacy Policy also applies.' },
    { title: 'About fortunes',
      text: 'The seashell fortune is just for fun.' }
  ],

  notice: {
    title: 'Welcome to Tanu-kun!',
    text: 'This app contains <b>slightly mature content</b> (flustered, teasing reactions).\n' +
          'Recommended for ages <b>15 and up</b>.\n\n' +
          'Illustrations are made with AI.\n' +
          'Your progress is saved only on this device.\n' +
          'To make the app better, we count things like how many days people play, anonymously (your name and progress are never sent).',
    post: '📮 Letters to Tanu-kun stay on this phone only (not even the creator can see them). You can send feedback to the creator from Settings.',
    more: 'For details, see "ⓘ Promises & notes" in Settings anytime.',
    ok: 'Got it! Let\'s play'
  }
};
