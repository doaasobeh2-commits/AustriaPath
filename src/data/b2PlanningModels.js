/** B2 – Gemeinsame Planung & Diskussion (ÖIF-orientiert, Originaltexte) */
export const b2PlanningModels = [
  {
    id: "b2-plan-01",
    title: "Betriebsausflug planen",
    situation:
      "Ihr Team im Betrieb möchte einen Betriebsausflug organisieren. Sie besprechen mit einer Kollegin / einem Kollegen Ort, Datum und Programm.",
    points: [
      "Wohin soll der Ausflug gehen?",
      "Wann und wie lange?",
      "Wie kommen Sie hin (Transport, Kosten)?",
      "Was soll im Programm enthalten sein?",
    ],
    dialog: [
      "A: Ich würde vorschlagen, dass wir einen Tagesausflug in die Wachau machen.",
      "B: Das klingt gut. Wann wäre für dich am besten?",
      "A: Vielleicht im Frühling, an einem Samstag. Was hältst du davon?",
      "B: Das passt mir. Wir könnten mit dem Zug fahren — das ist entspannter als mit dem Bus.",
      "A: Einverstanden. Sollen wir auch ein gemeinsames Mittagessen einplanen?",
      "B: Ja, und vielleicht eine kurze Wanderung. Ich kümmere mich um die Reservierung im Restaurant.",
    ],
    words: [
      "der Betriebsausflug",
      "die Wachau",
      "die Reservierung",
      "das Programm",
      "die Anreise",
    ],
    verbs: ["vorschlagen", "einplanen", "reservieren", "sich kümmern um", "organisieren"],
    sentences: [
      "Ich würde vorschlagen, dass wir …",
      "Was hältst du davon?",
      "Das passt mir gut.",
      "Wir könnten mit dem Zug fahren.",
    ],
    grammar: ["Konjunktiv II: würde / könnte", "dass-Satz", "sich kümmern um + Akk."],
    mistakes: [
      "❌ Ich schlage vor, dass wir gehen in die Wachau.",
      "✅ Ich schlage vor, dass wir in die Wachau gehen.",
    ],
    tip: "Nennen Sie konkrete Vorschläge und teilen Sie Aufgaben fair auf.",
  },
  {
    id: "b2-plan-02",
    title: "Sprachcafé in der Gemeinde",
    situation:
      "In Ihrer Gemeinde soll ein monatliches Sprachcafé für Menschen mit Migrationshintergrund starten. Sie planen mit einer Mitstreiterin / einem Mitstreiter.",
    points: [
      "Wo findet das Sprachcafé statt?",
      "Wie oft und zu welcher Uhrzeit?",
      "Wer übernimmt welche Aufgaben?",
      "Wie werben Sie dafür?",
    ],
    dialog: [
      "A: Meiner Meinung nach wäre das Gemeindezentrum ein guter Ort.",
      "B: Stimmt. Es ist zentral und barrierefrei. Wie oft sollten wir uns treffen?",
      "A: Einmal im Monat, am ersten Donnerstag ab 18 Uhr.",
      "B: Das finde ich sinnvoll. Ich könnte mich um Flyer und Social Media kümmern.",
      "A: Super. Ich übernehme den Kontakt zur Gemeinde und die Getränke.",
      "B: Sollen wir auch muttersprachliche Helfer einladen?",
      "A: Ja, das würde die Atmosphäre verbessern.",
    ],
    words: [
      "das Sprachcafé",
      "die Gemeinde",
      "die Werbung",
      "die Teilnahme",
      "die Integration",
    ],
    verbs: ["stattfinden", "werben", "einladen", "übernehmen", "verbessern"],
    sentences: [
      "Meiner Meinung nach wäre …",
      "Ich könnte mich um … kümmern.",
      "Das finde ich sinnvoll.",
    ],
    grammar: ["Konjunktiv II", "sich kümmern um", "Modalverb: sollen / könnte"],
    mistakes: [
      "❌ Wir treffen uns jeden Monat ein Mal.",
      "✅ Wir treffen uns einmal im Monat.",
    ],
    tip: "Bei Integrations-Themen: respektvoll formulieren und praktische Schritte nennen.",
  },
];

export const b2DiscussionModels = [
  {
    id: "b2-disk-04",
    title: "Homeoffice vs. Büro",
    type: "Diskussion",
    level: "B2",
    situation:
      "Immer mehr Unternehmen bieten Homeoffice an. Andere erwarten die Anwesenheit im Büro.",
    task:
      "Diskutieren Sie Vor- und Nachteile für Arbeitnehmer und Arbeitgeber. Begründen Sie Ihre Haltung.",
    example:
      "Einerseits spart Homeoffice Zeit und ermöglicht flexible Arbeitszeiten. Andererseits fehlt der direkte Austausch mit Kolleginnen und Kollegen. Aus meiner Sicht hängt die sinnvolle Lösung von der Branche ab — in manchen Berufen ist Präsenz unverzichtbar, in anderen nicht.",
    words: ["Homeoffice", "Produktivität", "Teamarbeit", "Flexibilität", "Pendeln"],
    verbs: ["ermöglichen", "fehlen", "abhängen von", "kombinieren", "verringern"],
    sentences: [
      "Einerseits …, andererseits …",
      "Aus meiner Sicht hängt … von … ab.",
      "Man sollte beide Modelle abwägen.",
    ],
    grammar: ["einerseits … andererseits", "abhängen von", "dass-Satz"],
    mistakes: [
      "❌ Homeoffice ist immer besser wie Büro.",
      "✅ Homeoffice ist in manchen Fällen besser als Büroarbeit.",
    ],
    tip: "Nennen Sie mindestens je einen Vorteil und Nachteil.",
  },
  {
    id: "b2-disk-05",
    title: "Öffentlicher Nahverkehr ausbauen",
    type: "Diskussion",
    level: "B2",
    situation:
      "In vielen Regionen Österreichs wird über den Ausbau des öffentlichen Nahverkehrs diskutiert.",
    task:
      "Erörtern Sie, warum der Ausbau wichtig sein kann und welche Herausforderungen bestehen (Kosten, ländlicher Raum).",
    example:
      "Ich bin der Ansicht, dass ein guter Nahverkehr die Umwelt entlasten und Mobilität für alle ermöglichen kann. Gleichzeitig sind hohe Investitionen nötig, und auf dem Land sind die Strecken teuer. Eine Mischung aus Bus, Bahn und guter Anbindung scheint mir sinnvoll.",
    words: [
      "der Nahverkehr",
      "die Infrastruktur",
      "die Investition",
      "der ländliche Raum",
      "die Anbindung",
    ],
    verbs: ["ausbauen", "entlasten", "ermöglichen", "finanzieren", "verbessern"],
    sentences: [
      "Ich bin der Ansicht, dass …",
      "Gleichzeitig sind … nötig.",
      "Das scheint mir sinnvoll.",
    ],
    grammar: ["Passiv-Erkennen", "Modalverben", "Nebensätze"],
    mistakes: [
      "❌ Der Nahverkehr muss mehr ausgebaut werden überall.",
      "✅ Der Nahverkehr sollte vor allem dort ausgebaut werden, wo die Nachfrage hoch ist.",
    ],
    tip: "Verbinden Sie Umwelt-, Wirtschafts- und Sozialargumente.",
  },
];
