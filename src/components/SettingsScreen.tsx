import { useState, Dispatch, SetStateAction } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { tokens } from '../tokens';
import { COPY } from '../copy';
import { Button } from './Button';
import { Field } from './Field';
import { AgentProfile, PolicyCard, PolicyType } from '../types';

interface SettingsScreenProps {
  agent: AgentProfile;
  setAgent: Dispatch<SetStateAction<AgentProfile>>;
  policies: PolicyCard[];
  setPolicies: Dispatch<SetStateAction<PolicyCard[]>>;
}

const EMPTY_POLICY: PolicyCard = {
  id: '',
  name: '',
  carrier: '',
  type: 'term',
  ageMin: 18,
  ageMax: 75,
  coverageMin: '$25,000',
  coverageMax: '$1,000,000',
  sellingPoints: '',
  limitations: '',
};

export function SettingsScreen({
  agent,
  setAgent,
  policies,
  setPolicies,
}: SettingsScreenProps) {
  const [profileSaved, setProfileSaved] = useState(false);

  // Policy edit/add inline form state (NO modals!)
  const [editingPolicy, setEditingPolicy] = useState<PolicyCard | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Inline delete confirmation state (No modals, inline UI)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleAgentNameChange = (val: string) =>
    setAgent((prev) => ({ ...prev, name: val }));
  const handleAgentAgencyChange = (val: string) =>
    setAgent((prev) => ({ ...prev, agency: val }));
  const handleAgentPhoneChange = (val: string) =>
    setAgent((prev) => ({ ...prev, phone: val }));
  const handleAgentEmailChange = (val: string) =>
    setAgent((prev) => ({ ...prev, email: val }));
  const handleAgentStatesChange = (val: string) =>
    setAgent((prev) => ({ ...prev, states: val }));

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
    }, 2500);
  };

  const handleStartAddPolicy = () => {
    setPendingDeleteId(null);
    setIsAddingNew(true);
    setEditingPolicy({
      ...EMPTY_POLICY,
      id: `custom-policy-${Date.now()}`,
    });
  };

  const handleStartEditPolicy = (policy: PolicyCard) => {
    setPendingDeleteId(null);
    setIsAddingNew(false);
    setEditingPolicy({ ...policy });
  };

  const handleCancelPolicyForm = () => {
    setEditingPolicy(null);
    setIsAddingNew(false);
  };

  const handleSavePolicyForm = () => {
    if (!editingPolicy) return;
    if (!editingPolicy.name.trim()) return;

    setPolicies((prev) => {
      const exists = prev.some((p) => p.id === editingPolicy.id);
      if (exists) {
        return prev.map((p) => (p.id === editingPolicy.id ? editingPolicy : p));
      }
      return [editingPolicy, ...prev];
    });

    setEditingPolicy(null);
    setIsAddingNew(false);
  };

  const handlePolicyDraftFieldChange = (
    field: keyof PolicyCard,
    val: any
  ) => {
    if (!editingPolicy) return;
    setEditingPolicy((prev) => (prev ? { ...prev, [field]: val } : null));
  };

  const handlePolicyDraftName = (val: string) =>
    handlePolicyDraftFieldChange('name', val);
  const handlePolicyDraftCarrier = (val: string) =>
    handlePolicyDraftFieldChange('carrier', val);
  const handlePolicyDraftType = (val: PolicyType) =>
    handlePolicyDraftFieldChange('type', val);
  const handlePolicyDraftAgeMin = (val: string) =>
    handlePolicyDraftFieldChange('ageMin', Number(val) || 0);
  const handlePolicyDraftAgeMax = (val: string) =>
    handlePolicyDraftFieldChange('ageMax', Number(val) || 0);
  const handlePolicyDraftCoverageMin = (val: string) =>
    handlePolicyDraftFieldChange('coverageMin', val);
  const handlePolicyDraftCoverageMax = (val: string) =>
    handlePolicyDraftFieldChange('coverageMax', val);
  const handlePolicyDraftSellingPoints = (val: string) =>
    handlePolicyDraftFieldChange('sellingPoints', val);
  const handlePolicyDraftLimitations = (val: string) =>
    handlePolicyDraftFieldChange('limitations', val);

  const handleAskDeletePolicy = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    if (policies.length <= 1) return;
    setPolicies((prev) => prev.filter((p) => p.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const policyTypeOptions = [
    { value: 'term', label: COPY.options.term },
    { value: 'whole_life', label: COPY.options.wholeLife },
    { value: 'iul', label: COPY.options.iul },
    { value: 'final_expense', label: COPY.options.finalExpense },
  ];

  return (
    <div className={tokens.space.section}>
      {/* Agent Signature Profile */}
      <div className={tokens.surface.card}>
        <div className={tokens.space.stack}>
          <div className="flex flex-col gap-1">
            <h2 className={tokens.text.heading}>{COPY.sections.agentProfile}</h2>
            <p className={tokens.text.helper}>
              {COPY.sections.agentProfileHelper}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              id="agent-name"
              label={COPY.fields.agentName}
              type="text"
              value={agent.name}
              onChange={handleAgentNameChange}
              placeholder={COPY.placeholders.agentName}
            />

            <Field
              id="agent-agency"
              label={COPY.fields.agentAgency}
              type="text"
              value={agent.agency}
              onChange={handleAgentAgencyChange}
              placeholder={COPY.placeholders.agentAgency}
            />

            <Field
              id="agent-phone"
              label={COPY.fields.agentPhone}
              type="text"
              value={agent.phone}
              onChange={handleAgentPhoneChange}
              placeholder={COPY.placeholders.agentPhone}
            />

            <Field
              id="agent-email"
              label={COPY.fields.agentEmail}
              type="text"
              value={agent.email}
              onChange={handleAgentEmailChange}
              placeholder={COPY.placeholders.agentEmail}
            />

            <div className="col-span-1 md:col-span-2">
              <Field
                id="agent-states"
                label={COPY.fields.agentStates}
                type="text"
                value={agent.states}
                onChange={handleAgentStatesChange}
                placeholder={COPY.placeholders.agentStates}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button
              id="save-profile-button"
              label={
                profileSaved
                  ? COPY.buttons.savedProfile
                  : COPY.buttons.saveProfile
              }
              onClick={handleSaveProfile}
              icon={profileSaved ? Check : undefined}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* Policy Library */}
      <div className={tokens.surface.card}>
        <div className={tokens.space.stack}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className={tokens.text.heading}>
                {COPY.sections.policyLibrary}
              </h2>
              <p className={tokens.text.helper}>
                {COPY.sections.policyLibraryHelper}
              </p>
            </div>

            {!editingPolicy && (
              <div className="flex justify-start md:justify-end">
                <Button
                  id="add-policy-button"
                  label={COPY.buttons.addPolicy}
                  onClick={handleStartAddPolicy}
                  icon={Plus}
                  variant="primary"
                />
              </div>
            )}
          </div>

          {/* Inline Add / Edit Policy Form */}
          {editingPolicy && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-4">
              <h3 className={tokens.text.label}>
                {isAddingNew
                  ? COPY.sections.newPolicyHeader
                  : COPY.sections.editPolicyHeader}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  id="draft-policy-name"
                  label={COPY.fields.policyName}
                  type="text"
                  value={editingPolicy.name}
                  onChange={handlePolicyDraftName}
                  placeholder={COPY.placeholders.policyName}
                />

                <Field
                  id="draft-policy-carrier"
                  label={COPY.fields.policyCarrier}
                  type="text"
                  value={editingPolicy.carrier}
                  onChange={handlePolicyDraftCarrier}
                  placeholder={COPY.placeholders.policyCarrier}
                />

                <Field
                  id="draft-policy-type"
                  label={COPY.fields.policyType}
                  type="select"
                  value={editingPolicy.type}
                  onChange={handlePolicyDraftType}
                  options={policyTypeOptions}
                />

                <Field
                  id="draft-policy-age-min"
                  label={COPY.fields.policyAgeMin}
                  type="number"
                  value={editingPolicy.ageMin}
                  onChange={handlePolicyDraftAgeMin}
                />

                <Field
                  id="draft-policy-age-max"
                  label={COPY.fields.policyAgeMax}
                  type="number"
                  value={editingPolicy.ageMax}
                  onChange={handlePolicyDraftAgeMax}
                />

                <Field
                  id="draft-policy-coverage-min"
                  label={COPY.fields.policyCoverageMin}
                  type="text"
                  value={editingPolicy.coverageMin}
                  onChange={handlePolicyDraftCoverageMin}
                  placeholder={COPY.placeholders.policyCoverageMin}
                />

                <Field
                  id="draft-policy-coverage-max"
                  label={COPY.fields.policyCoverageMax}
                  type="text"
                  value={editingPolicy.coverageMax}
                  onChange={handlePolicyDraftCoverageMax}
                  placeholder={COPY.placeholders.policyCoverageMax}
                />

                <div className="col-span-1 md:col-span-2">
                  <Field
                    id="draft-policy-selling-points"
                    label={COPY.fields.policySellingPoints}
                    type="textarea"
                    value={editingPolicy.sellingPoints}
                    onChange={handlePolicyDraftSellingPoints}
                    placeholder={COPY.placeholders.policySellingPoints}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Field
                    id="draft-policy-limitations"
                    label={COPY.fields.policyLimitations}
                    type="textarea"
                    value={editingPolicy.limitations}
                    onChange={handlePolicyDraftLimitations}
                    placeholder={COPY.placeholders.policyLimitations}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  id="save-policy-draft-button"
                  label={COPY.buttons.savePolicy}
                  onClick={handleSavePolicyForm}
                  variant="primary"
                />
                <Button
                  id="cancel-policy-draft-button"
                  label={COPY.buttons.cancelPolicy}
                  onClick={handleCancelPolicyForm}
                  variant="secondary"
                />
              </div>
            </div>
          )}

          {/* List of Policies */}
          <div className="flex flex-col gap-4">
            {policies.map((p) => {
              const isDeletingThis = pendingDeleteId === p.id;
              const handleEditThis = () => handleStartEditPolicy(p);
              const handleDeleteThis = () => handleAskDeletePolicy(p.id);

              return (
                <div
                  key={p.id}
                  className="p-6 bg-white border border-slate-200 rounded-lg flex flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className={tokens.text.label}>{p.name}</h4>
                      <p className={tokens.text.helper}>
                        {p.carrier} • {p.ageMin} - {p.ageMax} {COPY.options.yearsUnit} • {p.coverageMin} - {p.coverageMax}
                      </p>
                    </div>

                    {!isDeletingThis && (
                      <div className="flex items-center gap-2">
                        <Button
                          label={COPY.buttons.editPolicy}
                          onClick={handleEditThis}
                          icon={Edit2}
                          variant="secondary"
                        />
                        <Button
                          label={COPY.buttons.deletePolicy}
                          onClick={handleDeleteThis}
                          icon={Trash2}
                          variant="danger"
                          disabledReason={
                            policies.length <= 1 ? COPY.helpers.keepOnePolicy : null
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className={tokens.text.label}>
                        {COPY.fields.policySellingPoints}:
                      </span>
                      <p className={tokens.text.body}>{p.sellingPoints}</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={tokens.text.label}>
                        {COPY.fields.policyLimitations}:
                      </span>
                      <p className={tokens.text.body}>{p.limitations}</p>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation - No modal */}
                  {isDeletingThis && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
                      <p className={tokens.text.label}>
                        {COPY.helpers.deleteWarning}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          label={COPY.buttons.confirmDelete}
                          onClick={handleConfirmDelete}
                          variant="danger"
                        />
                        <Button
                          label={COPY.buttons.cancelDelete}
                          onClick={handleCancelDelete}
                          variant="secondary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
