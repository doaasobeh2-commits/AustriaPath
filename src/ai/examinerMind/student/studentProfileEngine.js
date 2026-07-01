/**
 * AustriaPath Student Profile Engine
 * Version: 1.0
 *
 * Stores and updates the student's learning profile.
 */

const STORAGE_KEY = "austriaPathStudentProfile";

export class StudentProfileEngine {
  constructor() {
    this.name = "AustriaPath Student Profile Engine";
    this.version = "1.0";
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
      repeatedMistakes: [],
      examHistory: [],
      updatedAt: new Date().toISOString(),
    };
  }

  addExamResult(result) {
    const profile = this.getProfile();

    const updatedProfile = {
      ...profile,
      level: result.level || profile.level,
      weaknesses: result.weaknesses || profile.weaknesses,
      strengths: result.strengths || profile.strengths,
      repeatedMistakes: result.repeatedMistakes || profile.repeatedMistakes,
      examHistory: [
        {
          date: new Date().toISOString(),
          result,
        },
        ...profile.examHistory,
      ],
      updatedAt: new Date().toISOString(),
    };

    return this.saveProfile(updatedProfile);
  }
}