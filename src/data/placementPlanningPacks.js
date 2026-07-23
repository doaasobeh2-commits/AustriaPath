const AUDIO_ROOT = "/audio/placement/planning";

const evidence = (id, label, requiredByTask, patterns, partialPatterns = []) =>
  Object.freeze({ id, label, requiredByTask, patterns, partialPatterns });
const move = (id, kind, order, filename, text, targets, additional, responseSeconds, maxAudioDurationSeconds, options = {}) =>
  Object.freeze({ id, kind, order, filename, text, audioUrl: `${AUDIO_ROOT}/${filename}`, targets, additional, responseSeconds, maxAudioDurationSeconds, ...options });
const E = {
  date_time: evidence("date_time", "Termin und Uhrzeit", true, ["(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende|morgen)", "(?:um|gegen) \\d{1,2}(?::\\d{2})? uhr"], ["(?:spater|fruher|nachmittag|abend)"]),
  place: evidence("place", "Ort", true, ["(?:im|in der|in einem|bei|auf dem) (?:restaurant|park|garten|lokal|kursraum|wohnung|hotel|zentrum|hof|saal|cafe)"]),
  guests: evidence("guests", "Gäste", true, ["(?:freund|familie|kolleg|nachbar|kursteilnehmer|gast|gaste|personen)"]),
  food_drinks: evidence("food_drinks", "Essen und Getränke", true, ["(?:essen|trinken|pizza|brot|kuchen|salat|obst|gemuse|saft|wasser|kaffee|fruhstuck)"]),
  simple_reason: evidence("simple_reason", "Einfacher Grund", false, ["(?:weil|denn|deshalb|darum)"]),
  reaction: evidence("reaction", "Auf einen Vorschlag reagieren", false, ["(?:ja|nein|einverstanden|gute idee|finde ich|passt|lieber|nicht gut)"]),
  alternative: evidence("alternative", "Einen anderen Vorschlag machen", false, ["(?:stattdessen|alternativ|lieber|wir konnten|wir konnen auch|anderer vorschlag)"]),
  final_agreement: evidence("final_agreement", "Gemeinsame Entscheidung", true, ["(?:wir einigen uns|wir haben vereinbart|also machen wir|unser plan|endgultig)"]),
  meeting_place: evidence("meeting_place", "Treffpunkt", true, ["(?:treffen wir uns|treffpunkt|am bahnhof|vor dem|bei der haltestelle)"]),
  items: evidence("items", "Benötigte Dinge", true, ["(?:decke|teller|becher|besteck|ball|tasche|schirm|sonnenschutz)"]),
  weather_alternative: evidence("weather_alternative", "Alternative bei schlechtem Wetter", false, ["(?:bei regen|wenn es regnet|schlechtes wetter).*(?:innen|cafe|verschieben|absagen)"]),
  tasks: evidence("tasks", "Aufgaben", true, ["(?:ich ubernehme|ich trage|ich packe|ich helfe|aufgabe|macht|organisiert)"]),
  transport_items: evidence("transport_items", "Transport und Hilfsmittel", true, ["(?:auto|transporter|wagen|tragen|karton|sackkarre|mieten)"]),
  break_food: evidence("break_food", "Pause und Verpflegung", true, ["(?:pause|pizza|essen|trinken|getranke|kaffee)"]),
  transport: evidence("transport", "Verkehrsmittel", true, ["(?:zug|bus|bahn|auto|fahrrad|zu fuss|fahren)"]),
  costs: evidence("costs", "Kosten", true, ["(?:\\d+|zehn|zwanzig|dreissig|funfzig) euro|budget|kosten|preis|billig|teuer"], ["(?:nicht viel|gunstig)"]),
  proposal_reason: evidence("proposal_reason", "Vorschlag mit Begründung", false, ["(?:weil|denn|deshalb|darum)"]),
  reaction_alternative: evidence("reaction_alternative", "Reaktion und Alternative", false, ["(?:finde ich|einverstanden|lieber|stattdessen|alternativ|wir konnten)"]),
  weather_solution: evidence("weather_solution", "Lösung bei schlechtem Wetter", true, ["(?:regen|schlechtes wetter).*(?:innen|verschieben|absagen|museum|cafe)"]),
  program: evidence("program", "Programm", true, ["(?:musik|spiel|rede|tanzen|programm|quiz|prasentation)"]),
  responsibilities: evidence("responsibilities", "Aufgabenverteilung", true, ["(?:ich|du|er|sie|wir).*(?:ubernimmt|organisiert|kauft|reserviert|informiert|macht)"]),
  reason_alternative: evidence("reason_alternative", "Begründung und Alternative", false, ["(?:weil|denn|stattdessen|alternativ|wir konnten)"]),
  attendance_problem: evidence("attendance_problem", "Lösung bei geringer Teilnahme", false, ["(?:nicht alle|teilnehmer|kommen konnen).*(?:termin|verschieben|online|informieren|abstimmen)"]),
  arrival: evidence("arrival", "Ankunft und Abholung", true, ["(?:kommt an|ankunft|bahnhof|flughafen|abholen|zug).*(?:uhr|abhol|treffen)?"]),
  accommodation: evidence("accommodation", "Unterkunft", true, ["(?:hotel|wohnung|ubernachten|gastezimmer|pension)"]),
  food_scope: evidence("food_scope", "Verpflegung", true, ["(?:fruhstuck).*(?:mittag|abend)|(?:mittag|abend).*(?:fruhstuck)|(?:restaurant|kochen|essen).*(?:wochenende|samstag|sonntag)"], ["(?:hotel mit fruhstuck|fruhstuck)"]),
  activities: evidence("activities", "Gemeinsame Aktivitäten", true, ["(?:museum|spaziergang|wandern|stadt|kino|park|ausflug|besichtigen)"]),
  budget: evidence("budget", "Budget", true, ["(?:\\d+|hundert|zweihundert|dreihundert) euro|budget|kosten|ausgeben"]),
  reason_preference: evidence("reason_preference", "Wünsche und Begründungen", false, ["(?:weil|denn|mochte lieber|wunsch|bevorzug)"]),
  delay_solution: evidence("delay_solution", "Lösung bei Verspätung", true, ["(?:verspatung|spater).*(?:reservierung|informieren|verschieben|andern|warten)"]),
  priorities: evidence("priorities", "Ziele und Prioritäten", true, ["(?:prioritat|am wichtigsten|ziel|vorrang)"]),
  budget_allocation: evidence("budget_allocation", "Begründete Budgetverteilung", true, ["(?:budget|euro).*(?:verteilen|fur|sparen)|(?:verteilen|sparen).*(?:budget|euro)"]),
  stakeholder_balance: evidence("stakeholder_balance", "Unterschiedliche Interessen abwägen", true, ["(?:familien|bewohner|kinder|musik).*(?:beide|kompromiss|zusammen|einerseits|andererseits)"]),
  noise_constraint: evidence("noise_constraint", "Umgang mit der Nachtruhe", true, ["(?:nachtruhe|22|zweiundzwanzig).*(?:musik|enden|leiser|innen|programm)"]),
  weather_capacity: evidence("weather_capacity", "Schlechtwetter- und Kapazitätslösung", true, ["(?:regen|innenraum|kapazitat).*(?:zelt|teilen|verschieben|absagen|gruppen)"]),
  tradeoff: evidence("tradeoff", "Vor- und Nachteile abwägen", false, ["(?:einerseits|andererseits|vorteil|nachteil|dafur|dagegen|in kauf)"]),
  learning_goal: evidence("learning_goal", "Lernziel und Erfolgskriterien", true, ["(?:lernziel|ziel|erfolg).*(?:messen|erkennen|uberprufen|kriter)"]),
  format_tradeoff: evidence("format_tradeoff", "Präsenz- und Onlineformat abwägen", true, ["(?:prasenz|online).*(?:vorteil|nachteil|bevorzug|einerseits|andererseits)"]),
  participation_equity: evidence("participation_equity", "Faire Teilnahme ermöglichen", true, ["(?:teilzeit|faire teilnahme|alle teilnehmen).*(?:gruppe|hybrid|aufzeichnung|termin)"]),
  operations_constraint: evidence("operations_constraint", "Laufenden Betrieb sichern", true, ["(?:betrieb|gleichzeitig fehlen).*(?:gruppe|schicht|abwechselnd|weiterlaufen)"]),
  budget_value: evidence("budget_value", "Budget und Nutzen begründen", true, ["(?:teuer|budget|kosten).*(?:nutzen|lohnt|erfolg|sparen|anpassen)"]),
  alternative_solution: evidence("alternative_solution", "Tragfähige Alternative entwickeln", false, ["(?:alternativ|stattdessen|hybrid|anpassen|andere losung)"]),
  implementation: evidence("implementation", "Umsetzung und Verantwortlichkeiten", true, ["(?:umsetzen|verantwortlich|ubernimmt|zeitplan|uberprufen)"]),
};

