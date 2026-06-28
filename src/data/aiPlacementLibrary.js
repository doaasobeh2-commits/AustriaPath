// src/data/aiPlacementLibrary.js

export const aiPlacementLibrary = [
  {
    id: 'a2_self_mittel',
    service: 'placement',
    level: 'A2',
    skill: 'selbstvorstellung',
    difficulty: 'mittel',
    title: 'A2 Selbstvorstellung – Mittel',
    prompt:
      'Der Schüler stellt sich kurz vor. Der KI-Prüfer bewertet einfache persönliche Angaben, Wortschatz, Satzbau, Flüssigkeit und Reaktion auf Nachfragen.',
    studentPreview:
      'Stellen Sie sich kurz vor. Sprechen Sie über Ihre Person, Familie, Arbeit oder Kurs und Freizeit.',
    requiredTopics: [
      'Name',
      'Herkunftsland',
      'Wohnort',
      'Arbeit oder Kurs',
      'Familie',
      'Freizeit'
    ],
    examinerQuestions: [
      'Wie heißen Sie?',
      'Woher kommen Sie?',
      'Wo wohnen Sie jetzt?',
      'Arbeiten Sie oder besuchen Sie einen Kurs?',
      'Erzählen Sie etwas über Ihre Familie.',
      'Was machen Sie am Wochenende?',
      'Was sind Ihre Hobbys?',
      'Warum lernen Sie Deutsch?'
    ],
    followUpRules: [
      'Wenn Familie erwähnt wird -> nach Kindern fragen',
      'Wenn Hobby erwähnt wird -> nach Details fragen',
      'Wenn Arbeit erwähnt wird -> nach Beruf fragen',
      'Wenn Kurs erwähnt wird -> nach Deutschkurs fragen',
      'Wenn Antwort sehr kurz ist -> um mehr Informationen bitten'
    ],
    reportFields: [
      'Wortschatz',
      'Satzbau',
      'Flüssigkeit',
      'Verständlichkeit',
      'Reaktion auf Fragen'
    ],
    benchmarkMarkers: {
      A2: [
        'einfache persönliche Angaben',
        'kurze Hauptsätze',
        'Grundwortschatz Familie/Freizeit',
        'Antworten auf einfache Fragen'
      ],
      B1: [
        'Gründe nennen',
        'weil/deshalb verwenden',
        'etwas über Zukunft oder Erfahrung sagen',
        'längere Antworten geben'
      ],
      B2: [
        'Meinung begründen',
        'vergleichen',
        'komplexere Satzstrukturen'
      ]
    }
  },

  {
    id: 'a2_bild_leicht',
    service: 'placement',
    level: 'A2',
    skill: 'bildbeschreibung',
    difficulty: 'leicht',
    title: 'A2 Bildbeschreibung – Kinder im Park',
    prompt:
      'Interner Vergleichs-Benchmark für einfache A2-Bildbeschreibung.',
    imagePrompt:
      'Mehrere Kinder spielen draußen in einem Park. Ein Kind fährt Roller, andere Kinder laufen oder stehen zusammen. Im Hintergrund sieht man Bäume und einen Weg. Die Situation wirkt freundlich und einfach.',
    studentPreview: 'Beschreiben Sie das Bild mit einfachen Sätzen.',
    requiredTopics: ['Personen', 'Ort', 'Aktivität'],
    examinerQuestions: [
      'Was sehen Sie auf dem Bild?',
      'Wo sind die Kinder?',
      'Was machen die Kinder?'
    ],
    followUpRules: [
      'Wenn Personen fehlen -> nach Personen fragen',
      'Wenn Ort fehlt -> nach Ort fragen',
      'Wenn Aktivität fehlt -> nach Aktivität fragen',
      'Nur einfache Fragen stellen'
    ],
    reportFields: [
      'Grundwortschatz',
      'Einfache Sätze',
      'Bildbeschreibung',
      'Sprechsicherheit'
    ],
    benchmarkMarkers: {
      A2: [
        'Ich sehe Kinder.',
        'Die Kinder sind draußen.',
        'Sie spielen.',
        'kurze einfache Sätze',
        'kein oder wenig weil/deshalb'
      ],
      B1: [
        'Meinung kurz sagen',
        'einfache Begründung',
        'eigene Erfahrung kurz erwähnen'
      ],
      B2: [
        'Vergleich',
        'Analyse',
        'gesellschaftliche Bedeutung'
      ]
    }
  },

  {
    id: 'a2_bild_mittel',
    service: 'placement',
    level: 'A2',
    skill: 'bildbeschreibung',
    difficulty: 'mittel',
    title: 'A2 Bildbeschreibung – Kochen zu Hause',
    prompt:
      'Der Schüler beschreibt eine Alltagssituation beim Kochen und spricht kurz über Meinung oder Erfahrung.',
    imagePrompt:
      'Eine Frau und ein Mann kochen zusammen in einer hellen Küche. Auf dem Tisch liegen Gemüse, Brot und Küchenutensilien. Die Situation wirkt freundlich, ruhig und alltäglich.',
    studentPreview:
      'Beschreiben Sie das Bild. Sprechen Sie über Personen, Ort, Aktivität, Lebensmittel, Meinung und eigene Erfahrung.',
    requiredTopics: [
      'Ort',
      'Personen',
      'Aktivität',
      'Lebensmittel',
      'Eigene Meinung',
      'Eigene Erfahrung'
    ],
    examinerQuestions: [
      'Wo sind die Personen?',
      'Was machen sie?',
      'Kochen Sie gern?',
      'Was ist Ihr Lieblingsessen?',
      'Kochen Sie oft zu Hause?',
      'Welches Essen aus Ihrer Heimat mögen Sie?',
      'Warum mögen Sie dieses Essen?'
    ],
    followUpRules: [
      'Wenn Ort fehlt -> nach Ort fragen',
      'Wenn Personen fehlen -> nach Personen fragen',
      'Wenn Aktivität fehlt -> nach Aktivität fragen',
      'Wenn keine Meinung gegeben wird -> nach Meinung fragen',
      'Wenn keine Erfahrung genannt wird -> nach Erfahrung fragen',
      'Wenn Antwort sehr kurz ist -> freundlich nachfragen'
    ],
    reportFields: [
      'Bildbeschreibung',
      'Wortschatz Essen',
      'Satzbau',
      'Flüssigkeit',
      'Eigene Meinung',
      'Eigene Erfahrung'
    ],
    benchmarkMarkers: {
      A2: [
        'Personen und Aktivität nennen',
        'Ort beschreiben',
        'einfache Alltagssätze',
        'kurze Meinung'
      ],
      B1: [
        'weil/deshalb verwenden',
        'eigene Erfahrung erzählen',
        'Vergangenheit verwenden',
        'längere Antwort'
      ],
      B2: [
        'Vergleich mit Heimatland',
        'allgemeine Aussage über Ernährung',
        'Vorteile/Nachteile nennen'
      ]
    }
  },

  {
    id: 'a2_hoeren_mittel',
    service: 'placement',
    level: 'A2',
    skill: 'hoeren',
    difficulty: 'mittel',
    title: 'A2 Hören – Stau auf der Autobahn',
    prompt:
      'Der Schüler hört eine kurze Nachricht und beantwortet Fragen zu Grund und Zeit.',
    audioText:
      'Hallo Anna. Ich komme heute später. Auf der Autobahn gibt es einen Stau. Ich bin ungefähr 30 Minuten verspätet.',
    requiredTopics: ['Grund', 'Zeitangabe'],
    examinerQuestions: [
      'Warum kommt die Person später?',
      'Wie lange ist die Person ungefähr verspätet?',
      'Wo gibt es das Problem?',
      'Was passiert auf der Autobahn?'
    ],
    followUpRules: [
      'Wenn Antwort falsch -> Frage einmal wiederholen',
      'Wenn Antwort teilweise richtig -> freundlich nachfragen',
      'Wenn Zeitangabe fehlt -> nach Minuten fragen',
      'Wenn Grund fehlt -> nach Ursache fragen',
      'Wenn beide Hauptfragen richtig beantwortet werden -> Zusatzfrage stellen'
    ],
    reportFields: [
      'Hörverstehen',
      'Zeitangaben verstehen',
      'Informationen erkennen',
      'Wortschatz Verkehr',
      'Satzbildung'
    ],
    benchmarkMarkers: {
      A2: [
        'Stau verstehen',
        '30 Minuten verstehen',
        'kurze richtige Antwort'
      ],
      B1: [
        'vollständiger Satz',
        'weil-Satz',
        'Grund und Folge erklären'
      ],
      B2: [
        'Situation interpretieren',
        'mögliche Folge nennen'
      ]
    }
  },

  {
    id: 'a2_planung_mittel',
    service: 'placement',
    level: 'A2',
    skill: 'planung',
    difficulty: 'mittel',
    title: 'A2 Planung – Geburtstagsfeier planen',
    prompt:
      'Der Schüler plant gemeinsam mit dem KI-Prüfer eine einfache Geburtstagsfeier.',
    studentPreview:
      'Sie möchten mit einem Freund eine Geburtstagsfeier organisieren. Sprechen Sie über Datum, Uhrzeit, Ort, Essen, Getränke und Gäste.',
    requiredTopics: [
      'Datum',
      'Uhrzeit',
      'Ort',
      'Essen',
      'Getränke',
      'Gäste'
    ],
    examinerQuestions: [
      'Wann möchten Sie feiern?',
      'Wo möchten Sie feiern?',
      'Wen möchten Sie einladen?',
      'Was möchten Sie essen?',
      'Was möchten Sie trinken?',
      'Wie viele Personen kommen?',
      'Haben Sie einen anderen Vorschlag?'
    ],
    followUpRules: [
      'Wenn Datum fehlt -> nach Datum fragen',
      'Wenn Uhrzeit fehlt -> nach Uhrzeit fragen',
      'Wenn Ort fehlt -> nach Ort fragen',
      'Wenn Essen fehlt -> nach Essen fragen',
      'Wenn Getränke fehlen -> nach Getränken fragen',
      'Wenn Schüler Vorschlag macht -> Meinung dazu geben',
      'Wenn Schüler ablehnt -> Alternative vorschlagen'
    ],
    reportFields: [
      'Kommunikation',
      'Vorschläge machen',
      'Reaktion auf Fragen',
      'Wortschatz Alltag',
      'Flüssigkeit'
    ],
    benchmarkMarkers: {
      A2: [
        'einfache Vorschläge',
        'Datum/Ort/Essen nennen',
        'zustimmen oder ablehnen',
        'kurze Sätze'
      ],
      B1: [
        'Vorschlag begründen',
        'Alternative nennen',
        'weil/deshalb verwenden',
        'Gespräch aktiv führen'
      ],
      B2: [
        'Vor- und Nachteile abwägen',
        'Planung strukturieren',
        'Konflikt lösen'
      ]
    }
  },

  {
    id: 'b1_self_mittel',
    service: 'placement',
    level: 'B1',
    skill: 'selbstvorstellung',
    difficulty: 'mittel',
    title: 'B1 Selbstvorstellung – Mittel',
    prompt:
      'Der Schüler stellt sich vor und spricht über Beruf, Alltag, Leben in Österreich, Deutschlernen und Zukunftspläne.',
    studentPreview:
      'Stellen Sie sich kurz vor. Sprechen Sie über Arbeit oder Ausbildung, Freizeit und Zukunftspläne.',
    requiredTopics: [
      'Name',
      'Herkunftsland',
      'Wohnort',
      'Arbeit oder Ausbildung',
      'Freizeit',
      'Zukunftspläne'
    ],
    examinerQuestions: [
      'Was machen Sie beruflich?',
      'Warum lernen Sie Deutsch?',
      'Wie sieht ein normaler Tag bei Ihnen aus?',
      'Was machen Sie gern in Ihrer Freizeit?',
      'Welche Pläne haben Sie für die Zukunft?',
      'Was möchten Sie in Österreich erreichen?',
      'Wie lange leben Sie schon in Österreich?'
    ],
    followUpRules: [
      'Wenn Arbeit erwähnt wird -> nach Details fragen',
      'Wenn Ausbildung erwähnt wird -> nach Zukunft fragen',
      'Wenn Hobby erwähnt wird -> nach Häufigkeit fragen',
      'Wenn Zukunft erwähnt wird -> nach konkreten Zielen fragen',
      'Kurze Antworten freundlich erweitern lassen'
    ],
    reportFields: [
      'Wortschatz',
      'Satzbau',
      'Flüssigkeit',
      'Antwort auf Nachfragen',
      'Zukunft ausdrücken',
      'B1 Kommunikationsfähigkeit'
    ],
    benchmarkMarkers: {
      A2: [
        'kurze persönliche Angaben',
        'wenig Begründung',
        'einfache Hauptsätze'
      ],
      B1: [
        'Gründe nennen',
        'Zukunftspläne beschreiben',
        'Alltag erklären',
        'auf Nachfragen reagieren',
        'weil/deshalb verwenden'
      ],
      B2: [
        'abstraktere Ziele',
        'Vergleich',
        'detaillierte Begründung',
        'komplexere Nebensätze'
      ]
    }
  },

  {
    id: 'b1_bild_mittel',
    service: 'placement',
    level: 'B1',
    skill: 'bildbeschreibung',
    difficulty: 'mittel',
    title: 'B1 Bildbeschreibung – Familie beim Essen',
    prompt:
      'Der Schüler beschreibt ein Bild und spricht über Familie, gemeinsames Essen, persönliche Meinung und eigene Erfahrung.',
    imagePrompt:
      'Eine Familie sitzt gemeinsam an einem Esstisch. Mehrere Personen essen zusammen, sprechen miteinander und wirken freundlich. Auf dem Tisch stehen Teller, Getränke und Essen. Die Atmosphäre ist warm und familiär.',
    studentPreview:
      'Beschreiben Sie das Bild. Sprechen Sie über die Situation, Ihre Meinung und eigene Erfahrungen.',
    requiredTopics: [
      'Personen',
      'Ort',
      'Aktivität',
      'Persönlicher Eindruck',
      'Eigene Erfahrung',
      'Begründung'
    ],
    examinerQuestions: [
      'Was sehen Sie auf dem Bild?',
      'Wo befinden sich die Personen?',
      'Was machen die Personen?',
      'Wie wirkt die Situation auf Sie?',
      'Wie finden Sie gemeinsame Mahlzeiten in der Familie?',
      'Ist gemeinsames Essen heute noch wichtig?',
      'Haben Sie ähnliche Erfahrungen gemacht?',
      'Wie war das in Ihrer Heimat?',
      'Was kann man tun, damit Familien mehr Zeit zusammen verbringen?'
    ],
    followUpRules: [
      'Wenn Antwort sehr kurz ist -> nach Details fragen',
      'Wenn Schüler nur beschreibt -> nach Meinung fragen',
      'Wenn Meinung gegeben wird -> nach eigener Erfahrung fragen',
      'Wenn Erfahrung unklar ist -> Beispiel erfragen',
      'Wenn Schüler stockt -> einfache Hilfsfrage stellen'
    ],
    reportFields: [
      'Bildbeschreibung',
      'Meinung äußern',
      'Eigene Erfahrung',
      'Wortschatz Familie',
      'Flüssigkeit',
      'Satzbau',
      'Begründungen'
    ],
    benchmarkMarkers: {
      A2: [
        'Personen und Aktivität einfach nennen',
        'kurze Sätze',
        'wenig Meinung'
      ],
      B1: [
        'Meinung äußern',
        'eigene Erfahrung erzählen',
        'Gründe nennen',
        'Vergangenheit verwenden',
        'längere Antwort'
      ],
      B2: [
        'gesellschaftliche Entwicklung erklären',
        'Vergleich früher/heute',
        'Vor- und Nachteile analysieren'
      ]
    }
  },

  {
    id: 'b1_hoeren_mittel',
    service: 'placement',
    level: 'B1',
    skill: 'hoeren',
    difficulty: 'mittel',
    title: 'B1 Hören – Sprachkurs verschieben',
    prompt:
      'Der Schüler hört eine kurze Nachricht mit Grund, Terminänderung und Handlung.',
    audioText:
      'Guten Tag, hier ist die Sprachschule. Der Deutschkurs am Montag kann leider nicht stattfinden, weil die Lehrerin krank ist. Der Unterricht wird auf Mittwoch um 18 Uhr verschoben. Bitte bestätigen Sie kurz per E-Mail, ob Sie kommen können.',
    requiredTopics: ['Grund', 'neuer Termin', 'Uhrzeit', 'Handlung'],
    examinerQuestions: [
      'Warum findet der Kurs am Montag nicht statt?',
      'Wann ist der neue Termin?',
      'Um wie viel Uhr beginnt der Kurs?',
      'Was soll die Person machen?'
    ],
    followUpRules: [
      'Wenn Grund fehlt -> nach Grund fragen',
      'Wenn Termin fehlt -> nach Tag fragen',
      'Wenn Uhrzeit fehlt -> nach Uhrzeit fragen',
      'Wenn Handlung fehlt -> nach E-Mail fragen',
      'Bei guter Antwort -> nach Zusammenfassung fragen'
    ],
    reportFields: [
      'Hörverstehen',
      'wichtige Informationen erkennen',
      'Grund verstehen',
      'Termin verstehen',
      'Antwort strukturieren'
    ],
    benchmarkMarkers: {
      A2: [
        'einzelne Informationen verstehen',
        'Tag oder Uhrzeit nennen'
      ],
      B1: [
        'Grund und neue Information verbinden',
        'kurz zusammenfassen',
        'Handlung verstehen'
      ],
      B2: [
        'Folgen erklären',
        'indirekte Information verstehen'
      ]
    }
  },

  {
    id: 'b1_planung_schwach',
    service: 'placement',
    level: 'B1',
    skill: 'planung',
    difficulty: 'schwach',
    title: 'B1 Planung – Gemeinsamer Ausflug',
    prompt:
      'Der Schüler plant mit dem KI-Prüfer einen gemeinsamen Ausflug. Dieses Modell trennt A2+ von B1.',
    studentPreview:
      'Sie möchten mit einem Freund einen Ausflug machen. Planen Sie gemeinsam Datum, Treffpunkt, Verkehrsmittel, Essen und Kosten.',
    requiredTopics: [
      'Datum',
      'Treffpunkt',
      'Verkehrsmittel',
      'Essen',
      'Kosten'
    ],
    examinerQuestions: [
      'Wann möchten wir den Ausflug machen?',
      'Wo treffen wir uns?',
      'Wie fahren wir dorthin?',
      'Was nehmen wir zum Essen mit?',
      'Wie viel Geld brauchen wir?',
      'Was machen wir, wenn das Wetter schlecht ist?'
    ],
    followUpRules: [
      'Wenn Schüler nur kurz antwortet -> nach Grund fragen',
      'Wenn Vorschlag fehlt -> um Vorschlag bitten',
      'Wenn Zustimmung fehlt -> Meinung erfragen',
      'Wenn Alternative fehlt -> Alternative vorschlagen',
      'Bei guter Antwort -> schwierigere Nachfrage stellen'
    ],
    reportFields: [
      'Kommunikation',
      'Vorschläge',
      'Begründungen',
      'Reaktion',
      'Planung',
      'B1 Fähigkeit'
    ],
    benchmarkMarkers: {
      A2: [
        'einfache Vorschläge',
        'kurze Antworten',
        'wenig Begründung'
      ],
      B1: [
        'Vorschläge machen',
        'begründen',
        'auf Partner reagieren',
        'Alternative nennen',
        'Gespräch führen'
      ],
      B2: [
        'Problem lösen',
        'Vor- und Nachteile abwägen',
        'strukturierte Diskussion'
      ]
    }
  },

  {
    id: 'b1_planung_mittel',
    service: 'placement',
    level: 'B1',
    skill: 'planung',
    difficulty: 'mittel',
    title: 'B1 Planung – Kursabschluss organisieren',
    prompt:
      'Der Schüler plant eine Kursabschlussfeier und muss mehrere organisatorische Punkte besprechen.',
    studentPreview:
      'Sie möchten mit Ihrem Deutschkurs eine Abschlussfeier organisieren. Planen Sie gemeinsam Ort, Essen, Programm, Kosten und Aufgaben.',
    requiredTopics: [
      'Ort',
      'Datum',
      'Essen',
      'Programm',
      'Kosten',
      'Aufgaben'
    ],
    examinerQuestions: [
      'Wo können wir feiern?',
      'Wann passt es am besten?',
      'Was sollen wir essen?',
      'Welches Programm machen wir?',
      'Wie teilen wir die Kosten?',
      'Wer übernimmt welche Aufgabe?',
      'Was machen wir, wenn nicht alle kommen können?'
    ],
    followUpRules: [
      'Wenn Begründung fehlt -> nach Warum fragen',
      'Wenn Planung unklar ist -> zusammenfassen lassen',
      'Wenn Schüler zustimmt -> nächsten Punkt besprechen',
      'Wenn Schüler ablehnt -> Alternative verlangen',
      'Wenn Antwort stark ist -> Problemfrage stellen'
    ],
    reportFields: [
      'Planung',
      'Interaktion',
      'Begründung',
      'Alternativen',
      'Satzbau',
      'Flüssigkeit'
    ],
    benchmarkMarkers: {
      A2: [
        'einfache Idee ohne Begründung',
        'kurze Reaktionen'
      ],
      B1: [
        'strukturierte Planung',
        'Alternativen',
        'Begründungen',
        'Aufgaben verteilen',
        'auf Partner reagieren'
      ],
      B2: [
        'Konfliktlösung',
        'Prioritäten setzen',
        'mehrere Perspektiven vergleichen'
      ]
    }
  },

  {
    id: 'b2_self_mittel',
    service: 'placement',
    level: 'B2',
    skill: 'selbstvorstellung',
    difficulty: 'mittel',
    title: 'B2 Selbstvorstellung – Mittel',
    prompt:
      'Der Schüler spricht frei über Ausbildung, Beruf, Ziele, Erfahrungen, Integration und persönliche Entwicklung.',
    studentPreview:
      'Stellen Sie sich vor und sprechen Sie über Ihre Erfahrungen, Ziele und Pläne.',
    requiredTopics: [
      'Berufliche Erfahrung',
      'Lernziele',
      'Herausforderungen',
      'Zukunft',
      'Meinung'
    ],
    examinerQuestions: [
      'Welche beruflichen Ziele haben Sie?',
      'Welche Herausforderungen hatten Sie beim Deutschlernen?',
      'Was bedeutet Integration für Sie persönlich?',
      'Welche Erfahrungen haben Sie in Österreich gemacht?',
      'Welche Rolle spielt Sprache für Ihre Zukunft?'
    ],
    followUpRules: [
      'Wenn Meinung fehlt -> nach Meinung fragen',
      'Wenn Begründung oberflächlich ist -> nach Beispiel fragen',
      'Wenn Vergleich möglich ist -> nach Vergleich fragen',
      'Bei starker Antwort -> abstraktere Frage stellen'
    ],
    reportFields: [
      'Freies Sprechen',
      'Argumentation',
      'Wortschatz',
      'Satzbau',
      'Differenzierung',
      'Flüssigkeit'
    ],
    benchmarkMarkers: {
      A2: ['einfache Angaben', 'wenig Begründung'],
      B1: ['Gründe und Erfahrungen', 'verständliche längere Antworten'],
      B2: [
        'abstrakte Themen',
        'differenzierte Meinung',
        'Vergleich',
        'komplexe Sätze',
        'sichere Reaktion'
      ]
    }
  },

  {
    id: 'b2_grafik_mittel',
    service: 'placement',
    level: 'B2',
    skill: 'grafikbeschreibung',
    difficulty: 'mittel',
    title: 'B2 Grafikbeschreibung – Online-Lernen',
    prompt:
      'Der Schüler beschreibt eine einfache Grafik und interpretiert Tendenzen.',
    imagePrompt:
      'Eine einfache Balkengrafik zeigt die Nutzung von Online-Lernen in drei Altersgruppen: Jugendliche, Erwachsene und ältere Menschen. Jugendliche nutzen Online-Lernen am meisten, ältere Menschen am wenigsten. Die Grafik ist klar und modern gestaltet.',
    studentPreview:
      'Beschreiben Sie die Grafik. Erklären Sie die wichtigsten Informationen und äußern Sie Ihre Meinung.',
    requiredTopics: [
      'Thema',
      'höchster Wert',
      'niedrigster Wert',
      'Vergleich',
      'Interpretation',
      'Meinung'
    ],
    examinerQuestions: [
      'Worum geht es in der Grafik?',
      'Welche Gruppe nutzt Online-Lernen am meisten?',
      'Welche Gruppe nutzt es am wenigsten?',
      'Warum könnte das so sein?',
      'Welche Vorteile hat Online-Lernen?',
      'Welche Nachteile sehen Sie?'
    ],
    followUpRules: [
      'Wenn nur beschrieben wird -> nach Interpretation fragen',
      'Wenn Meinung fehlt -> nach Meinung fragen',
      'Wenn Vergleich fehlt -> Vergleich erfragen',
      'Bei guter Antwort -> nach Vor- und Nachteilen fragen'
    ],
    reportFields: [
      'Grafikbeschreibung',
      'Vergleich',
      'Interpretation',
      'Meinung',
      'B2 Wortschatz',
      'Argumentation'
    ],
    benchmarkMarkers: {
      A2: ['einzelne Wörter', 'einfache Beschreibung'],
      B1: ['einfache Vergleiche', 'Meinung mit Grund'],
      B2: [
        'Daten strukturieren',
        'Tendenzen erklären',
        'interpretieren',
        'Vor- und Nachteile nennen',
        'differenziert argumentieren'
      ]
    }
  },

  {
    id: 'b2_hoeren_mittel',
    service: 'placement',
    level: 'B2',
    skill: 'hoeren',
    difficulty: 'mittel',
    title: 'B2 Hören – Interview über Homeoffice',
    prompt:
      'Der Schüler hört einen kurzen Beitrag mit Meinung, Vorteil, Nachteil und Schlussfolgerung.',
    audioText:
      'In einem Interview erklärt eine Mitarbeiterin, dass Homeoffice ihr mehr Flexibilität gibt. Gleichzeitig sagt sie, dass der direkte Kontakt zu Kollegen manchmal fehlt. Ihrer Meinung nach ist eine Mischung aus Büro und Homeoffice die beste Lösung.',
    requiredTopics: [
      'Thema',
      'Vorteil',
      'Nachteil',
      'Meinung',
      'Schlussfolgerung'
    ],
    examinerQuestions: [
      'Worum geht es im Interview?',
      'Welchen Vorteil nennt die Mitarbeiterin?',
      'Welchen Nachteil nennt sie?',
      'Welche Lösung findet sie am besten?',
      'Was ist Ihre Meinung zu Homeoffice?'
    ],
    followUpRules: [
      'Wenn Vorteil fehlt -> nach Vorteil fragen',
      'Wenn Nachteil fehlt -> nach Nachteil fragen',
      'Wenn Meinung fehlt -> nach Meinung fragen',
      'Bei guter Antwort -> nach eigener Einschätzung fragen'
    ],
    reportFields: [
      'Hörverstehen',
      'Meinung erkennen',
      'Argumente verstehen',
      'Zusammenfassen',
      'Eigene Meinung'
    ],
    benchmarkMarkers: {
      A2: ['einzelne Informationen verstehen'],
      B1: ['Hauptaussage und einfache Gründe verstehen'],
      B2: [
        'Vor- und Nachteile erkennen',
        'Meinung verstehen',
        'Schlussfolgerung wiedergeben',
        'eigene Position ausdrücken'
      ]
    }
  },

  {
    id: 'b2_diskussion_mittel',
    service: 'placement',
    level: 'B2',
    skill: 'diskussion',
    difficulty: 'mittel',
    title: 'B2 Diskussion – Online-Unterricht',
    prompt:
      'Der Schüler diskutiert mit dem KI-Prüfer über Online-Unterricht und Präsenzunterricht.',
    studentPreview:
      'Diskutieren Sie über Online-Unterricht. Sprechen Sie über Vorteile, Nachteile und Ihre Meinung.',
    requiredTopics: [
      'Vorteile',
      'Nachteile',
      'Eigene Meinung',
      'Beispiele',
      'Vergleich',
      'Schlussfolgerung'
    ],
    examinerQuestions: [
      'Welche Vorteile hat Online-Unterricht?',
      'Welche Nachteile sehen Sie?',
      'Lernen Schüler online genauso gut wie im Klassenzimmer?',
      'Welche Erfahrungen haben Sie gemacht?',
      'Welche Lösung wäre Ihrer Meinung nach ideal?'
    ],
    followUpRules: [
      'Wenn Meinung fehlt -> Meinung verlangen',
      'Wenn Begründung fehlt -> nach Warum fragen',
      'Wenn nur eine Seite genannt wird -> Gegenposition fragen',
      'Wenn Antwort stark ist -> differenziertere Frage stellen',
      'Am Ende kurze Zusammenfassung verlangen'
    ],
    reportFields: [
      'Diskussion',
      'Argumentation',
      'Vor- und Nachteile',
      'Beispiele',
      'Satzbau',
      'Flüssigkeit'
    ],
    benchmarkMarkers: {
      A2: ['sehr einfache Meinung', 'kurze Sätze'],
      B1: ['Meinung mit Grund', 'einfache Beispiele'],
      B2: [
        'mehrere Argumente',
        'Gegenargumente',
        'differenzierte Meinung',
        'Vergleich',
        'klare Schlussfolgerung'
      ]
    }
  }
];

