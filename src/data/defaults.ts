import { AgentProfile, PolicyCard, CustomerData } from '../types';

export const DEFAULT_AGENT: AgentProfile = {
  name: 'David Miller',
  agency: 'Apex Pinnacle Financial',
  phone: '(555) 234-8901',
  email: 'david.miller@apexpinnacle.com',
  states: 'TX, FL, GA, NC, OH',
  defaultTone: 'warmer',
  defaultLanguage: 'en',
};

export const DEFAULT_POLICIES: PolicyCard[] = [
  {
    id: 'mo-living-promise',
    name: 'Living Promise Simplified Issue',
    carrier: 'Mutual of Omaha',
    type: 'final_expense',
    ageMin: 45,
    ageMax: 85,
    coverageMin: '$2,000',
    coverageMax: '$40,000',
    sellingPoints:
      'Monthly rate is locked and never increases; full death benefit never decreases; no medical exam or blood draw required; proceeds paid tax-free directly to family within 48-72 hours of claim to cover funeral and burial costs without financial strain.',
    limitations:
      'Coverage is capped at $40,000 maximum. Does not serve as a high-limit wealth transfer vehicle. Subject to prescription database health verification. Two-year contestability period applies.',
  },
  {
    id: 'banner-opt-term',
    name: 'Opt-Term Level Protection',
    carrier: 'Banner Life / Legal & General',
    type: 'term',
    ageMin: 20,
    ageMax: 70,
    coverageMin: '$100,000',
    coverageMax: '$2,000,000',
    sellingPoints:
      'Lowest monthly cost per dollar of coverage; guaranteed level monthly payments for 10, 15, 20, or 30 years; covers the mortgage and replaces income during peak family dependency years; convertible to permanent coverage without re-qualifying medically.',
    limitations:
      'Builds zero cash surrender value. Coverage expires at end of term period unless renewed at significantly higher non-level annual rates or converted prior to conversion deadline.',
  },
  {
    id: 'transamerica-ffiul',
    name: 'Financial Foundation IUL',
    carrier: 'Transamerica',
    type: 'iul',
    ageMin: 18,
    ageMax: 75,
    coverageMin: '$25,000',
    coverageMax: '$1,500,000',
    sellingPoints:
      'Permanent coverage with index-linked cash accumulation potential; guaranteed 0% floor guarantees against market losses; built-in living benefit riders for qualifying chronic, critical, and terminal illnesses.',
    limitations:
      'Index returns are not guaranteed fixed returns and are capped by annual caps and participation rates. Policy internal cost of insurance charges increase with attained age. Policy may lapse if premiums and cash value do not cover monthly deductions.',
  },
  {
    id: 'americo-eagle-whole',
    name: 'Eagle Premier Lifetime Whole Life',
    carrier: 'Americo Financial',
    type: 'whole_life',
    ageMin: 40,
    ageMax: 80,
    coverageMin: '$5,000',
    coverageMax: '$30,000',
    sellingPoints:
      'Guaranteed lifelong protection to age 100+; guaranteed locked premium that never jumps; guaranteed cash value schedule; accidental death rider option included.',
    limitations:
      'Higher monthly rate per dollar of death benefit than term policies. Cash value accumulation in initial 2-3 policy years is minimal. Early cash surrenders incur surrender charges.',
  },
];

export const SAMPLE_CUSTOMER: CustomerData = {
  name: 'Maria Gonzalez',
  age: '58',
  income: '$42,000/year',
  policyId: 'mo-living-promise',
  coverageAmount: '$15,000',
  termLength: '',
  monthlyPayment: '$67',
  smoker: 'No',
  protecting: 'Her daughter',
  currentCoverage: 'Just through work',
  textConsent: 'Yes',
  stage: 'Quoted, thinking it over',
  notes: 'Sister passed last year, no money for the service. Daughter had to take out a loan.',
};

export const BLANK_CUSTOMER: CustomerData = {
  name: '',
  age: '',
  income: '',
  policyId: 'mo-living-promise',
  coverageAmount: '',
  termLength: '',
  monthlyPayment: '',
  smoker: 'No',
  protecting: '',
  currentCoverage: '',
  textConsent: 'Yes',
  stage: 'Initial Call / Discovery',
  notes: '',
};

export const PROSPECT_STAGES = [
  'Initial Call / Discovery',
  'Quoted, thinking it over',
  'Follow-up after appointment',
  'Application started / Pending',
  'Underwriting review question',
  'Policy approved, ready for signature',
  'Unresponsive / Cold check-in',
];

export const TERM_LENGTH_OPTIONS = [
  '10 Years',
  '15 Years',
  '20 Years',
  '25 Years',
  '30 Years',
  'To Age 65',
  'To Age 70',
];
