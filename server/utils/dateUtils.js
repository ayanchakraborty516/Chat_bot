/**
 * Server Date Utilities
 * 
 * Dynamically determines current date and temporal context from the system clock.
 * Never hardcodes dates.
 * Pure JavaScript - No TypeScript.
 */

/**
 * Returns comprehensive, dynamic date information based on system time
 * @param {Date} [referenceDate] Optional date override for testing
 * @returns {object}
 */
export function getCurrentDateInfo(referenceDate = new Date()) {
  try {
    const d = referenceDate instanceof Date && !isNaN(referenceDate) ? referenceDate : new Date();

    const year = d.getFullYear();
    const monthIndex = d.getMonth(); // 0-11
    const day = d.getDate();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    const month = monthNames[monthIndex];
    const monthNumber = monthIndex + 1;
    const dayOfWeek = dayNames[d.getDay()];

    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${year}-${pad(monthNumber)}-${pad(day)}`;
    const formattedDate = `${month} ${day}, ${year}`;
    const humanReadable = `${dayOfWeek}, ${month} ${day}, ${year}`;

    return {
      date: dateFormatted,
      year,
      month,
      monthNumber,
      day,
      dayOfWeek,
      timestamp: d.getTime(),
      iso: d.toISOString(),
      formattedDate,
      humanReadable,
    };
  } catch (error) {
    console.error('[dateUtils] Error determining current date:', error);
    // Graceful fallback
    const fallback = new Date();
    return {
      date: fallback.toISOString().slice(0, 10),
      year: fallback.getFullYear(),
      month: 'Current Month',
      monthNumber: fallback.getMonth() + 1,
      day: fallback.getDate(),
      dayOfWeek: 'Today',
      timestamp: fallback.getTime(),
      iso: fallback.toISOString(),
      formattedDate: fallback.toDateString(),
      humanReadable: fallback.toDateString(),
    };
  }
}

/**
 * Keyword detector for time-sensitive queries
 * @param {string} text
 * @returns {boolean}
 */
export function isTimeSensitiveQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const pattern = /\b(today|currently|current|now|latest|recent|this year|this month|age|how old|current president|current ceo|latest score|latest news|recent update|when will|birthday|born)\b/i;
  return pattern.test(text);
}

/**
 * Builds the centralized system instruction grounded with the dynamic reference date
 * @param {string} [baseInstruction] Base persona
 * @param {Date} [referenceDate]
 * @returns {string}
 */
export function buildDateSystemInstruction(baseInstruction = '', referenceDate) {
  const info = getCurrentDateInfo(referenceDate);

  const base = baseInstruction && baseInstruction.trim().length > 0
    ? baseInstruction.trim()
    : 'You are Ayan AI, a production-grade, highly capable, helpful, and empathetic AI assistant. You provide clear, concise, well-structured, and accurate responses. You format code blocks with proper syntax highlighting, cite steps methodically, and tailor your tone to the user.';

  return `${base}

CRITICAL TEMPORAL CONTEXT & DYNAMIC DATE REFERENCE:
The current reference date is: ${info.humanReadable} (Year: ${info.year}, Month: ${info.month}, Day: ${info.day}).

TEMPORAL REASONING & AGE CALCULATION RULES:
1. Reference Date: Always evaluate time-sensitive questions (such as current age, current year, elapsed time, tenure, or recent events) using this current reference date (${info.humanReadable}). Never assume that information from your training data reflects the current date or current year.
2. Age Calculation: When calculating a person's age:
   - Use their verified date of birth (DOB) if known.
   - If you do NOT know their verified date of birth, state: "I don't have a reliable date of birth for that person, so I can't calculate their exact current age." Never invent or hallucinate birth dates.
   - Compare the verified DOB against the current reference date (${info.humanReadable}):
     * Initial difference: (current_year - birth_year).
     * If their birthday in the current year (${info.year}) has NOT occurred yet relative to the reference date (${info.humanReadable}), subtract 1 from the initial difference.
     * Calculate completed years accurately. Do NOT simply repeat an outdated age from memory.
   - If a person is born today, their age is 0 years old (newborn).
   - If a birth date is in the future relative to the reference date, clearly indicate that the date has not arrived yet.
3. Information Currency & Transparency:
   - For facts that can be mathematically computed from verified historical data (such as age, anniversary, elapsed time, or calendar year), calculate them accurately using the current reference date.
   - For real-time information that requires live external feeds (such as breaking news, live match scores, today's stock prices), clearly distinguish between calculated facts, known historical information, and potentially outdated information. Never pretend to have a live web search tool unless one is explicitly provided.
4. Current State & Leadership Guidelines:
   - For queries containing terms like "current president", "current CEO", "latest score", "latest news", "recent update":
     * Clarify the time horizon of your verified knowledge.
     * If discussing a leadership position or office, state the verified incumbent as of your records, and acknowledge that leadership can change.
     * Never pretend that static training knowledge is a live external internet feed.`;
}

export default {
  getCurrentDateInfo,
  isTimeSensitiveQuery,
  buildDateSystemInstruction,
};