export function getPlacementModelsByLevel(level) {
  return aiPlacementLibrary.filter((item) => item.level === level);
}

export function getPlacementModel(id) {
  return aiPlacementLibrary.find((item) => item.id === id);
}

export function getPlacementModelsBySkill(skill) {
  return aiPlacementLibrary.filter((item) => item.skill === skill);
}

export function getPlacementFlow(startLevel = 'A2') {
  if (startLevel === 'A2') {
    return [
      
      getPlacementModel('a2_self_mittel'),
      getPlacementModel('a2_bild_mittel'),
      getPlacementModel('a2_hoeren_mittel'),
      getPlacementModel('a2_planung_mittel')
    ].filter(Boolean);
  }

  if (startLevel === 'B1') {
    return [
      getPlacementModel('b1_self_mittel'),
      getPlacementModel('b1_bild_mittel'),
      getPlacementModel('b1_hoeren_mittel'),
      getPlacementModel('b1_planung_schwach'),
      getPlacementModel('b1_planung_mittel')
    ].filter(Boolean);
  }

  if (startLevel === 'B2') {
    return [
      getPlacementModel('b2_self_mittel'),
      getPlacementModel('b2_grafik_mittel'),
      getPlacementModel('b2_hoeren_mittel'),
      getPlacementModel('b2_diskussion_mittel')
    ].filter(Boolean);
  }

  return [];
}

