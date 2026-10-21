# innovations.md: Cross-domain mechanism transfer (IdeaScientist innovator format)

Each candidate block records:
- the source mechanism and its paper;
- the target gap it addresses;
- how it maps onto our setting;
- the condition the transfer depends on;
- the current evidence (completed / pending);
- the falsifiable prediction.

---

## I1. Speculative decoding: draft and verify → "System 2 call rate = 1 − acceptance rate"

- **Source.** Fast Inference from Transformers via Speculative Decoding (2211.17192), an LLM inference mechanism. A small draft model proposes tokens and a large model verifies them. The acceptance rate measures how closely the two distributions agree, and distilling the large model into the draft model raises the acceptance rate.
- **Target gap.** G-B1 / G-A2.
- **Mapping.**
  - System 1 = the draft model: it proposes an action chunk every N steps.
  - System 2 = the verifier: its failure detector judges "about to fail" and takes over.
  - Takeovers / teacher steps = rejections.
  - Imitating System 2 data = distilling the verifier's distribution into the draft model. It should raise the acceptance rate, i.e. reduce System 2 calls, without lowering system success.
- **Transfer condition.** System 2 interventions must be triggered by cheap, verifiable checks (here: geometry-based detection of dropped, empty grasp, tipped, stalled), and System 1 must replan after hand-back.
- **Evidence (completed).**
  - DP student + the same System 2, 100 pairs.
  - Students trained with System 2 data: takeovers 2.08 → 1.82 (−12%, p = 0.046), teacher steps 358 → 298 (−17%, p = 0.004), system success 14 → 23 / 100.
  - pi0 HGD showed no such reduction (2.02 vs 1.98).
- **Falsifiable prediction.** If the loop is iterated (I4), the call rate should keep falling as the student improves. It is refuted if the second-round call rate is not lower than the first.

## I2. Online hard example mining (OHEM) → "System 2 as a failure-region coverage operator"

- **Source.** Training Region-based Object Detectors with Online Hard Example Mining (1604.03540), from object detection. Concentrating training on the samples the model gets wrong is more efficient than sampling uniformly.
- **Target gap.** G-A1 / G-C1 / G-C2.
- **Mapping.**
  - System 2 does not collect data uniformly. It takes over exactly where System 1 is about to fail, so the successful demonstrations it harvests land in System 1's failure region (hard examples).
  - System 1's own successes provide the easy samples and in-distribution consistency.
  - The two are complementary: hard examples alone are hard to learn from (mixed motion styles), and easy examples alone generalize poorly.
- **Transfer condition.** System 2 must be able to succeed in some configurations where System 1 fails. Verified: 33 training layouts that pi0 never completed alone have guided successes.
- **Evidence (completed).**
  - Held-out layouts, 120 pairs:
    - native 58 episodes: 5/120;
    - native 111 episodes (≈ equal volume): 1/120;
    - guided only: 4/120;
    - native + guided: 18/120 (p = 0.002) and 13/120 (vs equal-volume native, p = 0.002).
  - Coverage: after 818 native episodes, 24 training layouts still have only guided successes.
- **Revision (the P1 check refuted the initial version).**
  - Originally predicted: "the gains concentrate on the held-out layouts that are hardest for pi0".
  - Actual: on the 5 held-out layouts where pi0 succeeds < 10%, every DP gets 0–1/40; all the gains are on medium-difficulty layouts (dpN 5/80 → dpG 18/80).
  - Revised statement: hard-case coverage in the training distribution improves generalization to unseen medium configurations, but does not solve the hardest configurations.
- **Falsifiable prediction.** If the guided data is subsampled down to layouts that System 1 can already complete (removing the "only guided" layouts), the gain should disappear. It is refuted if the gain stays the same after that subsampling.

## I3. Progressive networks / parameter isolation → "System 1.5: frozen VLA + companion corrector + learned gate"

- **Source.**
  - Progressive Neural Networks (1606.04671): freeze the old network and add a new column, avoiding forgetting.
  - Combined with speculative decoding's "decide whether to accept".
- **Target gap.** G-D1 / G-B2.
- **Mapping.**
  - The pretrained VLA (pi0) stays fully frozen.
  - A companion corrector is trained from scratch on System 2 correction segments (the same architecture as DP).
  - A learned gate predicts "System 2 would take over now" from System 1's inputs only (images and joints), trained on the detector trigger labels from guided episodes.
  - At deployment there is no System 2. When the gate fires, the corrector runs a stretch of the episode and then hands control back to pi0. This distills System 2's "when" (detector) and its "how" (actions) into a System-1-side module separately.
- **Transfer condition.**
  - The gate must reach usable precision and recall from System 1 inputs alone.
  - The corrector must succeed in the states where takeover happens.
  - The DP evidence suggests System 2 data can be learned by a separate network.
- **Evidence.**
  - Indirect: weight-space fine-tuning of pi0 has hit the trade-off. HGD −6 pp; native replay ×3 −11 pp; anchoring e2 −2 pp, still no gain.
  - A DP trained from scratch can absorb System 2 data (4 → 15%).
- **Falsifiable prediction.** On held-out layouts, success of frozen pi0 + gate + corrector should exceed pi0 alone. It is refuted if success ≤ pi0, or if gate precision < 0.5.

## I4. Scaffolding with fading / DAgger iteration → "fading System 2 guidance across iterations"

- **Source.** DAgger (1011.0686): iteratively aggregate data on the learner's own distribution. Combined with the scaffolding-then-fading idea from education.
- **Target gap.** G-A2 / G-B1.
- **Mapping.**
  - Round 1: System 2 guides pi0, and a DP is trained.
  - Round 2: System 2 guides that DP itself (the guided data is now on the student's own distribution); aggregate and retrain.
  - As the student gets stronger, System 2 intervenes less.
  - Track per round: success, takeovers, teacher steps, and the number of layouts with a successful demonstration.
- **Transfer condition.** The student must already run in guided mode. In place: the `dpguided` mode has completed 100 paired runs.
- **Evidence.** Pending; in progress as X1.
- **Falsifiable prediction.** The second-round student (dpR2) should beat dpG on the same 120 held-out pairs. It is refuted if it is no better.
