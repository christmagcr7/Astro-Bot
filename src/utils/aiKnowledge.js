const intents = [
  {
    keywords: ['wer bist du', 'dein name', 'was bist du', 'astro bot', 'ki'],
    answer: 'Ich bin Astro, der KI-Support von Astro Bot. Ich helfe dir bei Bewerbung, Verifizierung, Tickets und Serverfragen.',
  },
  {
    keywords: ['bewerbung', 'bewerben', 'bewerb', 'apply', 'team beitreten', 'mitmachen'],
    answer: 'Für eine Bewerbung gehst du in den Apply-Kanal und klickst auf Bewerbung starten. Die Fragen kommen anschließend per Direktnachricht.',
  },
  {
    keywords: ['verifizier', 'verify', 'rolle bekommen', 'zugriff'],
    answer: 'Öffne den Verify-Kanal und klicke auf Jetzt verifizieren. Danach bekommst du die Verified-Rolle und Zugriff auf die Community.',
  },
  {
    keywords: ['ticket', 'support ticket', 'problem', 'probleme', 'hilfe bekommen', 'hilfe brauche'],
    answer: 'Öffne den Ticket-Kanal, wähle eine Kategorie aus und beschreibe dein Anliegen. Das Support-Team meldet sich dort.',
  },
  {
    keywords: ['tox', 'tox office'],
    answer: 'Das Tox Office ist der Sprachkanal für Tox. Für den Zugang brauchst du die passende Tox-Rolle.',
  },
  {
    keywords: ['nox', 'nox office'],
    answer: 'Das Nox Office ist der Sprachkanal für Nox. Für den Zugang brauchst du die passende Nox-Rolle.',
  },
  {
    keywords: ['christ', 'christ office'],
    answer: 'Das Christ Office ist der Sprachkanal für Christ. Für den Zugang brauchst du die passende Christ-Rolle.',
  },
  {
    keywords: ['regel', 'regeln', 'erlaubt', 'verboten', 'ordnung'],
    answer: 'Halte dich an die Serverregeln: respektvoll bleiben, kein Spam, keine unerlaubte Werbung und den Anweisungen des Teams folgen.',
  },
  {
    keywords: ['command', 'befehl', 'slash', 'bot kann', 'funktionen'],
    answer: 'Astro Bot bietet Moderation, Tickets, Bewerbungen, Verify, RP-Tools und Community-Funktionen. Nutze /help für die verfügbaren Befehle.',
  },
  {
    keywords: ['hallo', 'hi', 'hey', 'moin', 'guten morgen', 'guten tag'],
    answer: 'Hey! Ich bin Astro. Was möchtest du über den Server wissen?',
  },
  {
    keywords: ['danke', 'dankeschön', 'thanks'],
    answer: 'Sehr gerne! Wenn noch etwas unklar ist, frag mich einfach.',
  },
];

const getAiAnswer = (input) => {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let bestMatch = null;
  let bestScore = 0;
  for (const intent of intents) {
    const score = intent.keywords.reduce((total, keyword) => (
      normalized.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? total + keyword.length : total
    ), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  return bestMatch?.answer || 'Das weiß ich noch nicht genau. Meinst du Bewerbung, Verify, Tickets, Regeln oder eines der Offices?';
};

module.exports = { getAiAnswer };