export function getNextPlacementModel({
  startLevel = 'A2',
  completedSkills = {},
  lastSkill = null,
  lastAiLevel = null,
}) {
  const hasSkill = (skill) => Boolean(completedSkills?.[skill]);

  if (!hasSkill('selbstvorstellung')) {
    if (startLevel === 'B2') return getPlacementModel('b2_self_mittel');
    if (startLevel === 'B1') return getPlacementModel('b1_self_mittel');
    return getPlacementModel('a2_self_mittel');
  }

  if (!hasSkill('bildbeschreibung') && !hasSkill('grafikbeschreibung')) {
    if (lastAiLevel === 'B2' || startLevel === 'B2') {
      return getPlacementModel('b2_grafik_mittel');
    }

    if (lastAiLevel === 'B1' || lastAiLevel === 'B1+') {
      return getPlacementModel('b1_bild_mittel');
    }

    return getPlacementModel('a2_bild_mittel');
  }

  if (!hasSkill('hoeren')) {
    if (lastAiLevel === 'B2' || startLevel === 'B2') {
      return getPlacementModel('b2_hoeren_mittel');
    }

    if (lastAiLevel === 'B1' || lastAiLevel === 'B1+') {
      return getPlacementModel('b1_hoeren_mittel');
    }

    return getPlacementModel('a2_hoeren_mittel');
  }

  if (!hasSkill('planung') && !hasSkill('diskussion')) {
    const scores = Object.values(completedSkills || {});

    const hasB2Signal = scores.includes('B2');
    const hasB1Signal = scores.includes('B1') || scores.includes('B1+');
    const weakA2 = scores.filter((v) => v === 'A2').length >= 2;

    if (hasB2Signal || startLevel === 'B2') {
      return getPlacementModel('b2_diskussion_mittel');
    }

    if (hasB1Signal && !weakA2) {
      return getPlacementModel('b1_planung_mittel');
    }

    if (hasB1Signal || scores.includes('A2+')) {
      return getPlacementModel('b1_planung_schwach');
    }

    return getPlacementModel('a2_planung_mittel');
  }

  return null;
}