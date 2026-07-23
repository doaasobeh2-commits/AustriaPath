const E = (id, mention, sufficient = mention, priority = 2, reportLabel = null) => ({
  id, mention, sufficient, priority, reportLabel,
});

const Q = (id, question, intent, prerequisites = []) => ({
  id, question, intent, prerequisites,
});

const FALLBACK_REPORT_LABELS = Object.freeze({
  woman: "Personen im Bild",
  atmosphere: "Atmosphäre",
  healthy: "Gesunde Ernährung",
  description: "Bildbeschreibung",
  solution: "Lösungsmöglichkeiten",
  age_comparison: "Vergleich der Altersgruppen",
});

const questionAsReportLabel = (question = "") =>
  String(question).trim().replace(/[?!.]+$/, "");

const pack = (level, imageId, title, referenceAnswer, evidence, followUpBank) => {
  const questionsByIntent = new Map(
    followUpBank.map((item) => [item.intent, questionAsReportLabel(item.question)])
  );
  return {
    key: `${level}:${imageId}`,
    level,
    imageId,
    title,
    referenceAnswer,
    referenceEvidence: evidence.map((item) => ({
      ...item,
      reportLabel:
        item.reportLabel || questionsByIntent.get(item.id) || FALLBACK_REPORT_LABELS[item.id],
    })),
    followUpBank,
  };
};

