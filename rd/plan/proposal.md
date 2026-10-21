# proposal.md: Research proposal (IdeaScientist report-writer format)

> Working title: **Failure Harvesting: Distilling System-2 Takeovers into Fast Visuomotor Policies**
> Hypotheses and predictions are stated before results; how each completed prediction turned out is recorded in the status table at the end, with the numbers in experimental_log.md.

## 1. Problem setting

- **Task distribution.** A long-horizon manipulation task with a set of initial configurations (layouts) C. The training layouts C_tr and the held-out layouts C_te do not overlap.
- **System 1 (π1).** A fast policy (a VLA or visuomotor policy) that outputs action chunks from images and joint state, replanning every N steps.
- **System 2 (π2).** A slow teacher with a failure detector D and an executor E.
  - D watches the run and decides when failure is imminent (dropped, empty grasp, tipped, stalled, late, not back at the start pose).
  - When D fires, E takes over a stretch (bounded inverse kinematics + skills) and then hands control back to π1.
  - Calling π2 has a cost: number of takeovers K and teacher control steps T.
- **Data sources.**
  - Native successes S_nat: successful episodes of π1 running alone.
  - Guided successes S_gui: successful episodes of π1 + π2. Within them, pre-takeover windows judged as "about to fail" and teacher segments that ended in a skill failure are not used as training starts.
- **Goal.**
  - Learn a System 1 π̂1 from the data such that, on C_te, (a) π̂1's own success rate is higher than a policy trained only on S_nat, and (b) when π2 is still available, π̂1 + π2 needs fewer calls (K, T) at equal or higher system success.

## 2. Core novelty

1. **The value of System 2 lies in coverage, not volume.**
   - We argue that S_gui's main value to System 1 is turning configurations π1 can never complete into successful demonstrations, not adding volume or correcting local action labels.
   - The verifiable consequences:
     - a volume-matched control using only native data does not improve;
     - guided data alone is not enough either;
     - only native + guided improves.
2. **System 2 call cost as a distillation target.**
   - Borrowing speculative decoding's "acceptance rate", we treat K and T as quantities distillation should reduce.
   - We show that imitating System 2 makes π̂1 + π2 call π2 less.
3. **For pretrained VLAs, use parameter isolation instead of weight-space fine-tuning.**
   - We measure the stability–plasticity conflict of fine-tuning pi0 on corrections: corrections are learned, but ordinary behaviour drifts.
   - We propose System 1.5: frozen VLA + learned gate + companion corrector.

## 3. Differences from the closest prior work

- vs **HG-DAgger / Sirius / ThriftyDAgger**:
  - our expert is an automatic System 2, so call cost is measurable;
  - we separate coverage from volume (volume-matched native control) and complementarity (guided-only control);
  - we evaluate on held-out configurations.
- vs **Hi Robot / YAY / GPT-as-Policy**: they keep System 2 in the deployment loop. We distill it into System 1 and quantify the reduction in calls.
- vs **MimicGen / DART / CCIL**: their coverage comes from synthesis or noise. Ours comes from a teacher taking over at the learner's real failure points.
- vs **CLEAR / DSRL / LoRA**: we measure on the same task that weight-space constraints cannot get both corrections and retention, and propose a structural alternative (I3).

## 4. Method

1. **Takeover-guided collection.**
   - π1 runs and D is checked every step. When it fires, the remaining chunk is discarded and E takes over.
   - At most 4 takeovers and 500 teacher steps per episode.
   - Native episodes in the same batch serve as the reference.
2. **Data curation.**
   - Successful episodes only.
   - Mask the student segment before each takeover (50 steps; 200 steps for a stall trigger) and teacher segments that ended in a skill failure.
   - Smooth teacher arm commands with a 5-step moving average.
3. **Student learning.**
   - Path A, a learner trained from scratch: a Diffusion Policy with three cameras and two observation frames, 16-step actions, executing 8 steps before replanning, trained on S_nat ∪ S_gui.
   - Path B, a pretrained VLA: frozen pi0, plus a gate g(o) (predicting D's firing from System 1 inputs), plus a corrector c(o) (trained on teacher segments). When g fires, c takes over, then hands back to pi0 (I3).
4. **Iteration (I4).**
   - Use π̂1 as the new student under π2 guidance, aggregate, retrain.
   - Track success, K, T and coverage per round.

## 5. Evaluation plan

- **Held-out set:** set2 layouts 40–54 × 8 policy seeds = 120 starts. Every model is compared in pairs on the same starts and seeds. Primary test: exact McNemar.
- **Controls:**
  - native only (equal episode count / equal total volume);
  - guided only (equal episode count / all);
  - native + guided;
  - training-seed replicate;
  - same-distribution check on training layouts.
- **System 2 cost:** guided mode on the same starts. Takeovers and teacher steps use a paired sign test; system success uses McNemar.
- **Coverage:** the number of training layouts with a successful demonstration; held-out gains broken down by pi0 difficulty.
- **Pretrained VLA:** offline indicators (held-out correction error, ordinary-state drift) gate which variants are simulated; closed-loop runs are paired against the original.

## 6. Falsifiable predictions and refutation conditions

| # | Prediction | Refuted if |
|---|---|---|
| P1 | The gain concentrates on held-out configurations that are hard for π1 | Every model is ≈0 on the hardest configurations and the gain is all on medium configurations (**→ refuted; revised to "improves generalization to medium configurations"**) |
| P2 | Volume-matched native-only does not reach native + guided | Equal-volume native ≥ native + guided |
| P3 | Guided-only is worse than native + guided (complementary) | Guided-only ≥ native + guided |
| P4 | π̂1 + π2 needs fewer calls than the native-only student + π2, with success no lower | K and T not significantly lower, or success lower |
| P5 | The second-round student (I4) beats the first, and calls fall further | Second round ≤ first, or calls do not fall |
| P6 | System 1.5 (frozen pi0 + gate + corrector) beats pi0 alone | ≤ pi0, or gate precision < 0.5 |
| P7 | Swapping System 2 for a general VLM planner (Astra) reproduces P2–P4 | Not reproduced |

## 7. Limitations

- The current System 2 is a privileged scripted teacher that reads simulator ground truth. Astra (a general VLM) is still being integrated.
- One task (stack_bowls), simulation only.
- The DP's absolute success is modest (15%), and the effect size varies across training seeds (+10.8 pp / +3.4 pp).
- The hardest configurations remain unsolved by every method.
- On the pretrained VLA, weight-space fine-tuning has not beaten the original.

## Prediction status (as of 2026-10-21; numbers in experimental_log.md)

| Prediction | Status |
|---|---|
| P1 | Refuted and revised (held-out gains are all on medium layouts) |
| P2 | Confirmed (equal-volume native 1/120 vs native + guided 13/120, p = 0.002) |
| P3 | Confirmed (guided only 4/120 vs native + guided 18/120, p = 0.001) |
| P4 | Confirmed (teacher steps −17%, p = 0.004; takeovers −12%, p = 0.046) |
| P5 | Pending (X1) |
| P6 | Pending (X2) |
| P7 | Pending (X4, Astra line) |
