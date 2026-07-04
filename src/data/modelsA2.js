export const a2Models = [
  {
    id: 1,
    level: "A2",
    title: "Zahnarzt Termin absagen",
    category: "Termin",
    task: [
      "Sie möchten den Termin absagen.",
      "Entschuldigen Sie sich.",
      "Erklären Sie, warum Sie nicht kommen können.",
      "Bitten Sie um einen neuen Termin."
    ],
    schreiben: `Betreff: Termin absagen

Sehr geehrte Damen und Herren,

am 20. Mai habe ich einen Termin in Ihrer Praxis. Leider muss ich diesen Termin absagen, weil ich krank bin. Es tut mir leid.

Könnten Sie mir bitte einen neuen Termin in der nächsten Woche anbieten?

Vielen Dank für Ihr Verständnis.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["der Termin", "krank", "die nächste Woche", "das Verständnis", "die Praxis"],
    verbs: ["haben", "kommen", "absagen", "anbieten", "danken"],
    grammar: ["Präsens", "Modalverb können (Konjunktiv II: könnten)", "weil-Satz", "höfliche Frage"],
    mistakes: [
      "❌ Ich habe Termin am 20. Mai. → ✅ Am 20. Mai habe ich einen Termin in Ihrer Praxis.",
      "❌ … weil ich bin krank. → ✅ … weil ich krank bin.",
      "❌ Können ich einen Termin? → ✅ Könnten Sie mir bitte einen Termin anbieten?",
    ],
    tip: "Nennen Sie zuerst den alten Termin, dann den Grund und die Bitte um einen neuen Termin — kurz, höflich und in der richtigen Reihenfolge."
  },

  {
    id: 2,
    level: "A2",
    title: "Kindergarten Anmeldung",
    category: "Anmeldung",
    task: [
      "Warum haben Sie diesen Kindergarten ausgewählt?",
      "Fragen Sie nach Informationen zum Essen.",
      "Fragen Sie nach besonderen Aktivitäten."
    ],
    schreiben: `Betreff: Anmeldung im Kindergarten

Sehr geehrte Damen und Herren,

mein Sohn ist vier Jahre alt. Ich möchte ihn gern in Ihrem Kindergarten anmelden.

Ich habe mich für Ihren Kindergarten entschieden, weil er in der Nähe unserer Wohnung liegt und gute Bewertungen hat.

Könnten Sie mir bitte Informationen zum Essen geben? Werden die Mahlzeiten vor Ort zubereitet? Gibt es auch besondere Aktivitäten für die Kinder?

Ich freue mich auf Ihre Antwort.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["der Kindergarten", "die Anmeldung", "das Essen", "die Aktivität", "die Nähe"],
    verbs: ["anmelden", "sich entscheiden", "liegen", "geben", "sich freuen"],
    grammar: ["Präsens", "weil-Satz", "höfliche Frage (Könnten Sie …?)", "Relativsatz: der … hat"],
    mistakes: [
      "❌ Ich habe einen Sohn. Er ist vier. → ✅ Mein Sohn ist vier Jahre alt.",
      "❌ … in der Nähe von unserer Wohnung. → ✅ … in der Nähe unserer Wohnung.",
      "❌ Gibt es besondere Aktivitäten? (ohne Kontext) → ✅ Gibt es auch besondere Aktivitäten für die Kinder?",
    ],
    tip: "Schreiben Sie zuerst, wen Sie anmelden möchten, dann warum Sie diesen Kindergarten gewählt haben, danach Ihre Fragen."
  },

  {
    id: 3,
    level: "A2",
    title: "AMS-Termin verschieben",
    category: "Termin",
    task: [
      "Entschuldigen Sie sich für den Termin.",
      "Erklären Sie den Grund.",
      "Bitten Sie um einen neuen Termin."
    ],
    schreiben: `Betreff: Termin beim AMS verschieben

Sehr geehrte Damen und Herren,

morgen habe ich einen Termin beim AMS. Leider kann ich nicht kommen, weil mein Kind krank ist und ich zu Hause bleiben muss.

Ich entschuldige mich für die kurzfristige Absage.

Könnten Sie mir bitte einen neuen Termin geben? Am besten passt mir nächste Woche am Vormittag.

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["das AMS", "der Termin", "die Absage", "der Vormittag", "die Hilfe"],
    verbs: ["haben", "kommen", "bleiben", "sich entschuldigen", "passen"],
    grammar: ["Präsens", "Modalverb müssen", "weil-Satz", "höfliche Frage"],
    mistakes: [
      "❌ Ich habe Termin morgen. → ✅ Morgen habe ich einen Termin beim AMS.",
      "❌ … weil mein Kind ist krank. → ✅ … weil mein Kind krank ist.",
      "❌ Geben Sie mir Termin. → ✅ Könnten Sie mir bitte einen neuen Termin geben?",
    ],
    tip: "In Österreich heißt die Arbeitsagentur AMS (Arbeitsmarktservice). Nennen Sie den Grund und schlagen Sie, wenn möglich, einen Wunschtermin vor."
  },

  {
    id: 4,
    level: "A2",
    title: "Sprachkurs Anfrage",
    category: "Kurs",
    task: [
      "Fragen Sie nach dem Kursbeginn.",
      "Fragen Sie nach dem Preis.",
      "Fragen Sie nach einem Termin für den Einstufungstest."
    ],
    schreiben: `Betreff: Anfrage zum Deutschkurs

Sehr geehrte Damen und Herren,

ich habe Ihre Anzeige für einen Deutschkurs gelesen und interessiere mich dafür.

Könnten Sie mir bitte mitteilen, wann der Kurs beginnt und wie viel er pro Monat kostet?

Außerdem möchte ich gerne einen Einstufungstest machen. Wann wäre dafür ein Termin möglich?

Vielen Dank im Voraus.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["der Sprachkurs", "die Anzeige", "der Preis", "der Einstufungstest", "der Monat"],
    verbs: ["lesen", "sich interessieren", "beginnen", "kosten", "mitteilen"],
    grammar: ["Präsens", "Perfekt", "W-Fragen", "Nebensatz mit dass/wann", "höfliche Frage"],
    mistakes: [
      "❌ Ich interessiere mich für den Kurs sehr. → ✅ Ich interessiere mich sehr für den Kurs. / … interessiere mich dafür.",
      "❌ Wie viel kostet der Kurs? (ohne Höflichkeit) → ✅ Könnten Sie mir bitte mitteilen, wie viel der Kurs kostet?",
      "❌ Ich will Einstufungstest. → ✅ Ich möchte gerne einen Einstufungstest machen.",
    ],
    tip: "Formulieren Sie Ihre Fragen klar (Wann? Wie viel?) und nutzen Sie höfliche Formen wie „Könnten Sie mir bitte mitteilen …?“"
  },

  {
    id: 5,
    level: "A2",
    title: "Aufzug funktioniert nicht",
    category: "Beschwerde",
    task: [
      "Schreiben Sie den Grund für Ihr Schreiben.",
      "Erklären Sie, warum das ein Problem ist.",
      "Schreiben Sie, was die Hausverwaltung machen soll."
    ],
    schreiben: `Betreff: Aufzug funktioniert nicht

Sehr geehrte Damen und Herren,

ich schreibe Ihnen, weil der Aufzug in unserem Haus seit zwei Tagen nicht funktioniert.

Das ist für mich ein großes Problem, weil ich im vierten Stock wohne und ein kleines Kind habe. Mit dem Kinderwagen ist die Treppe sehr schwierig.

Bitte schicken Sie so schnell wie möglich einen Techniker zur Reparatur.

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["der Aufzug", "das Problem", "der vierte Stock", "der Techniker", "die Hausverwaltung"],
    verbs: ["schreiben", "funktionieren", "wohnen", "haben", "schicken"],
    grammar: ["Präsens", "weil-Satz", "seit + Dativ", "höfliche Bitte mit bitte"],
    mistakes: [
      "❌ Der Aufzug ist kaputt seit zwei Tagen. → ✅ Der Aufzug funktioniert seit zwei Tagen nicht.",
      "❌ Ich wohne im vierten Etage. → ✅ Ich wohne im vierten Stock.",
      "❌ Schicken Techniker! → ✅ Bitte schicken Sie so schnell wie möglich einen Techniker.",
    ],
    tip: "Beschreiben Sie das Problem konkret, erklären Sie kurz, warum es wichtig ist, und formulieren Sie eine klare Bitte an die Hausverwaltung."
  },

  {
    id: 6,
    level: "A2",
    title: "Geburtstag auf dem Schiff",
    category: "Anfrage",
    status: "preview",
    task: [
      "Warum möchten Sie den Ausflug auf dem Schiff machen?",
      "Wann möchten Sie feiern und mit wie vielen Personen?",
      "Bitten Sie um ein Angebot."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 7,
    level: "A2",
    title: "Betreuung für ältere Frau",
    category: "Arbeit",
    status: "preview",
    task: [
      "Stellen Sie sich vor.",
      "Warum interessieren Sie sich für diese Arbeit?",
      "Fragen Sie, was Sie genau tun sollen."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 8,
    level: "A2",
    title: "Teppichreinigung",
    category: "Anfrage",
    status: "preview",
    task: [
      "Warum ist der Teppich schmutzig?",
      "Wo und wann wurde er gekauft?",
      "Wie wird der Teppich zur Reinigungsfirma transportiert?"
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 9,
    level: "A2",
    title: "Kamera im Hotel vergessen",
    category: "Hotel",
    status: "preview",
    task: [
      "Wie war der Urlaub und wo waren Sie?",
      "Wo haben Sie die Kamera vergessen?",
      "Was möchten Sie vom Hotel?"
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 10,
    level: "A2",
    title: "Problem mit dem Kindergartenbus",
    category: "Beschwerde",
    status: "preview",
    task: [
      "Beschreiben Sie das Problem.",
      "Ihre Tochter kann nicht einsteigen.",
      "Bitten Sie um eine Lösung."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 11,
    level: "A2",
    title: "Geburtstagsfeier auf dem Schiff",
    category: "Freunde",
    status: "preview",
    task: [
      "Fragen Sie, warum sie auf dem Schiff feiern möchte.",
      "Fragen Sie, wie viele Personen eingeladen sind.",
      "Schreiben Sie Ihre Meinung und fragen Sie, was Sie mitnehmen sollen."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 12,
    level: "A2",
    title: "Bewerbung um eine Stelle",
    category: "Arbeit",
    status: "preview",
    task: [
      "Schreiben Sie kurz über Ihren Lebenslauf.",
      "Schreiben Sie, welche Abschlüsse Sie haben.",
      "Erklären Sie, warum Sie dieses Unternehmen ausgewählt haben."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 13,
    level: "A2",
    title: "Anmeldung zum Backkurs",
    category: "Kurs",
    status: "preview",
    task: [
      "Warum möchten Sie sich für den Kurs anmelden?",
      "Fragen Sie nach den Anforderungen.",
      "Fragen Sie nach Informationen zum Kurs."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 14,
    level: "A2",
    title: "Zahnarzt Termin absagen 2",
    category: "Termin",
    status: "preview",
    task: [
      "Sie möchten den Termin absagen.",
      "Entschuldigen Sie sich und nennen Sie den Termin.",
      "Erklären Sie den Grund und bitten Sie um einen neuen Termin."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 15,
    level: "A2",
    title: "Taschen im Treppenhaus",
    category: "Wohnen",
    status: "preview",
    task: [
      "Schreiben Sie den Grund für Ihre E-Mail.",
      "Erklären Sie, dass die Taschen nicht Ihnen gehören.",
      "Schreiben Sie, was der Hausbesitzer machen soll."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 16,
    level: "A2",
    title: "Kinderbetreuung",
    category: "Anmeldung",
    status: "preview",
    task: [
      "Warum brauchen Sie die Kinderbetreuung?",
      "Wann soll Ihr Kind dort bleiben?",
      "Schreiben Sie Informationen zum Kind."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 17,
    level: "A2",
    title: "Wohnung kündigen",
    category: "Wohnen",
    status: "preview",
    task: [
      "Warum möchten Sie ausziehen?",
      "Wann ziehen Sie aus?",
      "Fragen Sie nach einem Termin für die Schlüsselübergabe."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 18,
    level: "A2",
    title: "Garage mieten",
    category: "Anfrage",
    status: "preview",
    task: [
      "Warum brauchen Sie die Garage?",
      "Fragen Sie nach dem Preis pro Monat.",
      "Fragen Sie nach einem Termin für die Besichtigung."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 19,
    level: "A2",
    title: "Kindergarten Anmeldung 2",
    category: "Anmeldung",
    status: "preview",
    task: [
      "Warum haben Sie diesen Kindergarten ausgewählt?",
      "Fragen Sie nach Informationen zum Essen.",
      "Fragen Sie nach besonderen Aktivitäten."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 20,
    level: "A2",
    title: "Familienreise buchen",
    category: "Reise",
    status: "preview",
    task: [
      "Welche Reise haben Sie ausgewählt?",
      "Was möchten Sie dort unternehmen?",
      "Fragen Sie nach Datum und Preis."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 21,
    level: "A2",
    title: "Zimmer streichen lassen",
    category: "Wohnen",
    status: "preview",
    task: [
      "Warum möchten Sie das Zimmer streichen lassen?",
      "Welche Zimmer und welche Farbe möchten Sie?",
      "Fragen Sie nach Beginn und Dauer der Arbeit."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 22,
    level: "A2",
    title: "Skireise nach Tirol",
    category: "Reise",
    status: "preview",
    task: [
      "Schreiben Sie über Ihre Erfahrung mit Skifahren.",
      "Nennen Sie Ihren Wunschtermin.",
      "Schreiben Sie, was Sie im Zimmer möchten."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 23,
    level: "A2",
    title: "Garage kündigen",
    category: "Wohnen",
    status: "preview",
    task: [
      "Schreiben Sie den Grund für die Kündigung.",
      "Schreiben Sie, bis wann Sie bezahlen.",
      "Schlagen Sie Ihren Nachbarn als neuen Mieter vor."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 24,
    level: "A2",
    title: "Einladung zum Geburtstag absagen",
    category: "Freunde",
    status: "preview",
    task: [
      "Gratulieren Sie und entschuldigen Sie sich.",
      "Erklären Sie, warum Sie nicht kommen können.",
      "Schreiben Sie etwas über das Geschenk."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 25,
    level: "A2",
    title: "Fotokurs anmelden",
    category: "Kurs",
    status: "preview",
    task: [
      "Warum möchten Sie diesen Kurs machen?",
      "Schreiben Sie, dass Sie keine Kamera haben.",
      "Stellen Sie eine Frage zum Kurs."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 26,
    level: "A2",
    title: "Termin beim Arbeitsamt absagen",
    category: "Termin",
    status: "preview",
    task: [
      "Entschuldigen Sie sich, dass Sie nicht kommen können.",
      "Erklären Sie den Grund.",
      "Bitten Sie um einen neuen Termin."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 27,
    level: "A2",
    title: "Hund mit zur Arbeit nehmen",
    category: "Arbeit",
    status: "preview",
    task: [
      "Warum müssen Sie Ihren Hund mitnehmen?",
      "Wie oft möchten Sie den Hund mitnehmen?",
      "Beschreiben Sie den Hund."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 28,
    level: "A2",
    title: "Schulfest Ihres Kindes",
    category: "Schule",
    status: "preview",
    task: [
      "Warum mögen Sie das Schulfest?",
      "Was möchten Sie machen?",
      "Fragen Sie nach Informationen zum Schulfest."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 29,
    level: "A2",
    title: "Sprachkurs für die Arbeit",
    category: "Kurs",
    status: "preview",
    task: [
      "Fragen Sie nach dem Kursbeginn.",
      "Fragen Sie nach dem Preis.",
      "Fragen Sie nach einem Termin für den Einstufungstest."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 30,
    level: "A2",
    title: "Problem mit dem Aufzug",
    category: "Beschwerde",
    status: "preview",
    task: [
      "Schreiben Sie den Grund für Ihr Schreiben.",
      "Erklären Sie, warum Sie das stört.",
      "Schreiben Sie, was die Hausverwaltung machen soll."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 31,
    level: "A2",
    title: "Mantel im Restaurant vergessen",
    category: "Restaurant",
    status: "preview",
    task: [
      "Was ist passiert?",
      "Was möchten Sie?",
      "Beschreiben Sie Größe und Farbe."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 32,
    level: "A2",
    title: "Geschenkkorb bestellen",
    category: "Anfrage",
    status: "preview",
    task: [
      "Welche Lebensmittel möchten Sie?",
      "Wohin soll geliefert werden?",
      "Fragen Sie nach den Kosten."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 33,
    level: "A2",
    title: "Beschwerde beim Friseur",
    category: "Beschwerde",
    status: "preview",
    task: [
      "Wann war Ihr Sohn dort?",
      "Was ist das Problem?",
      "Was möchten Sie?"
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 34,
    level: "A2",
    title: "Praktikum für den Sohn",
    category: "Anmeldung",
    status: "preview",
    task: [
      "Was macht Ihr Kind momentan?",
      "Wofür möchten Sie ihn anmelden?",
      "Fragen Sie nach einem Termin für ein Vorstellungsgespräch."
    ],
    schreiben: "",
    words: [],
    verbs: [],
    grammar: [],
    tip: "Dieses Modell ist bald vollständig verfügbar."
  },

  {
    id: 35,
    level: "A2",
    title: "Lärm vom Nachbarn",
    category: "Beschwerde",
    task: [
      "Schreiben Sie, warum Sie sich beschweren.",
      "Sagen Sie, wann der Lärm passiert.",
      "Bitten Sie die Hausverwaltung um Hilfe."
    ],
    schreiben: `Betreff: Lärm in der Wohnung

Sehr geehrte Damen und Herren,

ich wohne in der Wohnung 12 im dritten Stock. Seit zwei Wochen höre ich abends sehr laute Musik aus der Nachbarwohnung.

Der Lärm ist meistens zwischen 22 und 24 Uhr. Ich kann deshalb nicht schlafen und bin am nächsten Tag müde.

Könnten Sie bitte mit dem Nachbarn sprechen? Ich wäre Ihnen sehr dankbar.

Mit freundlichen Grüßen
Ali Hassan`,
    words: ["der Lärm", "die Nachbarwohnung", "die Hausverwaltung", "schlafen", "müde", "abends"],
    verbs: ["wohnen", "hören", "schlafen", "sprechen", "sich beschweren", "bitten"],
    grammar: ["weil + Verb am Ende", "Könnten Sie …?", "Zeitangaben: zwischen … und …"],
    satzbau: [
      "Seit zwei Wochen höre ich …",
      "Ich kann deshalb nicht schlafen.",
      "Könnten Sie bitte …?"
    ],
    konnektoren: ["deshalb", "seit", "weil"],
    mistakes: [
      "❌ Ich beschwere mich weil der Nachbar ist laut.",
      "✅ Ich beschwere mich, weil der Nachbar laut ist."
    ],
    tip: "Bei Beschwerden: höflich bleiben, Zeit und Ort genau nennen, konkrete Bitte formulieren."
  }
];