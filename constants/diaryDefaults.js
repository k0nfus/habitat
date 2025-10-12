export const defaultDiarySettings = {
  daily: {
    fields: [
      { id: 'gratitude', label: 'Wofür bin ich heute dankbar?', enabled: true },
      { id: 'highlight', label: 'Was war mein Tageshighlight?', enabled: true },
      { id: 'lesson', label: 'Welche Erkenntnis nehme ich mit?', enabled: true },
      { id: 'support', label: 'Wem habe ich geholfen oder danken können?', enabled: true },
      { id: 'challenge', label: 'Welche Herausforderung habe ich gemeistert?', enabled: true },
      { id: 'selfcare', label: 'Wie habe ich für mich gesorgt?', enabled: true },
      { id: 'focus', label: 'Worauf richte ich morgen meinen Fokus?', enabled: true },
    ],
  },
  weekly: {
    enabled: true,
    autoCreate: true,
    ratingFields: [
      { id: 'energy', label: 'Energielevel', enabled: true },
      { id: 'stress', label: 'Stressmanagement', enabled: true },
      { id: 'relationships', label: 'Beziehungen & Umfeld', enabled: true },
      { id: 'progress', label: 'Fortschritt bei meinen Zielen', enabled: true },
      { id: 'wellbeing', label: 'Wohlbefinden', enabled: true },
    ],
    textFields: [
      { id: 'success', label: 'Was lief diese Woche besonders gut?', enabled: true },
      { id: 'improvement', label: 'Was möchte ich nächste Woche verbessern?', enabled: true },
      { id: 'insight', label: 'Welche Erkenntnis nehme ich mit?', enabled: true },
    ],
  },
  monthly: {
    enabled: true,
    autoCreate: true,
    ratingFields: Array.from({ length: 20 }).map((_, index) => ({
      id: `monthly_rating_${index + 1}`,
      label: `Thema ${index + 1}`,
      enabled: index < 10,
    })),
    textFields: [
      { id: 'achievements', label: 'Welche Ziele habe ich erreicht?', enabled: true },
      { id: 'learnings', label: 'Was habe ich gelernt?', enabled: true },
      { id: 'gratitudeMonthly', label: 'Wofür bin ich in diesem Monat dankbar?', enabled: true },
      { id: 'focusNext', label: 'Was ist mein Fokus für den nächsten Monat?', enabled: true },
      { id: 'celebration', label: 'Was möchte ich feiern?', enabled: true },
    ],
  },
};

export const DATA_VERSION = '2';
