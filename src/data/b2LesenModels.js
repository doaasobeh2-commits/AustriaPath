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
    title: 'B2 Modell 2 – Arbeit, Gesundheit und Mobilität',

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
      solutions: { 1: 'a', 2: 'b', 3: 'g', 4: 'e', 5: 'j' }
    },

    lesenTeil2: {
      title: 'Lesen Teil 2 – Detailverstehen',
      instruction:
        'Lesen Sie den Text und wählen Sie bei jeder Aufgabe die richtige Lösung.',
      text:
        'Die Digitalisierung verändert unsere Arbeitswelt schneller als je zuvor. Viele Unternehmen investieren in neue Technologien, um effizienter zu arbeiten. Gleichzeitig steigen die Anforderungen an Beschäftigte: Neben Fachwissen zählen digitale Kompetenzen, Teamfähigkeit und lebenslanges Lernen. Homeoffice hat gezeigt, dass Arbeit nicht mehr an einen festen Ort gebunden sein muss. Viele schätzen die Flexibilität, andere vermissen den persönlichen Kontakt. Fachleute plädieren für ein ausgewogenes Modell, das Produktivität, Gesundheit und Zusammenarbeit verbindet.',
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
            a: 'Den Kontakt zu Kolleginnen und Kollegen',
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

    lesenTeil3: {
      title: 'Lesen Teil 3 – Selektives Verstehen',
      instruction:
        'Lesen Sie die Situationen und die Anzeigen. Welche Anzeige passt?',
      situations: [
        { id: 1, text: 'Thomas sucht einen Abendkurs, um Excel für die Arbeit zu lernen.' },
        { id: 2, text: 'Elena möchte sich beruflich umorientieren und braucht Beratung zu Weiterbildung.' },
        { id: 3, text: 'Markus sucht einen Stressmanagement-Kurs nach der Arbeit.' },
        { id: 4, text: 'Sara möchte am Wochenende mit anderen Rad fahren.' },
        { id: 5, text: 'Jonas sucht einen Job als IT-Support in Teilzeit.' }
      ],
      ads: [
        { id: 'a', text: 'Abendkurs Excel für Berufstätige: Dienstag und Donnerstag 18–20 Uhr. Praxisübungen in kleinen Gruppen.' },
        { id: 'b', text: 'AMS-Beratung Weiterbildung: Kostenlose Orientierung zu Kursen, Förderungen und Qualifikationen. Termin online buchen.' },
        { id: 'c', text: 'Entspannung nach Feierabend: Atemübungen und leichte Bewegung. Mittwoch 19 Uhr im Gesundheitszentrum.' },
        { id: 'd', text: 'Radtreff Samstag: Gemeinsame Touren für Einsteigerinnen und Einsteiger. Leihräder auf Anfrage.' },
        { id: 'e', text: 'Teilzeit IT-Support gesucht: 20 Stunden pro Woche, Homeoffice möglich. Bewerbung mit Lebenslauf.' },
        { id: 'f', text: 'Kochkurs für Kinder: Samstagvormittag, ab 8 Jahren.' }
      ],
      solutions: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' }
    },

    sprachbausteineTeil1: {
      title: 'Sprachbausteine Teil 1 – Multiple Choice',
      instruction: 'Lesen Sie den Text und wählen Sie die richtige Lösung.',
      text:
        'Wer im Homeoffice arbeitet, sollte klare Regeln ___(1)___, ___(2)___ die Produktivität nicht leidet. Regelmäßige Pausen sind wichtig, ___(3)___ der Körper sich erholen kann. Viele Betriebe bieten Schulungen an, ___(4)___ Beschäftigte digitale Tools sicher nutzen. Besonders hilfreich sind Kurse, ___(5)___ praxisnah und verständlich erklärt werden.',
      questions: [
        { id: 1, options: { a: 'treffen', b: 'treffen zu', c: 'treffen mit' }, answer: 'a' },
        { id: 2, options: { a: 'damit', b: 'obwohl', c: 'während' }, answer: 'a' },
        { id: 3, options: { a: 'damit', b: 'denn', c: 'trotzdem' }, answer: 'a' },
        { id: 4, options: { a: 'damit', b: 'weil', c: 'ob' }, answer: 'a' },
        { id: 5, options: { a: 'die', b: 'denen', c: 'deren' }, answer: 'a' }
      ]
    },

    sprachbausteineTeil2: {
      title: 'Sprachbausteine Teil 2 – Wortkasten',
      instruction: 'Setzen Sie die passenden Wörter aus dem Wortkasten ein.',
      wordBox: ['Fachkräfte', 'Weiterbildung', 'Belastung', 'Pendeln', 'reduzieren', 'Chancen', 'Alltag', 'investieren'],
      text:
        'Viele Betriebe ___(1)___ in ___(2)___, weil qualifizierte ___(3)___ fehlen. Gleichzeitig wächst die ___(4)___ im Berufs___(5)___. Wer weniger ___(6)___ muss und flexibel arbeitet, kann seine ___(7)___ auf dem Arbeitsmarkt verbessern und Stress ___(8)___.',
      solutions: {
        1: 'investieren',
        2: 'Weiterbildung',
        3: 'Fachkräfte',
        4: 'Belastung',
        5: 'Alltag',
        6: 'Pendeln',
        7: 'Chancen',
        8: 'reduzieren'
      }
    },

    words: ['Weiterbildung', 'Homeoffice', 'Fachkräfte', 'Belastung', 'Mobilität', 'Flexibilität'],
    tips: [
      'Lesen Teil 1: Achten Sie auf das Hauptthema — nicht auf einzelne Wörter.',
      'Lesen Teil 3: Prüfen Sie Uhrzeit, Zielgruppe und Ort der Anzeige.',
      'Sprachbausteine: Lesen Sie den ganzen Satz, bevor Sie die Lücke wählen.'
    ]
  },
  {
    id: 'b2-lesen-modell-3',
    level: 'B2',
    title: 'B2 Modell 3 – Behörden, Wohnen und Alltag in Österreich',

    lesenTeil1: {
      title: 'Lesen Teil 1 – Globalverstehen',
      instruction:
        'Ordnen Sie jedem Text die passende Überschrift zu. Fünf Überschriften bleiben übrig.',
      headings: [
        { id: 'a', text: 'Online-Termin bei der Behörde' },
        { id: 'b', text: 'Wenn Nachbarn zu laut sind' },
        { id: 'c', text: 'Kinderbetreuung und Beruf vereinbaren' },
        { id: 'd', text: 'Alle Ärzte sind kostenlos' },
        { id: 'e', text: 'Wohnungswechsel und Meldezettel' },
        { id: 'f', text: 'ÖBB-Verspätung und Anschluss verpasst' },
        { id: 'g', text: 'Versicherung nach einem Unfall' },
        { id: 'h', text: 'Schule und Elternmitwirkung' },
        { id: 'i', text: 'Bankkonto für Neuzugezogene' },
        { id: 'j', text: 'Apotheke und Rezeptgebühr' }
      ],
      texts: [
        {
          id: 1,
          text:
            'Seit einigen Jahren können viele Termine bei Behörden online gebucht werden. Das spart Wartezeiten, erfordert aber oft eine Anmeldung im digitalen Portal. Wer Unterlagen vergisst, muss den Termin manchmal verschieben.'
        },
        {
          id: 2,
          text:
            'Wer in eine neue Wohnung zieht, muss sich innerhalb von drei Tagen beim Gemeindeamt anmelden. Dafür braucht man den Mietvertrag und einen gültigen Ausweis. Ohne Meldung können Probleme bei Bank oder Versicherung entstehen.'
        },
        {
          id: 3,
          text:
            'In vielen Gemeinden fehlen Betreuungsplätze in Kindergärten. Eltern organisieren deshalb oft geteilte Abholzeiten oder nutzen Tagesmütter. Flexible Arbeitszeiten helfen, Beruf und Familie besser zu verbinden.'
        },
        {
          id: 4,
          text:
            'Nach einer Zugverspätung der ÖBB verpasste Claudia ihren Anschluss. Am Service-Schalter erhielt sie eine Bestätigung für die Verspätung und Information, wie sie den nächsten Zug nutzen kann.'
        },
        {
          id: 5,
          text:
            'In Österreich zahlen Versicherte bei Rezepten in der Apotheke eine gesetzliche Rezeptgebühr. Bei Notfällen außerhalb der Sprechzeiten gibt es den ärztlichen Bereitschaftsdienst — nicht jede Apotheke ist rund um die Uhr geöffnet.'
        }
      ],
      solutions: { 1: 'a', 2: 'e', 3: 'c', 4: 'f', 5: 'j' }
    },

    lesenTeil2: {
      title: 'Lesen Teil 2 – Detailverstehen',
      instruction: 'Lesen Sie den Text und wählen Sie die richtige Lösung.',
      text:
        'In Wien und anderen Städten wenden sich immer mehr Menschen an die MA35, wenn es um Aufenthaltstitel oder Familiennachzug geht. Die Nachfrage ist hoch, deshalb sollten Termine frühzeitig online reserviert werden. Wer ohne Termin kommt, wird in der Regel nicht bedient. Wichtig sind vollständige Unterlagen: Pass, Meldezettel, Einkommensnachweise und gegebenenfalls Heirats- oder Geburtsurkunden mit beglaubigter Übersetzung. Fehlen Dokumente, kann das Verfahren sich deutlich verzögern. Viele Beratungsstellen empfehlen, vor dem Termin eine Checkliste zu nutzen und Kopien mitzubringen. Wer unsicher ist, kann sich bei Integrations- oder Rechtsberatungsstellen informieren — diese ersetzen jedoch keine behördliche Entscheidung.',
      questions: [
        {
          id: 1,
          question: 'Wofür wenden sich laut Text viele Menschen an die MA35?',
          options: {
            a: 'Für Aufenthaltstitel und Familiennachzug',
            b: 'Für Führerscheinprüfungen',
            c: 'Für Krankenversicherung'
          },
          answer: 'a'
        },
        {
          id: 2,
          question: 'Was passiert laut Text ohne Termin?',
          options: {
            a: 'Man wird sofort bedient',
            b: 'Man wird in der Regel nicht bedient',
            c: 'Man bekommt automatisch einen Termin per SMS'
          },
          answer: 'b'
        },
        {
          id: 3,
          question: 'Was kann das Verfahren verzögern?',
          options: {
            a: 'Zu viele Kopien',
            b: 'Fehlende Unterlagen',
            c: 'Eine Online-Anmeldung'
          },
          answer: 'b'
        },
        {
          id: 4,
          question: 'Was empfehlen Beratungsstellen vor dem Termin?',
          options: {
            a: 'Nur den Pass mitbringen',
            b: 'Checkliste nutzen und Kopien mitbringen',
            c: 'Ohne Unterlagen kommen'
          },
          answer: 'b'
        },
        {
          id: 5,
          question: 'Was ersetzen Integrationsberatungsstellen laut Text nicht?',
          options: {
            a: 'Eine Sprachschule',
            b: 'Eine behördliche Entscheidung',
            c: 'Einen Meldezettel'
          },
          answer: 'b'
        }
      ]
    },

    lesenTeil3: {
      title: 'Lesen Teil 3 – Selektives Verstehen',
      instruction: 'Welche Anzeige passt zur Situation?',
      situations: [
        { id: 1, text: 'Fatima braucht Hilfe beim Ausfüllen des Meldezettels nach dem Umzug.' },
        { id: 2, text: 'Peter möchte wissen, wie er online einen Termin bei der MA35 bucht.' },
        { id: 3, text: 'Linda sucht einen Deutschkurs mit Kinderbetreuung am Vormittag.' },
        { id: 4, text: 'Omar möchte wissen, welche Rechte Mieter bei Lärm durch Nachbarn haben.' },
        { id: 5, text: 'Nina braucht eine Kopie ihrer Geburtsurkunde für ein Behördenformular.' }
      ],
      ads: [
        { id: 'a', text: 'Integrationszentrum: Unterstützung bei Meldezettel, Formularen und Terminen. Beratung in mehreren Sprachen.' },
        { id: 'b', text: 'MA35 Infoseite: Terminreservierung online — Schritt-für-Schritt-Anleitung und Checkliste der Unterlagen.' },
        { id: 'c', text: 'Sprachkurs mit Kinderbetreuung: Montag–Freitag 9–12 Uhr. Anmeldung im Bildungszentrum.' },
        { id: 'd', text: 'Mieterverein: Beratung zu Lärm, Miete und Kaution. Erstgespräch kostenlos.' },
        { id: 'e', text: 'Standesamt: Ausstellung beglaubigter Urkunden. Antrag mit Ausweis und Geburtsdatum.' },
        { id: 'f', text: 'Fitnessstudio: Probetraining samstags.' }
      ],
      solutions: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' }
    },

    sprachbausteineTeil1: {
      title: 'Sprachbausteine Teil 1',
      instruction: 'Wählen Sie die richtige Lösung.',
      text:
        'Wer in Österreich wohnen möchte, muss viele Formulare ___(1)___. Oft ist es sinnvoll, ___(2)___ man alle Unterlagen vor dem Termin prüft. ___(3)___ fehlende Dokumente kann das Verfahren länger dauern. Viele Behörden bieten Informationen online an, ___(4)___ Bürgerinnen und Bürger sich besser vorbereiten können. Wer Fragen hat, sollte sich ___(5)___ Beratungsstellen wenden.',
      questions: [
        { id: 1, options: { a: 'ausfüllen', b: 'ausfüllen zu', c: 'ausfüllen mit' }, answer: 'a' },
        { id: 2, options: { a: 'dass', b: 'wenn', c: 'obwohl' }, answer: 'a' },
        { id: 3, options: { a: 'Bei', b: 'Trotz', c: 'Während' }, answer: 'a' },
        { id: 4, options: { a: 'damit', b: 'denn', c: 'sondern' }, answer: 'a' },
        { id: 5, options: { a: 'an', b: 'auf', c: 'über' }, answer: 'a' }
      ]
    },

    sprachbausteineTeil2: {
      title: 'Sprachbausteine Teil 2',
      instruction: 'Setzen Sie die Wörter aus dem Wortkasten ein.',
      wordBox: ['Meldezettel', 'Termin', 'Unterlagen', 'Behörde', 'online', 'Wartezeit', 'beraten', 'beantragen'],
      text:
        'Viele Menschen ___(1)___ heute ihren ___(2)___ ___(3)___. So wird die ___(4)___ oft kürzer. Trotzdem müssen alle ___(5)___ vollständig sein. Wer unsicher ist, kann sich vorher ___(6)___ lassen. Beim ___(7)___ nach dem Umzug ist der ___(8)___ besonders wichtig.',
      solutions: {
        1: 'beantragen',
        2: 'Termin',
        3: 'online',
        4: 'Wartezeit',
        5: 'Unterlagen',
        6: 'beraten',
        7: 'Behörde',
        8: 'Meldezettel'
      }
    },

    words: ['die MA35', 'der Meldezettel', 'die Rezeptgebühr', 'der Aufenthaltstitel', 'die Gemeinde', 'die Verspätung'],
    tips: [
      'Behörden-Texte: Achten Sie auf Fristen, Pflichtunterlagen und „muss / kann / sollte“.',
      'Lesen Teil 3: Unterscheiden Sie Beratung, Information und konkrete Dienstleistung.',
      'Österreich-Begriffe: MA35, AMS, Meldezettel, Rezeptgebühr — in Prüfungen oft implizit erwartet.'
    ]
  }
];