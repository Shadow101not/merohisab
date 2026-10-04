export const EXPENSE_GROUPS = [
  { id: 'daily', ne: 'दैनिक', en: 'Daily' },
  { id: 'household', ne: 'घरायसी', en: 'Household' },
  { id: 'personal', ne: 'व्यक्तिगत', en: 'Personal' },
  { id: 'important', ne: 'महत्त्वपूर्ण', en: 'Important' },
  { id: 'other', ne: 'अन्य', en: 'Other' }
];

const E = (id, emoji, ne, en, group) => ({
  id,
  emoji,
  ne,
  en,
  group,
  kind: 'expense',
  hidden: false,
  custom: false
});

export function baseExpenseCats() {
  return [
    E('food', '🍚', 'खाना', 'Food', 'daily'),
    E('tea', '🍵', 'चिया/खुर्सानी', 'Tea/Snacks', 'daily'),
    E('transport', '🚌', 'यातायात', 'Transport', 'daily'),
    E('groceries', '🛒', 'किराना', 'Groceries', 'daily'),
    E('mobile', '📱', 'मोबाइल/इन्टरनेट', 'Mobile/Internet', 'daily'),
    E('electricity', '💡', 'बिजुली', 'Electricity', 'household'),
    E('water', '💧', 'पानी', 'Water', 'household'),
    E('gas', '🔥', 'ग्यास', 'Gas', 'household'),
    E('rent', '🏠', 'भाडा', 'Rent', 'household'),
    E('household', '🧺', 'घरायसी सामान', 'Household items', 'household'),
    E('clothing', '👕', 'लुगाफाटा', 'Clothing', 'personal'),
    E('personalcare', '🧴', 'व्यक्तिगत हेरचाह', 'Personal care', 'personal'),
    E('entertainment', '🎬', 'मनोरञ्जन', 'Entertainment', 'personal'),
    E('eatingout', '🍢', 'बाहिर खाने', 'Eating out', 'personal'),
    E('education', '📚', 'शिक्षा', 'Education', 'important'),
    E('health', '💊', 'स्वास्थ्य', 'Health', 'important'),
    E('familiesupport', '👨‍👩‍👧', 'परिवार सहयोग', 'Family support', 'important'),
    E('gifts', '🎁', 'उपहार/सामाजिक', 'Gifts/Social', 'important'),
    E('religious', '🪔', 'धार्मिक/सांस्कृतिक', 'Religious/Cultural', 'important'),
    E('loan', '🧾', 'ऋण तिर्ने', 'Loan repayment', 'other'),
    E('udhaaro', '📓', 'उधारो', 'Udhaaro', 'other'),
    E('dhukuti', '🪣', 'धुकुटी', 'Savings group (Dhukuti)', 'other'),
    E('remitout', '✈️', 'पठाएको रेमिट्यान्स', 'Remittance sent', 'other'),
    E('other', '⭕', 'अन्य', 'Other', 'other')
  ];
}

const I = (id, emoji, ne, en) => ({
  id,
  emoji,
  ne,
  en,
  group: 'income',
  kind: 'income',
  hidden: false,
  custom: false
});

export function baseIncomeCats() {
  return [
    I('salary', '💼', 'तलब', 'Salary'),
    I('wages', '🛠️', 'दैनिक/साप्ताहिक पारी', 'Daily/weekly wages'),
    I('freelance', '💻', 'फ्रिलान्स', 'Freelance'),
    I('business', '🏪', 'व्यापार/दोकान', 'Business/shop'),
    I('agriculture', '🌾', 'कृषि', 'Agriculture'),
    I('rental', '🏡', 'भाडा (पाउने)', 'Rental'),
    I('remittance', '✈️', 'रेमिट्यान्स', 'Remittance'),
    I('pension', '🪙', 'पेन्सन', 'Pension'),
    I('allowance', '🎒', 'भत्ता', 'Allowance'),
    I('otherincome', '➕', 'अन्य आम्दानी', 'Other income')
  ];
}

/** Default categories for a mode chosen in onboarding. */
export function buildCats(mode) {
  const expenses = baseExpenseCats();
  const hiddenByMode = {
    student: ['loan', 'udhaaro', 'dhukuti', 'remitout', 'familiesupport', 'rent'],
    personal: [],
    family: [],
    business: []
  };
  const hidden = hiddenByMode[mode] || [];
  expenses.forEach((c) => {
    if (hidden.includes(c.id)) c.hidden = true;
  });
  if (mode === 'business') {
    expenses.push(
      E('shopstock', '📦', 'दोकानको माल', 'Shop stock', 'other'),
      E('bizexpense', '🧮', 'व्यापार खर्च', 'Business expense', 'other')
    );
  }
  if (mode === 'student') {
    expenses.push(E('stationery', '✏️', 'स्टेशनरी', 'Stationery', 'daily'));
  }
  return [...expenses, ...baseIncomeCats()];
}

export function catLabel(cat, lang) {
  if (!cat) return '';
  return lang === 'ne' ? cat.ne : cat.en;
}
