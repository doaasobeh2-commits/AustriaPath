/**
 * AustriaPath Student Profile Engine
 * Version: 1.1
 *
 * Stores and updates the student's learning profile.
 */

const STORAGE_KEY = "austriaPathStudentProfile";

export class StudentProfileEngine {
  constructor() {
    this.name = "AustriaPath Student Profile Engine";
    this.version = "1.1";
  }

  getProfile() {
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    if (!savedProfile) {
      return this.createEmptyProfile();
    }

    try {
      return JSON.parse(savedProfile);
    } catch {
      return this.createEmptyProfile();
    }
  }

  saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }

  createEmptyProfile() {
    return {
      level: null,
      skills: {
        writing: null,
        reading: null,
        listening: null,
        speaking: null,
      },
      strengths: [],
      weaknesses: [],
      focusAreas: [],
      repeatedMistakes: [],
      examHistory: [],
      updatedAt: new Date().toISOString(),
    };
  }

  addExamResult(result = {}) {
    const profile = this.getProfile();

    const strengths = this.mergeUnique(
      profile.strengths,
      result.strengths || []
    );

    const weaknesses = this.mergeUnique(
      profile.weaknesses,
      result.weaknesses || []
    );

    const focusAreas = this.mergeUnique(
      profile.focusAreas,
      result.focusAreas || []
    );

    const repeatedMistakes = this.detectRepeatedMistakes(
      profile.examHistory,
      weaknesses
    );

    const updatedProfile = {
      ...profile,
      level: result.level || profile.level,
      strengths,
      weaknesses,
      focusAreas,
      repeatedMistakes,
      examHistory: [
        {
          date: new Date().toISOString(),
          level: result.level || profile.level,
          score: result.score || null,
          confidence: result.confidence || null,
          service: result.service || null,
          examType: result.examType || null,
          examLevel: result.examLevel || null,
          strengths: result.strengths || [],
          weaknesses: result.weaknesses || [],
          focusAreas: result.focusAreas || [],
          repeatedMistakes,
        },
        ...profile.examHistory,
      ].slice(0, 20),
      updatedAt: new Date().toISOString(),
    };

    return this.saveProfile(updatedProfile);
  }

  mergeUnique(oldItems = [], newItems = []) {
    return [...new Set([...(oldItems || []), ...(newItems || [])])];
  }

  detectRepeatedMistakes(examHistory = [], currentWeaknesses = []) {
    const previousWeaknesses = examHistory.flatMap(
      (exam) => exam.weaknesses || []
    );

    return currentWeaknesses.filter((item) =>
      previousWeaknesses.includes(item)
    );
  }
}