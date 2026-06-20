export const PROVIDER_STAGES = {
  LEAD: 'Lead',
  SHORTLISTED: 'Shortlisted',
  EVALUATION: 'Evaluation',
  CONTRACTING: 'Contracting',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  RENEWAL_REVIEW: 'Renewal Review',
  REJECTED: 'Rejected',
  EXITED: 'Exited'
};

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const PROVIDER_PLAYBOOKS = {
  [PROVIDER_STAGES.LEAD]: [
    { title: 'Initial Outreach', description: 'Send introductory email to provider', dueDaysFromNow: 1, priority: 'Medium' },
    { title: 'Research Online Presence', description: 'Check website, LinkedIn, and reviews', dueDaysFromNow: 2, priority: 'Low' }
  ],
  [PROVIDER_STAGES.SHORTLISTED]: [
    { title: 'Request Capabilities Deck', description: 'Ask for detailed service overview', dueDaysFromNow: 2, priority: 'Medium' },
    { title: 'Schedule Discovery Call', description: '30-minute call to assess fit', dueDaysFromNow: 5, priority: 'High' }
  ],
  [PROVIDER_STAGES.EVALUATION]: [
    { title: 'Reference Check', description: 'Contact 2-3 existing clients', dueDaysFromNow: 3, priority: 'High' },
    { title: 'Scorecard Assessment', description: 'Complete internal evaluation scorecard', dueDaysFromNow: 5, priority: 'High' },
    { title: 'Compare Pricing', description: 'Analyze rate card against market', dueDaysFromNow: 4, priority: 'Medium' }
  ],
  [PROVIDER_STAGES.CONTRACTING]: [
    { title: 'Review NDA', description: 'Ensure NDA is signed and filed', dueDaysFromNow: 1, priority: 'Critical' },
    { title: 'Legal Review of Contract', description: 'Submit contract to legal for review', dueDaysFromNow: 5, priority: 'High' },
    { title: 'Negotiate Terms', description: 'Finalize payment terms and SLA', dueDaysFromNow: 7, priority: 'High' }
  ],
  [PROVIDER_STAGES.ACTIVE]: [
    { title: 'Onboarding Kickoff', description: 'Schedule kickoff meeting with team', dueDaysFromNow: 5, priority: 'High' },
    { title: 'System Access Setup', description: 'Grant necessary permissions', dueDaysFromNow: 2, priority: 'Medium' },
    { title: 'Set Quarterly Goals', description: 'Define KPIs for the first quarter', dueDaysFromNow: 14, priority: 'Medium' }
  ],
  [PROVIDER_STAGES.RENEWAL_REVIEW]: [
    { title: 'Performance Audit', description: 'Review past 12 months performance', dueDaysFromNow: 5, priority: 'High' },
    { title: 'Market Rate Check', description: 'Verify if pricing is still competitive', dueDaysFromNow: 7, priority: 'Medium' },
    { title: 'Renewal Negotiation', description: 'Discuss terms for renewal', dueDaysFromNow: 14, priority: 'High' }
  ]
};