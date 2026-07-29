const RELATIONSHIP_LABELS = {
  parent: 'Parent',
  sibling: 'Sibling',
  grandparent: 'Grandparent',
  uncle_aunt: 'Uncle/Aunt',
  cousin: 'Cousin',
  in_law: 'In-law',
  friend_close: 'Close Friend',
  friend_casual: 'Casual Friend'
};

const RELATIONSHIP_LABELS_FR = {
  parent: 'Parent',
  sibling: 'Frère/Sœur',
  grandparent: 'Grand-parent',
  uncle_aunt: 'Oncle/Tante',
  cousin: 'Cousin(e)',
  in_law: 'Belle-famille',
  friend_close: 'Ami(e) proche',
  friend_casual: 'Connaissance'
};

const RELATIONSHIP_EMOJI = {
  parent: '👨‍👩',
  sibling: '👫',
  grandparent: '👴',
  uncle_aunt: '👤',
  cousin: '🤝',
  in_law: '💒',
  friend_close: '💛',
  friend_casual: '🙂'
};

const OCCASION_LABELS = {
  checking_in: 'Just checking in',
  birthday: 'Birthday',
  holiday: 'Holiday',
  congratulations: 'Congratulations',
  condolences: 'Condolences',
  thank_you: 'Thank you',
  encouragement: 'Encouragement',
  apology: 'Apology'
};

const OCCASION_LABELS_FR = {
  checking_in: 'Prendre des nouvelles',
  birthday: 'Anniversaire',
  holiday: 'Fête',
  congratulations: 'Félicitations',
  condolences: 'Condoléances',
  thank_you: 'Remerciement',
  encouragement: 'Encouragement',
  apology: 'Excuses'
};

