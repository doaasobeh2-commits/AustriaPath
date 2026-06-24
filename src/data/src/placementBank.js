export const placementBank = [
  {
    id: 'placement_01',
    visibility: 'ai_only',
    type: 'placement',
    title: 'Placement Test 1',
    estimatedTime: '8 Minuten',
    levelRange: ['A2', 'B1'],
    speaking: {
      intro: {
        time: '01:00',
        task: 'Bitte stellen Sie sich vor. Sprechen Sie über Name, Herkunft, Wohnort, Beruf, Familie und Hobbys.',
        followUps: [
          'Was gefällt Ihnen an Ihrem Wohnort?',
          'Was machen Sie gern in Ihrer Freizeit?',
        ],
      },
      image: {
        time: '01:00',
        title: 'Familie im Park',
        task: 'Beschreiben Sie das Bild. Wer ist auf dem Bild? Was machen die Personen? Wie finden Sie die Situation?',
        followUps: [
          'Gehen Sie gern in den Park?',
          'Was machen Familien normalerweise zusammen?',
        ],
      },
    },
    hoeren: {
      text: 'Herr Müller fährt morgen mit seinem Sohn zum Arzt. Nach dem Termin gehen sie in die Apotheke. Dort kauft Herr Müller ein Medikament für seinen Sohn.',
      questions: [
        {
          question: 'Mit wem fährt Herr Müller zum Arzt?',
          options: ['mit der Sohn', 'mit seinem Sohn', 'mit den Sohn'],
          correctAnswer: 'mit seinem Sohn',
          grammarFocus: 'Dativ',
        },
        {
          question: 'Wo gehen sie nach dem Termin hin?',
          options: ['zum Arzt', 'in die Apotheke', 'nach Hause'],
          correctAnswer: 'in die Apotheke',
          grammarFocus: 'Verstehen',
        },
      ],
    },
    lesen: {
      text: 'Anna arbeitet in einem Büro. Jeden Morgen fährt sie mit dem Bus zur Arbeit. Am Nachmittag trifft sie ihre Freundin im Café.',
      questions: [
        {
          question: 'Anna arbeitet ___ Büro.',
          options: ['in ein', 'in einem', 'in einen'],
          correctAnswer: 'in einem',
          grammarFocus: 'Dativ',
        },
        {
          question: 'Am Nachmittag trifft sie ___ Freundin.',
          options: ['ihre', 'ihrer', 'ihren'],
          correctAnswer: 'ihre',
          grammarFocus: 'Akkusativ',
        },
      ],
    },
    grammatik: [
      {
        question: 'Ich kaufe ___ Computer.',
        options: ['der', 'den', 'dem'],
        correctAnswer: 'den',
        grammarFocus: 'Akkusativ',
      },
      {
        question: 'Ich fahre mit ___ Auto.',
        options: ['das', 'dem', 'den'],
        correctAnswer: 'dem',
        grammarFocus: 'Dativ',
      },
      {
        question: 'Ich gehe in ___ Schule.',
        options: ['die', 'der', 'den'],
        correctAnswer: 'die',
        grammarFocus: 'Akkusativ / Richtung',
      },
      {
        question: 'Das Bild hängt an ___ Wand.',
        options: ['die', 'der', 'den'],
        correctAnswer: 'der',
        grammarFocus: 'Dativ / Ort',
      },
      {
        question: 'Ich lerne Deutsch, ___ ich in Österreich arbeite.',
        options: ['weil', 'obwohl', 'aber'],
        correctAnswer: 'weil',
        grammarFocus: 'Konnektor',
      },
    ],
    resultLogic: {
      weakAreas: ['Aussprache', 'Sprechen', 'Hören', 'Lesen', 'Grammatik', 'Wortschatz'],
      possibleLevels: ['A2', 'A2+', 'B1'],
    },
  },

  {
    id: 'placement_02',
    visibility: 'ai_only',
    type: 'placement',
    title: 'Placement Test 2',
    estimatedTime: '8 Minuten',
    levelRange: ['A2+', 'B1', 'B1+'],
    speaking: {
      intro: {
        time: '01:00',
        task: 'Bitte stellen Sie sich vor. Sprechen Sie über Ihren Namen, Ihr Herkunftsland, Ihre Familie, Ihre Arbeit oder Ausbildung und Ihre Zukunftspläne.',
        followUps: [
          'Welche Arbeit möchten Sie in Zukunft machen?',
          'Warum ist diese Arbeit interessant für Sie?',
        ],
      },
      image: {
        time: '01:00',
        title: 'Menschen in einem Supermarkt',
        task: 'Beschreiben Sie das Bild. Was sehen Sie? Was machen die Personen? Kaufen Sie gern im Supermarkt ein?',
        followUps: [
          'Wo kaufen Sie normalerweise ein?',
          'Was ist wichtiger: Preis oder Qualität?',
        ],
      },
    },
    hoeren: {
      text: 'Frau Berger ruft im Sprachinstitut an. Sie möchte sich für einen Deutschkurs anmelden. Der Kurs beginnt am 15. September und findet zweimal pro Woche statt.',
      questions: [
        {
          question: 'Wann beginnt der Kurs?',
          options: ['am 5. September', 'am 15. September', 'am 25. September'],
          correctAnswer: 'am 15. September',
          grammarFocus: 'Verstehen',
        },
        {
          question: 'Wie oft findet der Kurs statt?',
          options: ['einmal pro Woche', 'zweimal pro Woche', 'jeden Tag'],
          correctAnswer: 'zweimal pro Woche',
          grammarFocus: 'Verstehen',
        },
        {
          question: 'Frau Berger möchte sich für ___ Deutschkurs anmelden.',
          options: ['ein', 'einen', 'einem'],
          correctAnswer: 'einen',
          grammarFocus: 'Akkusativ',
        },
      ],
    },
    lesen: {
      text: 'Karim sucht eine neue Wohnung. Die Wohnung soll nicht weit von seiner Arbeit entfernt sein. Außerdem möchte er einen Parkplatz und einen Balkon haben.',
      questions: [
        {
          question: 'Was sucht Karim?',
          options: ['eine Arbeit', 'eine Wohnung', 'einen Parkplatz'],
          correctAnswer: 'eine Wohnung',
          grammarFocus: 'Verstehen',
        },
        {
          question: 'Die Wohnung soll nicht weit von ___ Arbeit entfernt sein.',
          options: ['seine', 'seiner', 'seinen'],
          correctAnswer: 'seiner',
          grammarFocus: 'Dativ',
        },
        {
          question: 'Karim möchte außerdem:',
          options: ['einen Garten', 'einen Balkon', 'ein Haustier'],
          correctAnswer: 'einen Balkon',
          grammarFocus: 'Verstehen',
        },
      ],
    },
    grammatik: [
      {
        question: 'Ich suche ___ Wohnung.',
        options: ['eine', 'einer', 'einen'],
        correctAnswer: 'eine',
        grammarFocus: 'Akkusativ',
      },
      {
        question: 'Ich fahre mit ___ Bus zur Arbeit.',
        options: ['den', 'dem', 'der'],
        correctAnswer: 'dem',
        grammarFocus: 'Dativ',
      },
      {
        question: '___ Balkon ist groß.',
        options: ['Die', 'Der', 'Das'],
        correctAnswer: 'Der',
        grammarFocus: 'Artikel',
      },
      {
        question: 'Ich lerne Deutsch, ___ ich in Österreich arbeite.',
        options: ['weil', 'obwohl', 'aber'],
        correctAnswer: 'weil',
        grammarFocus: 'Konnektor',
      },
      {
        question: 'Das Gegenteil von „teuer“ ist:',
        options: ['günstig', 'modern', 'laut'],
        correctAnswer: 'günstig',
        grammarFocus: 'Wortschatz',
      },
    ],
    resultLogic: {
      weakAreas: ['Aussprache', 'Sprechen', 'Hören', 'Lesen', 'Grammatik', 'Wortschatz'],
      possibleLevels: ['A2+', 'B1', 'B1+'],
    },
  },
];