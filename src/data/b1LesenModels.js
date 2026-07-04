export const b1LesenModels = [
  {
    id: 'b1-lesen-01',
    title: 'Verkehr & Mobilität',
    level: 'B1',

    teil1: {
      title: 'Teil 1 – Lückentext',
      text: `Herr Schneider wohnt außerhalb von Wien und fährt jeden Morgen zur Arbeit. Früher nahm er meistens das Auto, ___(31)___ er oft im Stau stand und viel Geld für Benzin ausgeben musste. Seit einigen Monaten benutzt er die öffentlichen Verkehrsmittel, ___(32)___ er entspannter ankommt.

Zuerst fährt er mit dem Bus zum Bahnhof. Danach steigt er in den Zug um. Wenn der Zug pünktlich ist, braucht er nur 35 Minuten bis ins Büro. Besonders praktisch findet er, ___(33)___ er während der Fahrt E-Mails lesen oder Musik hören kann.

Seine Frau möchte bald den Führerschein machen, ___(34)___ sie flexibler ist, wenn sie die Kinder abholen muss. Sie sucht aber keinen Intensivkurs, ___(35)___ einen Abendkurs, weil sie tagsüber arbeitet.

Herr Schneider findet: Wer in der Stadt lebt, braucht nicht immer ein eigenes Auto. Trotzdem ist ein Führerschein manchmal hilfreich, ___(36)___ man außerhalb der Stadt wohnt.`,
      options: {
        31: ['weil', 'obwohl', 'damit'],
        32: ['trotzdem', 'weil', 'sondern'],
        33: ['dass', 'wenn', 'obwohl'],
        34: ['damit', 'denn', 'trotz'],
        35: ['aber', 'sondern', 'oder'],
        36: ['wenn', 'obwohl', 'deshalb']
      },
      answers: {
        31: 'weil',
        32: 'weil',
        33: 'dass',
        34: 'damit',
        35: 'sondern',
        36: 'wenn'
      }
    },

    teil2: {
      title: 'Teil 2 – Anzeigen',
      image: "/images/b1lesen/b1-broschuere-01.jpeg",
      intro:
        'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achtung: Mehrere Anzeigen haben ähnliche Wörter.',
      questions: [
        {
          q: '41. Sie möchten möglichst schnell den Führerschein machen. Sie haben zwei Wochen frei und suchen einen Intensivkurs mit Prüfungstraining.',
          a: 'B'
        },
        {
          q: '42. Sie haben den Führerschein schon lange, fahren aber unsicher. Sie suchen keinen normalen Anfängerkurs, sondern einen Auffrischungskurs.',
          a: 'H'
        },
        {
          q: '43. Sie fahren jeden Tag mit öffentlichen Verkehrsmitteln und möchten ein Ticket, das das ganze Jahr gültig ist.',
          a: 'G'
        },
        {
          q: '44. Sie möchten den Führerschein machen, können aber nicht jeden Tag kommen. Sie brauchen flexible Zeiten und möchten Theorie online lernen.',
          a: 'D'
        },
        {
          q: '45. Sie fahren mit Zug, Bus, Bim und U-Bahn und suchen ein Ticket für verschiedene Verkehrsmittel in ganz Österreich.',
          a: 'E'
        }
      ]
    },

    teil3: {
      title: 'Teil 3 – Lesetext',
      text: `In vielen österreichischen Städten überlegen immer mehr Menschen, ob sie wirklich ein eigenes Auto brauchen. Der Grund dafür ist nicht nur der hohe Benzinpreis. Auch Parkplätze sind oft teuer und schwer zu finden. Wer jeden Tag im Stau steht, verliert außerdem viel Zeit und kommt oft gestresst zur Arbeit.

Viele Berufstätige steigen deshalb auf Bus, Bahn oder Straßenbahn um. Moderne Verkehrsmittel sind heute meistens pünktlicher und bequemer als früher. Manche Menschen nutzen die Fahrtzeit, um Nachrichten zu lesen, Musik zu hören oder sich auf den Arbeitstag vorzubereiten. Besonders für Personen, die in der Nähe einer guten Verbindung wohnen, kann das eine echte Entlastung sein.

Trotzdem ist das Auto für viele Familien weiterhin wichtig. Wer am Land wohnt, Kinder hat oder zu ungewöhnlichen Zeiten arbeitet, kann nicht immer mit öffentlichen Verkehrsmitteln fahren. Deshalb entscheiden sich viele Menschen für eine Mischung: In der Stadt fahren sie mit Bus und Bahn, am Wochenende oder für größere Einkäufe benutzen sie das Auto.

Auch Fahrschulen merken diese Veränderung. Viele junge Menschen wollen zwar den Führerschein machen, aber sie kaufen später kein eigenes Auto. Sie möchten flexibel bleiben und bei Bedarf ein Auto mieten oder Carsharing nutzen. Andere besuchen nach vielen Jahren wieder einen Kurs, weil sie sich im Verkehr unsicher fühlen.

Experten sagen, dass Mobilität in Zukunft vielfältiger wird. Nicht jeder braucht täglich ein Auto, aber viele Menschen möchten verschiedene Möglichkeiten haben. Wichtig ist, dass Verkehrsmittel zuverlässig, bezahlbar und gut miteinander verbunden sind.`,
      questions: [
        {
          q: '46. Warum verzichten manche Menschen in der Stadt auf ein eigenes Auto?',
          options: [
            'Weil Parkplätze und Benzin teuer sind.',
            'Weil Fahrschulen zu teuer geworden sind.',
            'Weil Autos in Österreich verboten werden.'
          ],
          a: 'Weil Parkplätze und Benzin teuer sind.'
        },
        {
          q: '47. Was machen manche Berufstätige während der Fahrt mit öffentlichen Verkehrsmitteln?',
          options: [
            'Sie reparieren ihr Auto.',
            'Sie lesen Nachrichten oder hören Musik.',
            'Sie suchen einen Parkplatz.'
          ],
          a: 'Sie lesen Nachrichten oder hören Musik.'
        },
        {
          q: '48. Warum brauchen viele Familien trotzdem ein Auto?',
          options: [
            'Weil sie nie mit dem Zug fahren dürfen.',
            'Weil sie am Land wohnen oder Kinder haben.',
            'Weil öffentliche Verkehrsmittel immer kostenlos sind.'
          ],
          a: 'Weil sie am Land wohnen oder Kinder haben.'
        },
        {
          q: '49. Was machen viele junge Menschen nach dem Führerschein?',
          options: [
            'Sie kaufen sofort ein eigenes Auto.',
            'Sie möchten flexibel bleiben und manchmal Carsharing nutzen.',
            'Sie fahren nur noch mit dem Motorrad.'
          ],
          a: 'Sie möchten flexibel bleiben und manchmal Carsharing nutzen.'
        },
        {
          q: '50. Welche Überschrift passt am besten?',
          options: [
            'Mobilität heute: Auto, Bus und Bahn kombinieren',
            'Warum niemand mehr einen Führerschein braucht',
            'Autofahren ist immer billiger als Busfahren'
          ],
          a: 'Mobilität heute: Auto, Bus und Bahn kombinieren'
        }
      ]
    },

    words: [
      'der Führerschein',
      'die Fahrschule',
      'der Intensivkurs',
      'die Fahrstunde',
      'die Jahreskarte',
      'das Verkehrsmittel',
      'der Stau',
      'die Verbindung'
    ],
    verbs: [
      'umsteigen',
      'benutzen',
      'sich anmelden',
      'gültig sein',
      'verzichten auf',
      'kombinieren'
    ],
    grammar: [
      'weil + Verb am Ende',
      'damit + Nebensatz',
      'nicht ..., sondern ...',
      'Relativsatz: ein Ticket, das ...'
    ],
    mistakes: [
      '❌ Ich suche ein Kurs für Führerschein.',
      '✅ Ich suche einen Kurs für den Führerschein.',
      '❌ Ich brauche eine Auffrischung, weil ich bin unsicher.',
      '✅ Ich brauche eine Auffrischung, weil ich unsicher bin.'
    ],
    tip:
      'Achte bei Anzeigen nicht nur auf ein einzelnes Wort. Oft kommen ähnliche Wörter in mehreren Anzeigen vor. Entscheidend sind Details wie Zeit, Zielgruppe, Preis oder Zweck.'
  
},

{
  id: 'b1-lesen-02',
  title: 'Freizeit & Kultur in Wien',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Lukas wohnt seit einem Jahr in Wien und möchte seine Freizeit besser nutzen. Früher blieb er am Wochenende oft zu Hause, ___(31)___ er nicht wusste, welche Angebote es in der Stadt gibt.

Eines Tages erzählte ihm eine Kollegin von verschiedenen Museen, Konzerten und Führungen. Lukas war überrascht, ___(32)___ viele Veranstaltungen auch günstig oder sogar kostenlos sind.

Am Samstag möchte er zuerst eine Ausstellung besuchen. Danach trifft er Freunde im Park, ___(33)___ sie gemeinsam ein Konzert unter freiem Himmel hören können.

Seine Schwester kommt mit ihren Kindern zu Besuch. Für sie sucht Lukas ein Angebot, ___(34)___ die Kinder selbst etwas ausprobieren können.

Am Abend möchte er vielleicht ins Theater gehen, ___(35)___ er sich für moderne Stücke interessiert. Wenn noch Zeit bleibt, macht er am Sonntag eine Stadtführung, ___(36)___ er mehr über die Geschichte Wiens erfahren möchte.`,
    options: {
      31: ['weil', 'obwohl', 'damit'],
      32: ['dass', 'wenn', 'trotzdem'],
      33: ['damit', 'weil', 'sondern'],
      34: ['bei dem', 'trotzdem', 'obwohl'],
      35: ['weil', 'damit', 'sondern'],
      36: ['wenn', 'weil', 'aber']
    },
    answers: {
      31: 'weil',
      32: 'dass',
      33: 'damit',
      34: 'bei dem',
      35: 'weil',
      36: 'weil'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-02.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achtung: Mehrere Anzeigen haben ähnliche Wörter.',
    questions: [
      {
        q: '41. Sie interessieren sich für moderne Kunst und möchten eine Ausstellung besuchen. Sie sind Student und suchen ein günstiges Angebot.',
        a: 'A'
      },
      {
        q: '42. Sie möchten am Freitagabend im Sommer Musik hören. Am liebsten draußen und ohne Eintritt zu bezahlen.',
        a: 'B'
      },
      {
        q: '43. Sie möchten mit Kindern am Wochenende etwas unternehmen. Die Kinder sollen nicht nur schauen, sondern auch selbst mitmachen.',
        a: 'E'
      },
      {
        q: '44. Sie möchten Wien besser kennenlernen und suchen eine Führung durch die Stadt. Sie möchten Informationen über Geschichte bekommen.',
        a: 'G'
      },
      {
        q: '45. Sie interessieren sich für Filme und möchten am Samstag eine Führung besuchen.',
        a: 'H'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Wien ist nicht nur die Hauptstadt Österreichs, sondern auch eine Stadt mit einem sehr großen kulturellen Angebot. Viele Menschen verbinden Wien zuerst mit Musik, Museen und alten Gebäuden. Doch Kultur bedeutet heute viel mehr. In der Stadt gibt es Angebote für junge Menschen, Familien, Touristen und ältere Personen.

Besonders beliebt sind Museen und Ausstellungen. Manche Besucher interessieren sich für moderne Kunst, andere möchten mehr über Geschichte erfahren. Viele Museen bieten günstigere Preise für Schüler und Studenten an. Dadurch können auch Menschen mit wenig Geld regelmäßig Ausstellungen besuchen.

Im Sommer finden in Wien viele Veranstaltungen im Freien statt. Konzerte in Parks, Feste an der Donau oder Filmabende unter freiem Himmel ziehen viele Besucher an. Für viele Menschen ist das angenehm, weil sie Kultur erleben können, ohne in einem geschlossenen Raum zu sitzen. Einige Veranstaltungen sind sogar kostenlos. Das ist besonders für Familien und junge Leute interessant.

Auch Theater und Kino spielen in Wien eine wichtige Rolle. Viele Theater zeigen klassische Stücke, aber auch moderne Geschichten über Freundschaft, Familie oder das Leben in der Stadt. Wer sich für Filme interessiert, findet nicht nur normale Kinos, sondern auch Filmmuseen oder besondere Filmprogramme.

Für Familien mit Kindern gibt es eigene Angebote. Kindermuseen sind oft interaktiv. Die Kinder können dort nicht nur zuhören, sondern selbst experimentieren, spielen und entdecken. Solche Angebote sind für Eltern praktisch, weil die Kinder gleichzeitig Spaß haben und etwas lernen.

Touristen nehmen gerne an Stadtführungen teil. Dabei erfahren sie mehr über bekannte Plätze, alte Gebäude und wichtige Ereignisse. Aber auch Menschen, die schon lange in Wien wohnen, entdecken bei solchen Führungen oft neue Seiten ihrer Stadt.

Insgesamt zeigt sich: Freizeit und Kultur in Wien sind sehr vielfältig. Man muss nicht viel Geld ausgeben, um etwas Interessantes zu erleben. Wichtig ist nur, dass man sich informiert und ein Angebot auswählt, das zu den eigenen Interessen passt.`,
    questions: [
      {
        q: '46. Warum können auch Menschen mit wenig Geld manche Museen besuchen?',
        options: [
          'Weil es oft günstigere Preise für Schüler und Studenten gibt.',
          'Weil alle Museen in Wien immer kostenlos sind.',
          'Weil man in Museen arbeiten muss.'
        ],
        a: 'Weil es oft günstigere Preise für Schüler und Studenten gibt.'
      },
      {
        q: '47. Warum sind Veranstaltungen im Freien im Sommer beliebt?',
        options: [
          'Weil sie immer nur für Touristen sind.',
          'Weil viele Menschen Kultur draußen erleben können.',
          'Weil sie nur am Vormittag stattfinden.'
        ],
        a: 'Weil viele Menschen Kultur draußen erleben können.'
      },
      {
        q: '48. Was ist typisch für Kindermuseen?',
        options: [
          'Kinder dürfen dort nichts anfassen.',
          'Kinder können dort mitmachen und etwas ausprobieren.',
          'Sie sind nur für Erwachsene geöffnet.'
        ],
        a: 'Kinder können dort mitmachen und etwas ausprobieren.'
      },
      {
        q: '49. Warum nehmen Menschen an Stadtführungen teil?',
        options: [
          'Weil sie mehr über Geschichte und bekannte Plätze erfahren möchten.',
          'Weil sie dort den Führerschein machen können.',
          'Weil Stadtführungen immer kostenlos sind.'
        ],
        a: 'Weil sie mehr über Geschichte und bekannte Plätze erfahren möchten.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Freizeit und Kultur in Wien erleben',
          'Warum Kultur in Wien verboten ist',
          'Autofahren in der Wiener Innenstadt'
        ],
        a: 'Freizeit und Kultur in Wien erleben'
      }
    ]
  },

  words: [
    'die Freizeit',
    'die Kultur',
    'die Ausstellung',
    'das Museum',
    'das Konzert',
    'das Theater',
    'die Stadtführung',
    'der Eintritt'
  ],
  verbs: [
    'besuchen',
    'teilnehmen',
    'stattfinden',
    'entdecken',
    'sich interessieren für',
    'auswählen'
  ],
  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'dass + Nebensatz',
    'Relativsatz: ein Angebot, bei dem ...'
  ],
  mistakes: [
    '❌ Ich interessiere mich für moderne Stücke, weil ich finde sie spannend.',
    '✅ Ich interessiere mich für moderne Stücke, weil ich sie spannend finde.',
    '❌ Ich möchte eine Führung teilnehmen.',
    '✅ Ich möchte an einer Führung teilnehmen.'
  ],
  tip:
    'Achte bei Kulturangeboten besonders auf Zielgruppe, Zeit, Preis und Art der Veranstaltung. Mehrere Anzeigen können ähnlich klingen.'
},
{
  id: 'b1-lesen-03',
  title: 'Gesundheit & Arzttermine',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Frau Yilmaz fühlt sich seit einigen Tagen nicht gut. Sie hat Kopfschmerzen und ist sehr müde, ___(31)___ sie in letzter Zeit viel gearbeitet hat. Zuerst wollte sie nicht zum Arzt gehen, ___(32)___ sie dachte, dass es von allein besser wird.

Am Montag ruft sie in einer Praxis an, ___(33)___ sie einen Termin vereinbaren möchte. Die Assistentin sagt, dass am Nachmittag noch ein Termin frei ist. Frau Yilmaz soll ihre e-card mitbringen, ___(34)___ die Anmeldung schneller geht.

Im Wartezimmer sitzen viele Patienten. Einige haben Husten, andere brauchen nur ein Rezept. Frau Yilmaz wartet fast eine halbe Stunde, ___(35)___ die Ärztin sehr viele Patienten behandeln muss.

Nach der Untersuchung sagt die Ärztin, dass Frau Yilmaz sich ausruhen soll. Sie bekommt ein Rezept und soll wiederkommen, ___(36)___ die Beschwerden nicht besser werden.`,
    options: {
      31: ['weil', 'obwohl', 'damit'],
      32: ['sondern', 'weil', 'trotzdem'],
      33: ['damit', 'obwohl', 'deshalb'],
      34: ['damit', 'weil', 'aber'],
      35: ['weil', 'trotzdem', 'sondern'],
      36: ['wenn', 'obwohl', 'deshalb']
    },
    answers: {
      31: 'weil',
      32: 'weil',
      33: 'damit',
      34: 'damit',
      35: 'weil',
      36: 'wenn'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-03.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Öffnungszeiten, Zielgruppe und Art der Behandlung.',
    questions: [
      {
        q: '41. Sie haben starke Zahnschmerzen und brauchen heute noch Hilfe. Sie suchen einen Zahnarzt mit Notterminen.',
        a: 'C'
      },
      {
        q: '42. Sie möchten Ihre Augen kontrollieren lassen, weil Sie beim Lesen oft Kopfschmerzen bekommen.',
        a: 'F'
      },
      {
        q: '43. Ihr Kind hat Fieber. Sie suchen eine Praxis, die speziell Kinder behandelt.',
        a: 'B'
      },
      {
        q: '44. Sie brauchen nach einer Sportverletzung Übungen und Behandlung für den Rücken.',
        a: 'E'
      },
      {
        q: '45. Sie haben Husten und Fieber und möchten am Wochenende eine medizinische Beratung bekommen.',
        a: 'H'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Gesundheit ist für viele Menschen eines der wichtigsten Themen im Alltag. Wer krank ist, möchte schnell Hilfe bekommen und verstehen, welche Schritte notwendig sind. In Österreich gibt es verschiedene Möglichkeiten, medizinische Unterstützung zu bekommen. Viele Menschen gehen zuerst zum Hausarzt. Dort werden einfache Untersuchungen gemacht, Rezepte ausgestellt oder Überweisungen zu Fachärzten geschrieben.

Besonders wichtig ist es, Termine rechtzeitig zu vereinbaren. Manche Praxen sind sehr voll, deshalb kann man nicht immer sofort behandelt werden. Bei akuten Beschwerden sollte man aber am Telefon genau erklären, wie stark die Schmerzen sind oder ob Fieber vorhanden ist. Dann kann die Praxis besser entscheiden, wie dringend der Termin ist.

Für Kinder gibt es eigene Kinderarztpraxen. Eltern schätzen es, wenn Ärzte Erfahrung mit Kindern haben und ruhig erklären, was untersucht wird. Auch Impfungen, Kontrollen und Beratungen gehören zu den Aufgaben einer Kinderarztpraxis.

Neben Hausärzten und Kinderärzten gibt es viele Fachärzte. Wer schlecht sieht oder beim Lesen Kopfschmerzen bekommt, geht zum Augenarzt. Bei Zahnschmerzen hilft ein Zahnarzt. Nach Verletzungen oder Rückenschmerzen kann Physiotherapie sinnvoll sein. Dort lernen Patienten Übungen, die den Körper stärken und Schmerzen reduzieren können.

Am Wochenende oder am Abend ist es manchmal schwieriger, eine geöffnete Praxis zu finden. Dafür gibt es Bereitschaftsdienste oder telefonische Gesundheitsberatung. Diese Angebote helfen besonders dann, wenn man unsicher ist, ob man sofort ins Krankenhaus gehen muss.

Experten empfehlen, Beschwerden nicht zu lange zu ignorieren. Viele Krankheiten lassen sich besser behandeln, wenn man früh reagiert. Gleichzeitig sollte man nicht wegen jeder Kleinigkeit in die Notaufnahme gehen. Wichtig ist, die passende Stelle zu wählen: Hausarzt, Facharzt, Apotheke, Bereitschaftsdienst oder Krankenhaus. So bekommen Patienten schneller die richtige Hilfe.`,
    questions: [
      {
        q: '46. Wohin gehen viele Menschen in Österreich zuerst, wenn sie krank sind?',
        options: [
          'Zum Hausarzt.',
          'Immer sofort ins Krankenhaus.',
          'Direkt zur Fahrschule.'
        ],
        a: 'Zum Hausarzt.'
      },
      {
        q: '47. Warum sollte man am Telefon seine Beschwerden genau erklären?',
        options: [
          'Damit die Praxis die Dringlichkeit besser einschätzen kann.',
          'Damit man kein Rezept braucht.',
          'Damit man automatisch kostenlos behandelt wird.'
        ],
        a: 'Damit die Praxis die Dringlichkeit besser einschätzen kann.'
      },
      {
        q: '48. Was ist eine Aufgabe von Kinderarztpraxen?',
        options: [
          'Autoreparaturen für Familien.',
          'Untersuchungen, Impfungen und Beratung für Kinder.',
          'Verkauf von Monatskarten.'
        ],
        a: 'Untersuchungen, Impfungen und Beratung für Kinder.'
      },
      {
        q: '49. Wann kann Physiotherapie sinnvoll sein?',
        options: [
          'Nach Verletzungen oder bei Rückenschmerzen.',
          'Nur beim Zahnarzt.',
          'Wenn man ein Museum besuchen möchte.'
        ],
        a: 'Nach Verletzungen oder bei Rückenschmerzen.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Gesundheit: Die passende Hilfe finden',
          'Warum Arztpraxen immer geschlossen sind',
          'Freizeitangebote in Wien'
        ],
        a: 'Gesundheit: Die passende Hilfe finden'
      }
    ]
  },

  words: [
    'der Arzttermin',
    'die Praxis',
    'die Untersuchung',
    'das Rezept',
    'die Überweisung',
    'die Beschwerden',
    'der Bereitschaftsdienst',
    'die Physiotherapie'
  ],
  verbs: [
    'einen Termin vereinbaren',
    'untersuchen',
    'behandeln',
    'verschreiben',
    'sich ausruhen',
    'erklären'
  ],
  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'wenn + Nebensatz',
    'dass + Nebensatz'
  ],
  mistakes: [
    '❌ Ich habe Fieber, deshalb ich brauche einen Termin.',
    '✅ Ich habe Fieber, deshalb brauche ich einen Termin.',
    '❌ Ich gehe zum Arzt, weil ich bin krank.',
    '✅ Ich gehe zum Arzt, weil ich krank bin.'
  ],
  tip:
    'Achte bei Gesundheitsanzeigen besonders auf Fachrichtung, Öffnungszeiten, Notfälle und Zielgruppe. Zahnarzt, Kinderarzt und Hausarzt sind nicht dasselbe.'
},
{
  id: 'b1-lesen-04',
  title: 'Wohnen & Wohnungssuche',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',

    text: `Ali wohnt seit drei Jahren in Wien und möchte bald in eine größere Wohnung ziehen. Seine jetzige Wohnung ist zu klein, ___(31)___ seine Familie gewachsen ist.

Im Internet findet er viele Wohnungsanzeigen. Er ruft einen Vermieter an, ___(32)___ er einen Besichtigungstermin vereinbaren möchte.

Die neue Wohnung gefällt ihm gut. Sie hat einen Balkon, ___(33)___ die Kinder draußen spielen können.

Der Vermieter erklärt den Mietvertrag genau. Ali liest alles sorgfältig, ___(34)___ er später keine Probleme bekommt.

Am Ende unterschreibt er den Vertrag. Er freut sich sehr, ___(35)___ die Wohnung nah an der Schule seiner Kinder liegt. Der Umzug findet nächste Woche statt, ___(36)___ alle Möbel vorbereitet sind.`,

    options: {
      31: ['weil', 'obwohl', 'damit'],
      32: ['weil', 'trotzdem', 'sondern'],
      33: ['damit', 'weil', 'obwohl'],
      34: ['damit', 'wenn', 'aber'],
      35: ['weil', 'obwohl', 'sondern'],
      36: ['wenn', 'weil', 'trotz']
    },

    answers: {
      31: 'weil',
      32: 'weil',
      33: 'damit',
      34: 'damit',
      35: 'weil',
      36: 'wenn'
    }
  },teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-04.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Wohnungsart, Zielgruppe und Service.',

    questions: [
      {
        q: '41. Sie sind Student und suchen ein günstiges Zimmer in einer Wohngemeinschaft.',
        a: 'C'
      },
      {
        q: '42. Ihre Familie hat zwei Kinder. Sie möchten eine große Wohnung mit Balkon mieten.',
        a: 'B'
      },
      {
        q: '43. Sie wohnen nur sechs Monate in Wien und suchen eine möblierte Wohnung.',
        a: 'D'
      },
      {
        q: '44. Sie ziehen nächste Woche um und brauchen Hilfe beim Transport Ihrer Möbel.',
        a: 'F'
      },
      {
        q: '45. Nach dem Umzug möchten Sie Ihre Wohnung professionell reinigen lassen.',
        a: 'H'
      }
    ]
  },teil3: {
    title: 'Teil 3 – Lesetext',

    text: `Immer mehr Menschen ziehen nach Österreichs größeren Städten, besonders nach Wien. Deshalb ist es oft nicht einfach, eine passende Wohnung zu finden. Viele Wohnungen werden schon wenige Tage nach der Veröffentlichung vermietet. Wer eine gute Wohnung sucht, muss deshalb schnell reagieren und alle notwendigen Unterlagen vorbereiten.

Vor einer Besichtigung informieren sich viele Interessenten im Internet. Dort finden sie Informationen über die Größe der Wohnung, die monatliche Miete, die Betriebskosten und die Lage. Besonders wichtig sind für viele Menschen gute öffentliche Verkehrsmittel, Einkaufsmöglichkeiten und Schulen in der Nähe.

Familien suchen oft größere Wohnungen mit mehreren Zimmern und einem Balkon oder Garten. Studenten entscheiden sich dagegen häufig für eine Wohngemeinschaft, weil sie dort weniger Miete bezahlen müssen. Wer nur für kurze Zeit in Österreich bleibt, mietet oft eine möblierte Wohnung.

Vor der Unterschrift sollte man den Mietvertrag genau lesen. Darin stehen wichtige Informationen über die Miete, die Kaution, die Kündigungsfrist und andere Regeln. Wer Fragen hat, sollte sie vor der Unterschrift stellen.

Nach dem Einzug beginnt oft noch viel Arbeit. Möbel müssen aufgebaut, Kisten ausgepackt und manchmal auch die alte Wohnung gereinigt werden. Deshalb nutzen viele Menschen Umzugsfirmen oder professionelle Reinigungsdienste.

Experten empfehlen, verschiedene Wohnungsangebote miteinander zu vergleichen und nicht sofort die erste Wohnung zu mieten. Wer sich gut vorbereitet, findet meistens schneller ein passendes Zuhause.`,

    questions: [
      {
        q: '46. Warum muss man bei der Wohnungssuche oft schnell reagieren?',
        options: [
          'Weil viele Wohnungen schnell vermietet werden.',
          'Weil alle Wohnungen kostenlos sind.',
          'Weil man keine Unterlagen braucht.'
        ],
        a: 'Weil viele Wohnungen schnell vermietet werden.'
      },

      {
        q: '47. Worauf achten viele Menschen bei der Lage einer Wohnung?',
        options: [
          'Auf Einkaufsmöglichkeiten und öffentliche Verkehrsmittel.',
          'Nur auf das Wetter.',
          'Nur auf die Farbe des Hauses.'
        ],
        a: 'Auf Einkaufsmöglichkeiten und öffentliche Verkehrsmittel.'
      },

      {
        q: '48. Warum wohnen viele Studenten in einer WG?',
        options: [
          'Weil sie dort weniger Miete bezahlen.',
          'Weil sie keinen Mietvertrag brauchen.',
          'Weil sie dort kostenlos wohnen.'
        ],
        a: 'Weil sie dort weniger Miete bezahlen.'
      },

      {
        q: '49. Was sollte man vor der Unterschrift machen?',
        options: [
          'Den Mietvertrag genau lesen.',
          'Sofort einziehen.',
          'Neue Möbel kaufen.'
        ],
        a: 'Den Mietvertrag genau lesen.'
      },

      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Wohnungssuche in Österreich',
          'Urlaub in den Bergen',
          'Autofahren in Wien'
        ],
        a: 'Wohnungssuche in Österreich'
      }
    ]
  },words: [
    'die Wohnung',
    'der Mietvertrag',
    'die Kaution',
    'die Betriebskosten',
    'die Wohngemeinschaft',
    'der Balkon',
    'die Besichtigung',
    'der Umzug'
  ],

  verbs: [
    'mieten',
    'umziehen',
    'besichtigen',
    'unterschreiben',
    'vergleichen',
    'einziehen'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'Relativsatz: die Wohnung, die ...',
    'wenn + Nebensatz'
  ],

  mistakes: [
    '❌ Ich suche Wohnung in Wien.',
    '✅ Ich suche eine Wohnung in Wien.',
    '❌ Ich unterschreibe den Vertrag, weil ich habe keine Zeit.',
    '✅ Ich unterschreibe den Vertrag, weil ich keine Zeit habe.'
  ],

  tip:
    'Lies Wohnungsanzeigen genau. Achte nicht nur auf die Miete, sondern auch auf Betriebskosten, Kaution, Lage und Ausstattung.'
},