const pack = (scenarioId, level, title, task, evidenceIds, main, branch) => {
  const closings = main.filter((m) => m.closing);
  return Object.freeze({
    scenarioId, id: scenarioId, service: "placement", skill: "planung", level,
    difficulty: scenarioId.endsWith("schwach") ? "schwach" : "mittel", title,
    studentPreview: task, learnerTask: task,
    evidenceUnits: Object.freeze(evidenceIds.map((id) => E[id])),
    mainMoves: Object.freeze(main), branchMoves: Object.freeze(branch),
    moves: Object.freeze([...main, ...branch]),
    // Prefer the primary/combined closing when multiple covered-aware closings exist.
    finalMoveId: (closings.find((m) => m.closingProfile === "combined") || closings[0] || main.at(-1))?.id,
  });
};

export const placementPlanningPacks = Object.freeze([
  pack("a2_planung_mittel", "A2", "A2 Planung – Geburtstagsfeier planen", "Sie möchten mit einem Freund eine Geburtstagsfeier organisieren. Planen Sie gemeinsam den Termin, den Ort, die Gäste sowie Essen und Getränke. Treffen Sie am Ende eine Entscheidung.", ["date_time","place","guests","food_drinks","simple_reason","reaction","alternative","final_agreement"], [
    move("birthday-time","main",1,"a2_geburtstag_01_termin.mp3","Wann möchten Sie die Geburtstagsfeier machen?",["date_time"],["place","guests","simple_reason"],15,6,{mandatory:true,replacementMoveId:"birthday-time-reaction"}),
    move("birthday-place","main",2,"a2_geburtstag_02_ort.mp3","Wo können wir feiern?",["place"],["date_time","guests","simple_reason"],15,5,{skipWhenCovered:true}),
    move("birthday-guests","main",3,"a2_geburtstag_03_gaeste.mp3","Wen möchten wir einladen?",["guests"],["place"],15,5,{skipWhenCovered:true}),
    move("birthday-food","main",4,"a2_geburtstag_04_essen_trinken.mp3","Was brauchen wir zum Essen und Trinken?",["food_drinks"],["guests"],15,6,{skipWhenCovered:true}),
    move("birthday-reaction","main",5,"a2_geburtstag_05_reaktion.mp3","Ich finde ein Restaurant besser. Was meinen Sie?",["reaction"],["alternative","simple_reason","place","costs"],15,7,{mandatory:true,replacementMoveId:"birthday-why"}),
    move("birthday-close","main",6,"a2_geburtstag_06_entscheidung.mp3","Gut, worauf einigen wir uns jetzt?",["final_agreement"],[],15,6,{mandatory:true,closing:true}),
  ],[
    move("birthday-time-reaction","branch",1,"a2_geburtstag_b01_termin_reaktion.mp3","Passt der Termin für alle Gäste?",["reaction","simple_reason"],[],15,6),
    move("birthday-why","branch",2,"a2_geburtstag_b02_warum.mp3","Warum finden Sie das Restaurant besser?",["simple_reason"],[],15,6),
  ]),
  pack("a2_planung_picknick", "A2", "A2 Planung – Picknick im Park planen", "Sie möchten mit Freunden ein Picknick machen. Planen Sie Tag, Uhrzeit, Treffpunkt, Essen und Dinge, die Sie mitbringen. Treffen Sie am Ende eine Entscheidung.", ["date_time","meeting_place","food_drinks","items","reaction","weather_alternative","final_agreement"], [
    move("picnic-time","main",1,"a2_picknick_01_termin.mp3","An welchem Tag und um wie viel Uhr machen wir das Picknick?",["date_time"],["meeting_place"],15,7,{mandatory:true,replacementMoveId:"picnic-time-reason"}),
    move("picnic-meet","main",2,"a2_picknick_02_treffpunkt.mp3","Wo treffen wir uns?",["meeting_place"],["transport","date_time"],15,4,{skipWhenCovered:true}),
    move("picnic-food","main",3,"a2_picknick_03_essen.mp3","Was möchten Sie zum Essen und Trinken mitbringen?",["food_drinks"],[],15,7,{skipWhenCovered:true}),
    move("picnic-items","main",4,"a2_picknick_04_sachen.mp3","Was brauchen wir noch für das Picknick?",["items"],["responsibilities"],15,6,{skipWhenCovered:true}),
    move("picnic-reaction","main",5,"a2_picknick_05_sonntag.mp3","Ich möchte das Picknick lieber am Sonntag machen. Ist das für Sie gut?",["reaction"],["alternative","simple_reason","date_time"],15,8,{mandatory:true,replacementMoveId:"picnic-rain"}),
    move("picnic-close","main",6,"a2_picknick_06_abschluss.mp3","Gut, was ist jetzt unser gemeinsamer Plan?",["final_agreement"],[],15,6,{mandatory:true,closing:true}),
  ],[
    move("picnic-time-reason","branch",1,"a2_picknick_b01_uhrzeit_grund.mp3","Warum passt diese Uhrzeit gut?",["simple_reason"],[],15,5),
    move("picnic-rain","branch",2,"a2_picknick_b02_regen.mp3","Es soll regnen. Wo können wir uns stattdessen treffen?",["weather_alternative"],["alternative"],15,8),
  ]),
  pack("a2_planung_umzugshilfe", "A2", "A2 Planung – Hilfe beim Einzug organisieren", "Ein Freund zieht in eine neue Wohnung. Sie möchten helfen. Planen Sie Termin, Treffpunkt, Aufgaben, Transport und eine kleine Pause mit Essen oder Getränken.", ["date_time","meeting_place","tasks","transport_items","break_food","reaction","final_agreement"], [
    move("move-time","main",1,"a2_einzug_01_termin.mp3","Wann können wir unserem Freund beim Einzug helfen?",["date_time"],[],15,6,{mandatory:true,replacementMoveId:"move-duration"}),
    move("move-meet","main",2,"a2_einzug_02_treffpunkt.mp3","Wo treffen wir uns?",["meeting_place"],["transport_items","date_time"],15,4,{skipWhenCovered:true}),
    move("move-tasks","main",3,"a2_einzug_03_aufgaben.mp3","Welche Aufgaben können Sie übernehmen?",["tasks"],["responsibilities"],15,6,{skipWhenCovered:true}),
    move("move-transport","main",4,"a2_einzug_04_transport.mp3","Wie transportieren wir die schweren Sachen?",["transport_items"],["costs"],15,6,{skipWhenCovered:true}),
    move("move-food","main",5,"a2_einzug_05_pause.mp3","Ich schlage vor, dass wir Pizza und Getränke bestellen. Was meinen Sie?",["reaction","break_food"],["costs","alternative"],15,9,{mandatory:true,replacementMoveId:"move-car-problem"}),
    // Covered-aware closed closings (deterministic).
    // Displayed text MUST match the reused MP3 transcript exactly.
    move("move-close","main",6,"a2_einzug_06_abschluss.mp3","Also, wann kommen wir und wer macht was?",["final_agreement"],["date_time","tasks"],15,6,{mandatory:true,closing:true,closingProfile:"combined"}),
    move("move-close-time","main",7,"a2_einzug_01_termin.mp3","Wann können wir unserem Freund beim Einzug helfen?",["final_agreement"],["date_time"],15,6,{mandatory:true,closing:true,closingProfile:"time_only"}),
    move("move-close-tasks","main",8,"a2_einzug_03_aufgaben.mp3","Welche Aufgaben können Sie übernehmen?",["final_agreement"],["tasks"],15,6,{mandatory:true,closing:true,closingProfile:"tasks_only"}),
    move("move-close-summary","main",9,"a2_picknick_06_abschluss.mp3","Gut, was ist jetzt unser gemeinsamer Plan?",["final_agreement"],[],15,6,{mandatory:true,closing:true,closingProfile:"summary"}),
  ],[
    move("move-duration","branch",1,"a2_einzug_b01_dauer.mp3","Wie lange können Sie helfen?",["date_time"],[],15,5),
    move("move-car-problem","branch",2,"a2_einzug_b02_auto_problem.mp3","Wir haben kein großes Auto. Was können wir machen?",["alternative","transport_items"],[],15,7),
  ]),
  pack("b1_planung_schwach", "B1", "B1 Planung – Gemeinsamer Ausflug", "Sie möchten mit einem Freund einen Tagesausflug machen. Planen Sie Termin, Treffpunkt, Verkehrsmittel, Verpflegung und Kosten. Reagieren Sie auf Vorschläge und finden Sie eine Lösung für schlechtes Wetter.", ["date_time","meeting_place","transport","food_drinks","costs","proposal_reason","reaction_alternative","weather_solution","final_agreement"], [
    move("trip-time","main",1,"b1_ausflug_01_termin.mp3","Wann sollen wir den Ausflug machen?",["date_time"],["proposal_reason"],20,5,{mandatory:true,replacementMoveId:"trip-time-reason"}),
    move("trip-meet","main",2,"b1_ausflug_02_treffpunkt.mp3","Wo treffen wir uns, und warum ist dieser Treffpunkt praktisch?",["meeting_place","proposal_reason"],["transport","date_time"],25,8,{skipWhenCovered:true}),
    move("trip-transport","main",3,"b1_ausflug_03_verkehr.mp3","Wie fahren wir dorthin?",["transport"],["costs","date_time"],20,5,{skipWhenCovered:true}),
    move("trip-food","main",4,"b1_ausflug_04_verpflegung.mp3","Was nehmen wir zum Essen und Trinken mit?",["food_drinks"],["costs","responsibilities"],20,6,{skipWhenCovered:true}),
    move("trip-cost","main",5,"b1_ausflug_05_kosten.mp3","Wie viel darf der Ausflug ungefähr kosten?",["costs"],["transport","food_drinks"],20,6,{skipWhenCovered:true}),
    move("trip-reaction","main",6,"b1_ausflug_06_auto_vorschlag.mp3","Ich würde lieber mit dem Auto fahren. Was halten Sie davon?",["reaction_alternative"],["transport","costs","proposal_reason"],25,8,{mandatory:true}),
    move("trip-rain","main",7,"b1_ausflug_07_regenproblem.mp3","Am Ausflugstag soll es stark regnen. Was können wir tun?",["weather_solution"],["reaction_alternative","costs"],25,8,{mandatory:true,replacementMoveId:"trip-compare"}),
    move("trip-close","main",8,"b1_ausflug_08_abschluss.mp3","Fassen Sie bitte kurz zusammen: Was haben wir vereinbart?",["final_agreement"],[],30,8,{mandatory:true,closing:true}),
  ],[
    move("trip-time-reason","branch",1,"b1_ausflug_b01_termin_grund.mp3","Warum passt dieser Termin besonders gut?",["proposal_reason"],[],20,6),
    move("trip-compare","branch",2,"b1_ausflug_b02_loesung_vergleichen.mp3","Welche Lösung wäre günstiger, und warum?",["costs","proposal_reason"],["reaction_alternative"],25,8),
  ]),
  pack("b1_planung_mittel", "B1", "B1 Planung – Kursabschluss organisieren", "Sie möchten mit Ihrem Deutschkurs eine Abschlussfeier organisieren. Planen Sie Termin, Ort, Essen, Programm, Kosten und Aufgaben. Reagieren Sie auf ein organisatorisches Problem und treffen Sie eine gemeinsame Entscheidung.", ["date_time","place","food_drinks","program","costs","responsibilities","reason_alternative","attendance_problem","final_agreement"], [
    move("course-place-time","main",1,"b1_kursfeier_01_ort_termin.mp3","Wo und wann könnten wir die Abschlussfeier machen?",["place","date_time"],["reason_alternative","costs"],25,7,{mandatory:true,replacementMoveId:"course-benefits"}),
    move("course-reason","main",2,"b1_kursfeier_02_ort_grund.mp3","Warum passt dieser Ort für unseren Kurs?",["reason_alternative"],["place","costs"],20,6,{skipWhenCovered:true}),
    move("course-food","main",3,"b1_kursfeier_03_essen.mp3","Was organisieren wir zum Essen und Trinken?",["food_drinks"],["costs","responsibilities"],20,6,{skipWhenCovered:true}),
    move("course-program","main",4,"b1_kursfeier_04_programm.mp3","Welches Programm wäre für die Feier passend?",["program"],["reason_alternative","responsibilities"],20,6,{skipWhenCovered:true}),
    move("course-cost","main",5,"b1_kursfeier_05_kosten.mp3","Wie teilen wir die Kosten?",["costs"],["food_drinks"],20,5,{skipWhenCovered:true}),
    move("course-tasks","main",6,"b1_kursfeier_06_aufgaben.mp3","Wer übernimmt welche Aufgabe?",["responsibilities"],["program","food_drinks"],20,5,{skipWhenCovered:true}),
    move("course-problem","main",7,"b1_kursfeier_07_terminproblem.mp3","Einige Kursteilnehmer können an diesem Termin nicht kommen. Wie lösen wir das?",["attendance_problem","reason_alternative"],["date_time"],30,10,{mandatory:true,replacementMoveId:"course-priority"}),
    move("course-close","main",8,"b1_kursfeier_08_entscheidung.mp3","Treffen wir bitte eine endgültige Entscheidung. Wie sieht unser Plan aus?",["final_agreement"],[],30,9,{mandatory:true,closing:true}),
  ],[
    move("course-benefits","branch",1,"b1_kursfeier_b01_vorteile.mp3","Welche zwei Vorteile hat Ihr Vorschlag?",["reason_alternative"],[],25,7),
    move("course-priority","branch",2,"b1_kursfeier_b02_prioritaet.mp3","Was ist wichtiger: ein passender Termin für alle oder ein günstiger Ort?",["reason_alternative","costs"],["date_time","place"],30,10),
  ]),
  pack("b1_planung_besuch", "B1", "B1 Planung – Besuch aus dem Ausland organisieren", "Eine befreundete Person besucht Sie für ein Wochenende. Planen Sie Ankunft, Unterkunft, Verpflegung, Aktivitäten und Kosten. Reagieren Sie auf eine Verspätung und einigen Sie sich auf einen vollständigen Plan.", ["arrival","accommodation","food_scope","activities","budget","reason_preference","delay_solution","responsibilities","final_agreement"], [
    move("visit-arrival","main",1,"b1_besuch_01_ankunft.mp3","Wann kommt unser Gast an, und wie holen wir die Person ab?",["arrival"],["budget","responsibilities"],25,8,{mandatory:true,replacementMoveId:"visit-info"}),
    move("visit-hotel","main",2,"b1_besuch_02_unterkunft.mp3","Wo soll unser Gast übernachten? Begründen Sie Ihren Vorschlag.",["accommodation","reason_preference"],["food_scope","budget","place"],25,8,{skipWhenCovered:true}),
    move("visit-food","main",3,"b1_besuch_03_verpflegung.mp3","Wie organisieren wir das Essen am Wochenende?",["food_scope"],["budget","responsibilities"],25,6,{skipWhenCovered:true}),
    move("visit-activities","main",4,"b1_besuch_04_aktivitaeten.mp3","Welche zwei Aktivitäten würden Sie vorschlagen?",["activities"],["reason_preference"],25,7,{skipWhenCovered:true}),
    move("visit-budget","main",5,"b1_besuch_05_budget.mp3","Wie viel Geld können wir für das Wochenende einplanen?",["budget"],["accommodation","food_scope"],20,7,{skipWhenCovered:true}),
    move("visit-preference","main",6,"b1_besuch_06_wunsch.mp3","Unser Gast möchte lieber etwas Ruhiges machen. Wie reagieren Sie darauf?",["reason_preference"],["activities"],25,9,{mandatory:true}),
    move("visit-delay","main",7,"b1_besuch_07_verspaetung.mp3","Der Zug hat zwei Stunden Verspätung. Was müssen wir an unserem Plan ändern?",["delay_solution"],["arrival","responsibilities"],30,10,{mandatory:true,replacementMoveId:"visit-reservation"}),
    move("visit-close","main",8,"b1_besuch_08_abschluss.mp3","Fassen Sie bitte unseren endgültigen Wochenendplan zusammen.",["final_agreement"],[],30,7,{mandatory:true,closing:true}),
  ],[
    move("visit-info","branch",1,"b1_besuch_b01_information.mp3","Wer informiert unseren Gast über den genauen Treffpunkt?",["responsibilities"],["arrival"],20,7),
    move("visit-reservation","branch",2,"b1_besuch_b02_reservierung.mp3","Welche Reservierung müssen wir zuerst ändern, und warum?",["delay_solution","reason_preference"],[],30,9),
  ]),
  pack("b2_planung_nachbarschaftsfest", "B2", "B2 Planung – Nachbarschaftsfest unter Auflagen", "Sie organisieren mit einer Nachbarschaftsinitiative ein Fest für etwa 100 Personen. Das Budget ist begrenzt, ab 22 Uhr gilt Nachtruhe, und bei schlechtem Wetter steht nur ein kleiner Innenraum zur Verfügung. Entwickeln Sie einen realistischen Plan, wägen Sie Interessen ab und treffen Sie eine begründete Vereinbarung.", ["priorities","budget_allocation","stakeholder_balance","noise_constraint","weather_capacity","tradeoff","responsibilities","final_agreement"], [
    move("neighbour-priority","main",1,"b2_nachbarschaft_01_prioritaeten.mp3","Welche Ziele sollte das Nachbarschaftsfest haben, und was hat für Sie höchste Priorität?",["priorities"],["stakeholder_balance"],45,11,{mandatory:true}),
    move("neighbour-budget","main",2,"b2_nachbarschaft_02_budget.mp3","Wir haben nur dreitausend Euro. Wie würden Sie das Budget verteilen, und wo könnten wir sparen?",["budget_allocation","tradeoff"],[],50,12,{mandatory:true,replacementMoveId:"neighbour-sponsor"}),
    move("neighbour-interests","main",3,"b2_nachbarschaft_03_interessen.mp3","Einige Familien wünschen ein Kinderprogramm, andere Bewohner möchten vor allem Musik. Wie bringen wir diese Interessen zusammen?",["stakeholder_balance"],["budget_allocation","tradeoff"],50,14,{mandatory:true}),
    move("neighbour-noise","main",4,"b2_nachbarschaft_04_nachtruhe.mp3","Wegen der Nachtruhe muss die Musik um zweiundzwanzig Uhr enden. Welche Lösung schlagen Sie vor?",["noise_constraint"],["responsibilities"],45,12,{mandatory:true}),
    move("neighbour-weather","main",5,"b2_nachbarschaft_05_regen.mp3","Bei starkem Regen passen nicht alle Gäste in den Innenraum. Welche Alternativen sind realistisch, und welche würden Sie bevorzugen?",["weather_capacity","tradeoff"],[],60,15,{mandatory:true,replacementMoveId:"neighbour-cancel"}),
    move("neighbour-close","main",6,"b2_nachbarschaft_06_vereinbarung.mp3","Formulieren Sie bitte unsere endgültige Vereinbarung: Was machen wir, wer ist verantwortlich, und welche Risiken müssen wir noch absichern?",["final_agreement","responsibilities"],[],60,15,{mandatory:true,closing:true}),
  ],[
    move("neighbour-sponsor","branch",1,"b2_nachbarschaft_b01_sponsor.mp3","Ein Sponsor bietet Geld an, möchte aber deutlich sichtbar werben. Unter welchen Bedingungen würden Sie zustimmen?",["tradeoff","stakeholder_balance"],[],50,14),
    move("neighbour-cancel","branch",2,"b2_nachbarschaft_b02_absagekriterien.mp3","Welche Entscheidungskriterien sollten wir für eine kurzfristige Absage festlegen?",["weather_capacity","priorities"],[],45,11),
  ]),
  pack("b2_planung_weiterbildung", "B2", "B2 Planung – Weiterbildung für ein Team organisieren", "Sie planen eine Weiterbildung für ein zwölfköpfiges Team. Das Budget reicht entweder für einen zweitägigen Präsenzkurs oder für ein längeres Onlineprogramm. Einige Mitarbeitende arbeiten in Teilzeit, der laufende Betrieb muss gesichert bleiben, und die Teamleitung erwartet einen messbaren Nutzen. Verhandeln Sie eine tragfähige Lösung.", ["learning_goal","format_tradeoff","participation_equity","operations_constraint","budget_value","alternative_solution","implementation","final_agreement"], [
    move("training-goal","main",1,"b2_weiterbildung_01_lernziel.mp3","Welches konkrete Ziel soll die Weiterbildung erreichen, und woran erkennen wir später ihren Erfolg?",["learning_goal"],["implementation"],45,12,{mandatory:true}),
    move("training-format","main",2,"b2_weiterbildung_02_format.mp3","Wir können entweder einen zweitägigen Präsenzkurs oder ein sechswöchiges Onlineprogramm finanzieren. Welche Lösung bevorzugen Sie, und welche Nachteile nehmen Sie dabei in Kauf?",["format_tradeoff","budget_value"],[],60,17,{mandatory:true,replacementMoveId:"training-scope"}),
    move("training-equity","main",3,"b2_weiterbildung_03_teilzeit.mp3","Mehrere Teilzeitkräfte können an ganzen Präsenztagen nicht teilnehmen. Wie stellen wir eine faire Teilnahme sicher?",["participation_equity","alternative_solution"],[],50,13,{mandatory:true}),
    move("training-operations","main",4,"b2_weiterbildung_04_betrieb.mp3","Wenn zu viele Personen gleichzeitig fehlen, kann der Betrieb nicht normal weiterlaufen. Wie organisieren wir die Teilnahme?",["operations_constraint"],["implementation"],50,13,{mandatory:true,replacementMoveId:"training-resistance"}),
    move("training-value","main",5,"b2_weiterbildung_05_kostenkritik.mp3","Die Teamleitung hält Ihre Lösung für zu teuer. Wie würden Sie den Nutzen begründen oder den Plan anpassen?",["budget_value","alternative_solution"],["learning_goal"],60,14,{mandatory:true}),
    move("training-close","main",6,"b2_weiterbildung_06_vereinbarung.mp3","Treffen Sie bitte eine endgültige Vereinbarung: Welches Format wählen wir, wie setzen wir es um, und wie überprüfen wir den Erfolg?",["final_agreement","implementation"],[],60,15,{mandatory:true,closing:true}),
  ],[
    move("training-scope","branch",1,"b2_weiterbildung_b01_umfang.mp3","Welche Bestandteile der Weiterbildung sind unverzichtbar, und worauf könnten wir verzichten?",["budget_value","format_tradeoff"],[],50,13),
    move("training-resistance","branch",2,"b2_weiterbildung_b02_widerstand.mp3","Eine erfahrene Mitarbeiterin bezweifelt den Nutzen des Programms. Wie würden Sie sie einbeziehen?",["implementation","alternative_solution"],[],50,13),
  ]),
]);

