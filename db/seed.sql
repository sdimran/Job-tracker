-- Seed data: postings from the Aug 12, 2026 daily briefing
-- Run after schema.sql

insert into postings
  (role_category, title, company, location, work_type, employment_type, salary_range, description, apply_url, linkedin_name, linkedin_title, linkedin_url, source, date_found)
values
('AI Product Manager','Senior Product Manager, AI Strategy','Varicent','Canada','Remote','Full-time',null,
 'Owns 0-to-1 strategy and roadmap for Varicent''s new AI products and agents in enterprise sales-performance management.',
 'https://job-boards.greenhouse.io/varicent/jobs/5317523008', null, null, null, 'Greenhouse', '2026-08-12'),

('AI Product Manager','Senior Product Manager, AI & Data Analytics Platform','Caseware','Toronto, ON','Hybrid','Full-time',null,
 'Leads vision and roadmap for Caseware''s AI-powered Data Analytics Platform and its AI Digital Assistant (AiDA).',
 'https://jobs.lever.co/caseware/8ca58c7e-326b-4a81-bd3a-1276e9c15e62', 'Maira Russo', 'Senior Talent Acquisition Partner', null, 'Lever', '2026-08-12'),

('AI Product Manager','Product Manager | AI','Grafana Labs','Canada','Remote','Full-time',null,
 'Drives the roadmap for the Grafana Assistant/AI ecosystem across R&D and GTM.',
 'https://job-boards.greenhouse.io/grafanalabs/jobs/5795334004', 'Lauren Godfrey', 'Senior Recruiter', 'https://www.linkedin.com/in/lauren-godfrey-weaver-0a69853b/', 'Greenhouse', '2026-08-12'),

('AI Product Manager','Senior Product Manager, AI & 3rd Party Products','JLL','Toronto, ON','Hybrid','Full-time',null,
 'Owns AI-powered Occupancy Planning and Sustainability products, layering agentic AI on third-party platforms.',
 'https://ca.indeed.com/viewjob?jk=a9742637e48de9e1', 'La Reina Cheney', 'Sr. Director, Talent Acquisition', 'https://www.linkedin.com/in/lareina/', 'Indeed', '2026-08-12'),

('AI Product Manager','Senior Product Manager (AI Portfolio)','Vena Solutions','Canada','Remote','Full-time','$132,090–$178,710 CAD',
 'Owns the AI product portfolio (incl. Vena Copilot) for Vena''s Excel-native FP&A platform.',
 'https://www.lifeatvena.com/postings/0b537e2f-3522-4d4d-9b13-90cedf7bc414', null, null, null, 'Pinpoint', '2026-08-12'),

('Product Manager','Technical Product Manager, Native Integrations','Docebo','Toronto, ON','Hybrid','Full-time','$118.5K–$158K CAD',
 'Owns Docebo''s native HRIS/CRM connector portfolio for its AI-powered learning platform.',
 'https://ca.indeed.com/viewjob?jk=c2b5956bc02f677c', 'Jennifer Reed', 'Talent Acquisition', 'https://www.linkedin.com/in/jenniferreed892/', 'Indeed', '2026-08-12'),

('Product Manager','Product Manager (Contract)','Statflo','Toronto, ON','Hybrid','Contract','$90K–$120K CAD',
 'Owns roadmap and delivery for Statflo''s sales-acceleration / customer-conversation SaaS platform. 12-month maternity leave coverage.',
 'https://ca.indeed.com/viewjob?jk=d3447b6c7a707912', null, null, null, 'Indeed', '2026-08-12'),

('Product Manager','Principal Product Manager','Employer undisclosed (via Jobgether)','Canada','Remote','Full-time',null,
 'Leads product strategy for administration/workspace-management experiences on a large-scale global SaaS collaboration platform.',
 'https://jobs.lever.co/jobgether/245ffcff-55ca-477f-af43-9b1e51415b66', null, null, null, 'Lever (Jobgether)', '2026-08-12'),

('Product Owner','Product Owner – Digital Products','247 Labs','Remote (GTA-based)','Remote','Full-time / Contract',null,
 'Owns end-to-end lifecycle for client digital products at this Toronto-headquartered software development firm.',
 'https://ca.indeed.com/viewjob?jk=b057c6298579224f', 'Preethi Venkataswamy', 'HR Manager', 'https://ca.linkedin.com/in/preethi-venkataswamy', 'Indeed', '2026-08-12'),

('Product Owner','HRSD Functional Product Owner','Employer undisclosed (via Jobgether)','Canada','Remote','Full-time','$118,000–$141,000 CAD',
 'Owns the ServiceNow HRSD functional backlog for an enterprise HR-service transformation program.',
 'https://jobs.lever.co/jobgether/dd63535c-28bf-4d27-9c3e-5b9174c7a5cd', null, null, null, 'Lever (Jobgether)', '2026-08-12'),

('Product Owner','Product Owner, Card Programs','Flex (Flexbase Technologies)','Remote (Canada eligible)','Remote','Full-time',null,
 'Owns Flex''s card programs (ledger, processing, servicing, BIN sponsor & network relationships).',
 'https://jobs.lever.co/Flex/1fad631d-1808-49bf-960d-c3413c9c5487', 'Chris Fowlkes', 'Flexbase talent/recruiting', 'https://www.linkedin.com/in/christopherfowlkes/', 'Lever', '2026-08-12'),

('Agile Coach','Senior Project Manager/Scrum Master','Apply Digital (APPLY)','Canada','Remote','Full-time',null,
 'Primary Scrum Leader for multiple squads delivering agentic CX programs for enterprise clients.',
 'https://jobs.lever.co/applydigital/24a4efca-ff19-406f-86ba-e0d9617163c7', null, null, null, 'Lever', '2026-08-12');
