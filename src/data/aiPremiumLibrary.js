export const aiPremiumLibrary = [
  {
    id: 'a2-self-001',
    level: 'A2',
    skill: 'selbstvorstellung',
    difficulty: 'leicht',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 90,
    preparationTime: 30,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 25,

    title: 'A2 Selbstvorstellung – Basis',
    studentPreview: 'Stellen Sie sich kurz vor.',
    shortPrompt:
      'Der Schüler beginnt mit einer kurzen Selbstvorstellung. Der KI-Prüfer stellt einfache Nachfragen.',

    mandatoryTopics: ['Name', 'Herkunftsland', 'Wohnort', 'ArbeitOderKurs'],

    keywords: [
      'ich heiße',
      'ich komme aus',
      'ich wohne in',
      'ich arbeite',
      'ich lerne Deutsch'
    ],

    examinerQuestions: [
      'Wie heißen Sie?',
      'Aus welchem Land kommen Sie?',
      'Wo wohnen Sie jetzt?',
      'Arbeiten Sie oder besuchen Sie einen Deutschkurs?'
    ],

    followUpRules: [
      {
        ifMissing: 'Herkunftsland',
        ask: 'Sie haben Ihr Heimatland noch nicht erwähnt. Aus welchem Land kommen Sie?'
      },
      {
        ifOnlyCityMentioned: true,
        ask: 'Erzählen Sie bitte kurz etwas über Ihr Heimatland.'
      },
      {
        ifKeyword: 'Arbeit',
        ask: 'Was machen Sie bei der Arbeit?'
      },
      {
        ifKeyword: 'Deutschkurs',
        ask: 'Wann besuchen Sie den Deutschkurs?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentAnswersInFullSentences',
        action: 'askSlightlyHarderQuestion',
        nextQuestion: 'Warum lernen Sie Deutsch?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentAnswersVeryShort',
        action: 'askSimplerQuestion'
      }
    ],

    nextStepRules: {
      schwach: 'A2 Bildbeschreibung mittel',
      mittel: 'A2 Bildbeschreibung mittel',
      stark: 'A2 Bildbeschreibung stark'
    },

    examinerRules: [
      'Stelle immer nur eine Frage auf einmal.',
      'Sprich langsam und klar.',
      'Bleibe auf Niveau A2.',
      'Korrigiere nicht jeden Fehler sofort.',
      'Wenn die Antwort zu kurz ist, frage freundlich nach.'
    ],

    reportFields: [
      'Aussprache',
      'Wortschatz',
      'Satzbau',
      'Flüssigkeit',
      'Empfohlene Übungen'
    ]
  },

  {
    id: 'a2-bild-001',
    level: 'A2',
    skill: 'bildbeschreibung',
    difficulty: 'leicht',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 120,
    preparationTime: 30,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 25,

    title: 'A2 Bildbeschreibung – Bäckerei',
    studentPreview: 'Beschreiben Sie das Bild kurz.',
    shortPrompt:
      'Der KI-Prüfer zeigt ein einfaches A2-Bild und stellt einfache Fragen zu Personen, Ort und Handlung.',

    imagePrompt:
      'Eine Frau steht in einer Bäckerei. Sie kauft Brot. Hinter der Theke steht eine Verkäuferin. Man sieht Brot, Brötchen und Kuchen.',

    mandatoryTopics: ['Personen', 'Ort', 'Handlung'],

    keywords: [
      'ich sehe',
      'eine Frau',
      'in der Bäckerei',
      'sie kauft',
      'Brot',
      'Verkäuferin'
    ],

    examinerQuestions: [
      'Was sehen Sie auf dem Bild?',
      'Wer ist auf dem Bild?',
      'Wo ist die Frau?',
      'Was macht die Frau?',
      'Was sehen Sie in der Bäckerei?'
    ],

    followUpRules: [
      {
        ifAnswerTooShort: true,
        ask: 'Können Sie noch einen Satz sagen?'
      },
      {
        ifMissing: 'Ort',
        ask: 'Wo ist die Person?'
      },
      {
        ifMissing: 'Handlung',
        ask: 'Was macht die Person?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentAnswersInFullSentences',
        action: 'askSlightlyHarderQuestion',
        nextQuestion: 'Kaufen Sie auch gern Brot in einer Bäckerei?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentAnswersVeryShort',
        action: 'askSimplerQuestion',
        nextQuestion: 'Ist das eine Frau?'
      }
    ],

    nextStepRules: {
      schwach: 'A2 Niveau bestätigen',
      mittel: 'A2 Bildbeschreibung mittel',
      stark: 'A2 Bildbeschreibung mittel'
    },

    examinerRules: [
      'Bleibe auf Niveau A2 leicht.',
      'Frage nur nach sichtbaren Dingen.',
      'Keine Meinung und keine lange Erfahrung verlangen.',
      'Hilf mit einfachen Nachfragen.'
    ],

    reportFields: [
      'Personen beschreiben',
      'Ort nennen',
      'Tätigkeit beschreiben',
      'Einfache Sätze'
    ]
  },

  {
    id: 'a2-bild-002',
    level: 'A2',
    skill: 'bildbeschreibung',
    difficulty: 'mittel',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 150,
    preparationTime: 30,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 25,

    title: 'A2 Bildbeschreibung – Kochen zu Hause',
    studentPreview: 'Beschreiben Sie das Bild.',
    shortPrompt:
      'Der KI-Prüfer prüft, ob der Schüler Personen, Ort, Handlung und Gegenstände einfach beschreiben kann.',

    imagePrompt:
      'Eine Familie steht in einer Küche. Eine Mutter und ein Kind kochen zusammen. Auf dem Tisch liegen Gemüse, Messer und Teller.',

    mandatoryTopics: ['Personen', 'Ort', 'Handlung', 'Gegenstände'],

    keywords: [
      'in der Küche',
      'kochen',
      'schneiden',
      'helfen',
      'Gemüse',
      'zusammen'
    ],

    examinerQuestions: [
      'Wer ist auf dem Bild?',
      'Wo sind die Personen?',
      'Was machen die Personen?',
      'Was sehen Sie in der Küche?',
      'Welche Gegenstände sehen Sie?'
    ],

    followUpRules: [
      {
        ifMissing: 'Ort',
        ask: 'Wo sind die Personen?'
      },
      {
        ifMissing: 'Gegenstände',
        ask: 'Was sehen Sie auf dem Tisch?'
      },
      {
        ifAnswerTooShort: true,
        ask: 'Können Sie bitte noch etwas mehr sagen?'
      },
      {
        ifStudentStrong: true,
        ask: 'Kochen Sie auch gern zu Hause?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentUsesSeveralVerbs',
        action: 'askPersonalQuestion',
        nextQuestion: 'Wer kocht meistens in Ihrer Familie?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentHasManyPauses',
        action: 'askSimpleObservationQuestion',
        nextQuestion: 'Sehen Sie eine Küche?'
      }
    ],

    nextStepRules: {
      schwach: 'A2 Lesen/Hören leicht',
      mittel: 'A2 Lesen/Hören mittel',
      stark: 'A2 Bildbeschreibung stark oder B1- prüfen'
    },

    examinerRules: [
      'Bleibe zuerst bei Beschreibung.',
      'Frage erst am Ende eine einfache persönliche Frage.',
      'Nicht sofort B1-Fragen stellen.',
      'Achte auf Verben und Satzbau.'
    ],

    reportFields: [
      'Bildbeschreibung A2',
      'Verben',
      'Satzbau',
      'Wortschatz Küche',
      'Nächster Schritt'
    ]
  },

  {
    id: 'a2-bild-003',
    level: 'A2',
    skill: 'bildbeschreibung',
    difficulty: 'stark',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 180,
    preparationTime: 30,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 25,

    title: 'A2 Bildbeschreibung – Familienausflug',
    studentPreview: 'Beschreiben Sie das Bild etwas genauer.',
    shortPrompt:
      'Der KI-Prüfer prüft starkes A2/A2+ mit Ort, Handlung, Wetter und einfacher persönlicher Frage.',

    imagePrompt:
      'Eine Familie macht einen Ausflug im Park oder in den Bergen. Die Eltern und Kinder gehen spazieren. Das Wetter ist schön.',

    mandatoryTopics: ['Personen', 'Ort', 'Handlung', 'Wetter', 'Hintergrund'],

    keywords: [
      'Ausflug',
      'Familie',
      'spazieren gehen',
      'schönes Wetter',
      'im Hintergrund',
      'Freizeit'
    ],

    examinerQuestions: [
      'Was sehen Sie auf dem Bild?',
      'Wo sind die Personen?',
      'Was machen die Personen?',
      'Wie ist das Wetter?',
      'Was sehen Sie im Hintergrund?'
    ],

    followUpRules: [
      {
        ifMissing: 'Wetter',
        ask: 'Wie ist das Wetter auf dem Bild?'
      },
      {
        ifMissing: 'Hintergrund',
        ask: 'Was sehen Sie im Hintergrund?'
      },
      {
        ifStudentStrong: true,
        ask: 'Machen Sie auch gern Ausflüge? Warum?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentGivesReason',
        action: 'moveToB1Minus',
        nextQuestion: 'Warum ist Freizeit mit der Familie wichtig?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentStrugglesWithA2Strong',
        action: 'returnToA2Medium'
      }
    ],

    nextStepRules: {
      schwach: 'A2+ bestätigen',
      mittel: 'B1- prüfen',
      stark: 'B1 Bildbeschreibung geben'
    },

    examinerRules: [
      'Beginne mit normalen A2-Fragen.',
      'Wenn der Schüler stark ist, frage nach einem einfachen Warum.',
      'Keine lange B1-Erfahrung verlangen.',
      'Nutze die Antwort für die Einstufung A2+ oder B1-.'
    ],

    reportFields: [
      'A2+ Bildbeschreibung',
      'Ort und Wetter',
      'Einfache Begründung',
      'Flüssigkeit',
      'Empfohlenes Niveau'
    ]
  },

  {
    id: 'b1-bild-001',
    level: 'B1',
    skill: 'bildbeschreibung',
    difficulty: 'mittel',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 180,
    preparationTime: 45,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 25,

    title: 'B1 Bildbeschreibung – Familie beim Essen',
    studentPreview:
      'Beschreiben Sie ein Bild. Sprechen Sie auch über Ihre Meinung und Erfahrung.',
    shortPrompt:
      'Der KI-Prüfer zeigt ein Bildthema und stellt Fragen zur Beschreibung, Meinung und Erfahrung.',

    imagePrompt:
      'Eine Familie sitzt in einer Küche am Tisch. Die Eltern und zwei Kinder essen gemeinsam. Auf dem Tisch stehen Brot, Gemüse und Getränke.',

    mandatoryTopics: [
      'Personen',
      'Ort',
      'Handlung',
      'PersönlicherEindruck',
      'EigeneErfahrung'
    ],

    keywords: [
      'im Vordergrund',
      'im Hintergrund',
      'am Tisch',
      'gemeinsam',
      'wahrscheinlich',
      'meiner Meinung nach',
      'ich habe auch erlebt'
    ],

    examinerQuestions: [
      'Was sehen Sie auf dem Bild?',
      'Wo sind die Personen?',
      'Was machen die Personen?',
      'Wie wirkt die Situation auf Sie?',
      'Haben Sie so etwas schon erlebt?'
    ],

    followUpRules: [
      {
        ifMissing: 'PersönlicherEindruck',
        ask: 'Wie wirkt die Situation auf Sie?'
      },
      {
        ifMissing: 'EigeneErfahrung',
        ask: 'Haben Sie eine ähnliche Situation schon erlebt?'
      },
      {
        ifAnswerTooShort: true,
        ask: 'Können Sie das bitte noch etwas genauer beschreiben?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentUsesConnectors',
        action: 'askOpinionQuestion',
        nextQuestion: 'Warum ist gemeinsames Essen für Familien wichtig?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentHasManyPauses',
        action: 'askSimpleObservationQuestion'
      }
    ],

    nextStepRules: {
      schwach: 'A2+ bestätigen',
      mittel: 'B1 bestätigen',
      stark: 'B1 Planung mittel'
    },

    examinerRules: [
      'Stelle zuerst einfache Beschreibungsfragen.',
      'Frage danach nach Meinung und Erfahrung.',
      'Bleibe auf Niveau B1.',
      'Unterbrich den Schüler nicht ständig.',
      'Bewerte am Ende Wortschatz, Grammatik und Struktur.'
    ],

    reportFields: [
      'Bildbeschreibung',
      'Persönliche Meinung',
      'Eigene Erfahrung',
      'Grammatik',
      'Wortschatz',
      'Nächster Trainingsschritt'
    ]
  },

  {
    id: 'b1-planung-001',
    level: 'B1',
    skill: 'planung',
    difficulty: 'mittel',
    service: ['einstufungstest', 'weeklyPlan', 'premiumExam'],
    estimatedTime: 240,
    preparationTime: 30,
    visibleToStudents: false,
    placementUse: true,
    placementWeight: 30,

    title: 'B1 Planung – Abschlussfeier im Kurs',
    studentPreview:
      'Planen Sie gemeinsam mit Ihrem Gesprächspartner eine Abschlussfeier.',
    shortPrompt:
      'Der KI-Prüfer spielt den Gesprächspartner. Der Schüler soll Vorschläge machen, reagieren und Entscheidungen treffen.',

    situation:
      'Ihr Deutschkurs ist bald zu Ende. Sie möchten mit den anderen Teilnehmern eine kleine Abschlussfeier organisieren.',

    studentPreviewPoints: [
      'Wann und wo?',
      'Essen und Getränke',
      'Musik oder Programm',
      'Wer bringt was mit?'
    ],

    mandatoryTopics: [
      'Zeit',
      'Ort',
      'EssenUndGetränke',
      'AufgabenVerteilen',
      'Entscheidung'
    ],

    keywords: [
      'ich schlage vor',
      'wir könnten',
      'das ist eine gute Idee',
      'ich bin einverstanden',
      'ich kann mitbringen',
      'am besten'
    ],

    examinerQuestions: [
      'Wann sollen wir die Abschlussfeier machen?',
      'Wo können wir feiern?',
      'Was sollen wir essen und trinken?',
      'Wer bringt was mit?',
      'Wie entscheiden wir uns?'
    ],

    followUpRules: [
      {
        ifMissing: 'Ort',
        ask: 'Wo möchten Sie feiern?'
      },
      {
        ifMissing: 'AufgabenVerteilen',
        ask: 'Was können Sie mitbringen oder organisieren?'
      },
      {
        ifStudentStrong: true,
        ask: 'Was machen wir, wenn einige Teilnehmer keine Zeit haben?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentNegotiatesWell',
        action: 'askAlternativePlan',
        nextQuestion: 'Welche Alternative haben wir, wenn das Wetter schlecht ist?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentOnlyAnswersYesNo',
        action: 'askChoiceQuestion',
        nextQuestion: 'Möchten Sie lieber im Kursraum oder im Park feiern?'
      }
    ],

    nextStepRules: {
      schwach: 'B1- oder A2+ Lernplan',
      mittel: 'B1 bestätigen',
      stark: 'B1 stark oder B2 Einstieg prüfen'
    },

    examinerRules: [
      'Spiele einen echten Gesprächspartner.',
      'Stelle nicht alle Fragen auf einmal.',
      'Der Schüler muss Vorschläge machen und reagieren.',
      'Achte auf Redemittel für Planung.',
      'Bewerte nicht wie ein offizieller Prüfer, sondern als Lernanalyse.'
    ],

    reportFields: [
      'Planungsgespräch',
      'Vorschläge',
      'Reaktion auf Partner',
      'Redemittel',
      'Entscheidung',
      'Nächster Trainingsschritt'
    ]
  },

  {
    id: 'b2-diskussion-001',
    level: 'B2',
    skill: 'diskussion',
    difficulty: 'mittel',
    service: ['weeklyPlan', 'premiumExam'],
    estimatedTime: 300,
    preparationTime: 60,
    visibleToStudents: false,
    placementUse: false,
    placementWeight: 0,

    title: 'B2 Diskussion – Homeoffice oder Büro',
    studentPreview:
      'Diskutieren Sie über ein Thema. Nennen Sie Vorteile, Nachteile und Ihre Meinung.',
    shortPrompt:
      'Der KI-Prüfer führt eine B2-Diskussion über Homeoffice und Büroarbeit.',

    topic:
      'Viele Menschen arbeiten heute teilweise im Homeoffice. Andere bevorzugen das Büro.',

    studentPreviewPoints: [
      'Vorteile von Homeoffice',
      'Nachteile für Teamarbeit',
      'Ihre persönliche Meinung'
    ],

    mandatoryTopics: [
      'Vorteile',
      'Nachteile',
      'Begründung',
      'Beispiel',
      'PersönlicheMeinung'
    ],

    keywords: [
      'einerseits',
      'andererseits',
      'im Vergleich zu',
      'ein großer Vorteil besteht darin',
      'problematisch ist',
      'aus meiner Sicht',
      'beispielsweise'
    ],

    examinerQuestions: [
      'Welche Vorteile hat Homeoffice Ihrer Meinung nach?',
      'Welche Nachteile kann Homeoffice haben?',
      'Ist Homeoffice für alle Berufe geeignet?',
      'Wie wichtig ist Teamarbeit im Büro?',
      'Welche Lösung finden Sie persönlich am besten?'
    ],

    followUpRules: [
      {
        ifMissing: 'Begründung',
        ask: 'Können Sie Ihre Meinung bitte begründen?'
      },
      {
        ifMissing: 'Beispiel',
        ask: 'Können Sie ein konkretes Beispiel nennen?'
      },
      {
        ifStudentStrong: true,
        ask: 'Wie könnte man Homeoffice und Büroarbeit sinnvoll kombinieren?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentArguesClearly',
        action: 'askAbstractQuestion',
        nextQuestion:
          'Welche langfristigen Auswirkungen könnte Homeoffice auf die Arbeitswelt haben?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentStrugglesWithB2',
        action: 'askConcreteQuestion',
        nextQuestion: 'Arbeiten Sie lieber zu Hause oder im Büro? Warum?'
      }
    ],

    examinerRules: [
      'Gib dem Schüler 60 Sekunden Vorbereitung.',
      'Zeige nur Thema und drei Stichpunkte, keine Musterlösung.',
      'Führe eine echte Diskussion, keinen Unterricht.',
      'Frage nach Begründungen und Beispielen.',
      'Erhöhe die Schwierigkeit, wenn der Schüler sicher spricht.',
      'Vereinfache die Frage, wenn der Schüler überfordert ist.'
    ],

    reportFields: [
      'Argumentation',
      'Struktur',
      'Wortschatz B2',
      'Grammatik',
      'Flüssigkeit',
      'Empfohlene nächste Aufgabe'
    ]
  },

  {
    id: 'b2-grafik-001',
    level: 'B2',
    skill: 'grafikbeschreibung',
    difficulty: 'mittel',
    service: ['weeklyPlan', 'premiumExam'],
    estimatedTime: 300,
    preparationTime: 60,
    visibleToStudents: false,
    placementUse: false,
    placementWeight: 0,

    title: 'B2 Grafikbeschreibung – Nutzung von Online-Kursen',
    studentPreview:
      'Beschreiben Sie eine Grafik. Fassen Sie die wichtigsten Informationen zusammen und äußern Sie Ihre Meinung.',
    shortPrompt:
      'Der KI-Prüfer zeigt ein Grafikthema und prüft Beschreibung, Vergleich, Interpretation und Meinung.',

    graphicPrompt:
      'Eine Balkengrafik zeigt, wie viele Erwachsene Online-Kurse nutzen: 2018: 18%, 2020: 32%, 2022: 45%, 2024: 58%.',

    mandatoryTopics: [
      'ThemaDerGrafik',
      'WichtigsteZahlen',
      'Vergleich',
      'Entwicklung',
      'Interpretation',
      'EigeneMeinung'
    ],

    keywords: [
      'die Grafik zeigt',
      'der Anteil steigt',
      'im Vergleich zu',
      'deutlich höher',
      'auffällig ist',
      'daraus kann man schließen',
      'meiner Ansicht nach'
    ],

    examinerQuestions: [
      'Was zeigt die Grafik?',
      'Welche Entwicklung sehen Sie?',
      'Welche Zahl ist besonders auffällig?',
      'Warum nutzen immer mehr Menschen Online-Kurse?',
      'Welche Vor- und Nachteile haben Online-Kurse?'
    ],

    followUpRules: [
      {
        ifMissing: 'WichtigsteZahlen',
        ask: 'Welche Zahlen sind in der Grafik besonders wichtig?'
      },
      {
        ifMissing: 'Interpretation',
        ask: 'Was könnte der Grund für diese Entwicklung sein?'
      },
      {
        ifStudentStrong: true,
        ask: 'Welche Bedeutung hat diese Entwicklung für die Zukunft der Bildung?'
      }
    ],

    upgradeRules: [
      {
        condition: 'studentInterpretsDataClearly',
        action: 'askAbstractQuestion',
        nextQuestion:
          'Glauben Sie, dass Online-Kurse den klassischen Unterricht teilweise ersetzen können?'
      }
    ],

    downgradeRules: [
      {
        condition: 'studentCannotDescribeGraph',
        action: 'askConcreteGraphQuestion',
        nextQuestion: 'Ist die Zahl von 2018 bis 2024 gestiegen oder gesunken?'
      }
    ],

    examinerRules: [
      'Zeige nur Grafikthema und Daten, keine Musterlösung.',
      'Prüfe zuerst Beschreibung, dann Interpretation.',
      'Verlange Beispiele und Begründungen.',
      'Bleibe auf B2-Niveau, aber vereinfache bei Überforderung.'
    ],

    reportFields: [
      'Grafikbeschreibung',
      'Zahlen und Vergleiche',
      'Interpretation',
      'Meinung',
      'Wortschatz B2',
      'Nächster Trainingsschritt'
    ]
  }
];

export function getAiPremiumModels({
  level,
  skill,
  service,
  difficulty,
  usedIds = []
}) {
  return aiPremiumLibrary.filter((item) => {
    const matchLevel = !level || item.level === level;
    const matchSkill = !skill || item.skill === skill;
    const matchService = !service || item.service.includes(service);
    const matchDifficulty = !difficulty || item.difficulty === difficulty;
    const notUsed = !usedIds.includes(item.id);

    return (
      matchLevel &&
      matchSkill &&
      matchService &&
      matchDifficulty &&
      notUsed &&
      item.visibleToStudents === false
    );
  });
}

export function getAiPremiumModel(options) {
  const models = getAiPremiumModels(options);
  if (!models.length) return null;

  return models[Math.floor(Math.random() * models.length)];
}