export function getPlacementPlanningPack(id) { return placementPlanningPacks.find((p) => p.scenarioId === id) || null; }
export function getPlacementPlanningPacksByLevel(level) { return placementPlanningPacks.filter((p) => p.level === level); }
export function getPlacementPlanningMove(packOrId, moveId) { const p=typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId; return p?.moves.find((m)=>m.id===moveId) || null; }
export function getPlacementPlanningReportTopic(packOrId, id) { const p=typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId; return p?.evidenceUnits.find((e)=>e.id===id) || null; }

export function selectPlacementPlanningPack(step, { recentIds = [] } = {}) {
  const candidates = getPlacementPlanningPacksByLevel(step?.level);
  if (!candidates.length) return null;
  const recent = new Set(recentIds);
  return candidates.find((p)=>!recent.has(p.scenarioId)) || candidates[0];
}

const normalized = (v) => String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/\s+/g," ").trim();
const matches = (text, patterns=[]) => patterns.some((p)=>new RegExp(p,"i").test(text));
export function buildPlanningEvidenceLedger(packOrId, conversation = []) {
  const pack=typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId;
  if(!pack) return {};
  const fullText=normalized(conversation.map((t)=>t?.transcript||"").join(" "));
  const tested=new Set();
  for(const turn of conversation){ const m=getPlacementPlanningMove(pack,turn?.moveId); for(const id of m?.targets||[]) tested.add(id); }
  return Object.fromEntries(pack.evidenceUnits.map((unit)=>{
    const sufficient=matches(fullText,unit.patterns);
    const partial=!sufficient && matches(fullText,unit.partialPatterns);
    const assessed=unit.requiredByTask || tested.has(unit.id) || sufficient || partial;
    return [unit.id,{ id:unit.id,label:unit.label,requiredByTask:unit.requiredByTask,tested:tested.has(unit.id),internalState:sufficient?"covered":partial?"partial":"not_covered",finalState:sufficient?"covered":assessed?"tested_but_weak_or_incomplete":"not_assessed" }];
  }));
}

