import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPlanningEvidenceLedger,
  getPlacementPlanningPack,
  getPlacementPlanningPacksByLevel,
  isPlanningRecordingAllowed,
  placementPlanningPacks,
  planningTopicsFromLedger,
  selectNextPlanningMove,
  selectPlacementPlanningPack,
} from "../src/data/placementPlanningPacks.js";
import { getPlanningStep } from "../src/data/placementLogic.js";
import { evaluatePlacementTurnOffline } from "../server/src/services/placementEvaluateService.js";
import { buildEvidenceSummary } from "../src/data/utils/placementReport.js";

describe("closed Placement Planning packs", () => {
  it("contains exactly 3 A2, 3 B1 and 2 B2 packs", () => {
    expect(placementPlanningPacks).toHaveLength(8);
    expect(getPlacementPlanningPacksByLevel("A2")).toHaveLength(3);
    expect(getPlacementPlanningPacksByLevel("B1")).toHaveLength(3);
    expect(getPlacementPlanningPacksByLevel("B2")).toHaveLength(2);
  });

  it("maps every frozen manifest item to an existing MP3 (closing variants may reuse audio)", () => {
    const manifest = JSON.parse(fs.readFileSync(
      path.resolve("review-only/planning-audio-generation-manifest.json"), "utf8"
    ));
    const moves = placementPlanningPacks.flatMap((pack) => pack.moves);
    expect(moves.length).toBeGreaterThanOrEqual(70);
    const uniqueFilenames = new Set(moves.map((move) => move.filename));
    expect(uniqueFilenames.size).toBe(70);
    expect(uniqueFilenames).toEqual(
      new Set(manifest.items.map((item) => item.filename))
    );
    for (const move of moves) {
      expect(fs.existsSync(path.resolve("public/audio/placement/planning", move.filename))).toBe(true);
    }
  });

  it("keeps selection level-isolated and rotates only new selections", () => {
    const first = selectPlacementPlanningPack({ level: "A2" });
    const second = selectPlacementPlanningPack({ level: "A2" }, { recentIds: [first.scenarioId] });
    expect(first.level).toBe("A2");
    expect(second.level).toBe("A2");
    expect(second.scenarioId).not.toBe(first.scenarioId);
    expect(getPlacementPlanningPack(first.scenarioId)).toBe(first);
  });

  it("routes uniformly strong pre-Planning evidence to B2", () => {
    expect(getPlanningStep({
      selfIntroResult: "strong", imageResult: "strong", lesenHoerenResult: "strong",
    })).toMatchObject({ level: "B2", difficulty: "mittel" });
  });

  it("records multiple dimensions from one rich answer", () => {
    const ledger = buildPlanningEvidenceLedger("b1_planung_schwach", [{
      moveId: "trip-time",
      transcript: "Am Samstag treffen wir uns um neun Uhr am Bahnhof, fahren mit dem Zug und nehmen belegte Brote mit, weil das billiger ist und etwa dreißig Euro kostet.",
    }]);
    for (const id of ["date_time", "meeting_place", "transport", "food_drinks", "costs", "proposal_reason"]) {
      expect(ledger[id].finalState).toBe("covered");
    }
  });

  it("does not let off-topic speech satisfy the current target", () => {
    const ledger = buildPlanningEvidenceLedger("b1_planung_schwach", [{
      moveId: "trip-cost",
      transcript: "Wir nehmen belegte Brote und Wasser mit.",
    }]);
    expect(ledger.costs.finalState).toBe("tested_but_weak_or_incomplete");
    expect(ledger.food_drinks.finalState).toBe("covered");
  });

  it("keeps hotel breakfast partial for broader weekend food planning", () => {
    const ledger = buildPlanningEvidenceLedger("b1_planung_besuch", [{
      moveId: "visit-hotel",
      transcript: "Wir buchen ein Hotel mit Frühstück.",
    }]);
    expect(ledger.accommodation.finalState).toBe("covered");
    expect(ledger.food_scope.internalState).toBe("partial");
    expect(ledger.food_scope.finalState).toBe("tested_but_weak_or_incomplete");
  });

  it("keeps unrequired and untested evidence out of weaknesses", () => {
    const ledger = buildPlanningEvidenceLedger("a2_planung_mittel", [{
      moveId: "birthday-time", transcript: "Am Samstag um 18 Uhr.",
    }]);
    expect(ledger.alternative.finalState).toBe("not_assessed");
    expect(planningTopicsFromLedger("a2_planung_mittel", ledger).missingTopics)
      .not.toContain("alternative");
  });

  it("suppresses covered moves and deterministically rejects provider injection", () => {
    const conversation = [{
      moveId: "trip-time",
      question: "Wann sollen wir den Ausflug machen?",
      transcript: "Am Samstag treffen wir uns am Bahnhof, weil dieser Treffpunkt praktisch ist, und fahren mit dem Zug.",
    }];
    expect(selectNextPlanningMove("b1_planung_schwach", conversation).id).not.toBe("trip-meet");
    const result = evaluatePlacementTurnOffline({
      modelId: "b1_planung_schwach",
      raw: { band: "medium", needsFollowUp: true, nextMoveId: "invented", coveredTopics: ["invented"] },
      conversation,
    });
    expect(result.followUpQuestionId).not.toBe("invented");
    expect(getPlacementPlanningPack(result.modelId).moves.some(
      (move) => move.id === result.followUpQuestionId && move.text === result.followUpQuestion
    )).toBe(true);
    expect(result.coveredTopics).not.toContain("invented");
  });

  it("always selects the approved closing move after prior purposes finish", () => {
    const pack = getPlacementPlanningPack("a2_planung_mittel");
    const conversation = pack.mainMoves.slice(0, -1).map((move) => ({
      moveId: move.id, transcript: "Antwort ohne zusätzliche Information.",
    }));
    expect(selectNextPlanningMove(pack, conversation).id).toBe(pack.finalMoveId);
  });

  it("never repeats a successfully evaluated weak move and still reaches the Picknick closing", () => {
    const weakItemsConversation = [
      { moveId: "picnic-time", transcript: "Samstag um zehn Uhr." },
      { moveId: "picnic-meet", transcript: "Vor dem Park." },
      { moveId: "picnic-food", transcript: "Brot und Wasser." },
      { moveId: "picnic-items", transcript: "Nichts." },
    ];
    const afterWeakItems = selectNextPlanningMove("a2_planung_picknick", weakItemsConversation);
    expect(afterWeakItems.id).toBe("picnic-reaction");
    expect(afterWeakItems.id).not.toBe("picnic-items");

    const beforeClosing = [
      ...weakItemsConversation,
      { moveId: "picnic-reaction", transcript: "Nein." },
    ];
    expect(selectNextPlanningMove("a2_planung_picknick", beforeClosing).id)
      .toBe("picnic-close");
  });

  it("uses level-appropriate timing and never permits recording over examiner audio", () => {
    for (const pack of getPlacementPlanningPacksByLevel("A2")) {
      expect(pack.mainMoves.every((move) => move.responseSeconds === 15)).toBe(true);
    }
    for (const pack of getPlacementPlanningPacksByLevel("B1")) {
      expect(pack.mainMoves.every((move) => move.responseSeconds >= 15 && move.responseSeconds <= 30)).toBe(true);
    }
    for (const pack of getPlacementPlanningPacksByLevel("B2")) {
      expect(pack.mainMoves.every((move) => move.responseSeconds >= 30 && move.responseSeconds <= 60)).toBe(true);
    }
    expect(isPlanningRecordingAllowed({ phase: "examiner", examinerAudioActive: true })).toBe(false);
    expect(isPlanningRecordingAllowed({ phase: "responding", examinerAudioActive: true })).toBe(false);
    expect(isPlanningRecordingAllowed({ phase: "responding", examinerAudioActive: false })).toBe(true);
  });

  it("recognizes 'bei mir zu Hause' as satisfying place (Phase 1 paraphrase broadening)", () => {
    const ledger = buildPlanningEvidenceLedger("a2_planung_mittel", [{
      moveId: "birthday-place", transcript: "Wir feiern bei mir zu Hause.",
    }]);
    expect(ledger.place.finalState).toBe("covered");
  });

  it.each([
    ["Wir treffen uns bei uns zu Hause.", "meeting_place"],
    ["Kommt einfach in unserer Wohnung vorbei.", "meeting_place"],
    ["Ich bin dann einfach daheim.", "meeting_place"],
  ])("recognizes the natural meeting_place paraphrase: %s", (transcript, evidenceId) => {
    const ledger = buildPlanningEvidenceLedger("a2_planung_picknick", [{ transcript }]);
    expect(ledger[evidenceId].finalState).toBe("covered");
  });

  it.each([
    ["Wir könnten auch bei mir feiern.", "place"],
    ["Am liebsten zuhause, das ist am einfachsten.", "place"],
  ])("recognizes the natural place paraphrase: %s", (transcript, evidenceId) => {
    const ledger = buildPlanningEvidenceLedger("a2_planung_mittel", [{ transcript }]);
    expect(ledger[evidenceId].finalState).toBe("covered");
  });

  it("bounded semantic fallback lets an unanticipated informational answer skip the corresponding move", () => {
    const conversation = [
      { moveId: "birthday-time", transcript: "Am Samstag um 18 Uhr." },
      { moveId: "birthday-place", transcript: "Wir feiern bei mir zu Hause." },
    ];
    // Regex alone does not recognize "ein paar Leute, die wir gut kennen" as guests.
    const baseline = buildPlanningEvidenceLedger("a2_planung_mittel", conversation);
    expect(baseline.guests.finalState).not.toBe("covered");
    expect(selectNextPlanningMove("a2_planung_mittel", conversation).id).toBe("birthday-guests");

    // The provider validly recognized "guests" as covered from this same
    // unanticipated phrasing; the deterministic skip logic must honor it —
    // this never invents or reorders moves, it only marks an information
    // target already covered.
    const next = selectNextPlanningMove("a2_planung_mittel", conversation, null, ["guests"]);
    expect(next.id).not.toBe("birthday-guests");
  });

  it("persists a semantically confirmed informational topic carried on a prior turn's own field", () => {
    const conversation = [
      { moveId: "birthday-time", transcript: "Am Samstag um 18 Uhr." },
      {
        moveId: "birthday-place",
        transcript: "Wir feiern bei mir zu Hause.",
        semanticEvidenceConfirmed: ["guests"],
      },
    ];
    expect(selectNextPlanningMove("a2_planung_mittel", conversation).id).not.toBe("birthday-guests");
  });

  it("keeps the mandatory reaction move eligible even if its evidence id is (invalidly) marked semantically confirmed", () => {
    const conversation = [
      { moveId: "birthday-time", transcript: "Am Samstag um 18 Uhr." },
      { moveId: "birthday-place", transcript: "Bei mir zu Hause." },
      { moveId: "birthday-guests", transcript: "Meine Familie." },
      { moveId: "birthday-food", transcript: "Kuchen und Saft." },
    ];
    // "reaction" is a mandatory move's own evidence id, not a regular
    // information topic — marking it "confirmed" must never fabricate the
    // scripted reaction beat's completion since it is not skipWhenCovered.
    const next = selectNextPlanningMove("a2_planung_mittel", conversation, null, ["reaction"]);
    expect(next.id).toBe("birthday-reaction");
  });

  it("never lets a provider-proposed move skip past an earlier outstanding mandatory move", () => {
    const conversation = [
      { moveId: "visit-arrival", transcript: "Der Zug kommt Freitagabend an, ich hole unseren Gast ab." },
    ];
    // visit-preference (mandatory, order 6) has not been asked yet; a
    // provider attempt to jump straight to visit-delay (also mandatory,
    // order 7) would skip it and must be rejected.
    const guarded = selectNextPlanningMove("b1_planung_besuch", conversation, "visit-delay");
    expect(guarded.id).not.toBe("visit-delay");
    expect(guarded.id).toBe("visit-hotel");
  });

  it("still permits skipping ahead among plain information moves that sit before the next mandatory move", () => {
    const conversation = [
      { moveId: "visit-arrival", transcript: "Der Zug kommt Freitagabend an, ich hole unseren Gast ab." },
    ];
    // visit-budget (order 5) is a plain information move that sits before
    // the next outstanding mandatory move (visit-preference, order 6) —
    // provider choice may still legitimately skip ahead to it.
    const guided = selectNextPlanningMove("b1_planung_besuch", conversation, "visit-budget");
    expect(guided.id).toBe("visit-budget");
  });

  it("resolves report labels only from the selected pack without contradictions", () => {
    const summary = buildEvidenceSummary({
      planung: [{
        modelId: "b1_planung_besuch",
        planningPackId: "b1_planung_besuch",
        coveredTopics: ["accommodation", "unknown"],
        missingTopics: ["accommodation", "food_scope", "unknown"],
        transcript: "Wir buchen ein Hotel.",
      }],
    }, { planung: "medium" });
    expect(summary.planung.coveredTopics).toEqual(["Unterkunft"]);
    expect(summary.planung.missingTopics).toEqual(["Verpflegung"]);
    expect(summary.planung.missingTopicIds).not.toContain("accommodation");
  });
});
