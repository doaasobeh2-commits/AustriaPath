export const b2LesenModels = [
  {
    id: 'b2-lesen-modell-1',
    level: 'B2',
    title: 'B2 Modell 1 – Gesundheit, Bildung und Alltag',

    lesenTeil1: {
      title: 'Lesen Teil 1 – Globalverstehen',
      instruction:
        'Lesen Sie die Überschriften und die Texte. Ordnen Sie jedem Text die passende Überschrift zu. Fünf Überschriften bleiben übrig.',
      headings: [
        { id: 'a', text: 'Neue Wege zu besserem Schlaf' },
        { id: 'b', text: 'Warum Haustiere Kindern guttun können' },
        { id: 'c', text: 'Digitale Medien im Unterricht' },
        { id: 'd', text: 'Mehr Bewegung im Alltag' },
        { id: 'e', text: 'Gesunde Ernährung in der Schule' },
        { id: 'f', text: 'Lernen bis ins hohe Alter' },
        { id: 'g', text: 'Stress durch ständige Erreichbarkeit' },
        { id: 'h', text: 'Freundschaften im digitalen Zeitalter' },
        { id: 'i', text: 'Mehr Grünflächen in der Stadt' },
        { id: 'j', text: 'Ehrenamt als Chance für Integration' }
      ],
      texts: [
        {
          id: 1,
          text:
            'Immer mehr Schulen achten darauf, dass Kinder nicht nur satt werden, sondern auch verstehen, was ausgewogenes Essen bedeutet. Einige Schulen bieten Kochprojekte an, bei denen Schülerinnen und Schüler lernen, einfache und gesunde Gerichte selbst zuzubereiten.'
        },
        {
          id: 2,
          text:
            'Viele Menschen schlafen schlecht, weil sie abends noch lange auf Bildschirme schauen. Fachleute empfehlen deshalb feste Schlafzeiten, weniger Licht am Abend und kleine Rituale, die dem Körper helfen, zur Ruhe zu kommen.'
        },
        {
          id: 3,
          text:
            'Studien zeigen, dass Kinder, die mit Tieren aufwachsen, häufig Verantwortung übernehmen und soziale Fähigkeiten entwickeln. Besonders Hunde und Katzen können dazu beitragen, dass Kinder ruhiger und selbstbewusster werden.'
        },
        {
          id: 4,
          text:
            'Nicht jeder hat Zeit für Sport im Verein. Trotzdem kann man im Alltag aktiver werden: Treppen statt Aufzug, kurze Wege zu Fuß und kleine Bewegungspausen während der Arbeit können langfristig viel bewirken.'
        },
        {
          id: 5,
          text:
            'Viele Erwachsene besuchen auch nach ihrer Ausbildung Kurse oder Seminare. Sie möchten beruflich weiterkommen, geistig aktiv bleiben oder einfach etwas Neues lernen. Bildung endet heute für viele nicht mehr mit Schule oder Studium.'
        }
      ],
      solutions: {
        1: 'e',
        2: 'a',
        3: 'b',
        4: 'd',
        5: 'f'
      }
    },

    lesenTeil2: {
      title: 'Lesen Teil 2 – Detailverstehen',
      instruction:
        'Lesen Sie den Text und wählen Sie bei jeder Aufgabe die richtige Lösung: a, b oder c.',
      text:
        'In vielen europäischen Städten wird darüber diskutiert, wie Menschen gesünder leben können. Dabei geht es nicht nur um Sport oder Ernährung, sondern auch um die Frage, wie der Alltag organisiert ist. Wer jeden Tag lange im Auto sitzt, wenig Zeit für Pausen hat und ständig erreichbar sein muss, fühlt sich oft erschöpft. Experten betonen deshalb, dass Gesundheit nicht nur eine private Aufgabe ist. Auch Arbeitgeber, Schulen und Städte können viel dazu beitragen. Flexible Arbeitszeiten, sichere Radwege, gesunde Kantinen und öffentliche Parks sind Beispiele dafür, wie Lebensqualität verbessert werden kann. Gleichzeitig bleibt die persönliche Verantwortung wichtig. Wer regelmäßig Pausen macht, sich bewegt und bewusst mit digitalen Medien umgeht, kann Stress reduzieren. Entscheidend ist also ein Zusammenspiel aus individuellen Entscheidungen und guten Rahmenbedingungen.',
      questions: [
        {
          id: 1,
          question: 'Worum geht es im Text hauptsächlich?',
          options: {
            a: 'Um gesunde Lebensbedingungen im Alltag',
            b: 'Um neue Sportarten in Europa',
            c: 'Um Probleme in Krankenhäusern'
          },
          answer: 'a'
        },
        {
          id: 2,
          question: 'Was kann laut Text zu Erschöpfung führen?',
          options: {
            a: 'Zu viel Urlaub',
            b: 'Lange Autofahrten und ständige Erreichbarkeit',
            c: 'Gesunde Ernährung'
          },
          answer: 'b'
        },
        {
          id: 3,
          question: 'Wer trägt laut Text Verantwortung für Gesundheit?',
          options: {
            a: 'Nur Ärztinnen und Ärzte',
            b: 'Nur die einzelne Person',
            c: 'Einzelne Personen und die Gesellschaft'
          },
          answer: 'c'
        },
        {
          id: 4,
          question: 'Welche Beispiele nennt der Text für bessere Lebensqualität?',
          options: {
            a: 'Radwege, Parks und gesunde Kantinen',
            b: 'Mehr Werbung und längere Arbeitszeiten',
            c: 'Teurere Wohnungen'
          },
          answer: 'a'
        },
        {
          id: 5,
          question: 'Was ist die Hauptaussage am Ende des Textes?',
          options: {
            a: 'Gesundheit hängt nur vom Zufall ab',
            b: 'Gesundheit braucht persönliche und gesellschaftliche Lösungen',
            c: 'Digitale Medien sind immer schlecht'
          },
          answer: 'b'
        }
      ]
    },

    lesenTeil3: {
      title: 'Lesen Teil 3 – Selektives Verstehen',
      instruction:
        'Lesen Sie die Situationen und die Anzeigen. Welche Anzeige passt? Für eine Situation kann es auch keine passende Anzeige geben. Dann wählen Sie X.',
      situations: [
        { id: 1, text: 'Mira sucht einen Deutschkurs am Abend, weil sie tagsüber arbeitet.' },
        { id: 2, text: 'Omar möchte sich ehrenamtlich engagieren und älteren Menschen helfen.' },
        { id: 3, text: 'Lea sucht einen Kurs, in dem sie gesünder kochen lernen kann.' },
        { id: 4, text: 'Samir möchte am Wochenende gemeinsam mit anderen wandern gehen.' },
        { id: 5, text: 'Anna sucht eine Beratung, weil sie sich beruflich weiterbilden möchte.' }
      ],
      ads: [
        {
          id: 'a',
          text:
            'Abendkurs Deutsch B2: Montag und Mittwoch von 18:30 bis 20:30 Uhr. Kleine Gruppen, Prüfungsvorbereitung und persönliches Feedback.'
        },
        {
          id: 'b',
          text:
            'Gesund kochen im Alltag: Lernen Sie einfache Rezepte mit frischen Zutaten. Der Kurs findet jeden Freitagvormittag statt.'
        },
        {
          id: 'c',
          text:
            'Besuchsdienst gesucht: Wir suchen Freiwillige, die ältere Menschen besuchen, Gespräche führen oder kleine Wege gemeinsam erledigen.'
        },
        {
          id: 'd',
          text:
            'Karriereberatung im Bildungszentrum: Wir informieren über Kurse, Förderungen und Möglichkeiten der beruflichen Weiterbildung.'
        },
        {
          id: 'e',
          text:
            'Wandergruppe am Samstag: Gemeinsam entdecken wir leichte Routen in der Umgebung. Anmeldung bis Donnerstag erforderlich.'
        },
        {
          id: 'f',
          text:
            'Onlinekurs Bildbearbeitung: Lernen Sie, Fotos professionell zu bearbeiten. Keine Vorkenntnisse nötig.'
        }
      ],
      solutions: {
        1: 'a',
        2: 'c',
        3: 'b',
        4: 'e',
        5: 'd'
      }
    },

    sprachbausteineTeil1: {
      title: 'Sprachbausteine Teil 1 – Multiple Choice',
      instruction:
        'Lesen Sie den Text und wählen Sie für jede Lücke die richtige Lösung: a, b oder c.',
      text:
        'Viele Menschen möchten gesünder leben, wissen aber nicht, ___(1)___ sie anfangen sollen. Wichtig ist, kleine Schritte zu machen. Wer zum Beispiel jeden Tag zehn Minuten spazieren geht, kann bereits ___(2)___ seine Gesundheit tun. Auch die Ernährung spielt eine große Rolle. Dabei geht es nicht darum, alles zu verbieten, ___(3)___ bewusster zu wählen. Besonders im Berufsalltag ist es wichtig, Pausen einzuplanen, ___(4)___ Körper und Geist sich erholen können. Langfristig profitieren Menschen, ___(5)___ regelmäßig auf sich achten.',
      questions: [
        {
          id: 1,
          options: { a: 'wann', b: 'wo', c: 'warum' },
          answer: 'a'
        },
        {
          id: 2,
          options: { a: 'für', b: 'gegen', c: 'ohne' },
          answer: 'a'
        },
        {
          id: 3,
          options: { a: 'sondern', b: 'trotzdem', c: 'denn' },
          answer: 'a'
        },
        {
          id: 4,
          options: { a: 'obwohl', b: 'damit', c: 'seitdem' },
          answer: 'b'
        },
        {
          id: 5,
          options: { a: 'die', b: 'deren', c: 'denen' },
          answer: 'a'
        }
      ]
    },

    sprachbausteineTeil2: {
      title: 'Sprachbausteine Teil 2 – Wortkasten',
      instruction:
        'Lesen Sie den Text. Setzen Sie die passenden Wörter aus dem Wortkasten ein. Jedes Wort passt nur einmal.',
      wordBox: [
        'deutlich',
        'durch',
        'geringeres',
        'während',
        'Zusammenhang',
        'fördern',
        'Studien',
        'Umgang'
      ],
      text:
        'Mehrere ___(1)___ zeigen, dass Haustiere einen positiven Einfluss auf Kinder haben können. Besonders Hunde können Bewegung und soziale Kontakte ___(2)___. Kinder lernen außerdem den verantwortungsvollen ___(3)___ mit einem Lebewesen. Einige Forscher sehen sogar einen ___(4)___ zwischen Haustieren und einem ___(5)___ Stressniveau bei Kindern. Die Wirkung entsteht vor allem ___(6)___ regelmäßige Beschäftigung und emotionale Nähe.',
      solutions: {
        1: 'Studien',
        2: 'fördern',
        3: 'Umgang',
        4: 'Zusammenhang',
        5: 'geringeres',
        6: 'durch'
      }
    },

    words: [
      'Lebensqualität',
      'Rahmenbedingungen',
      'Verantwortung',
      'Erschöpfung',
      'Weiterbildung',
      'Zusammenhang',
      'Stressniveau'
    ],

    tips: [
      'Lesen Teil 1: zuerst die Hauptidee jedes Textes verstehen, nicht nur einzelne Wörter suchen.',
      'Lesen Teil 2: bei Multiple Choice immer im Text nach Beweisen suchen.',
      'Lesen Teil 3: zuerst die Situation genau lesen, dann die Anzeige vergleichen.',
      'Sprachbausteine: auf Grammatik, Kontext und Satzstruktur achten.'
    ]
    },
    {
  id: 'b2-lesen-modell-2',
  level: 'B2',
  title: 'B2 Modell 2 – Arbeit, Gesundheit und Digitalisierung',

  lesenTeil1: {
    title: 'Lesen Teil 1 – Globalverstehen',
    instruction:
      'Lesen Sie zuerst die zehn Überschriften. Lesen Sie dann die fünf Texte und entscheiden Sie, welche Überschrift am besten zu welchem Text passt. Fünf Überschriften bleiben übrig.',
    headings: [
      { id: 'a', text: 'Wenn Arbeit flexibler wird' },
      { id: 'b', text: 'Neue Chancen durch digitale Weiterbildung' },
      { id: 'c', text: 'Warum Pausen im Beruf wichtig sind' },
      { id: 'd', text: 'Künstliche Intelligenz ersetzt alle Berufe' },
      { id: 'e', text: 'Gesund bleiben trotz hoher Belastung' },
      { id: 'f', text: 'Weniger Verkehr durch Homeoffice' },
      { id: 'g', text: 'Fachkräfte dringend gesucht' },
      { id: 'h', text: 'Digitale Geräte in der Schule verboten' },
      { id: 'i', text: 'Ehrenamt als beruflicher Vorteil' },
      { id: 'j', text: 'Umweltfreundliche Mobilität im Alltag' }
    ],
    texts: [
      {
        id: 1,
        text:
          'Viele Unternehmen bieten ihren Mitarbeitern inzwischen flexible Arbeitszeiten an. Dadurch können Beschäftigte private Termine besser organisieren und ihre Arbeit an den eigenen Alltag anpassen. Gleichzeitig brauchen Teams klare Absprachen, damit die Zusammenarbeit funktioniert.'
      },
      {
        id: 2,
        text:
          'Immer mehr Erwachsene besuchen Onlinekurse, um neue berufliche Fähigkeiten zu erwerben. Besonders digitale Kompetenzen sind gefragt, weil viele Arbeitsbereiche sich schnell verändern. Wer regelmäßig dazulernt, verbessert seine Chancen auf dem Arbeitsmarkt.'
      },
      {
        id: 3,
        text:
          'In vielen Branchen fehlen qualifizierte Mitarbeiterinnen und Mitarbeiter. Betriebe suchen deshalb nicht nur nach jungen Absolventen, sondern auch nach Menschen, die sich beruflich neu orientieren möchten. Weiterbildung spielt dabei eine zentrale Rolle.'
      },
      {
        id: 4,
        text:
          'Wer täglich viele Aufgaben gleichzeitig erledigen muss, fühlt sich oft erschöpft. Experten empfehlen regelmäßige Pausen, Bewegung und klare Grenzen zwischen Arbeit und Freizeit. So kann langfristig die Leistungsfähigkeit erhalten bleiben.'
      },
      {
        id: 5,
        text:
          'Viele Menschen steigen für kurze Strecken auf Fahrrad, Bus oder Bahn um. Das entlastet den Verkehr und reduziert Abgase. Besonders Städte investieren deshalb in bessere Radwege und ein dichteres öffentliches Verkehrsnetz.'
      }
    ],
    solutions: {
      1: 'a',
      2: 'b',
      3: 'g',
      4: 'e',
      5: 'j'
    }
  },lesenTeil2: {
  title: 'Lesen Teil 2 – Detailverstehen',
  instruction:
    'Lesen Sie den Text und wählen Sie bei jeder Aufgabe die richtige Lösung.',

  text:
    'Die Digitalisierung verändert unsere Arbeitswelt schneller als je zuvor. Viele Unternehmen investieren in neue Technologien, um effizienter zu arbeiten und ihre Dienstleistungen zu verbessern. Gleichzeitig steigen jedoch die Anforderungen an Arbeitnehmerinnen und Arbeitnehmer. Neben fachlichem Wissen werden heute digitale Kompetenzen, Teamfähigkeit und lebenslanges Lernen immer wichtiger. Besonders Homeoffice hat gezeigt, dass Arbeit nicht mehr an einen festen Ort gebunden sein muss. Viele Beschäftigte schätzen die größere Flexibilität, andere vermissen jedoch den persönlichen Kontakt zu Kolleginnen und Kollegen. Fachleute sind sich einig, dass die Zukunft der Arbeit weder vollständig digital noch ausschließlich im Büro stattfinden wird. Vielmehr wird ein ausgewogenes Modell benötigt, das Produktivität, Gesundheit und Zusammenarbeit gleichermaßen berücksichtigt.',

  questions: [
    {
      id: 1,
      question: 'Worum geht es hauptsächlich im Text?',
      options: {
        a: 'Um Veränderungen der modernen Arbeitswelt',
        b: 'Um den öffentlichen Verkehr',
        c: 'Um das Schulsystem'
      },
      answer: 'a'
    },
    {
      id: 2,
      question: 'Welche Fähigkeiten werden heute besonders wichtig?',
      options: {
        a: 'Sportliche Leistungen',
        b: 'Digitale Kompetenzen',
        c: 'Musikalische Kenntnisse'
      },
      answer: 'b'
    },
    {
      id: 3,
      question: 'Welchen Vorteil sehen viele Menschen im Homeoffice?',
      options: {
        a: 'Mehr Freizeit im Büro',
        b: 'Größere Flexibilität',
        c: 'Höheres Gehalt'
      },
      answer: 'b'
    },
    {
      id: 4,
      question: 'Was vermissen manche Beschäftigte?',
      options: {
        a: 'Den Kontakt zu Kollegen',
        b: 'Den Arbeitsweg',
        c: 'Digitale Geräte'
      },
      answer: 'a'
    },
    {
      id: 5,
      question: 'Welche Lösung empfehlen Fachleute?',
      options: {
        a: 'Nur Homeoffice',
        b: 'Nur Büroarbeit',
        c: 'Ein ausgewogenes Arbeitsmodell'
      },
      answer: 'c'
    }
  ]
},
  }
  
];