export function selectCoveredAwareClosingMove(packOrId, conversation = []) {
  const pack = typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId;
  if (!pack) return null;
  const asked = new Set(conversation.map((t) => t?.moveId).filter(Boolean));
  const ledger = buildPlanningEvidenceLedger(pack, conversation);
  const closings = pack.mainMoves.filter((m) => m.closing && !asked.has(m.id));
  if (!closings.length) return null;
  if (closings.length === 1 && !closings[0].closingProfile) return closings[0];

  const dateCovered = ledger.date_time?.finalState === "covered";
  const tasksCovered = ledger.tasks?.finalState === "covered";
  const profile =
    dateCovered && tasksCovered
      ? "summary"
      : dateCovered && !tasksCovered
        ? "tasks_only"
        : !dateCovered && tasksCovered
          ? "time_only"
          : "combined";

  return (
    closings.find((m) => m.closingProfile === profile) ||
    closings.find((m) => m.closingProfile === "combined") ||
    closings[0]
  );
}

export function selectNextPlanningMove(packOrId, conversation = [], proposed = null) {
  const pack=typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId;
  if(!pack) return null;
  const asked=new Set(conversation.map((t)=>t?.moveId).filter(Boolean));
  const ledger=buildPlanningEvidenceLedger(pack,conversation);
  const eligible=(m)=>{
    if(asked.has(m.id)) return false;
    if(m.closing) return false;
    const covered=m.targets.length>0 && m.targets.every((id)=>ledger[id]?.finalState==="covered");
    if(m.skipWhenCovered && covered) return false;
    if(m.replacementMoveId && covered && asked.has(m.replacementMoveId)) return false;
    return true;
  };
  const nonClosingRemaining=pack.mainMoves.filter((m)=>!m.closing && eligible(m));
  let allowed=[...nonClosingRemaining];
  if(!allowed.length) {
    const closing = selectCoveredAwareClosingMove(pack, conversation);
    if (closing) allowed = [closing];
  }
  const proposedMove=typeof proposed === "string" ? getPlacementPlanningMove(pack,proposed) : null;
  if(proposedMove && allowed.some((m)=>m.id===proposedMove.id)) return proposedMove;
  const next=allowed[0] || null;
  if(next?.replacementMoveId && next.targets.every((id)=>ledger[id]?.finalState==="covered")) {
    const replacement=getPlacementPlanningMove(pack,next.replacementMoveId);
    if(replacement && !asked.has(replacement.id)) return replacement;
  }
  return next;
}

export function planningTopicsFromLedger(packOrId, ledger={}) {
  const pack=typeof packOrId === "string" ? getPlacementPlanningPack(packOrId) : packOrId;
  const valid=new Set(pack?.evidenceUnits.map((u)=>u.id)||[]);
  const covered=[], missing=[];
  for(const [id,state] of Object.entries(ledger)){ if(!valid.has(id)) continue; if(state.finalState==="covered") covered.push(id); else if(state.finalState==="tested_but_weak_or_incomplete") missing.push(id); }
  return {coveredTopics:covered,missingTopics:missing.filter((id)=>!covered.includes(id))};
}
export function isPlanningRecordingAllowed({ phase, examinerAudioActive }) {
  return phase === "responding" && !examinerAudioActive;
}
