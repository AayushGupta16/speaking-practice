export type PromptCategory =
  | 'warmup'
  | 'storytelling'
  | 'values'
  | 'hypothetical'
  | 'improv'
  | 'debate'
  | 'explain'
  | 'interview'
  | 'yc'
  | 'current-event'
  | 'leadership';

export type SpeakingPrompt = {
  id: string;
  category: PromptCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  coachingFocus: string;
  structureHint: string;
};

export const promptCategories: Record<PromptCategory, string> = {
  warmup: 'Warmups',
  storytelling: 'Storytelling',
  values: 'Values & tradeoffs',
  hypothetical: 'Hypotheticals',
  improv: 'Improv constraints',
  debate: 'Persuasion & debate',
  explain: 'Explain clearly',
  interview: 'Interview / STAR',
  yc: 'YC / startup',
  'current-event': 'Topic or event',
  leadership: 'Leadership',
};

export const prompts: SpeakingPrompt[] = [
  { id: 'w1', category: 'warmup', difficulty: 'easy', text: 'What everyday habit do you think more people should adopt?', coachingFocus: 'Low-pressure opinion fluency', structureHint: 'Claim → reason → example → takeaway' },
  { id: 'w2', category: 'warmup', difficulty: 'easy', text: 'Which small inconvenience would you permanently remove from modern life?', coachingFocus: 'Specific examples and light persuasion', structureHint: 'Problem → why it matters → fix' },
  { id: 'w3', category: 'warmup', difficulty: 'easy', text: 'What is an underrated way to spend 30 free minutes?', coachingFocus: 'Warm vocal energy', structureHint: 'Answer → example → invitation' },
  { id: 'w4', category: 'warmup', difficulty: 'easy', text: 'Describe your morning routine as if it were a product demo.', coachingFocus: 'Energy, clarity, and concise sequencing', structureHint: 'Feature → benefit → proof' },
  { id: 's1', category: 'storytelling', difficulty: 'medium', text: 'Tell a story about a time you changed your mind.', coachingFocus: 'Narrative arc and emotional specificity', structureHint: 'Before → turning point → after' },
  { id: 's2', category: 'storytelling', difficulty: 'medium', text: 'Tell a two-minute story about a small mistake that taught you something useful.', coachingFocus: 'Setup, tension, resolution', structureHint: 'Setup → mistake → lesson' },
  { id: 's3', category: 'storytelling', difficulty: 'medium', text: 'Describe a moment when you felt proud but did not say much about it.', coachingFocus: 'Emotional detail and pacing', structureHint: 'Scene → action → meaning' },
  { id: 's4', category: 'storytelling', difficulty: 'medium', text: 'Share a memory of receiving advice you did not appreciate until later.', coachingFocus: 'Reflection and takeaway', structureHint: 'Advice → resistance → realization' },
  { id: 'v1', category: 'values', difficulty: 'medium', text: 'Would you rather be consistently reliable or occasionally brilliant?', coachingFocus: 'Tradeoff reasoning', structureHint: 'Position → tradeoff → example' },
  { id: 'v2', category: 'values', difficulty: 'hard', text: 'When is it better to quit than to persist?', coachingFocus: 'Nuance and judgment', structureHint: 'Principle → boundary → example' },
  { id: 'v3', category: 'values', difficulty: 'medium', text: 'What should matter more in a decision: intention or outcome?', coachingFocus: 'Balanced argumentation', structureHint: 'Both sides → your view → caveat' },
  { id: 'h1', category: 'hypothetical', difficulty: 'medium', text: 'If meetings were banned for one month, what would improve and what would break?', coachingFocus: 'Scenario reasoning', structureHint: 'Upside → downside → policy' },
  { id: 'h2', category: 'hypothetical', difficulty: 'medium', text: 'If every adult had to teach one short class, what should yours be?', coachingFocus: 'Personal positioning', structureHint: 'Class → why you → outcome' },
  { id: 'h3', category: 'hypothetical', difficulty: 'hard', text: 'If your future self sent you a two-sentence warning, what might it say?', coachingFocus: 'Specificity and vulnerability', structureHint: 'Warning → context → action' },
  { id: 'i1', category: 'improv', difficulty: 'medium', text: 'A toaster, a calendar, and a bicycle are involved in a business idea. Pitch it.', coachingFocus: 'Playfulness and coherent improvisation', structureHint: 'Premise → customer → pitch' },
  { id: 'i2', category: 'improv', difficulty: 'hard', text: 'Explain why a library should hire a professional hype person.', coachingFocus: 'Commitment to a premise', structureHint: 'Absurd claim → real benefit → close' },
  { id: 'i3', category: 'improv', difficulty: 'medium', text: 'Pitch a completely ordinary object as if it were a breakthrough invention.', coachingFocus: 'Vocal variety and conviction', structureHint: 'Hook → demo → transformation' },
  { id: 'd1', category: 'debate', difficulty: 'medium', text: 'Argue that meetings should be replaced by short recorded videos.', coachingFocus: 'Persuasion and counterarguments', structureHint: 'Claim → evidence → objection → close' },
  { id: 'd2', category: 'debate', difficulty: 'hard', text: 'Defend the opposite of your actual opinion on remote work.', coachingFocus: 'Intellectual flexibility', structureHint: 'Opposing thesis → best evidence → concession' },
  { id: 'd3', category: 'debate', difficulty: 'medium', text: 'Convince a team to choose the slower but more durable solution.', coachingFocus: 'Executive persuasion', structureHint: 'Risk → investment → payoff' },
  { id: 'e1', category: 'explain', difficulty: 'easy', text: 'Explain a technical concept you know well to a smart 12-year-old.', coachingFocus: 'Plain language and analogies', structureHint: 'Analogy → mechanics → why it matters' },
  { id: 'e2', category: 'explain', difficulty: 'medium', text: 'Explain how a recommendation algorithm might shape someone’s choices.', coachingFocus: 'Causal explanation', structureHint: 'Input → system → consequence' },
  { id: 'e3', category: 'explain', difficulty: 'easy', text: 'Explain the difference between being busy and being effective.', coachingFocus: 'Simple contrast structure', structureHint: 'Definition → contrast → example' },
  { id: 'int1', category: 'interview', difficulty: 'medium', text: 'Tell me about a time you handled ambiguous instructions.', coachingFocus: 'STAR structure and specificity', structureHint: 'Situation → task → action → result' },
  { id: 'int2', category: 'interview', difficulty: 'hard', text: 'What is your biggest professional weakness, and what are you doing about it?', coachingFocus: 'Candor without self-sabotage', structureHint: 'Weakness → impact → system' },
  { id: 'int3', category: 'interview', difficulty: 'medium', text: 'Tell me about a project that did not go as planned.', coachingFocus: 'Ownership and STAR structure', structureHint: 'Situation → action → lesson' },
  { id: 'yc1', category: 'yc', difficulty: 'hard', text: 'What are you building, who needs it urgently, and why now?', coachingFocus: 'Founder clarity and urgency', structureHint: 'Product → customer → urgency' },
  { id: 'yc2', category: 'yc', difficulty: 'hard', text: 'A YC partner says your market sounds too small. Respond in 90 seconds.', coachingFocus: 'Calm objection handling', structureHint: 'Acknowledge → wedge → expansion' },
  { id: 'yc3', category: 'yc', difficulty: 'hard', text: 'What evidence would convince a skeptical person that this problem is real?', coachingFocus: 'Traction and proof', structureHint: 'Signal → source → implication' },
  { id: 'yc4', category: 'yc', difficulty: 'hard', text: 'If you had only 60 seconds with an investor, what should they remember?', coachingFocus: 'Memorable compression', structureHint: 'Hook → proof → ask' },
  { id: 'ce1', category: 'current-event', difficulty: 'medium', text: 'Pick a recent event and explain the strongest argument on both sides.', coachingFocus: 'Balanced framing', structureHint: 'Context → side A → side B → view' },
  { id: 'ce2', category: 'current-event', difficulty: 'medium', text: 'Pick a recent event and explain what most people are missing about it.', coachingFocus: 'Original insight', structureHint: 'Common take → missing angle → why it matters' },
  { id: 'ce3', category: 'current-event', difficulty: 'hard', text: 'Explain a recent launch, policy, or cultural moment to someone who has no context.', coachingFocus: 'Context setting', structureHint: 'What happened → why now → consequences' },
  { id: 'l1', category: 'leadership', difficulty: 'medium', text: 'Give your team a one-minute update after a project slips by two weeks.', coachingFocus: 'Accountability and confidence', structureHint: 'Status → cause → plan → ask' },
  { id: 'l2', category: 'leadership', difficulty: 'hard', text: 'A teammate is defensive after feedback. Explain how you would reset the conversation.', coachingFocus: 'Tact and clarity', structureHint: 'Validate → clarify → next step' },
];

export function buildCustomPrompt(topic: string) {
  return {
    text: `Speak for 60-120 seconds about ${topic}. Start with your position, give two concrete points, and end with a memorable takeaway.`,
    coachingFocus: 'User-requested topic/event practice',
    structureHint: 'Position → two points → takeaway',
  };
}
