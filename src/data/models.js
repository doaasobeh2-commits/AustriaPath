export const models = [

  {
    
    id: 1,
    level: "B1",
    title: "Modell 1",

    emails: [
      {
        id: "email-1",
        title: "Tanzkurs anmelden",
        task:
          "Sie hatten Geburtstag und haben eine Geschenkkarte erhalten. Die Karte ist ein Gutschein, mit dem Sie sich jetzt für einen Tanzkurs anmelden können.",
        points: [
          "Grund des Schreibens",
          "Warum möchten Sie diesen Kurs machen?",
          "Haben Sie Erfahrung?",
          "Was erwarten Sie / Was möchten Sie wissen?"
        ]
      },
      {
        id: "email-2",
        title: "Tisch nicht erhalten",
        task:
          "Sie haben einen Tisch bestellt, aber die Adresse falsch geschrieben und den Tisch nicht erhalten. Schreiben Sie eine E-Mail an die Firma.",
        points: [
          "Grund Ihres Schreibens",
          "Was genau mit der Adresse passiert ist",
          "Warum Sie den Tisch brauchen",
          "Was die Firma tun soll"
        ]
      }
    ],

    planning: [
      {
        id: "planning-1",
        title: "Besuch im Altenheim",
        task:
          "Planen Sie einen Besuch im Altenheim. Schreiben Sie kurz über Zeit, Aktivitäten und Hilfe.",
        points: [
          "Zeit auswählen",
          "Aktivitäten planen",
          "Hilfe anbieten",
          "Sachen mitbringen",
          "Ideen sammeln"
        ]
      },
      {
        id: "planning-2",
        title: "Grillfest mit Nachbarn",
        task:
          "Sie möchten mit Ihren Nachbarn und Nachbarinnen gemeinsam im Garten grillen.",
        points: [
          "Wann?",
          "Was machen: Fleisch, Gemüse?",
          "Nachbarn einladen",
          "Getränke organisieren",
          "Aufgaben verteilen"
        ]
      }
    ],

    imageGroups: [
      {
        id: "image-group-1",
        title: "Kinder lernen Berufe kennen",
        images: [
          {
            title: "Junge in einer Autowerkstatt",
            description:
              "Ein Junge arbeitet konzentriert an einem Auto. Er hält ein Werkzeug in der Hand und interessiert sich für Technik."
          },
          {
            title: "Kinder in Feuerwehrkleidung",
            description:
              "Vier Kinder tragen Feuerwehrkleidung. Sie stehen nebeneinander und wirken motiviert und fröhlich."
          }
        ]
      },
      {
        id: "image-group-2",
        title: "Paketzustellung",
        images: [
          {
            title: "Frau nimmt ein Paket an",
            description:
              "Eine Frau steht an der Haustür und nimmt ein Paket von einem Lieferboten entgegen."
          },
          {
            title: "Postbote liefert ein großes Paket",
            description:
              "Ein Postbote bringt ein großes Paket in ein Büro und übergibt es einer Mitarbeiterin."
          }
        ]
      }
    ],

    lesen: {
      title: "Lesen und Grammatik",
      parts: [
        "Inhaltsverzeichnis verstehen",
        "Richtig oder falsch",
        "Mehrfachauswahl",
        "Lückentext",
        "Konnektoren",
        "Satzbau"
      ]
    },

    hoeren: {
      title: "Hören",
      status: "coming-soon"
    }
  }
];