{
  id: 'b1-lesen-05',
  title: 'Arbeit & Bewerbung',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Samir sucht seit zwei Monaten eine neue Arbeit. Früher hat er in einem Restaurant gearbeitet, ___(31)___ er jetzt geregelte Arbeitszeiten haben möchte.

Er schreibt einen Lebenslauf und sucht passende Stellenanzeigen im Internet. Eine Anzeige gefällt ihm besonders gut, ___(32)___ die Firma Teilzeit anbietet.

Samir schickt seine Bewerbung per E-Mail, ___(33)___ der Arbeitgeber seine Unterlagen schnell bekommt.

Nach zwei Tagen bekommt er eine Einladung zum Vorstellungsgespräch. Er ist nervös, ___(34)___ er sich gut vorbereitet hat.

Im Gespräch erklärt er, welche Erfahrung er hat. Die Chefin sagt, ___(35)___ sie sich nächste Woche meldet.

Samir hofft, dass er die Stelle bekommt, ___(36)___ er bald wieder arbeiten kann.`,
    options: {
      31: ['weil', 'obwohl', 'damit'],
      32: ['weil', 'wenn', 'sondern'],
      33: ['damit', 'obwohl', 'aber'],
      34: ['obwohl', 'weil', 'sondern'],
      35: ['dass', 'wenn', 'damit'],
      36: ['damit', 'obwohl', 'trotz']
    },
    answers: {
      31: 'weil',
      32: 'weil',
      33: 'damit',
      34: 'obwohl',
      35: 'dass',
      36: 'damit'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-05.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie besonders auf Arbeitszeit, Erfahrung und Deutschkenntnisse.',

    questions: [
      {
        q: '41. Sie möchten im Büro arbeiten und suchen eine Vollzeitstelle mit Deutschkenntnissen auf B1-Niveau.',
        a: 'A'
      },
      {
        q: '42. Sie können nur am Vormittag arbeiten und suchen eine Teilzeitstelle im Büro.',
        a: 'G'
      },
      {
        q: '43. Sie haben Erfahrung in der Küche und möchten als Koch oder Köchin arbeiten.',
        a: 'C'
      },
      {
        q: '44. Sie möchten im Lager arbeiten. Erfahrung ist nicht unbedingt notwendig.',
        a: 'E'
      },
      {
        q: '45. Sie wissen nicht, wie man einen Lebenslauf schreibt, und brauchen Hilfe bei der Bewerbung.',
        a: 'H'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Viele Menschen suchen in Österreich eine neue Arbeit. Wichtig ist, dass man die Stellenanzeigen genau liest. Dort steht, ob die Arbeit Vollzeit oder Teilzeit ist, wann man beginnen kann und welche Deutschkenntnisse notwendig sind.

Für eine Bewerbung braucht man meistens einen Lebenslauf und ein kurzes Bewerbungsschreiben. Im Lebenslauf stehen persönliche Daten, Ausbildung, Berufserfahrung und besondere Kenntnisse. Das Bewerbungsschreiben sollte freundlich und klar sein.

Nach der Bewerbung laden manche Firmen zu einem Vorstellungsgespräch ein. Dort möchte der Arbeitgeber wissen, warum man die Stelle möchte und welche Erfahrungen man mitbringt. Es ist gut, sich vorher auf typische Fragen vorzubereiten.

Nicht jede Bewerbung ist erfolgreich. Trotzdem sollte man nicht sofort aufgeben. Wer regelmäßig sucht, seine Unterlagen verbessert und pünktlich zu Gesprächen kommt, hat bessere Chancen auf eine passende Arbeit.`,

    questions: [
      {
        q: '46. Was sollte man in Stellenanzeigen genau lesen?',
        options: [
          'Arbeitszeit, Beginn und notwendige Deutschkenntnisse.',
          'Nur die Farbe des Firmenlogos.',
          'Nur den Namen der Stadt.'
        ],
        a: 'Arbeitszeit, Beginn und notwendige Deutschkenntnisse.'
      },
      {
        q: '47. Was steht normalerweise im Lebenslauf?',
        options: [
          'Persönliche Daten, Ausbildung und Berufserfahrung.',
          'Nur Lieblingsessen.',
          'Nur Freizeitpläne.'
        ],
        a: 'Persönliche Daten, Ausbildung und Berufserfahrung.'
      },
      {
        q: '48. Was möchte der Arbeitgeber im Vorstellungsgespräch wissen?',
        options: [
          'Warum man die Stelle möchte und welche Erfahrung man hat.',
          'Welche Wohnung man mieten möchte.',
          'Welche Fahrkarte man benutzt.'
        ],
        a: 'Warum man die Stelle möchte und welche Erfahrung man hat.'
      },
      {
        q: '49. Was soll man tun, wenn eine Bewerbung nicht erfolgreich ist?',
        options: [
          'Nicht sofort aufgeben und weiter suchen.',
          'Nie wieder eine Bewerbung schreiben.',
          'Alle Unterlagen wegwerfen.'
        ],
        a: 'Nicht sofort aufgeben und weiter suchen.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Arbeit suchen und sich richtig bewerben',
          'Freizeitangebote in Wien',
          'Wohnungssuche in Österreich'
        ],
        a: 'Arbeit suchen und sich richtig bewerben'
      }
    ]
  },

  words: [
    'die Bewerbung',
    'der Lebenslauf',
    'die Stelle',
    'das Vorstellungsgespräch',
    'die Erfahrung',
    'die Teilzeit',
    'die Vollzeit',
    'der Arbeitgeber'
  ],

  verbs: [
    'sich bewerben',
    'arbeiten',
    'verdienen',
    'schicken',
    'einladen',
    'sich vorbereiten'
  ],

  grammar: [
    'weil + Verb am Ende',
    'obwohl + Nebensatz',
    'damit + Nebensatz',
    'dass + Nebensatz'
  ],

  mistakes: [
    '❌ Ich suche Arbeit seit zwei Monate.',
    '✅ Ich suche seit zwei Monaten Arbeit.',
    '❌ Ich habe Bewerbung geschickt.',
    '✅ Ich habe eine Bewerbung geschickt.'
  ],

  tip:
    'Lies Stellenanzeigen genau. Achte besonders auf Arbeitszeit, Erfahrung, Deutschkenntnisse und Beginn der Arbeit.'
},
{
  id: 'b1-lesen-06',
  title: 'Familie & Kinder',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Nora lebt mit ihrer Familie seit kurzer Zeit in Graz. Ihr Sohn ist fünf Jahre alt und soll bald in den Kindergarten gehen, ___(31)___ er andere Kinder kennenlernen kann.

Am Nachmittag arbeitet Nora manchmal länger, ___(32)___ sie eine Betreuung für ihr Kind braucht. Eine Freundin empfiehlt ihr eine Spielgruppe, ___(33)___ die Kinder gemeinsam spielen und basteln.

Ihr älterer Sohn hat Probleme in Mathematik. Deshalb sucht Nora Nachhilfe, ___(34)___ er sich in der Schule verbessert.

Am Wochenende möchte die Familie etwas gemeinsam unternehmen. Der Vater schlägt einen Sportverein vor, ___(35)___ die Kinder dort Bewegung haben.

Nora findet es wichtig, dass Kinder nicht nur lernen, ___(36)___ auch spielen und Freunde treffen.`,
    options: {
      31: ['damit', 'weil', 'obwohl'],
      32: ['weil', 'trotzdem', 'sondern'],
      33: ['in der', 'obwohl', 'damit'],
      34: ['damit', 'wenn', 'aber'],
      35: ['weil', 'sondern', 'obwohl'],
      36: ['sondern', 'weil', 'wenn']
    },
    answers: {
      31: 'damit',
      32: 'weil',
      33: 'in der',
      34: 'damit',
      35: 'weil',
      36: 'sondern'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-06.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Alter, Betreuung, Beratung und Freizeit.',
    questions: [
      {
        q: '41. Ihr Kind ist fünf Jahre alt und soll regelmäßig vormittags betreut werden.',
        a: 'A'
      },
      {
        q: '42. Sie arbeiten manchmal am Abend und suchen eine Betreuung zu Hause.',
        a: 'B'
      },
      {
        q: '43. Ihr Kind hat Probleme in Mathematik und braucht Hilfe beim Lernen.',
        a: 'G'
      },
      {
        q: '44. Ihre Familie hat Streit und Sie möchten mit einer Fachperson sprechen.',
        a: 'E'
      },
      {
        q: '45. Ihr kleines Kind soll andere Kinder treffen und spielerisch Deutsch üben.',
        a: 'F'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Familien brauchen im Alltag oft unterschiedliche Unterstützung. Viele Eltern arbeiten und suchen deshalb eine gute Betreuung für ihre Kinder. Kindergärten helfen Kindern, andere Kinder kennenzulernen und selbstständiger zu werden.

Nach der Schule besuchen manche Kinder Sportvereine, Musikschulen oder Nachhilfe. Solche Angebote sind wichtig, weil Kinder dort ihre Fähigkeiten verbessern und neue Freunde finden können.

Manchmal gibt es in Familien auch Probleme. Dann kann eine Familienberatung helfen. Dort sprechen Eltern mit Fachleuten über Erziehung, Schule oder Streit zu Hause.

Wichtig ist, dass Kinder genug Zeit zum Lernen, Spielen und Ausruhen haben. Ein guter Alltag besteht nicht nur aus Pflichten, sondern auch aus gemeinsamer Zeit mit der Familie.`,
    questions: [
      {
        q: '46. Warum suchen viele Eltern eine Betreuung?',
        options: [
          'Weil sie arbeiten.',
          'Weil Kinder nie spielen sollen.',
          'Weil Schulen geschlossen sind.'
        ],
        a: 'Weil sie arbeiten.'
      },
      {
        q: '47. Was lernen Kinder im Kindergarten?',
        options: [
          'Sie lernen andere Kinder kennen.',
          'Sie reparieren Fahrräder.',
          'Sie machen den Führerschein.'
        ],
        a: 'Sie lernen andere Kinder kennen.'
      },
      {
        q: '48. Wann kann Nachhilfe sinnvoll sein?',
        options: [
          'Wenn ein Kind Probleme in der Schule hat.',
          'Wenn ein Kind krank ist.',
          'Wenn man eine Wohnung sucht.'
        ],
        a: 'Wenn ein Kind Probleme in der Schule hat.'
      },
      {
        q: '49. Wobei hilft Familienberatung?',
        options: [
          'Bei Erziehung, Schule oder Streit.',
          'Beim Autokauf.',
          'Beim Zugticket.'
        ],
        a: 'Bei Erziehung, Schule oder Streit.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Familienalltag und Unterstützung',
          'Reisen mit dem Zug',
          'Arbeit und Bewerbung'
        ],
        a: 'Familienalltag und Unterstützung'
      }
    ]
  },

  words: [
    'die Familie',
    'das Kind',
    'der Kindergarten',
    'die Betreuung',
    'die Spielgruppe',
    'die Nachhilfe',
    'die Familienberatung',
    'der Sportverein'
  ],

  verbs: [
    'betreuen',
    'anmelden',
    'spielen',
    'lernen',
    'helfen',
    'sich verbessern'
  ],

  grammar: [
    'damit + Nebensatz',
    'weil + Verb am Ende',
    'Relativsatz: eine Spielgruppe, in der ...',
    'nicht nur ..., sondern auch ...'
  ],

  mistakes: [
    '❌ Mein Kind braucht Nachhilfe, weil es hat Probleme.',
    '✅ Mein Kind braucht Nachhilfe, weil es Probleme hat.',
    '❌ Ich suche Betreuung für mein Sohn.',
    '✅ Ich suche Betreuung für meinen Sohn.'
  ],

  tip:
    'Achte bei Familienthemen besonders auf Alter, Zeit, Ort und Art der Unterstützung: Betreuung, Nachhilfe, Freizeit oder Beratung.'
},
{
  id: 'b1-lesen-07',
  title: 'Bildung & Weiterbildung',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Samira möchte ihre beruflichen Chancen verbessern. Deshalb sucht sie einen Kurs, ___(31)___ sie am Abend besuchen kann. Sie arbeitet tagsüber, ___(32)___ sie keine Zeit für einen Vormittagskurs hat.

Im Internet findet sie eine Sprachschule, ___(33)___ Deutsch für den Beruf anbietet. Außerdem interessiert sie sich für einen Computerkurs, ___(34)___ sie sicherer mit E-Mails und Tabellen arbeitet.

Vor der Anmeldung ruft sie an, ___(35)___ sie Fragen zu Preis und Prüfung hat. Die Mitarbeiterin erklärt ihr alles freundlich. Samira ist froh, ___(36)___ es auch Online-Material zum Üben gibt.`,
    options: {
      31: ['den', 'weil', 'damit'],
      32: ['weil', 'obwohl', 'sondern'],
      33: ['die', 'damit', 'wenn'],
      34: ['damit', 'weil', 'trotzdem'],
      35: ['weil', 'obwohl', 'sondern'],
      36: ['dass', 'wenn', 'obwohl']
    },
    answers: {
      31: 'den',
      32: 'weil',
      33: 'die',
      34: 'damit',
      35: 'weil',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-07.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie auf Ziel, Kurszeit und Lernform.',
    questions: [
      {
        q: '41. Sie arbeiten tagsüber und suchen einen Deutschkurs am Abend.',
        a: 'A'
      },
      {
        q: '42. Sie möchten lernen, wie man E-Mails schreibt und Tabellen benutzt.',
        a: 'B'
      },
      {
        q: '43. Sie wollen sich auf eine Deutschprüfung vorbereiten.',
        a: 'H'
      },
      {
        q: '44. Sie suchen Hilfe für Lebenslauf und Bewerbungsgespräch.',
        a: 'E'
      },
      {
        q: '45. Sie möchten zu Hause lernen und brauchen einen Online-Kurs.',
        a: 'G'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Weiterbildung ist für viele Erwachsene wichtig. Wer eine neue Arbeit sucht oder im Beruf weiterkommen möchte, braucht oft neue Kenntnisse. Besonders gefragt sind Deutsch, Computerkenntnisse und gute Bewerbungsunterlagen.

Viele Kurse finden am Abend oder online statt. Das ist praktisch für Menschen, die tagsüber arbeiten oder Kinder betreuen. Manche Kurse enden mit einer Prüfung, andere helfen direkt im Alltag oder im Beruf.

Wichtig ist, vor der Anmeldung genau zu prüfen, ob der Kurs zum eigenen Ziel passt. Man sollte auf Zeit, Preis, Lernform und Abschluss achten. Ein guter Kurs ist nicht immer der teuerste, sondern der, der wirklich hilft.`,
    questions: [
      {
        q: '46. Warum machen viele Erwachsene eine Weiterbildung?',
        options: [
          'Weil sie beruflich bessere Chancen möchten.',
          'Weil sie keine Schule mögen.',
          'Weil alle Kurse kostenlos sind.'
        ],
        a: 'Weil sie beruflich bessere Chancen möchten.'
      },
      {
        q: '47. Welche Kenntnisse sind oft gefragt?',
        options: [
          'Deutsch und Computerkenntnisse.',
          'Nur Sport.',
          'Nur Musik.'
        ],
        a: 'Deutsch und Computerkenntnisse.'
      },
      {
        q: '48. Warum sind Abendkurse praktisch?',
        options: [
          'Weil viele Menschen tagsüber arbeiten.',
          'Weil sie immer im Freien stattfinden.',
          'Weil man dort nicht lernen muss.'
        ],
        a: 'Weil viele Menschen tagsüber arbeiten.'
      },
      {
        q: '49. Worauf sollte man vor der Anmeldung achten?',
        options: [
          'Auf Zeit, Preis, Lernform und Abschluss.',
          'Nur auf die Farbe des Gebäudes.',
          'Nur auf den Namen des Lehrers.'
        ],
        a: 'Auf Zeit, Preis, Lernform und Abschluss.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Weiterbildung für Beruf und Alltag',
          'Urlaub in Österreich',
          'Wohnungssuche in Wien'
        ],
        a: 'Weiterbildung für Beruf und Alltag'
      }
    ]
  },

  words: [
    'die Weiterbildung',
    'der Abendkurs',
    'der Computerkurs',
    'die Prüfung',
    'die Anmeldung',
    'der Lebenslauf',
    'das Bewerbungsgespräch',
    'der Online-Kurs'
  ],

  verbs: [
    'sich anmelden',
    'teilnehmen',
    'üben',
    'vorbereiten',
    'verbessern',
    'stattfinden'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'Relativsatz: ein Kurs, den ...',
    'dass + Nebensatz'
  ],

  mistakes: [
    '❌ Ich suche ein Kurs am Abend.',
    '✅ Ich suche einen Kurs am Abend.',
    '❌ Ich mache Weiterbildung, weil ich möchte bessere Arbeit.',
    '✅ Ich mache eine Weiterbildung, weil ich eine bessere Arbeit möchte.'
  ],

  tip:
    'Achte bei Bildungsanzeigen genau auf Kursziel, Kurszeit und Lernform: Abendkurs, Online-Kurs, Prüfung oder Bewerbungstraining.'
},
{
  id: 'b1-lesen-08',
  title: 'Einkaufen & Dienstleistungen',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Herr Bauer erledigt viele Dinge gern in der Nähe seiner Wohnung. Heute bringt er seine Jacke zur Schneiderei, ___(31)___ sie zu lang ist. Danach geht er zum Handyshop, ___(32)___ sein Display repariert werden muss.

Seine Frau möchte Passfotos machen lassen, ___(33)___ sie neue Dokumente beantragen will. Außerdem sucht sie eine Reinigung, ___(34)___ ihre Bluse schnell fertig ist.

Am Nachmittag holt Herr Bauer ein Paket ab. Er ist froh, ___(35)___ der Paketshop bis 19 Uhr geöffnet hat. Wenn alles erledigt ist, kauft er Blumen, ___(36)___ er seine Frau überraschen möchte.`,
    options: {
      31: ['weil', 'damit', 'obwohl'],
      32: ['weil', 'sondern', 'trotzdem'],
      33: ['weil', 'damit', 'aber'],
      34: ['damit', 'wenn', 'obwohl'],
      35: ['dass', 'wenn', 'weil'],
      36: ['weil', 'obwohl', 'sondern']
    },
    answers: {
      31: 'weil',
      32: 'weil',
      33: 'weil',
      34: 'damit',
      35: 'dass',
      36: 'weil'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-08.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Service, Öffnungszeiten und Zweck.',
    questions: [
      {
        q: '41. Ihre Hose ist zu lang. Sie suchen jemanden, der Kleidung ändert.',
        a: 'A'
      },
      {
        q: '42. Ihr Handy-Display ist kaputt und Sie brauchen eine schnelle Reparatur.',
        a: 'C'
      },
      {
        q: '43. Sie brauchen Passfotos für neue Dokumente.',
        a: 'F'
      },
      {
        q: '44. Sie möchten ein Paket nach der Arbeit abholen.',
        a: 'H'
      },
      {
        q: '45. Ihre Jacke muss professionell gereinigt werden.',
        a: 'E'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Im Alltag brauchen Menschen oft kleine Dienstleistungen. Eine Schneiderei ändert Kleidung, eine Reinigung pflegt Jacken oder Hemden, und ein Handyshop repariert defekte Geräte. Solche Angebote sparen Zeit, weil man nicht alles selbst machen muss.

Viele Geschäfte bieten heute auch längere Öffnungszeiten an. Das ist besonders praktisch für Berufstätige, die erst am Abend Zeit haben. Wichtig ist, vorher zu prüfen, ob ein Service sofort möglich ist oder einige Tage dauert.

Auch Paketshops und Fotostudios gehören für viele Menschen zum Alltag. Wer Dokumente beantragen möchte, braucht oft aktuelle Fotos. Wer online bestellt, holt Pakete häufig in einem Shop ab.`,
    questions: [
      {
        q: '46. Warum nutzen Menschen Dienstleistungen?',
        options: [
          'Weil sie Zeit sparen.',
          'Weil sie nie einkaufen.',
          'Weil alles kostenlos ist.'
        ],
        a: 'Weil sie Zeit sparen.'
      },
      {
        q: '47. Was macht eine Schneiderei?',
        options: [
          'Sie ändert Kleidung.',
          'Sie repariert Autos.',
          'Sie verkauft Tickets.'
        ],
        a: 'Sie ändert Kleidung.'
      },
      {
        q: '48. Warum sind längere Öffnungszeiten praktisch?',
        options: [
          'Weil Berufstätige oft erst abends Zeit haben.',
          'Weil Geschäfte dann geschlossen sind.',
          'Weil niemand arbeiten muss.'
        ],
        a: 'Weil Berufstätige oft erst abends Zeit haben.'
      },
      {
        q: '49. Wofür braucht man oft aktuelle Fotos?',
        options: [
          'Für Dokumente.',
          'Für den Busfahrplan.',
          'Für eine Sportstunde.'
        ],
        a: 'Für Dokumente.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Praktische Dienstleistungen im Alltag',
          'Urlaub am Meer',
          'Gesundheit und Arzttermine'
        ],
        a: 'Praktische Dienstleistungen im Alltag'
      }
    ]
  },

  words: [
    'die Schneiderei',
    'die Reinigung',
    'die Reparatur',
    'das Display',
    'das Fotostudio',
    'das Paket',
    'der Paketshop',
    'die Öffnungszeiten'
  ],

  verbs: [
    'ändern',
    'reparieren',
    'reinigen',
    'abholen',
    'beantragen',
    'prüfen'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'dass + Nebensatz',
    'Passiv: repariert werden muss'
  ],

  mistakes: [
    '❌ Ich brauche eine Reparatur, weil mein Handy ist kaputt.',
    '✅ Ich brauche eine Reparatur, weil mein Handy kaputt ist.',
    '❌ Ich hole mein Paket nach Arbeit ab.',
    '✅ Ich hole mein Paket nach der Arbeit ab.'
  ],

  tip:
    'Achte bei Dienstleistungsanzeigen besonders auf den genauen Service: ändern, reinigen, reparieren, Fotos machen oder Paket abholen.'
},
{
  id: 'b1-lesen-09',
  title: 'Behörden & Dokumente',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Omar ist in eine neue Wohnung gezogen. Er geht zum Meldeamt, ___(31)___ er seine neue Adresse anmelden muss. Die Mitarbeiterin sagt ihm, ___(32)___ er einen Ausweis und den Meldezettel braucht.

Danach möchte Omar einen neuen Pass beantragen, ___(33)___ sein alter Pass bald abläuft. Er macht zuerst Passfotos, ___(34)___ der Antrag vollständig ist.

Später ruft er bei seiner Versicherung an, ___(35)___ er seine Adresse ändern möchte. Omar merkt, dass Dokumente wichtig sind, ___(36)___ man in Österreich vieles schriftlich nachweisen muss.`,
    options: {
      31: ['weil', 'damit', 'obwohl'],
      32: ['dass', 'wenn', 'weil'],
      33: ['weil', 'obwohl', 'sondern'],
      34: ['damit', 'weil', 'aber'],
      35: ['weil', 'trotzdem', 'sondern'],
      36: ['weil', 'obwohl', 'damit']
    },
    answers: {
      31: 'weil',
      32: 'dass',
      33: 'weil',
      34: 'damit',
      35: 'weil',
      36: 'weil'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-09.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Amt, Dokument und Beratung.',
    questions: [
      {
        q: '41. Sie sind umgezogen und müssen Ihre neue Adresse anmelden.',
        a: 'A'
      },
      {
        q: '42. Ihr Pass läuft bald ab und Sie möchten einen neuen beantragen.',
        a: 'B'
      },
      {
        q: '43. Sie brauchen eine beglaubigte Übersetzung Ihrer Dokumente.',
        a: 'F'
      },
      {
        q: '44. Sie haben Fragen zu einem Vertrag und brauchen rechtliche Beratung.',
        a: 'G'
      },
      {
        q: '45. Sie möchten Ihre Adresse bei der Versicherung ändern.',
        a: 'D'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Wer in Österreich umzieht oder wichtige Dokumente braucht, muss oft mit Behörden Kontakt aufnehmen. Besonders wichtig ist die Anmeldung der Adresse. Dafür benötigt man meistens einen Ausweis und einen Meldezettel.

Auch ein Pass oder Personalausweis muss rechtzeitig beantragt werden. Viele Ämter verlangen aktuelle Fotos und manchmal einen Termin. Wer fremdsprachige Dokumente vorlegt, braucht oft eine beglaubigte Übersetzung.

Bei Verträgen oder offiziellen Schreiben kann Beratung hilfreich sein. Versicherungen, Banken oder Rechtsberatungen erklären, welche Unterlagen nötig sind. Wer seine Dokumente gut vorbereitet, spart Zeit und vermeidet Probleme.`,
    questions: [
      {
        q: '46. Was muss man nach einem Umzug oft machen?',
        options: [
          'Die neue Adresse anmelden.',
          'Ein Auto kaufen.',
          'Einen Sprachkurs kündigen.'
        ],
        a: 'Die neue Adresse anmelden.'
      },
      {
        q: '47. Was braucht man meistens für die Anmeldung?',
        options: [
          'Ausweis und Meldezettel.',
          'Nur ein Foto vom Handy.',
          'Eine Fahrkarte.'
        ],
        a: 'Ausweis und Meldezettel.'
      },
      {
        q: '48. Was verlangen viele Ämter bei einem Passantrag?',
        options: [
          'Aktuelle Fotos.',
          'Eine Sportbestätigung.',
          'Eine Wohnungsanzeige.'
        ],
        a: 'Aktuelle Fotos.'
      },
      {
        q: '49. Wann braucht man oft eine beglaubigte Übersetzung?',
        options: [
          'Bei fremdsprachigen Dokumenten.',
          'Beim Einkaufen im Supermarkt.',
          'Beim Besuch im Schwimmbad.'
        ],
        a: 'Bei fremdsprachigen Dokumenten.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Dokumente und Behörden richtig vorbereiten',
          'Freizeit und Sport im Park',
          'Restaurants in der Innenstadt'
        ],
        a: 'Dokumente und Behörden richtig vorbereiten'
      }
    ]
  },

  words: [
    'das Meldeamt',
    'der Ausweis',
    'der Meldezettel',
    'der Pass',
    'der Antrag',
    'die Versicherung',
    'die Übersetzung',
    'die Beratung'
  ],

  verbs: [
    'anmelden',
    'beantragen',
    'ablaufen',
    'nachweisen',
    'übersetzen',
    'vorbereiten'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'dass + Nebensatz',
    'Relativsatz: Dokumente, die ...'
  ],

  mistakes: [
    '❌ Ich muss meine Adresse anmelden, weil ich bin umgezogen.',
    '✅ Ich muss meine Adresse anmelden, weil ich umgezogen bin.',
    '❌ Mein Pass läuft ab, deshalb ich brauche einen neuen.',
    '✅ Mein Pass läuft ab, deshalb brauche ich einen neuen.'
  ],

  tip:
    'Achte bei Behördenanzeigen genau auf das passende Dokument: Meldezettel, Pass, Übersetzung, Versicherung oder rechtliche Beratung.'
},
{
  id: 'b1-lesen-10',
  title: 'Sport & Fitness',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Markus möchte mehr Sport machen, ___(31)___ er sich oft müde fühlt. Nach der Arbeit sucht er ein Fitnessstudio, ___(32)___ lange geöffnet hat.

Seine Frau interessiert sich für Yoga, ___(33)___ sie etwas gegen Stress tun möchte. Ihr Sohn möchte Fußball spielen, ___(34)___ er gern im Team ist.

Am Wochenende geht die Familie ins Schwimmbad, ___(35)___ alle gemeinsam aktiv bleiben. Markus merkt, ___(36)___ regelmäßige Bewegung ihm im Alltag hilft.`,
    options: {
      31: ['weil', 'damit', 'obwohl'],
      32: ['das', 'weil', 'wenn'],
      33: ['weil', 'sondern', 'trotzdem'],
      34: ['weil', 'obwohl', 'damit'],
      35: ['damit', 'weil', 'aber'],
      36: ['dass', 'wenn', 'obwohl']
    },
    answers: {
      31: 'weil',
      32: 'das',
      33: 'weil',
      34: 'weil',
      35: 'damit',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-10.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie auf Sportart, Alter, Zeit und Ziel.',
    questions: [
      {
        q: '41. Sie arbeiten lange und suchen ein Fitnessstudio, das bis spät geöffnet ist.',
        a: 'A'
      },
      {
        q: '42. Sie möchten sich entspannen und suchen einen Yogakurs gegen Stress.',
        a: 'F'
      },
      {
        q: '43. Ihr Kind möchte in einem Team Fußball spielen.',
        a: 'E'
      },
      {
        q: '44. Sie möchten am Wochenende schwimmen gehen.',
        a: 'B'
      },
      {
        q: '45. Sie möchten draußen trainieren und gemeinsam laufen.',
        a: 'G'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Sport ist für die Gesundheit wichtig. Viele Menschen bewegen sich im Alltag zu wenig, weil sie lange sitzen oder viel arbeiten. Schon kleine Veränderungen helfen: zu Fuß gehen, Rad fahren oder regelmäßig trainieren.

In Städten gibt es viele Angebote. Fitnessstudios sind praktisch, weil man unabhängig vom Wetter trainieren kann. Vereine bieten Sport in Gruppen an, zum Beispiel Fußball, Schwimmen oder Laufen.

Sport hilft nicht nur dem Körper, sondern auch dem Kopf. Wer sich bewegt, fühlt sich oft ruhiger und hat mehr Energie. Wichtig ist, eine Sportart zu finden, die Spaß macht und zum eigenen Alltag passt.`,
    questions: [
      {
        q: '46. Warum bewegen sich viele Menschen zu wenig?',
        options: [
          'Weil sie lange sitzen oder viel arbeiten.',
          'Weil Sport verboten ist.',
          'Weil sie immer im Urlaub sind.'
        ],
        a: 'Weil sie lange sitzen oder viel arbeiten.'
      },
      {
        q: '47. Warum sind Fitnessstudios praktisch?',
        options: [
          'Weil man unabhängig vom Wetter trainieren kann.',
          'Weil man dort Dokumente beantragt.',
          'Weil sie nur für Kinder sind.'
        ],
        a: 'Weil man unabhängig vom Wetter trainieren kann.'
      },
      {
        q: '48. Welche Sportarten werden im Text genannt?',
        options: [
          'Fußball, Schwimmen und Laufen.',
          'Kochen und Lesen.',
          'Reisen und Einkaufen.'
        ],
        a: 'Fußball, Schwimmen und Laufen.'
      },
      {
        q: '49. Wobei hilft Sport auch?',
        options: [
          'Beim Wohlbefinden und bei mehr Energie.',
          'Beim Passantrag.',
          'Beim Wohnungsmieten.'
        ],
        a: 'Beim Wohlbefinden und bei mehr Energie.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Bewegung im Alltag',
          'Arbeit und Bewerbung',
          'Behörden und Dokumente'
        ],
        a: 'Bewegung im Alltag'
      }
    ]
  },

  words: [
    'das Fitnessstudio',
    'der Yogakurs',
    'der Sportverein',
    'das Schwimmbad',
    'die Bewegung',
    'die Gesundheit',
    'das Training',
    'die Entspannung'
  ],

  verbs: [
    'trainieren',
    'sich bewegen',
    'schwimmen',
    'laufen',
    'entspannen',
    'aktiv bleiben'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'Relativsatz: ein Studio, das ...',
    'dass + Nebensatz'
  ],

  mistakes: [
    '❌ Ich mache Sport, weil ich möchte gesund bleiben.',
    '✅ Ich mache Sport, weil ich gesund bleiben möchte.',
    '❌ Mein Sohn spielt in Fußballverein.',
    '✅ Mein Sohn spielt in einem Fußballverein.'
  ],

  tip:
    'Achte bei Sportanzeigen genau auf Sportart, Zielgruppe und Zeit: Fitness, Yoga, Schwimmen, Verein oder Training im Freien.'
},
{
  id: 'b1-lesen-11',
  title: 'Reisen & Tourismus',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Anna plant ein Wochenende in Salzburg, ___(31)___ sie die Stadt schon lange sehen möchte. Sie sucht ein Hotel, ___(32)___ nicht zu teuer ist.

Am Samstag möchte sie eine Stadtführung machen, ___(33)___ sie mehr über die Geschichte erfährt. Danach besucht sie ein Museum, ___(34)___ auch am Wochenende geöffnet hat.

Für Sonntag reserviert sie Fahrräder, ___(35)___ sie die Umgebung aktiv entdecken kann. Anna freut sich, ___(36)___ sie alles gut vorbereitet hat.`,
    options: {
      31: ['weil', 'damit', 'obwohl'],
      32: ['das', 'weil', 'wenn'],
      33: ['damit', 'weil', 'sondern'],
      34: ['das', 'obwohl', 'damit'],
      35: ['damit', 'weil', 'aber'],
      36: ['dass', 'wenn', 'obwohl']
    },
    answers: {
      31: 'weil',
      32: 'das',
      33: 'damit',
      34: 'das',
      35: 'damit',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-11.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie auf Unterkunft, Aktivität, Zeit und Zielgruppe.',
    questions: [
      {
        q: '41. Sie suchen ein günstiges Zimmer für eine Nacht in der Nähe des Bahnhofs.',
        a: 'B'
      },
      {
        q: '42. Sie möchten eine Stadtführung machen und mehr über die Geschichte erfahren.',
        a: 'D'
      },
      {
        q: '43. Sie möchten am Sonntag Fahrräder ausleihen.',
        a: 'F'
      },
      {
        q: '44. Sie reisen mit Kindern und suchen ein familienfreundliches Hotel.',
        a: 'A'
      },
      {
        q: '45. Sie möchten eine Bootsfahrt auf einem See machen.',
        a: 'H'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Viele Menschen reisen gern für ein Wochenende in eine andere Stadt. Kurze Reisen sind beliebt, weil man nicht viel Urlaub nehmen muss. Wichtig ist eine gute Vorbereitung: Unterkunft, Tickets und Aktivitäten sollten rechtzeitig geplant werden.

Touristen interessieren sich oft für Stadtführungen, Museen oder Ausflüge in die Natur. Familien achten besonders darauf, ob ein Angebot für Kinder geeignet ist. Andere möchten aktiv sein und Fahrräder ausleihen oder wandern.

Wer Preise und Zeiten vergleicht, kann Geld sparen und Stress vermeiden. Eine Reise muss nicht weit sein, um interessant und erholsam zu sein.`,
    questions: [
      {
        q: '46. Warum sind kurze Reisen beliebt?',
        options: [
          'Weil man nicht viel Urlaub nehmen muss.',
          'Weil Reisen immer kostenlos sind.',
          'Weil Hotels geschlossen sind.'
        ],
        a: 'Weil man nicht viel Urlaub nehmen muss.'
      },
      {
        q: '47. Was sollte man rechtzeitig planen?',
        options: [
          'Unterkunft, Tickets und Aktivitäten.',
          'Nur das Wetter.',
          'Nur neue Kleidung.'
        ],
        a: 'Unterkunft, Tickets und Aktivitäten.'
      },
      {
        q: '48. Worauf achten Familien besonders?',
        options: [
          'Ob ein Angebot für Kinder geeignet ist.',
          'Ob es keine Betten gibt.',
          'Ob Fahrräder verboten sind.'
        ],
        a: 'Ob ein Angebot für Kinder geeignet ist.'
      },
      {
        q: '49. Wie kann man Geld sparen?',
        options: [
          'Indem man Preise und Zeiten vergleicht.',
          'Indem man ohne Plan reist.',
          'Indem man keine Unterkunft bucht.'
        ],
        a: 'Indem man Preise und Zeiten vergleicht.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Gut vorbereitet reisen',
          'Arbeit und Bewerbung',
          'Sport im Alltag'
        ],
        a: 'Gut vorbereitet reisen'
      }
    ]
  },

  words: [
    'die Reise',
    'die Unterkunft',
    'das Hotel',
    'die Jugendherberge',
    'die Stadtführung',
    'das Museum',
    'der Fahrradverleih',
    'die Bootsfahrt'
  ],

  verbs: [
    'reisen',
    'buchen',
    'reservieren',
    'ausleihen',
    'besuchen',
    'vergleichen'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'Relativsatz: ein Hotel, das ...',
    'dass + Nebensatz'
  ],

  mistakes: [
    '❌ Ich suche ein Hotel, weil ich möchte Salzburg besuchen.',
    '✅ Ich suche ein Hotel, weil ich Salzburg besuchen möchte.',
    '❌ Wir machen eine Stadtführung, damit wir lernen Geschichte.',
    '✅ Wir machen eine Stadtführung, damit wir Geschichte lernen.'
  ],

  tip:
    'Achte bei Reiseanzeigen genau auf Unterkunft, Preis, Lage, Öffnungszeiten und Zielgruppe: Familie, Touristen oder aktive Reisende.'
},
{
  id: 'b1-lesen-13',
  title: 'Haustiere & Tierpflege',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Lea hat seit zwei Jahren einen Hund, ___(31)___ sie sehr liebt. Jeden Morgen geht sie mit ihm spazieren, ___(32)___ Bewegung für Tiere wichtig ist.

Einmal im Jahr bringt sie ihn zum Tierarzt, ___(33)___ er untersucht und geimpft wird. Im Sommer fährt Lea in den Urlaub. Deshalb sucht sie eine Tierpension, ___(34)___ ihr Hund gut betreut wird.

Lea hat auch eine Tierversicherung, ___(35)___ sie hohe Kosten vermeiden möchte. Sie findet, ___(36)___ Haustiere viel Zeit und Verantwortung brauchen.`,

    options: {
      31: ['den', 'weil', 'wenn'],
      32: ['weil', 'obwohl', 'damit'],
      33: ['damit', 'weil', 'aber'],
      34: ['in der', 'obwohl', 'wenn'],
      35: ['weil', 'obwohl', 'sondern'],
      36: ['dass', 'wenn', 'weil']
    },

    answers: {
      31: 'den',
      32: 'weil',
      33: 'damit',
      34: 'in der',
      35: 'weil',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-13.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie auf Tierart, Betreuung und Service.',

    questions: [
      {
        q: '41. Ihr Hund muss geimpft werden und Sie suchen einen Tierarzt.',
        a: 'A'
      },
      {
        q: '42. Sie fahren eine Woche in den Urlaub und brauchen eine Betreuung für Ihren Hund.',
        a: 'C'
      },
      {
        q: '43. Ihr Hund hört nicht gut und Sie möchten eine Hundeschule besuchen.',
        a: 'B'
      },
      {
        q: '44. Sie möchten Ihr Haustier gegen hohe Tierarztkosten versichern.',
        a: 'F'
      },
      {
        q: '45. Sie möchten einem Tier aus dem Tierheim ein neues Zuhause geben.',
        a: 'G'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',

    text: `Haustiere gehören für viele Menschen zur Familie. Sie bringen Freude, brauchen aber auch Zeit und Verantwortung. Hunde müssen täglich spazieren gehen, Katzen brauchen Pflege und alle Tiere sollten regelmäßig zum Tierarzt.

Wer verreist, muss vorher überlegen, wer sich um das Tier kümmert. Viele Tierpensionen oder Tiersitter bieten professionelle Betreuung an. Auch eine Tierversicherung kann sinnvoll sein, weil Behandlungen manchmal teuer sind.

Bevor man ein Haustier kauft oder adoptiert, sollte man gut überlegen, ob man genug Zeit und Geld hat. Ein Tier ist ein Begleiter für viele Jahre und braucht Liebe, Geduld und Aufmerksamkeit.`,

    questions: [
      {
        q: '46. Warum brauchen Haustiere Verantwortung?',
        options: [
          'Weil sie gepflegt und versorgt werden müssen.',
          'Weil sie keine Nahrung brauchen.',
          'Weil sie nur draußen leben.'
        ],
        a: 'Weil sie gepflegt und versorgt werden müssen.'
      },

      {
        q: '47. Warum gehen Tiere regelmäßig zum Tierarzt?',
        options: [
          'Für Untersuchungen und Impfungen.',
          'Um Urlaub zu machen.',
          'Zum Einkaufen.'
        ],
        a: 'Für Untersuchungen und Impfungen.'
      },

      {
        q: '48. Was machen viele Tierpensionen?',
        options: [
          'Sie betreuen Tiere während des Urlaubs.',
          'Sie verkaufen Autos.',
          'Sie unterrichten Deutsch.'
        ],
        a: 'Sie betreuen Tiere während des Urlaubs.'
      },

      {
        q: '49. Warum schließen manche Menschen eine Tierversicherung ab?',
        options: [
          'Um hohe Behandlungskosten zu vermeiden.',
          'Damit das Tier schneller läuft.',
          'Damit das Tier größer wird.'
        ],
        a: 'Um hohe Behandlungskosten zu vermeiden.'
      },

      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Verantwortung für Haustiere',
          'Reisen nach Österreich',
          'Neue Wohnungen finden'
        ],
        a: 'Verantwortung für Haustiere'
      }
    ]
  },

  words: [
    'das Haustier',
    'der Tierarzt',
    'die Tierpension',
    'die Hundeschule',
    'die Tierversicherung',
    'die Impfung',
    'das Tierheim',
    'die Adoption'
  ],

  verbs: [
    'pflegen',
    'impfen',
    'adoptieren',
    'versichern',
    'betreuen',
    'spazieren gehen'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'Relativsatz: ein Hund, den ...',
    'dass + Nebensatz'
  ],

  mistakes: [
    '❌ Mein Hund braucht jeden Tag spazieren.',
    '✅ Mein Hund braucht jeden Tag einen Spaziergang.',
    '❌ Ich bringe ihn zum Tierarzt, weil er ist krank.',
    '✅ Ich bringe ihn zum Tierarzt, weil er krank ist.'
  ],

  tip:
    'Achte bei Tieranzeigen auf Tierart, Betreuung, Versicherung und Dienstleistungen. Mehrere Anzeigen enthalten ähnliche Begriffe.'
},
{
  id: 'b1-lesen-14',
  title: 'Umwelt & Nachhaltigkeit',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Miriam möchte umweltbewusster leben, ___(31)___ sie weniger Müll produzieren will. Alte Kleidung bringt sie in einen Second-Hand-Laden, ___(32)___ andere Menschen sie noch benutzen können.

Ihr Fahrrad ist kaputt, ___(33)___ sie es nicht wegwerfen möchte. Deshalb geht sie zu einem Reparatur-Café. Dort bekommt sie Hilfe, ___(34)___ das Rad wieder funktioniert.

Am Wochenende nimmt sie an einer Pflanzaktion teil, ___(35)___ ihre Nachbarschaft grüner wird. Miriam merkt, ___(36)___ kleine Schritte im Alltag viel verändern können.`,
    options: {
      31: ['weil', 'obwohl', 'damit'],
      32: ['damit', 'weil', 'sondern'],
      33: ['aber', 'weil', 'wenn'],
      34: ['damit', 'obwohl', 'sondern'],
      35: ['damit', 'weil', 'aber'],
      36: ['dass', 'wenn', 'obwohl']
    },
    answers: {
      31: 'weil',
      32: 'damit',
      33: 'aber',
      34: 'damit',
      35: 'damit',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-14.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie auf Umweltziel, Service und Teilnahme.',
    questions: [
      {
        q: '41. Sie haben alte Kleidung und möchten sie nicht wegwerfen.',
        a: 'B'
      },
      {
        q: '42. Ihr Fahrrad ist kaputt und Sie möchten es reparieren lassen.',
        a: 'D'
      },
      {
        q: '43. Sie möchten wissen, wie man Müll richtig trennt.',
        a: 'A'
      },
      {
        q: '44. Sie möchten gemeinsam mit Nachbarn Bäume und Blumen pflanzen.',
        a: 'G'
      },
      {
        q: '45. Sie möchten Strom und Heizkosten sparen.',
        a: 'F'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Umweltschutz beginnt oft im Alltag. Wer Müll trennt, Dinge repariert oder gebrauchte Kleidung weitergibt, spart Rohstoffe und vermeidet Abfall. Auch kleine Entscheidungen können eine große Wirkung haben.

Viele Städte bieten Beratungen, Recyclinghöfe und Reparaturangebote an. Dort lernen Menschen, wie sie nachhaltiger leben können. Besonders beliebt sind Second-Hand-Läden und Reparatur-Cafés, weil man dort Geld spart und die Umwelt schützt.

Auch Energie spielt eine wichtige Rolle. Wer weniger heizt, Geräte ausschaltet und bewusst einkauft, hilft der Umwelt und spart Kosten.`,
    questions: [
      {
        q: '46. Wie beginnt Umweltschutz oft?',
        options: [
          'Mit kleinen Entscheidungen im Alltag.',
          'Nur mit großen Firmen.',
          'Nur im Urlaub.'
        ],
        a: 'Mit kleinen Entscheidungen im Alltag.'
      },
      {
        q: '47. Warum sind Reparatur-Cafés sinnvoll?',
        options: [
          'Weil man Dinge weiter benutzen kann.',
          'Weil man dort Autos kauft.',
          'Weil sie nur für Kinder sind.'
        ],
        a: 'Weil man Dinge weiter benutzen kann.'
      },
      {
        q: '48. Was spart man durch Second-Hand?',
        options: [
          'Rohstoffe und oft auch Geld.',
          'Nur Zeit beim Arzt.',
          'Fahrkarten.'
        ],
        a: 'Rohstoffe und oft auch Geld.'
      },
      {
        q: '49. Wobei hilft Energiesparen?',
        options: [
          'Es schützt die Umwelt und senkt Kosten.',
          'Es macht Dokumente schneller.',
          'Es ersetzt Sport.'
        ],
        a: 'Es schützt die Umwelt und senkt Kosten.'
      },
      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Nachhaltig leben im Alltag',
          'Reisen und Tourismus',
          'Restaurants und Ernährung'
        ],
        a: 'Nachhaltig leben im Alltag'
      }
    ]
  },

  words: [
    'die Umwelt',
    'der Müll',
    'die Mülltrennung',
    'der Second-Hand-Laden',
    'das Reparatur-Café',
    'die Pflanzaktion',
    'die Energie',
    'die Nachhaltigkeit'
  ],

  verbs: [
    'trennen',
    'reparieren',
    'wegwerfen',
    'sparen',
    'teilnehmen',
    'weitergeben'
  ],

  grammar: [
    'weil + Verb am Ende',
    'damit + Nebensatz',
    'dass + Nebensatz',
    'aber als Konnektor'
  ],

  mistakes: [
    '❌ Ich trenne Müll, weil ich möchte die Umwelt schützen.',
    '✅ Ich trenne Müll, weil ich die Umwelt schützen möchte.',
    '❌ Ich nehme teil an eine Pflanzaktion.',
    '✅ Ich nehme an einer Pflanzaktion teil.'
  ],

  tip:
    'Achte bei Umweltanzeigen genau auf das Ziel: Müll trennen, reparieren, Second-Hand nutzen, Energie sparen oder gemeinsam pflanzen.'
},
{
  id: 'b1-lesen-15',
  title: 'Finanzen, Bank & Versicherungen',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Herr Hassan arbeitet seit einem Jahr in Österreich. Er möchte ein Bankkonto eröffnen, ___(31)___ sein Gehalt darauf überwiesen wird.

Die Bank erklärt ihm, ___(32)___ er einen Ausweis und eine Meldebestätigung braucht. Außerdem interessiert er sich für Online-Banking, ___(33)___ er seine Rechnungen von zu Hause bezahlen kann.

Sein Berater empfiehlt auch eine Versicherung, ___(34)___ sie bei Schäden hilft. Herr Hassan spart jeden Monat etwas Geld, ___(35)___ er später eine Reise machen möchte. Er freut sich, ___(36)___ alles einfach erklärt wurde.`,

    options: {
      31: ['damit', 'weil', 'obwohl'],
      32: ['dass', 'wenn', 'weil'],
      33: ['damit', 'obwohl', 'aber'],
      34: ['weil', 'die', 'wenn'],
      35: ['weil', 'obwohl', 'sondern'],
      36: ['dass', 'wenn', 'obwohl']
    },

    answers: {
      31: 'damit',
      32: 'dass',
      33: 'damit',
      34: 'die',
      35: 'weil',
      36: 'dass'
    }
  },

  teil2: {
    title: 'Teil 2 – Anzeigen',
    image: '/images/b1lesen/b1-broschuere-15.jpeg',
    intro:
      'Lesen Sie die Anzeigen A–H. Für jede Situation finden Sie die passende Anzeige. Achten Sie genau auf Bankservice, Versicherung und Beratung.',

    questions: [
      {
        q: '41. Sie möchten zum ersten Mal ein Girokonto eröffnen.',
        a: 'A'
      },
      {
        q: '42. Sie möchten Ihre Bankgeschäfte bequem von zu Hause erledigen.',
        a: 'D'
      },
      {
        q: '43. Sie suchen eine Versicherung für Ihre Wohnung.',
        a: 'F'
      },
      {
        q: '44. Sie möchten regelmäßig Geld sparen.',
        a: 'B'
      },
      {
        q: '45. Sie brauchen Hilfe bei finanziellen Fragen.',
        a: 'H'
      }
    ]
  },

  teil3: {
    title: 'Teil 3 – Lesetext',

    text: `Ein gutes Finanzmanagement erleichtert den Alltag. Viele Menschen eröffnen zuerst ein Girokonto, damit ihr Gehalt überwiesen werden kann. Mit Online-Banking lassen sich Rechnungen schnell und sicher bezahlen.

Auch Versicherungen sind wichtig. Sie schützen vor hohen Kosten, wenn ein Schaden entsteht. Wer regelmäßig Geld spart, kann später größere Wünsche erfüllen oder unerwartete Ausgaben besser bezahlen.

Vor einem Vertrag sollte man Angebote vergleichen und Fragen stellen. So findet man eine Lösung, die gut zu den eigenen Bedürfnissen passt.`,

    questions: [
      {
        q: '46. Warum eröffnen viele Menschen ein Girokonto?',
        options: [
          'Damit ihr Gehalt überwiesen werden kann.',
          'Um Sport zu machen.',
          'Um ein Auto zu reparieren.'
        ],
        a: 'Damit ihr Gehalt überwiesen werden kann.'
      },

      {
        q: '47. Was kann man mit Online-Banking machen?',
        options: [
          'Rechnungen bezahlen.',
          'Ein Fahrrad reparieren.',
          'Ein Haustier impfen.'
        ],
        a: 'Rechnungen bezahlen.'
      },

      {
        q: '48. Warum sind Versicherungen wichtig?',
        options: [
          'Sie schützen vor hohen Kosten.',
          'Sie verkaufen Lebensmittel.',
          'Sie organisieren Reisen.'
        ],
        a: 'Sie schützen vor hohen Kosten.'
      },

      {
        q: '49. Warum sparen viele Menschen Geld?',
        options: [
          'Für spätere Wünsche oder Notfälle.',
          'Um weniger zu arbeiten.',
          'Um keine Bank zu brauchen.'
        ],
        a: 'Für spätere Wünsche oder Notfälle.'
      },

      {
        q: '50. Welche Überschrift passt am besten?',
        options: [
          'Bank, Sparen und Sicherheit',
          'Freizeit in Wien',
          'Haustiere und Tierpflege'
        ],
        a: 'Bank, Sparen und Sicherheit'
      }
    ]
  },

  words: [
    'das Girokonto',
    'das Online-Banking',
    'die Überweisung',
    'die Versicherung',
    'das Sparkonto',
    'der Vertrag',
    'die Beratung',
    'das Gehalt'
  ],

  verbs: [
    'eröffnen',
    'überweisen',
    'sparen',
    'bezahlen',
    'vergleichen',
    'absichern'
  ],

  grammar: [
    'damit + Nebensatz',
    'weil + Verb am Ende',
    'dass + Nebensatz',
    'Relativsatz: eine Versicherung, die ...'
  ],

  mistakes: [
    '❌ Ich eröffne Konto bei Bank.',
    '✅ Ich eröffne ein Konto bei der Bank.',
    '❌ Ich spare Geld, weil ich möchte reisen.',
    '✅ Ich spare Geld, weil ich reisen möchte.'
  ],

  tip:
    'Achte bei Bankanzeigen auf Konto, Sparen, Online-Banking, Versicherungen und Beratung. Mehrere Anzeigen enthalten ähnliche Begriffe.'
},

{
  id: 'b1-lesen-06',
  title: 'Gesund leben & Vorsorge',
  level: 'B1',

  teil1: {
    title: 'Teil 1 – Lückentext',
    text: `Viele Menschen möchten gesünder leben, ___(31)___ sie oft wenig Zeit für Sport haben. Deshalb versuchen sie, im Alltag kleine Veränderungen zu machen. Manche nehmen ___(32)___ den Aufzug die Treppe, wenn es nicht zu weit ist.

Ein ausgewogener Ernährungsplan ist ebenfalls wichtig. Experten empfehlen, mehr Gemüse und Obst zu essen ___(33)___ man sich fitter fühlt. Regelmäßige Vorsorgeuntersuchungen beim Arzt können helfen, ___(34)___ Krankheiten früh zu erkennen.

Wer nachts schlecht schläft, sollte darauf achten, ___(35)___ er abends nicht zu spät Kaffee trinkt. Stress kann ebenfalls ein Problem sein. Deshalb ist es sinnvoll, ___(36)___ man sich bewusst Zeit für Erholung nimmt.`,
    options: {
      31: ['obwohl', 'weil', 'damit'],
      32: ['statt', 'wegen', 'trotz'],
      33: ['damit', 'obwohl', 'denn'],
      34: ['dass', 'wenn', 'ob'],
      35: ['dass', 'wenn', 'weil'],
      36: ['dass', 'obwohl', 'sondern']
    },
    answers: {
      31: 'obwohl',
      32: 'statt',
      33: 'damit',
      34: 'dass',
      35: 'dass',
      36: 'dass'
    }
  },

  teil3: {
    title: 'Teil 3 – Lesetext',
    text: `Immer mehr Menschen in Österreich achten stärker auf ihre Gesundheit. Das zeigt auch der Besuch von Vorsorgeuntersuchungen. Viele Hausärzte erklären, dass regelmäßige Kontrollen besonders ab einem bestimmten Alter wichtig sind. So lassen sich manche Erkrankungen früh behandeln.

Gleichzeitig wächst das Interesse an gesunder Ernährung. In Supermärkten findet man heute mehr Bio-Produkte und frisches Gemüse. Viele Menschen kochen wieder öfter zu Hause, weil sie wissen wollen, was in ihrem Essen enthalten ist. Andere nutzen Apps, um Schritte oder Schlaf zu dokumentieren.

Experten betonen jedoch, dass Gesundheit nicht nur aus Ernährung und Sport besteht. Ausreichend Schlaf, weniger Stress und soziale Kontakte spielen ebenfalls eine große Rolle. Wer dauerhaft unter Druck steht, fühlt sich oft müde und kann sich schwerer konzentrieren.

Nicht jede Trenddiät ist sinnvoll. Seriöse Ernährungsberater warnen vor extremen Methoden ohne medizinische Beratung. Stattdessen empfehlen sie kleine, realistische Veränderungen im Alltag. Wer zum Beispiel täglich zehn Minuten spazieren geht und mehr Wasser trinkt, kann langfristig viel erreichen.`,
    questions: [
      {
        q: '46. Was zeigen steigende Vorsorgeuntersuchungen?',
        options: [
          'Dass mehr Menschen auf ihre Gesundheit achten.',
          'Dass Ärzte weniger Patienten haben.',
          'Dass Krankheiten verschwunden sind.'
        ],
        a: 'Dass mehr Menschen auf ihre Gesundheit achten.'
      },
      {
        q: '47. Warum kochen manche Menschen wieder öfter zu Hause?',
        options: [
          'Weil Restaurants geschlossen sind.',
          'Weil sie wissen wollen, was im Essen enthalten ist.',
          'Weil Gemüse im Supermarkt verboten ist.'
        ],
        a: 'Weil sie wissen wollen, was im Essen enthalten ist.'
      },
      {
        q: '48. Was gehört laut Experten auch zur Gesundheit?',
        options: [
          'Nur Sport und Diät.',
          'Schlaf, weniger Stress und soziale Kontakte.',
          'Nur teure Bio-Produkte.'
        ],
        a: 'Schlaf, weniger Stress und soziale Kontakte.'
      },
      {
        q: '49. Was warnen Ernährungsberater?',
        options: [
          'Vor extremen Diäten ohne medizinische Beratung.',
          'Vor jedem Spaziergang.',
          'Vor Vorsorgeuntersuchungen.'
        ],
        a: 'Vor extremen Diäten ohne medizinische Beratung.'
      }
    ]
  },

  words: ['die Vorsorge', 'die Ernährung', 'der Stress', 'die Erholung', 'die Untersuchung'],
  verbs: ['achten auf', 'empfehlen', 'erkennen', 'konzentrieren', 'warnen vor'],
  grammar: ['obwohl', 'statt + Genitiv/Dativ', 'damit', 'dass-Sätze'],
  mistakes: [
    '❌ Ich achte auf gesund leben.',
    '✅ Ich achte darauf, gesund zu leben.',
    '❌ Experten warnen vor extreme Diäten.',
    '✅ Experten warnen vor extremen Diäten.'
  ],
  tip: 'Bei Gesundheitstexten: Unterscheide Fakten, Empfehlungen und Warnungen der Experten.'
}
];