const TEMPLATES = {
  en: {
    checking_in: {
      formal: [
        "Dear {name}, I hope this message finds you well. I've been thinking about you and wanted to check in. How have you been?",
        "Hello {name}, I hope you're doing well. It's been a while and I wanted to reach out. I'd love to hear how things are going with you.",
        "Dear {name}, I trust you are in good health. I just wanted to take a moment to reach out and see how you are doing.",
        "{name}, I hope all is well with you and yours. I've been meaning to write and ask how things have been on your end.",
        "Dear {name}, I pray this message meets you well. I've been thinking of you lately and wanted to check on you."
      ],
      semi_formal: [
        "Hi {name}! Just thinking about you and wanted to check in. How have you been doing lately?",
        "Hey {name}, hope you're doing great! It's been a minute — how are things going?",
        "Hi {name}! I was just thinking about you. How's everything going? Would love to catch up.",
        "{name}! It's been too long. How are you? I hope things are going well for you.",
        "Hi {name}, just wanted to drop you a message and see how you're doing. Miss catching up with you!"
      ],
      casual: [
        "Hey {name}! What's up? Been thinking about you, hope all is good!",
        "Yo {name}! How's it going? Feel like we haven't talked in forever 😄",
        "Hey {name}! Just checking in — how's life treating you?",
        "{name}! Miss you! How have you been? What's new?",
        "Hey hey {name}! Long time no talk. What's going on with you?"
      ]
    },
    birthday: {
      formal: [
        "Dear {name}, wishing you a very happy birthday! May this new year of life bring you abundant blessings, good health, and happiness.",
        "Happy birthday, {name}! I hope your special day is filled with joy and surrounded by loved ones. Wishing you all the best.",
        "{name}, warmest birthday wishes to you! May God continue to bless you and grant you many more years of good health and prosperity."
      ],
      semi_formal: [
        "Happy birthday, {name}! 🎂 Hope you have an amazing day filled with love and happiness. Enjoy every moment!",
        "Hey {name}, happy birthday! Wishing you the best year yet. Hope you celebrate big today! 🎉",
        "{name}! Happy birthday!! Another year wiser and more amazing. Hope today is as special as you are!"
      ],
      casual: [
        "HAPPY BIRTHDAY {name}!! 🎂🎉 Hope you have the best day ever!",
        "Yooo {name}! Happy birthday! Party hard today 🥳",
        "Happy bday {name}!! 🎈 Another year, another level. Enjoy your day!"
      ]
    },
    holiday: {
      formal: [
        "Dear {name}, wishing you a joyful holiday season. May this time bring you peace, happiness, and quality moments with loved ones.",
        "{name}, I hope this holiday season finds you well. Wishing you and your family a blessed celebration."
      ],
      semi_formal: [
        "Happy holidays, {name}! Hope you're having a wonderful time with family and friends. Enjoy every moment! 🎉",
        "Hey {name}! Wishing you happy holidays! Hope it's filled with good food, good company, and lots of rest."
      ],
      casual: [
        "Happy holidays {name}!! 🎉 Hope you're having a blast!",
        "Hey {name}! Happy holidays! Eat well, rest well, enjoy! 😄"
      ]
    },
    congratulations: {
      formal: [
        "Dear {name}, congratulations! I am so proud of your achievement. Your hard work and dedication have truly paid off. Wishing you continued success.",
        "{name}, heartfelt congratulations on this wonderful milestone. You deserve every bit of this success."
      ],
      semi_formal: [
        "Congratulations, {name}! So happy for you! You've worked so hard for this and it shows. Well deserved! 🎊",
        "Hey {name}, congrats!! That's such amazing news. You should be so proud of yourself!"
      ],
      casual: [
        "CONGRATS {name}!! 🎉🎊 So proud of you! Let's celebrate!",
        "Yooo {name}! Big congrats! You absolutely crushed it! 💪"
      ]
    },
    condolences: {
      formal: [
        "Dear {name}, I am deeply sorry for your loss. Please know that you and your family are in my thoughts and prayers during this difficult time.",
        "{name}, my heart goes out to you. I am so sorry for your loss. Please don't hesitate to reach out if there is anything I can do."
      ],
      semi_formal: [
        "{name}, I'm so sorry to hear about your loss. My thoughts are with you. Please know I'm here if you need anything at all.",
        "I'm thinking of you, {name}. I'm so sorry for what you're going through. Sending you all my love and strength."
      ],
      casual: [
        "{name}, I'm so sorry. I'm here for you, whatever you need. Sending you love.",
        "Thinking of you {name}. I'm so sorry. I'm just a message away if you want to talk."
      ]
    },
    thank_you: {
      formal: [
        "Dear {name}, I want to express my sincere gratitude for your kindness. Your generosity means more than words can say.",
        "{name}, thank you so much. I truly appreciate everything you've done. Your thoughtfulness does not go unnoticed."
      ],
      semi_formal: [
        "Hey {name}, just wanted to say a big thank you! I really appreciate what you did. You're the best!",
        "{name}, thank you so much! That really meant a lot to me. I'm so grateful to have you in my life."
      ],
      casual: [
        "Thanks so much {name}! You're honestly amazing 🙏",
        "{name}!! Thank you thank you thank you! You're the real MVP 💛"
      ]
    },
    encouragement: {
      formal: [
        "Dear {name}, I know things may be challenging right now, but I want you to know that I believe in you. You have overcome so much and you will get through this too.",
        "{name}, stay strong. I am praying for you and I know that better days are ahead. You are more resilient than you know."
      ],
      semi_formal: [
        "Hey {name}, just wanted to remind you that you've got this! I believe in you. Don't give up — better days are coming 💪",
        "{name}, thinking of you. Whatever you're going through, remember you're not alone. I'm rooting for you always!"
      ],
      casual: [
        "Hey {name}! Just a reminder: you're amazing and you've got this! 💪✨",
        "{name}! Keep your head up! I'm always in your corner. You're stronger than you think 🙌"
      ]
    },
    apology: {
      formal: [
        "Dear {name}, I sincerely apologize. I recognize that my actions may have caused hurt, and that was never my intention. I value our relationship deeply.",
        "{name}, I want to offer my heartfelt apologies. I take full responsibility and hope we can move forward together."
      ],
      semi_formal: [
        "Hey {name}, I owe you an apology. I'm sorry for what happened. I value you and our relationship, and I want to make things right.",
        "{name}, I'm sorry. I know I messed up and I feel bad about it. Can we talk? I want to sort things out."
      ],
      casual: [
        "{name}, I'm really sorry. My bad. Can we talk about it?",
        "Hey {name}, I messed up and I'm sorry. You mean a lot to me and I want to fix this."
      ]
    }
  },
  fr: {
    checking_in: {
      formal: [
        "Cher/Chère {name}, j'espère que vous allez bien. Je pensais à vous et je voulais prendre de vos nouvelles. Comment allez-vous?",
        "Bonjour {name}, j'espère que tout va bien pour vous. Cela fait un moment et je voulais vous écrire pour savoir comment vous vous portez.",
        "{name}, j'espère que ce message vous trouve en bonne santé. Je voulais simplement prendre un moment pour avoir de vos nouvelles.",
        "Cher/Chère {name}, je prie que vous soyez en bonne santé. Je pensais à vous ces derniers temps et je voulais m'enquérir de votre bien-être.",
        "Bonjour {name}, j'espère que tout va bien chez vous. Je voulais juste m'assurer que vous allez bien."
      ],
      semi_formal: [
        "Salut {name} ! Je pensais à toi et je voulais prendre de tes nouvelles. Comment vas-tu ces derniers temps?",
        "Coucou {name} ! Ça fait un moment qu'on ne s'est pas parlé. Comment ça va?",
        "Hey {name} ! J'espère que tu vas bien. Ça me ferait plaisir d'avoir de tes nouvelles!",
        "{name} ! Ça fait trop longtemps ! Comment tu vas? J'espère que tout se passe bien pour toi.",
        "Salut {name}, je voulais juste t'envoyer un petit message pour savoir comment tu vas. Tu me manques!"
      ],
      casual: [
        "Hey {name} ! Quoi de neuf? Je pensais à toi, j'espère que tout va bien!",
        "Yo {name} ! Comment ça va? On dirait qu'on ne s'est pas parlé depuis une éternité 😄",
        "Hey {name} ! Juste un petit coucou — comment va la vie?",
        "{name} ! Tu me manques! Comment tu vas? Quoi de nouveau?",
        "Salut salut {name} ! Ça fait longtemps! Qu'est-ce qui se passe de beau?"
      ]
    },
    birthday: {
      formal: [
        "Cher/Chère {name}, je vous souhaite un très joyeux anniversaire ! Que cette nouvelle année de vie vous apporte santé, bonheur et prospérité.",
        "Joyeux anniversaire {name} ! Que le Seigneur vous bénisse et vous accorde encore de longues années de bonheur et de santé.",
        "{name}, mes meilleurs vœux d'anniversaire ! Que Dieu continue de vous combler de ses grâces."
      ],
      semi_formal: [
        "Joyeux anniversaire {name} ! 🎂 J'espère que ta journée sera remplie d'amour et de bonheur. Profite bien!",
        "Hey {name}, bon anniversaire ! Je te souhaite la meilleure année ! Fête bien aujourd'hui ! 🎉",
        "{name} ! Joyeux anniversaire !! Une année de plus et toujours aussi incroyable. Bonne fête!"
      ],
      casual: [
        "BON ANNIVERSAIRE {name} !! 🎂🎉 Passe une journée de ouf!",
        "Yooo {name} ! Joyeux anniv ! Fais la fête aujourd'hui 🥳",
        "Bon anniv {name} !! 🎈 Une année de plus, toujours au top. Profite!"
      ]
    },
    holiday: {
      formal: [
        "Cher/Chère {name}, je vous souhaite de joyeuses fêtes. Que cette période vous apporte paix, bonheur et de beaux moments en famille.",
        "{name}, je vous souhaite d'excellentes fêtes. Que vous et votre famille passiez de merveilleux moments ensemble."
      ],
      semi_formal: [
        "Bonnes fêtes {name} ! J'espère que tu passes de bons moments en famille. Profite bien ! 🎉",
        "Hey {name} ! Je te souhaite de bonnes fêtes ! Bonne nourriture, bonne compagnie, et du repos!"
      ],
      casual: [
        "Bonnes fêtes {name} !! 🎉 Profite à fond!",
        "Hey {name} ! Joyeuses fêtes ! Mange bien, repose-toi, profite ! 😄"
      ]
    },
    congratulations: {
      formal: [
        "Cher/Chère {name}, toutes mes félicitations ! Je suis très fier(e) de votre accomplissement. Votre travail acharné a porté ses fruits.",
        "{name}, sincères félicitations pour cette belle réussite. Vous le méritez amplement."
      ],
      semi_formal: [
        "Félicitations {name} ! Trop content(e) pour toi ! Tu as tellement travaillé pour ça. Bien mérité ! 🎊",
        "Hey {name}, bravo !! C'est une super nouvelle. Tu peux être fier(e) de toi!"
      ],
      casual: [
        "FÉLICITATIONS {name} !! 🎉🎊 Trop fier(e) de toi ! On fête ça!",
        "Yooo {name} ! Bravo ! Tu as tout déchiré ! 💪"
      ]
    },
    condolences: {
      formal: [
        "Cher/Chère {name}, je suis profondément désolé(e) pour votre perte. Sachez que vous et votre famille êtes dans mes pensées et mes prières.",
        "{name}, toutes mes condoléances. Je suis de tout cœur avec vous. N'hésitez pas à me contacter si je peux faire quoi que ce soit."
      ],
      semi_formal: [
        "{name}, je suis vraiment désolé(e) d'apprendre cette triste nouvelle. Mes pensées sont avec toi. Je suis là si tu as besoin.",
        "Je pense à toi {name}. Je suis vraiment désolé(e) pour ce que tu traverses. Je t'envoie tout mon amour et ma force."
      ],
      casual: [
        "{name}, je suis tellement désolé(e). Je suis là pour toi, quoi qu'il arrive. Plein d'amour.",
        "Je pense fort à toi {name}. Je suis désolé(e). Je suis là si tu veux parler."
      ]
    },
    thank_you: {
      formal: [
        "Cher/Chère {name}, je tiens à vous exprimer ma sincère gratitude. Votre générosité me touche profondément.",
        "{name}, merci infiniment. J'apprécie sincèrement tout ce que vous avez fait. Votre gentillesse ne passe pas inaperçue."
      ],
      semi_formal: [
        "Hey {name}, je voulais te dire un grand merci ! J'apprécie vraiment ce que tu as fait. Tu es au top!",
        "{name}, merci beaucoup ! Ça m'a vraiment touché(e). Je suis tellement reconnaissant(e) de t'avoir dans ma vie."
      ],
      casual: [
        "Merci tellement {name} ! Tu es vraiment incroyable 🙏",
        "{name} !! Merci merci merci ! T'es le/la meilleur(e) 💛"
      ]
    },
    encouragement: {
      formal: [
        "Cher/Chère {name}, je sais que les temps sont difficiles, mais je veux que vous sachiez que je crois en vous. Vous avez surmonté tant d'épreuves.",
        "{name}, restez fort(e). Je prie pour vous et je sais que des jours meilleurs arrivent. Vous êtes plus résilient(e) que vous ne le pensez."
      ],
      semi_formal: [
        "Hey {name}, je voulais juste te rappeler que tu vas y arriver ! Je crois en toi. Ne lâche pas — les beaux jours arrivent 💪",
        "{name}, je pense à toi. Quoi que tu traverses, rappelle-toi que tu n'es pas seul(e). Je suis toujours de ton côté!"
      ],
      casual: [
        "Hey {name} ! Petit rappel : tu es incroyable et tu vas gérer ! 💪✨",
        "{name} ! Garde la tête haute ! Je suis toujours dans ton coin. Tu es plus fort(e) que tu ne le penses 🙌"
      ]
    },
    apology: {
      formal: [
        "Cher/Chère {name}, je m'excuse sincèrement. Je reconnais que mes actions ont pu vous blesser, ce qui n'était jamais mon intention.",
        "{name}, je tiens à vous présenter mes excuses les plus sincères. J'assume l'entière responsabilité et j'espère que nous pourrons avancer ensemble."
      ],
      semi_formal: [
        "Hey {name}, je te dois des excuses. Je suis désolé(e) pour ce qui s'est passé. Je tiens à toi et je veux arranger les choses.",
        "{name}, pardon. Je sais que j'ai fait une erreur et je me sens mal. On peut en parler?"
      ],
      casual: [
        "{name}, je suis vraiment désolé(e). C'est ma faute. On peut en discuter?",
        "Hey {name}, j'ai merdé et je suis désolé(e). Tu comptes beaucoup pour moi et je veux réparer ça."
      ]
    }
  }
};

