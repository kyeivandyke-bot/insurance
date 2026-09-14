import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Mail, MessageSquare, PhoneCall, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { tokens } from '../tokens';
import { COPY } from '../copy';
import { Button } from './Button';
import { Field } from './Field';
import {
  CustomerData,
  PolicyCard,
  OutputState,
  AssetType,
  ToneType,
  EmailContent,
  TextContent,
  CallScriptContent,
} from '../types';
import { PROSPECT_STAGES, TERM_LENGTH_OPTIONS } from '../data/defaults';

interface CustomerScreenProps {
  customer: CustomerData;
  setCustomer: Dispatch<SetStateAction<CustomerData>>;
  policies: PolicyCard[];
  output: OutputState;
  onGenerate: (type: AssetType, tone?: ToneType) => void;
  activeGenerating: AssetType | null;
  onLoadSample: () => void;
  onExtractNotes: (rawText: string) => Promise<void>;
  isExtracting: boolean;
}

export function CustomerScreen({
  customer,
  setCustomer,
  policies,
  output,
  onGenerate,
  activeGenerating,
  onLoadSample,
  onExtractNotes,
  isExtracting,
}: CustomerScreenProps) {
  const [quickNoteText, setQuickNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [quickNoteError, setQuickNoteError] = useState<string | null>(null);
  const [editableTextMessage, setEditableTextMessage] = useState(
    output.type === 'text' && output.content
      ? (output.content as TextContent).message || ''
      : ''
  );
  const lastTargetMessageRef = useRef(
    output.type === 'text' && output.content
      ? (output.content as TextContent).message || ''
      : ''
  );

  useEffect(() => {
    if (output.type === 'text' && output.content) {
      const target = (output.content as TextContent).message || '';
      if (lastTargetMessageRef.current !== target) {
        lastTargetMessageRef.current = target;
        setEditableTextMessage('');
        let currentIdx = 0;
        const step = Math.max(1, Math.ceil(target.length / 25));
        const timer = setInterval(() => {
          currentIdx += step;
          if (currentIdx >= target.length) {
            setEditableTextMessage(target);
            clearInterval(timer);
          } else {
            setEditableTextMessage(target.slice(0, currentIdx));
          }
        }, 20);

        return () => clearInterval(timer);
      }
    }
  }, [output.content, output.type]);

  const selectedPolicy =
    policies.find((p) => p.id === customer.policyId) || policies[0] || null;

  const isPermanentPolicy =
    selectedPolicy &&
    (selectedPolicy.type === 'whole_life' || selectedPolicy.type === 'final_expense');

  const handleFieldChange = (field: keyof CustomerData, val: any) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleNameChange = (val: string) => handleFieldChange('name', val);
  const handleAgeChange = (val: string) => handleFieldChange('age', val);
  const handleIncomeChange = (val: string) => handleFieldChange('income', val);
  const handlePolicyChange = (val: string) => handleFieldChange('policyId', val);
  const handleCoverageChange = (val: string) => handleFieldChange('coverageAmount', val);
  const handleTermChange = (val: string) => handleFieldChange('termLength', val);
  const handleMonthlyChange = (val: string) => handleFieldChange('monthlyPayment', val);
  const handleSmokerChange = (val: string) => handleFieldChange('smoker', val);
  const handleProtectingChange = (val: string) => handleFieldChange('protecting', val);
  const handleCoverageStatusChange = (val: string) => handleFieldChange('currentCoverage', val);
  const handleStageChange = (val: string) => handleFieldChange('stage', val);
  const handleTextConsentChange = (val: boolean) =>
    handleFieldChange('textConsent', val ? 'Yes' : 'No');
  const handleNotesChange = (val: string) => handleFieldChange('notes', val);

  const handleQuickNoteInputChange = (val: string) => {
    setQuickNoteText(val);
    if (quickNoteError) {
      setQuickNoteError(null);
    }
  };

  const handleTriggerExtract = () => {
    if (!quickNoteText.trim()) {
      setQuickNoteError(COPY.errors.quickNotesEmpty);
      return;
    }
    setQuickNoteError(null);
    onExtractNotes(quickNoteText);
  };

  const handleGenerateEmail = () => onGenerate('email', output.tone);
  const handleGenerateText = () => onGenerate('text', output.tone);
  const handleGenerateScript = () => onGenerate('script', output.tone);

  const handleToneWarmer = () => onGenerate(output.type || 'email', 'warmer');
  const handleToneProfessional = () => onGenerate(output.type || 'email', 'professional');
  const handleToneDirect = () => onGenerate(output.type || 'email', 'direct');

  const handleTryAgain = () => {
    if (output.type) {
      onGenerate(output.type, output.tone);
    } else {
      onGenerate('email', output.tone);
    }
  };

  const handleTextMessageChange = (val: string) => {
    setEditableTextMessage(val);
    lastTargetMessageRef.current = val;
  };

  const handleCopy = () => {
    if (!output.content) return;
    let fullText = '';
    if (output.type === 'email') {
      const email = output.content as EmailContent;
      fullText = `${COPY.outputs.subjectLabel}: ${email.subject}\n\n${email.body}`;
    } else if (output.type === 'text') {
      fullText =
        editableTextMessage || (output.content as TextContent).message || '';
    } else if (output.type === 'script') {
      const script = output.content as CallScriptContent;
      fullText = `${COPY.outputs.openerLabel}:\n${script.opener}\n\n${COPY.outputs.questionsLabel}:\n${script.questions.join('\n')}\n\n${COPY.outputs.framingLabel}:\n${script.valueFraming}\n\n${COPY.outputs.objectionsLabel}:\n${script.objections.map((o) => `${COPY.outputs.prospectSays}: "${o.objection}"\n${COPY.outputs.sayThis}: "${o.response}"`).join('\n\n')}\n\n${COPY.outputs.closeLabel}:\n${script.close}`;
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const policyOptions = policies.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.carrier})`,
  }));

  const smokerOptions = [
    { value: 'No', label: COPY.options.no },
    { value: 'Yes', label: COPY.options.yes },
    { value: COPY.placeholders.notSureYet, label: COPY.placeholders.notSureYet },
  ];

  const stageOptions = PROSPECT_STAGES.map((s) => ({
    value: s,
    label: s,
  }));

  const termOptions = [
    { value: '', label: COPY.options.select },
    ...TERM_LENGTH_OPTIONS.map((t) => ({ value: t, label: t })),
  ];

  return (
    <div className={tokens.space.section}>
      {/* Quick Notes Shortcut Section */}
      <div className={tokens.surface.card}>
        <div className={tokens.space.stack}>
          <div className="flex flex-col gap-1">
            <h2 className={tokens.text.heading}>{COPY.sections.quickNotes}</h2>
            <p className={tokens.text.helper}>{COPY.sections.quickNotesHelper}</p>
          </div>

          <Field
            id="quick-notes-textarea"
            label={COPY.fields.quickNotesInput}
            type="textarea"
            value={quickNoteText}
            onChange={handleQuickNoteInputChange}
            placeholder={COPY.placeholders.quickNotes}
            disabledReason={quickNoteError}
          />

          <div className="flex justify-start">
            <Button
              id="extract-notes-button"
              label={COPY.buttons.extract}
              onClick={handleTriggerExtract}
              icon={Sparkles}
              variant="secondary"
              loading={isExtracting}
            />
          </div>
        </div>
      </div>

      {/* Customer Details Table */}
      <div className={tokens.surface.card}>
        <div className={tokens.space.stack}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className={tokens.text.heading}>{COPY.sections.customerDetails}</h2>
            </div>
            <div className="flex justify-start md:justify-end">
              <Button
                id="load-sample-button"
                label={COPY.buttons.sample}
                onClick={onLoadSample}
                variant="secondary"
              />
            </div>
          </div>

          {/* Two-column table grid on 768px+, single column on 375px */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              id="customer-name"
              label={COPY.fields.name}
              type="text"
              value={customer.name}
              onChange={handleNameChange}
              placeholder={COPY.placeholders.name}
            />

            <Field
              id="customer-age"
              label={COPY.fields.age}
              type="text"
              value={customer.age}
              onChange={handleAgeChange}
              placeholder={COPY.placeholders.age}
            />

            <Field
              id="customer-income"
              label={COPY.fields.income}
              type="text"
              value={customer.income}
              onChange={handleIncomeChange}
              placeholder={COPY.placeholders.income}
            />

            <Field
              id="customer-policy"
              label={COPY.fields.policy}
              type="select"
              value={customer.policyId}
              onChange={handlePolicyChange}
              options={policyOptions}
            />

            <Field
              id="customer-coverage-amount"
              label={COPY.fields.coverageAmount}
              type="text"
              value={customer.coverageAmount}
              onChange={handleCoverageChange}
              placeholder={COPY.placeholders.coverageAmount}
            />

            <Field
              id="customer-term-length"
              label={COPY.fields.termLength}
              type="select"
              value={isPermanentPolicy ? '' : customer.termLength}
              onChange={handleTermChange}
              options={termOptions}
              disabledReason={isPermanentPolicy ? COPY.helpers.termLengthDisabled : null}
            />

            <Field
              id="customer-monthly-payment"
              label={COPY.fields.monthlyPayment}
              type="text"
              value={customer.monthlyPayment}
              onChange={handleMonthlyChange}
              placeholder={COPY.placeholders.monthlyPayment}
            />

            <Field
              id="customer-smoker"
              label={COPY.fields.smoker}
              type="select"
              value={customer.smoker}
              onChange={handleSmokerChange}
              options={smokerOptions}
            />

            <Field
              id="customer-protecting"
              label={COPY.fields.protecting}
              type="text"
              value={customer.protecting}
              onChange={handleProtectingChange}
              placeholder={COPY.placeholders.protecting}
            />

            <Field
              id="customer-current-coverage"
              label={COPY.fields.currentCoverage}
              type="text"
              value={customer.currentCoverage}
              onChange={handleCoverageStatusChange}
              placeholder={COPY.placeholders.currentCoverage}
            />

            <Field
              id="customer-stage"
              label={COPY.fields.stage}
              type="select"
              value={customer.stage}
              onChange={handleStageChange}
              options={stageOptions}
            />

            <Field
              id="customer-text-consent"
              label={COPY.fields.textConsent}
              type="checkbox"
              value={customer.textConsent === 'Yes'}
              onChange={handleTextConsentChange}
              helper={COPY.helpers.textConsentNeeded}
            />

            <div className="col-span-1 md:col-span-2">
              <Field
                id="customer-notes"
                label={COPY.fields.notes}
                type="textarea"
                value={customer.notes}
                onChange={handleNotesChange}
                placeholder={COPY.placeholders.notes}
              />
            </div>
          </div>

          {/* Action Generate Buttons Row: Stack on 375px, row on 768px */}
          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-200">
            <Button
              id="write-email-button"
              label={COPY.buttons.email}
              onClick={handleGenerateEmail}
              icon={Mail}
              variant="primary"
              loading={activeGenerating === 'email'}
            />

            <Button
              id="write-text-button"
              label={COPY.buttons.text}
              onClick={handleGenerateText}
              icon={MessageSquare}
              variant="secondary"
              loading={activeGenerating === 'text'}
              disabledReason={customer.textConsent !== 'Yes' ? COPY.errors.consent : null}
            />

            <Button
              id="write-script-button"
              label={COPY.buttons.script}
              onClick={handleGenerateScript}
              icon={PhoneCall}
              variant="secondary"
              loading={activeGenerating === 'script'}
            />
          </div>
        </div>
      </div>

      {/* Output Section */}
      {(output.content || output.error) && (
        <div id="output-section-card" className={tokens.surface.card}>
          <div className={tokens.space.stack}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className={tokens.text.heading}>{COPY.sections.outputHeader}</h2>

              {/* Tone Selection Toggles */}
              {output.content && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    label={COPY.buttons.warmer}
                    onClick={handleToneWarmer}
                    variant={output.tone === 'warmer' ? 'primary' : 'secondary'}
                  />
                  <Button
                    label={COPY.buttons.professional}
                    onClick={handleToneProfessional}
                    variant={output.tone === 'professional' ? 'primary' : 'secondary'}
                  />
                  <Button
                    label={COPY.buttons.direct}
                    onClick={handleToneDirect}
                    variant={output.tone === 'direct' ? 'primary' : 'secondary'}
                  />
                </div>
              )}
            </div>

            {/* Error Message Display */}
            {output.error && (
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 flex flex-col gap-3">
                <p className={tokens.text.body}>{output.error}</p>
                <div className="flex justify-start">
                  <Button
                    id="try-again-error-button"
                    label={COPY.buttons.regen}
                    onClick={handleTryAgain}
                    icon={RefreshCw}
                    variant="secondary"
                  />
                </div>
              </div>
            )}

            {/* Render Output Content */}
            {output.content && (
              <div className="flex flex-col gap-6">
                {/* Email Display */}
                {output.type === 'email' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className={tokens.text.label}>{COPY.outputs.subjectLabel}</span>
                      <p className={tokens.text.body}>
                        {(output.content as EmailContent).subject}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={tokens.text.label}>{COPY.outputs.bodyLabel}</span>
                      <p className={`${tokens.text.body} whitespace-pre-line`}>
                        {(output.content as EmailContent).body}
                      </p>
                    </div>
                  </div>
                )}

                {/* SMS Text Display with Real-Time Character Counter */}
                {output.type === 'text' && (
                  <div className="flex flex-col gap-3">
                    <Field
                      id="output-sms-editable-textarea"
                      label={COPY.outputs.textLabel}
                      type="textarea"
                      value={editableTextMessage}
                      onChange={handleTextMessageChange}
                      placeholder={COPY.placeholders.quickNotes}
                    />

                    {/* Real-time Character Counter & Segment Indicator */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={tokens.text.label}>
                          {COPY.outputs.characterCounterLabel}:
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {editableTextMessage.length}
                        </span>
                        <span className={tokens.text.helper}>
                          / 320 {COPY.outputs.charactersLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            editableTextMessage.length <= 160
                              ? 'text-slate-900'
                              : editableTextMessage.length <= 320
                              ? 'text-blue-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {editableTextMessage.length <= 160
                            ? COPY.outputs.singleSegmentLabel
                            : editableTextMessage.length <= 320
                            ? COPY.outputs.twoSegmentLabel
                            : COPY.outputs.overLimitLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Call Script Display */}
                {output.type === 'script' && (
                  <div className="flex flex-col gap-4">
                    {(() => {
                      const script = output.content as CallScriptContent;
                      return (
                        <>
                          <div className="flex flex-col gap-1">
                            <span className={tokens.text.label}>{COPY.outputs.openerLabel}</span>
                            <p className={tokens.text.body}>{script.opener}</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className={tokens.text.label}>
                              {COPY.outputs.questionsLabel}
                            </span>
                            {script.questions.map((q, idx) => (
                              <p key={idx} className={tokens.text.body}>
                                • {q}
                              </p>
                            ))}
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className={tokens.text.label}>{COPY.outputs.framingLabel}</span>
                            <p className={tokens.text.body}>{script.valueFraming}</p>
                          </div>

                          <div className="flex flex-col gap-3">
                            <span className={tokens.text.label}>
                              {COPY.outputs.objectionsLabel}
                            </span>
                            {script.objections.map((obj, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2"
                              >
                                <p className={tokens.text.label}>
                                  {COPY.outputs.prospectSays}: "{obj.objection}"
                                </p>
                                <p className={tokens.text.body}>
                                  {COPY.outputs.sayThis}: "{obj.response}"
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className={tokens.text.label}>{COPY.outputs.closeLabel}</span>
                            <p className={tokens.text.body}>{script.close}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Bottom Action Bar: Copy and Try Again */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
                  <Button
                    id="copy-output-button"
                    label={copied ? COPY.buttons.copied : COPY.buttons.copy}
                    onClick={handleCopy}
                    icon={copied ? Check : Copy}
                    variant="primary"
                  />

                  <Button
                    id="try-again-button"
                    label={COPY.buttons.regen}
                    onClick={handleTryAgain}
                    icon={RefreshCw}
                    variant="secondary"
                  />
                </div>

                {/* Compliance Notice */}
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <p className={tokens.text.helper}>{COPY.outputs.complianceNote}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
