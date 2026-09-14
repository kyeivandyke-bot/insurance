export type ToneType = 'warmer' | 'professional' | 'direct';
export type PolicyType = 'term' | 'whole_life' | 'iul' | 'final_expense';
export type LanguageType = 'en' | 'es';

export interface AgentProfile {
  name: string;
  agency: string;
  phone: string;
  email: string;
  states: string;
  defaultTone: ToneType;
  defaultLanguage: LanguageType;
}

export interface PolicyCard {
  id: string;
  name: string;
  carrier: string;
  type: PolicyType;
  ageMin: number;
  ageMax: number;
  coverageMin: string;
  coverageMax: string;
  sellingPoints: string;
  limitations: string;
}

export interface CustomerData {
  name: string;
  age: string;
  income: string;
  policyId: string;
  coverageAmount: string;
  termLength: string;
  monthlyPayment: string;
  smoker: 'No' | 'Yes' | 'Not sure yet';
  protecting: string;
  currentCoverage: string;
  textConsent: 'Yes' | 'No' | 'Not sure yet';
  stage: string;
  notes: string;
}

export type AssetType = 'email' | 'text' | 'script' | 'next_move';

export interface EmailContent {
  subject: string;
  body: string;
}

export interface TextContent {
  message: string;
}

export interface CallScriptContent {
  opener: string;
  questions: string[];
  valueFraming: string;
  objections: Array<{ objection: string; response: string }>;
  close: string;
}

export interface NextMoveContent {
  suggestedAction: string;
  timingNotice: string;
  communicationDraft: string;
}

export interface OutputState {
  type: AssetType | null;
  content: EmailContent | TextContent | CallScriptContent | NextMoveContent | null;
  tone: ToneType;
  language: LanguageType;
  loading: boolean;
  error: string | null;
  timestamp?: string;
}