function buildGeminiPrompt(contact, occasion, pointers) {
  const lang = contact.language === 'fr' ? 'French' : 'English';
  const relLabel = contact.language === 'fr'
    ? RELATIONSHIP_LABELS_FR[contact.relationship]
    : RELATIONSHIP_LABELS[contact.relationship];
  const occLabel = contact.language === 'fr'
    ? OCCASION_LABELS_FR[occasion]
    : OCCASION_LABELS[occasion];
  const formalityMap = { formal: 'formal and respectful', semi_formal: 'warm but respectful', casual: 'casual and friendly' };
  const formalityDesc = formalityMap[contact.profile?.formality] || 'warm';
  const closenessMap = { very_close: 'very close', close: 'close', moderate: 'moderately close', distant: 'not very close' };
  const closenessDesc = closenessMap[contact.profile?.closeness] || 'close';

  let prompt = `You are helping me write a ${formalityDesc} message in ${lang} to my ${relLabel} named ${contact.name}.\n\n`;
  prompt += `About our relationship:\n`;
  prompt += `- We are ${closenessDesc}\n`;
  if (contact.profile?.topics?.length) {
    prompt += `- Topics we usually discuss: ${contact.profile.topics.join(', ')}\n`;
  }
  const notes = contact.profile?.notes || contact.profile?.culturalNotes || '';
  if (notes) {
    prompt += `- Context & notes about this person: ${notes}\n`;
  }
  prompt += `\nOccasion: ${occLabel}\n`;
  if (pointers) {
    prompt += `\nMy specific notes: ${pointers}\n`;
  }
  prompt += `\nWrite a warm, authentic message (2-4 sentences). Don't be generic — make it personal and culturally appropriate.`;
  if (contact.language === 'fr') {
    prompt += ` Write entirely in French.`;
  } else {
    prompt += ` Write in English.`;
  }
  prompt += ` Return ONLY the message text, nothing else.`;
  return prompt;
}

