export type ScoreInput = {
  needExpressed: boolean;
  clearPain: boolean;
  businessImpact: boolean;
  decisionMaker: boolean;
  budgetDiscussed: boolean;
  timingKnown: boolean;
  positiveInterest: boolean;
  concreteNextStep: boolean;
  riskSignals: number;
  objections: number;
};

export function calculateCommercialScore(input: ScoreInput): number {
  const positives = [
    input.needExpressed ? 16 : 0,
    input.clearPain ? 14 : 0,
    input.businessImpact ? 14 : 0,
    input.decisionMaker ? 12 : 0,
    input.budgetDiscussed ? 10 : 0,
    input.timingKnown ? 10 : 0,
    input.positiveInterest ? 12 : 0,
    input.concreteNextStep ? 12 : 0
  ].reduce((sum, value) => sum + value, 0);

  const penalties = Math.min(24, input.riskSignals * 6 + input.objections * 3);
  return Math.max(0, Math.min(100, positives - penalties));
}

export function scoreLabel(score: number): string {
  if (score >= 82) return "Tres chaud";
  if (score >= 65) return "Bon potentiel";
  if (score >= 45) return "A clarifier";
  return "Risque eleve";
}
