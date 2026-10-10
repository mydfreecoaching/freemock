/**
 * Generic one-liner feedback ("good", "useful", "nice", "ok", "அருமை", "very good test sir" …) goes straight to Keep.
 * A comment is generic when, after removing generic praise and filler words, nothing meaningful is left.
 */
const GENERIC = [
  'good', 'gud', 'nice', 'ok', 'okay', 'k', 'useful', 'usefull', 'use', 'helpful', 'super', 'superb', 'excellent', 'excelent', 'fine', 'great', 'awesome',
  'best', 'better', 'well', 'perfect', 'fantastic', 'wonderful', 'amazing', 'cool', 'thanks', 'thank', 'thankyou', 'tq', 'thx', 'semma', 'mass',
  'அருமை', 'அருமையான', 'நன்று', 'நன்றாக', 'நல்லது', 'நல்ல', 'சூப்பர்', 'பயனுள்ளது', 'பயனுள்ள', 'பயனாக', 'நன்றி', 'சிறப்பு', 'சிறப்பான', 'சிறந்த', 'ஓகே', 'செம்ம', 'அற்புதம்',
];
const FILLER = [
  'very', 'so', 'too', 'much', 'more', 'really', 'test', 'tests', 'exam', 'exams', 'mock', 'the', 'is', 'it', 'was', 'a', 'an', 'and', 'this', 'that',
  'sir', 'mam', 'madam', 'maam', 'you', 'all', 'for', 'of', 'to', 'me', 'my', 'nice', 'question', 'questions', 'paper', 'online', 'overall', 'experience', 'it\'s', 'its',
  'மிகவும்', 'மிக', 'ரொம்ப', 'தேர்வு', 'தேர்வாக', 'தேர்வுகள்', 'வினாக்கள்', 'கேள்விகள்', 'இருந்தது', 'உள்ளது', 'இருக்கிறது', 'சார்', 'ஐயா', 'மேடம்', 'இந்த', 'மாதிரி', 'மற்றும்',
];
const DROP = new Set([...GENERIC, ...FILLER]);
export function isGenericFeedback(text) {
  const words = String(text || '').toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ') // emoji
    .replace(/[^\p{L}\p{M}\p{N}'\s]/gu, ' ')
    .split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  if (!words.some((w) => GENERIC.includes(w))) return words.length <= 1; // a single unknown word is not useful either
  return words.every((w) => DROP.has(w));
}