async function generateWithGemini(apiKey, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 300 }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function generateWithGrok(apiKey, prompt) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'grok-4.3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 300
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API error: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function generateWithGroq(apiKey, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 300
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} — ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function getTemplateMessage(contact, occasion) {
  const lang = contact.language || 'en';
  const formality = contact.profile?.formality || 'semi_formal';
  const pool = TEMPLATES[lang]?.[occasion]?.[formality]
    || TEMPLATES[lang]?.[occasion]?.semi_formal
    || TEMPLATES.en.checking_in.semi_formal;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace(/\{name\}/g, contact.name);
}

async function generateMessage(contact, occasion, pointers) {
  const provider = localStorage.getItem('ai_provider') || 'groq';
  const prompt = buildGeminiPrompt(contact, occasion, pointers);
  const geminiKey = localStorage.getItem('gemini_api_key');
  const grokKey = localStorage.getItem('grok_api_key');
  const groqKey = localStorage.getItem('groq_api_key');
  const errors = [];

  const providers = {
    gemini: [geminiKey, generateWithGemini, 'Gemini'],
    grok: [grokKey, generateWithGrok, 'Grok'],
    groq: [groqKey, generateWithGroq, 'Groq']
  };

  const order = [providers[provider]];
  for (const [k, v] of Object.entries(providers)) {
    if (k !== provider) order.push(v);
  }

  for (const [key, fn, name] of order) {
    if (!key) { errors.push(`${name}: no API key`); continue; }
    try {
      const text = await fn(key, prompt);
      return { text, source: name };
    }
    catch (e) { errors.push(`${name}: ${e.message}`); }
  }
  return { text: getTemplateMessage(contact, occasion), source: 'Template', errors };
}