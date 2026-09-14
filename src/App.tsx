import { useState, useEffect } from 'react';
import { tokens } from './tokens';
import { COPY } from './copy';
import { Button } from './components/Button';
import { CustomerScreen } from './components/CustomerScreen';
import { SettingsScreen } from './components/SettingsScreen';
import {
  CustomerData,
  AgentProfile,
  PolicyCard,
  OutputState,
  AssetType,
  ToneType,
} from './types';
import {
  DEFAULT_AGENT,
  DEFAULT_POLICIES,
  SAMPLE_CUSTOMER,
} from './data/defaults';

export default function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'settings'>('customer');
  const [activeGenerating, setActiveGenerating] = useState<AssetType | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Agent profile state with persistence in localStorage
  const [agent, setAgent] = useState<AgentProfile>(() => {
    try {
      const saved = localStorage.getItem('ai_insurance_agent_profile');
      return saved ? JSON.parse(saved) : DEFAULT_AGENT;
    } catch {
      return DEFAULT_AGENT;
    }
  });

  // Policy library state with persistence in localStorage
  const [policies, setPolicies] = useState<PolicyCard[]>(() => {
    try {
      const saved = localStorage.getItem('ai_insurance_policies');
      return saved ? JSON.parse(saved) : DEFAULT_POLICIES;
    } catch {
      return DEFAULT_POLICIES;
    }
  });

  // Customer data state
  const [customer, setCustomer] = useState<CustomerData>(SAMPLE_CUSTOMER);

  // Output state
  const [output, setOutput] = useState<OutputState>({
    type: 'email',
    tone: 'warmer',
    language: 'en',
    loading: false,
    error: null,
    content: {
      subject: "Following up on your daughter's protection, Maria",
      body: `Hi Maria,\n\nIt was so nice speaking with you earlier today. I was reflecting on what you shared about your sister, and I really admire how determined you are to make sure your daughter never faces that kind of financial stress.\n\nI wanted to send over the exact numbers we reviewed for the Mutual of Omaha Living Promise plan:\n\n• Benefit Amount: $15,000 paid tax-free directly to your daughter\n• Monthly Payment: $67/month\n• Locked Rate: Guaranteed never to increase, and coverage never decreases\n• No Medical Exam: Simple health questions without needles or doctor visits\n\nI know you mentioned wanting to think it through with family. Take all the time you need, but please know I'm here to answer any questions without any pressure.\n\nWould a quick 3-minute call tomorrow morning around 10:30 AM or afternoon around 2:00 PM be better to see if you have any questions?\n\nWarm regards,\n\n${agent.name}\n${agent.agency}\n${agent.phone}`,
    },
  });

  // Save agent profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_insurance_agent_profile', JSON.stringify(agent));
    } catch (e) {
      console.error(e);
    }
  }, [agent]);

  // Save policies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_insurance_policies', JSON.stringify(policies));
    } catch (e) {
      console.error(e);
    }
  }, [policies]);

  const handleSelectCustomerTab = () => {
    setActiveTab('customer');
  };

  const handleSelectSettingsTab = () => {
    setActiveTab('settings');
  };

  const handleLoadSample = () => {
    setCustomer(SAMPLE_CUSTOMER);
    handleGenerate('email', 'warmer');
  };

  const handleExtractNotes = async (rawText: string) => {
    setIsExtracting(true);
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          policies,
        }),
      });
      const json = await response.json();
      if (json.success && json.data) {
        const d = json.data;
        setCustomer((prev) => ({
          ...prev,
          name: d.name || COPY.placeholders.notSureYet,
          age: d.age || COPY.placeholders.notSureYet,
          income: d.income || COPY.placeholders.notSureYet,
          policyId: d.policyId || prev.policyId || policies[0]?.id || '',
          coverageAmount: d.coverageAmount || COPY.placeholders.notSureYet,
          termLength: d.termLength || '',
          monthlyPayment: d.monthlyPayment || COPY.placeholders.notSureYet,
          smoker: d.smoker || COPY.placeholders.notSureYet,
          protecting: d.protecting || COPY.placeholders.notSureYet,
          currentCoverage: d.currentCoverage || COPY.placeholders.notSureYet,
          textConsent: d.textConsent || 'Yes',
          stage: d.stage || prev.stage,
          notes: d.notes || rawText || COPY.placeholders.notSureYet,
        }));
      } else {
        throw new Error(json.error || COPY.errors.parse);
      }
    } catch {
      // Heuristic fallback for offline/interrupted scenarios
      const notSure = COPY.placeholders.notSureYet;
      const nameMatch = rawText.match(
        /(?:with|talking to|spoke with|client|customer)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
      );
      const ageMatch = rawText.match(/(\d{2})\s*(?:yo|y\/o|years old|,|\s)/);
      const covMatch = rawText.match(
        /(?:for|\$)?\s*(\d{1,3}(?:k|,\d{3}|\s*thousand|\s*k))/i
      );
      const premMatch = rawText.match(
        /(?:quoted|paying|payment|month|\$)\s*(\d{1,4})(?:\s*a month|\s*\/mo|\s*monthly)?/i
      );

      let parsedCov = notSure;
      if (covMatch) {
        let val = covMatch[1].toLowerCase().replace(/,/g, '');
        if (val.includes('k')) parsedCov = `$${parseInt(val, 10) * 1000}`;
        else if (!val.startsWith('$')) parsedCov = `$${val}`;
        else parsedCov = val;
      }

      setCustomer((prev) => ({
        ...prev,
        name: nameMatch ? nameMatch[1] : notSure,
        age: ageMatch ? ageMatch[1] : notSure,
        income: notSure,
        coverageAmount: parsedCov,
        monthlyPayment: premMatch ? `$${premMatch[1]}` : notSure,
        protecting: notSure,
        currentCoverage: notSure,
        smoker: /non[- ]?smoker/i.test(rawText)
          ? 'No'
          : /smoker/i.test(rawText)
          ? 'Yes'
          : notSure,
        notes: rawText || notSure,
      }));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async (
    assetType: AssetType,
    toneToUse: ToneType = 'warmer'
  ) => {
    setActiveGenerating(assetType);
    setOutput((prev) => ({
      ...prev,
      type: assetType,
      tone: toneToUse,
      error: null,
    }));

    try {
      const selectedPolicy =
        policies.find((p) => p.id === customer.policyId) || policies[0] || null;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          customer,
          agent,
          policy: selectedPolicy,
          tone: toneToUse,
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(COPY.errors.network);
      }

      const json = await response.json();
      if (json.success && json.data) {
        setOutput({
          type: assetType,
          tone: toneToUse,
          language: 'en',
          loading: false,
          error: null,
          content: json.data,
        });
      } else {
        throw new Error(COPY.errors.parse);
      }
    } catch {
      setOutput((prev) => ({
        ...prev,
        loading: false,
        error: COPY.errors.network,
      }));
    } finally {
      setActiveGenerating(null);
    }
  };

  return (
    <div className={tokens.surface.page}>
      <main className={tokens.space.page}>
        <div className={tokens.space.section}>
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className={tokens.text.heading}>{COPY.app.title}</h1>
            <p className={tokens.text.body}>{COPY.app.subtitle}</p>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center gap-3">
            <Button
              id="nav-tab-customer"
              label={COPY.tabs.customer}
              onClick={handleSelectCustomerTab}
              variant={activeTab === 'customer' ? 'primary' : 'secondary'}
            />
            <Button
              id="nav-tab-settings"
              label={COPY.tabs.settings}
              onClick={handleSelectSettingsTab}
              variant={activeTab === 'settings' ? 'primary' : 'secondary'}
            />
          </div>

          {/* Screens */}
          {activeTab === 'customer' && (
            <CustomerScreen
              customer={customer}
              setCustomer={setCustomer}
              policies={policies}
              output={output}
              onGenerate={handleGenerate}
              activeGenerating={activeGenerating}
              onLoadSample={handleLoadSample}
              onExtractNotes={handleExtractNotes}
              isExtracting={isExtracting}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              agent={agent}
              setAgent={setAgent}
              policies={policies}
              setPolicies={setPolicies}
            />
          )}
        </div>
      </main>
    </div>
  );
}