export const placementBildAssessmentPacks = Object.freeze([
  pack("A2", 2, "Buchhandlung",
    "Auf dem Bild sehe ich eine Buchhandlung. Eine Frau steht bei einem Regal und schaut ein Buch an. In der Buchhandlung gibt es viele Bücher. Ein Verkäufer ist an der Kasse. Die Buchhandlung wirkt ruhig. Ich lese auch gern Bücher.",
    [
      E("place", ["buchhandlung", "buchladen", "geschäft"], ["buchhandlung", "buchladen"], 1),
      E("woman", ["frau", "kundin"], ["frau", "kundin"], 1),
      E("woman_action", ["buch", "lesen", "such", "schau", "blätter"], ["schau.*buch", "liest.*buch", "liest.*roman", "such.*buch", "buch.*anschauen", "blätter.*roman", "blätter.*buch"], 1),
      E("shop_details", ["bücher", "regal", "kasse", "verkäufer"], ["regal", "kasse", "verkäufer", "viele bücher"], 2),
      E("atmosphere", ["ruhig", "leise", "angenehm"], undefined, 3),
      E("reading_preference", ["lese gern", "mag bücher", "lese.*bücher"], undefined, 3),
      E("reading_detail", ["roman", "krimi", "sachbuch", "zeitung", "geschichte"], undefined, 4),
    ],
    [Q("A2_BUCH_01", "Wo ist die Frau?", "place"), Q("A2_BUCH_02", "Was macht die Frau?", "woman_action"), Q("A2_BUCH_03", "Was sehen Sie noch im Geschäft?", "shop_details"), Q("A2_BUCH_04", "Lesen Sie gern Bücher?", "reading_preference"), Q("A2_BUCH_05", "Welche Bücher lesen Sie gern?", "reading_detail", ["reading_preference"])]) ,

  pack("A2", 6, "Koffergeschäft",
    "Auf dem Bild sehe ich ein Koffergeschäft. Eine Frau schaut sich einen Koffer an. Im Geschäft gibt es viele Koffer und Taschen. Ein Verkäufer hilft der Frau. Vielleicht braucht sie einen Koffer für eine Reise.",
    [E("place", ["geschäft", "koffergeschäft"], ["koffergeschäft", "kofferladen"], 1, "Ort"), E("woman", ["frau", "kundin"], undefined, 1, "Personen im Bild"), E("woman_action", ["koffer", "such", "schau"], ["such.*koffer", "schau.*koffer", "koffer.*anschauen"], 1, "Handlung der Frau"), E("shop_details", ["koffer", "tasche"], ["viele koffer", "taschen"], 2, "Koffer und Taschen im Geschäft"), E("seller_help", ["verkäufer", "hilft", "zeigt"], ["verkäufer.*hilft", "verkäufer.*zeigt"], 2, "Hilfe durch den Verkäufer"), E("travel_preference", ["reise gern", "reisen gern", "mag reisen"], undefined, 3, "Persönliche Reiseerfahrung")],
    [Q("A2_KOFFER_01", "Wo ist die Frau?", "place"), Q("A2_KOFFER_02", "Was sucht die Frau?", "woman_action"), Q("A2_KOFFER_03", "Was sehen Sie noch im Geschäft?", "shop_details"), Q("A2_KOFFER_04", "Wer hilft der Frau?", "seller_help"), Q("A2_KOFFER_05", "Reisen Sie gern?", "travel_preference")]),

  pack("A2", 8, "Wohnungsbesichtigung",
    "Auf dem Bild sehe ich eine Wohnung. Eine Frau besichtigt die Wohnung. Ein Mann zeigt ihr das Zimmer. Das Zimmer ist hell und sauber. Man sieht ein Fenster und Möbel. Vielleicht möchte die Frau die Wohnung mieten.",
    [E("place", ["wohnung", "zimmer"], ["wohnung", "zimmer"], 1), E("people_action", ["besicht", "zeigt", "anschauen"], ["frau.*besicht", "mann.*zeigt", "wohnung.*anschauen"], 1), E("appearance", ["hell", "sauber", "groß", "klein"], undefined, 2), E("room_details", ["fenster", "möbel", "tisch", "stuhl"], undefined, 2), E("housing_opinion", ["ich finde.*wohnung", "wohnung.*gefällt", "mag.*wohnung"], undefined, 3)],
    [Q("A2_WOHN_01", "Wo sind die Personen?", "place"), Q("A2_WOHN_02", "Was machen die Personen?", "people_action"), Q("A2_WOHN_03", "Wie sieht die Wohnung aus?", "appearance"), Q("A2_WOHN_04", "Was sehen Sie im Zimmer?", "room_details"), Q("A2_WOHN_05", "Wie finden Sie die Wohnung?", "housing_opinion")]),

  pack("A2", 9, "Bank",
    "Auf dem Bild sehe ich eine Bank. Ein Mann steht am Schalter und spricht mit einer Mitarbeiterin. Er hat Papiere oder Dokumente dabei. Vielleicht möchte er ein Konto eröffnen oder etwas bei der Bank erledigen.",
    [E("place", ["bank", "schalter"], ["bank", "bankschalter"], 1), E("conversation", ["spricht", "redet", "mitarbeiterin"], ["spricht.*mitarbeiterin", "redet.*mitarbeiterin"], 1), E("documents", ["papier", "dokument", "formular"], undefined, 2), E("possible_action", ["vielleicht", "konto", "geld", "erledigen"], ["vielleicht.*konto", "vielleicht.*geld", "möchte.*konto"], 2), E("bank_experience", ["gehe.*bank", "war.*bank", "zur bank"], undefined, 3)],
    [Q("A2_BANK_01", "Wo ist der Mann?", "place"), Q("A2_BANK_02", "Mit wem spricht der Mann?", "conversation"), Q("A2_BANK_03", "Was hat der Mann dabei?", "documents"), Q("A2_BANK_04", "Was macht der Mann vielleicht bei der Bank?", "possible_action"), Q("A2_BANK_05", "Gehen Sie manchmal zur Bank?", "bank_experience")]),

  pack("A2", 10, "Küche und Salat",
    "Auf dem Bild sehe ich eine Küche. Eine Frau macht einen Salat. Sie hat Gemüse, zum Beispiel Tomaten, Gurken und Paprika. Sie schneidet das Gemüse und bereitet das Essen vor. Das Essen sieht gesund aus.",
    [E("place", ["küche"], undefined, 1), E("salad_action", ["salat", "schneid", "gemüse", "gemuse", "mischt", "kochen"], ["macht.*salat", "salat.*macht", "bereitet.*salat", "schneidet.*gemüse", "schneidet.*gemuse", "schneidet.*gurke", "mischt.*gemüse", "mischt.*gemuse", "mischt.*alle.*gem"], 1), E("vegetables", ["gemüse", "tomate", "gurke", "paprika"], ["tomate", "gurke", "paprika"], 2), E("healthy", ["gesund"], undefined, 3), E("cooking_preference", ["koche gern", "kochen gern", "mag kochen"], undefined, 3), E("cooking_detail", ["ich koche.*gern", "koche gern.*suppe", "koche gern.*reis", "koche gern.*salat"], undefined, 4)],
    [Q("A2_SALAT_01", "Wo ist die Frau?", "place"), Q("A2_SALAT_02", "Was macht die Frau?", "salad_action"), Q("A2_SALAT_03", "Welches Gemüse sehen Sie?", "vegetables"), Q("A2_SALAT_04", "Kochen Sie gern?", "cooking_preference"), Q("A2_SALAT_05", "Was kochen Sie gern?", "cooking_detail", ["cooking_preference"])]) ,

  pack("B1", 2, "Paketlieferung zu Hause",
    "Auf dem Bild bringt ein Paketbote einer Frau ein Paket nach Hause. Die Frau steht an der Tür und nimmt das Paket an. Die Situation wirkt freundlich. Online-Bestellungen sind praktisch, weil man die Sachen direkt nach Hause bekommt. Manchmal kann eine Lieferung aber auch zu spät kommen.",
    [E("delivery_scene", ["paket", "paketbote", "liefert"], ["paketbote.*paket", "liefert.*paket", "frau.*nimmt.*paket"], 1), E("online_opinion", ["online.*gut", "bestellung.*praktisch", "ich finde.*bestellung"], undefined, 2), E("justification", ["weil", "denn", "deshalb"], undefined, 2), E("delivery_experience", ["habe.*paket.*bekommen", "bekomme.*paket", "bestelle.*online"], undefined, 3), E("delivery_problem", ["zu spät", "beschädigt", "verloren", "falsch", "problem.*liefer"], undefined, 2)],
    [Q("B1_PAKET_01", "Was passiert auf dem Bild?", "delivery_scene"), Q("B1_PAKET_02", "Wie finden Sie Bestellungen im Internet?", "online_opinion"), Q("B1_PAKET_03", "Warum finden Sie das gut oder nicht gut?", "justification", ["online_opinion"]), Q("B1_PAKET_04", "Haben Sie schon einmal ein Paket nach Hause bekommen?", "delivery_experience"), Q("B1_PAKET_05", "Welche Probleme kann es bei einer Lieferung geben?", "delivery_problem")]),

  pack("B1", 4, "Fernsehabend mit Hund",
    "Auf dem Bild sitzt ein Mann auf dem Sofa und sieht fern. Neben ihm ist ein Hund. Man sieht auch Snacks und ein Getränk. Die Atmosphäre wirkt ruhig. Nach der Arbeit kann so ein Abend angenehm sein, weil man sich ausruhen kann.",
    [E("man_action", ["mann", "sofa", "fern"], ["mann.*sieht fern", "mann.*fernsieht", "sitzt.*sofa"], 1), E("atmosphere", ["ruhig", "entspannt", "gemütlich"], undefined, 2), E("after_work_activity", ["nach der arbeit", "am abend.*ich", "ich.*entspann"], undefined, 3), E("leisure_importance", ["freizeit.*wichtig", "ausruhen.*wichtig"], undefined, 2), E("similar_experience", ["bei mir.*ähnlich", "abende.*ähnlich", "ich sehe.*fern"], undefined, 3)],
    [Q("B1_TV_01", "Was macht der Mann?", "man_action"), Q("B1_TV_02", "Wie wirkt die Situation auf Sie?", "atmosphere"), Q("B1_TV_03", "Was machen Sie gern nach der Arbeit?", "after_work_activity"), Q("B1_TV_04", "Warum ist Freizeit wichtig?", "leisure_importance"), Q("B1_TV_05", "Verbringen Sie Ihre Abende manchmal ähnlich?", "similar_experience")]),

  pack("B1", 5, "Mutter mit Kind im Bus",
    "Auf dem Bild sitzen eine Mutter und ihr Kind in einem Bus. Das Kind zeigt nach draußen. Die Situation wirkt ruhig. Öffentliche Verkehrsmittel sind für Familien wichtig, weil man damit einfach zur Arbeit, zur Schule oder in die Stadt fahren kann.",
    [E("place", ["bus", "verkehrsmittel"], ["im bus", "in einem bus"], 1), E("child_action", ["kind.*zeigt", "zeigt.*fenster", "schaut.*draußen"], undefined, 1), E("transport_opinion", ["verkehrsmittel.*gut", "bus.*praktisch", "ich finde.*bus"], undefined, 2), E("family_reason", ["familien.*wichtig", "weil.*famil", "schule.*fahren"], undefined, 2), E("transport_use", ["benutze.*bus", "fahre.*zug", "fahre.*bus"], undefined, 3)],
    [Q("B1_BUS_01", "Wo sind die Mutter und das Kind?", "place"), Q("B1_BUS_02", "Was macht das Kind?", "child_action"), Q("B1_BUS_03", "Wie finden Sie öffentliche Verkehrsmittel?", "transport_opinion"), Q("B1_BUS_04", "Warum sind Bus und Zug für Familien wichtig?", "family_reason"), Q("B1_BUS_05", "Benutzen Sie oft Bus oder Zug?", "transport_use")]),

  pack("B1", 6, "Einkaufen auf dem Markt",
    "Auf dem Bild kauft eine Frau auf einem Markt ein. Sie schaut sich frisches Obst oder Gemüse an. Auf dem Markt gibt es viele frische Lebensmittel. Ich kaufe gern auf dem Markt ein, weil die Produkte oft frisch sind. Im Supermarkt gibt es aber meistens mehr Auswahl.",
    [E("woman_action", ["frau", "markt", "kauft"], ["frau.*kauft", "frau.*markt", "wählt.*gemüse"], 1), E("market_goods", ["obst", "gemüse", "lebensmittel"], undefined, 1), E("market_preference", ["lieber.*markt", "lieber.*supermarkt", "markt.*als.*supermarkt"], undefined, 2), E("justification", ["weil", "denn", "deshalb"], undefined, 2), E("homeland_comparison", ["heimat", "bei uns", "herkunftsland"], undefined, 3)],
    [Q("B1_MARKT_01", "Was macht die Frau?", "woman_action"), Q("B1_MARKT_02", "Was kann man auf dem Markt kaufen?", "market_goods"), Q("B1_MARKT_03", "Kaufen Sie lieber auf dem Markt oder im Supermarkt?", "market_preference"), Q("B1_MARKT_04", "Warum?", "justification", ["market_preference"]), Q("B1_MARKT_05", "Wie ist das in Ihrem Heimatland?", "homeland_comparison")]),

  pack("B1", 7, "Einkaufen im Supermarkt",
    "Auf dem Bild ist eine Frau in einem Supermarkt. Sie hat einen Einkaufswagen und schaut sich ein Produkt an. In den Regalen stehen viele Lebensmittel. Supermärkte sind praktisch, weil man viele Dinge an einem Ort kaufen kann. Trotzdem sollte man die Preise vergleichen.",
    [E("woman_action", ["frau", "supermarkt", "einkaufswagen"], ["frau.*supermarkt", "frau.*produkt", "frau.*einkauf"], 1), E("supermarket_details", ["regal", "lebensmittel", "einkaufswagen", "produkt"], undefined, 1), E("supermarket_reason", ["weil.*supermarkt", "viele dinge.*ort", "praktisch.*kaufen"], undefined, 2), E("shopping_priority", ["preis", "qualität", "frisch", "angebot"], undefined, 2), E("shopping_preference", ["lieber.*supermarkt", "lieber.*markt"], undefined, 3)],
    [Q("B1_SUPER_01", "Was macht die Frau?", "woman_action"), Q("B1_SUPER_02", "Was sehen Sie im Supermarkt?", "supermarket_details"), Q("B1_SUPER_03", "Warum kaufen viele Menschen im Supermarkt ein?", "supermarket_reason"), Q("B1_SUPER_04", "Worauf achten Sie beim Einkaufen?", "shopping_priority"), Q("B1_SUPER_05", "Kaufen Sie lieber im Supermarkt oder auf dem Markt?", "shopping_preference")]),

  pack("B1", 12, "Kinder spielen draußen",
    "Auf dem Bild spielen Kinder draußen im Park Fußball. Man sieht Bäume und einen Spielplatz. Die Kinder wirken aktiv und glücklich. Ich finde es wichtig, dass Kinder draußen spielen, weil Bewegung gesund ist.",
    [E("children_action", ["kinder", "fußball", "spielen"], ["kinder.*spielen", "spielen.*fußball"], 1), E("children_mood", ["glücklich", "aktiv", "fröhlich", "spaß"], undefined, 2), E("outdoor_reason", ["draußen.*wichtig", "bewegung.*gesund", "weil.*gesund"], undefined, 2), E("childhood_experience", ["als kind", "in meiner kindheit"], undefined, 3), E("today_opinion", ["heute.*genug", "kinder heute", "zu wenig draußen"], undefined, 3)],
    [Q("B1_KINDER_01", "Was machen die Kinder?", "children_action"), Q("B1_KINDER_02", "Wie wirken die Kinder?", "children_mood"), Q("B1_KINDER_03", "Warum ist Spielen draußen für Kinder wichtig?", "outdoor_reason"), Q("B1_KINDER_04", "Was haben Sie als Kind gern draußen gemacht?", "childhood_experience"), Q("B1_KINDER_05", "Spielen Kinder heute genug draußen? Warum?", "today_opinion")]),

  pack("B1", 13, "Hausarbeit zu Hause",
    "Auf dem Bild machen zwei Personen Hausarbeit. Eine Person saugt den Boden, und die andere putzt. Man sieht auch Putzmittel und einen Wäschekorb. Hausarbeit ist notwendig, damit die Wohnung sauber bleibt. Ich finde es gut, wenn alle helfen.",
    [E("chores_action", ["hausarbeit", "saugt", "putzt"], ["saugt.*putzt", "zwei.*hausarbeit", "personen.*hausarbeit"], 1), E("cleaning_details", ["putzmittel", "wäschekorb", "staubsauger"], undefined, 1), E("home_experience", ["bei mir", "zu hause.*hausarbeit", "familie.*hausarbeit"], undefined, 3), E("sharing_opinion", ["alle.*helfen", "teilen.*hausarbeit", "sollen.*helfen"], undefined, 2), E("own_chore", ["ich.*putze", "ich.*sauge", "ich.*koche", "ich.*wasche"], undefined, 3)],
    [Q("B1_HAUS_01", "Was machen die Personen?", "chores_action"), Q("B1_HAUS_02", "Was sehen Sie noch auf dem Bild?", "cleaning_details"), Q("B1_HAUS_03", "Wer macht bei Ihnen zu Hause die Hausarbeit?", "home_experience"), Q("B1_HAUS_04", "Sollen alle in der Familie bei der Hausarbeit helfen? Warum?", "sharing_opinion"), Q("B1_HAUS_05", "Welche Hausarbeit machen Sie selbst?", "own_chore")]),

  pack("B1", 20, "Paket abholen",
    "Auf dem Bild holt eine Frau ein Paket ab. Ein Mitarbeiter gibt ihr das Paket. Wahrscheinlich ist sie in einer Poststelle oder Paketstation. Das Abholen kann praktisch sein, wenn man bei der Lieferung nicht zu Hause ist. Oft braucht man einen Ausweis.",
    [E("pickup_scene", ["paket", "abholt", "mitarbeiter"], ["frau.*paket.*ab", "holt.*paket", "mitarbeiter.*paket"], 1), E("likely_place", ["post", "paketstation", "paketfiliale"], undefined, 1), E("pickup_reason", ["nicht zu hause", "verpasst", "selbst abholen"], undefined, 2), E("pickup_requirements", ["ausweis", "bestätigung", "code"], undefined, 2), E("pickup_experience", ["habe.*paket.*abgeholt", "schon.*abgeholt"], undefined, 3)],
    [Q("B1_ABHOL_01", "Was passiert auf dem Bild?", "pickup_scene"), Q("B1_ABHOL_02", "Wo ist die Frau wahrscheinlich?", "likely_place"), Q("B1_ABHOL_03", "Warum holen Menschen Pakete selbst ab?", "pickup_reason"), Q("B1_ABHOL_04", "Was braucht man oft, um ein Paket abzuholen?", "pickup_requirements"), Q("B1_ABHOL_05", "Haben Sie schon einmal ein Paket abgeholt?", "pickup_experience")]),

  pack("B2", 3, "Künstliche Intelligenz im Alltag",
    "Auf dem Bild sitzt ein Mann an einem Computer und arbeitet mit künstlicher Intelligenz. Das Bild zeigt, dass digitale Technologien im Alltag, bei der Arbeit und beim Lernen wichtiger werden. KI kann Informationen schnell bearbeiten, birgt aber Risiken beim Datenschutz. Meiner Meinung nach sollte der Mensch die Kontrolle behalten.",
    [E("description", ["mann", "computer", "ki", "künstliche intelligenz"], ["mann.*computer", "arbeitet.*ki"], 1), E("interpretation", ["aussage", "zeigt.*wichtig", "technologie.*alltag"], undefined, 1), E("advantage", ["vorteil", "schnell", "unterstütz", "hilft"], undefined, 2), E("risk", ["risiko", "problem", "datenschutz", "abhängig"], undefined, 2), E("consequence", ["verändert.*arbeit", "arbeitsplätze", "aufgaben.*ändern", "dadurch"], undefined, 2), E("opinion", ["meiner meinung", "ich denke", "ich finde", "sollte"], undefined, 3), E("justification", ["weil", "denn", "deshalb"], undefined, 3), E("solution", ["kontrolle", "regeln", "verantwort", "sicher nutzen"], undefined, 3), E("experience", ["ich.*ki.*benutzt", "nutze.*ki", "habe.*ki"], undefined, 4)],
    [Q("B2_AI_01", "Was ist die wichtigste Aussage des Bildes?", "interpretation"), Q("B2_AI_02", "Welche Vorteile hat künstliche Intelligenz?", "advantage"), Q("B2_AI_03", "Welche Probleme oder Risiken kann es geben?", "risk"), Q("B2_AI_04", "Wie kann KI die Arbeit verändern?", "consequence"), Q("B2_AI_05", "Wie sollte man KI Ihrer Meinung nach nutzen?", "opinion"), Q("B2_AI_06", "Warum denken Sie so?", "justification", ["opinion"]), Q("B2_AI_07", "Wofür haben Sie selbst schon KI benutzt?", "experience")]),

  pack("B2", 5, "Umweltschutz und Nachhaltigkeit",
    "Auf dem Bild tun Menschen etwas für die Umwelt. Sie sammeln Müll, trennen Abfälle, pflanzen etwas und benutzen Fahrräder. Das Bild zeigt, dass Umweltschutz eine gemeinsame Aufgabe ist. Viel Verbrauch und Müll verursachen Umweltprobleme. Folgen sind Schäden für Klima, Natur und Gesundheit. Jeder kann Energie sparen und weniger Plastik nutzen.",
    [E("description", ["menschen", "müll", "fahrrad", "pflanzen"], ["sammeln.*müll", "trennen.*abfall", "pflanzen", "fahrräder"], 1), E("interpretation", ["umweltschutz.*aufgabe", "aussage", "gemeinsam.*umwelt"], undefined, 1), E("cause", ["grund", "weil", "ressourcen", "viel müll", "verbrauch"], undefined, 2), E("consequence", ["folge", "klima", "schaden", "gesundheit", "natur.*leidet"], undefined, 2), E("personal_solution", ["weniger plastik", "energie sparen", "öffentlich.*verkehr", "müll trennen"], undefined, 3), E("state_solution", ["staat.*soll", "gesetz", "fördern", "verbieten"], undefined, 3), E("own_action", ["ich.*umwelt", "ich trenne", "ich fahre.*rad", "ich spare"], undefined, 3), E("comparison", ["heimat", "herkunftsland", "bei uns"], undefined, 4)],
    [Q("B2_UMWELT_01", "Was ist die wichtigste Aussage des Bildes?", "interpretation"), Q("B2_UMWELT_02", "Warum haben wir Umweltprobleme?", "cause"), Q("B2_UMWELT_03", "Welche Folgen können diese Probleme haben?", "consequence"), Q("B2_UMWELT_04", "Was kann jeder Mensch für die Umwelt tun?", "personal_solution"), Q("B2_UMWELT_05", "Was sollte der Staat für die Umwelt tun?", "state_solution"), Q("B2_UMWELT_06", "Was tun Sie selbst für die Umwelt?", "own_action"), Q("B2_UMWELT_07", "Wie ist die Situation in Ihrem Heimatland?", "comparison")]),

  pack("B2", 101, "Internetnutzung nach Alter",
    "Die Grafik zeigt die Internetnutzung in verschiedenen Altersgruppen. Junge Menschen nutzen das Internet am meisten. Bei älteren Menschen ist die Nutzung niedriger. Jüngere Menschen wachsen mit digitalen Medien auf. Ältere Menschen können bei digitalen Diensten Schwierigkeiten haben. Einfache Angebote und Unterstützung sind deshalb wichtig.",
    [E("graphic_topic", ["grafik", "internetnutzung", "altersgruppen"], ["grafik.*internet", "internetnutzung.*alter"], 1), E("main_trend", ["junge.*meisten", "ältere.*weniger", "nimmt.*zu"], undefined, 1), E("age_comparison", ["jüngere.*ältere", "mehr als", "weniger als", "unterschied.*alter"], undefined, 1), E("cause", ["grund", "weil", "aufwachsen", "erfahrung"], undefined, 2), E("consequence", ["problem", "schwierigkeit", "ausgeschlossen", "digitale dienste"], undefined, 2), E("daily_relevance", ["alltag.*wichtig", "arbeit", "kommunikation", "information"], undefined, 3), E("solution", ["unterstütz", "kurs", "einfach.*angebot", "hilfe"], undefined, 3), E("comparison", ["heimat", "herkunftsland", "bei uns"], undefined, 4)],
    [Q("B2_NET_01", "Was zeigt die Grafik?", "graphic_topic"), Q("B2_NET_02", "Welche Altersgruppe nutzt das Internet am meisten?", "main_trend"), Q("B2_NET_03", "Warum gibt es Unterschiede zwischen den Altersgruppen?", "cause"), Q("B2_NET_04", "Welche Probleme können ältere Menschen im Internet haben?", "consequence"), Q("B2_NET_05", "Warum ist das Internet heute im Alltag wichtig?", "daily_relevance"), Q("B2_NET_06", "Wie kann man ältere Menschen dabei unterstützen?", "solution"), Q("B2_NET_07", "Wie ist die Situation in Ihrem Heimatland?", "comparison")]),
]);

const byKey = new Map(placementBildAssessmentPacks.map((item) => [item.key, item]));

export function getPlacementBildAssessmentPack(level, imageId) {
  return byKey.get(`${String(level || "").toUpperCase()}:${Number(imageId)}`) || null;
}

export function getPlacementBildAssessmentPackByKey(key) {
  return byKey.get(String(key || "")) || null;
}

export function getPlacementBildReportTopic(pack, topicId) {
  if (!pack) return null;
  const unit = pack.referenceEvidence.find((item) => item.id === String(topicId || ""));
  if (!unit?.reportLabel) return null;
  return { id: unit.id, label: unit.reportLabel };
}

export function listPlacementBildAssessmentPacks() {
  return [...placementBildAssessmentPacks];
}
