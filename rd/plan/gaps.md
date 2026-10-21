# gaps.md: Gap finding (IdeaScientist format)

Project: distilling System 2 (slow, takes over to rescue a run) into System 1 (fast visuomotor policy).
Testbed: RoboDojo stack_bowls, dual-arm arx_x5, official pi0 checkpoint.

Each axis follows the gap-finder schema:
- a mechanism-level summary of prior work;
- at most two gaps, each stated as one contrast-form sentence;
- near-miss papers and the reason each falls short.

All papers below were checked by arXiv id (2026-10-21).

---

## Axis A: interactive imitation (an expert intervenes, then the learner imitates)

**Mechanism summary.**
- The learner executes while an expert intervenes at the right moments; the intervention labels are aggregated into the training set.
- DAgger has the expert label every visited state.
- HG-DAgger collects labels only during human takeovers.
- Sirius re-weights samples by intervention, pre-intervention and autonomous segments.
- RLIF treats "an intervention happened" as a negative reward and runs RL.
- ThriftyDAgger and LazyDAgger use novelty / risk gates to reduce how often a human is called.
- What they share: the expert is a **human**, the value of an intervention is understood as **correcting the learner's local action labels**, and evaluation is usually on the training distribution.

**Gaps.**
- G-A1: Prior work treats interventions as corrections of local action labels; nobody has separated whether their value comes from **coverage of new task configurations** (failure regions the learner can never reach turned into successful demonstrations) or from the corrective actions themselves.
- G-A2: Prior work uses humans as the expert, whose cost cannot be measured precisely; nobody uses an **automatic System 2** as the expert and treats "System 2 calls / teacher steps" as a measurable cost that distillation should reduce.

**Near misses.**
- DAgger (1011.0686): needs the expert to label every state; no automatic System 2; does not separate coverage from correction.
- HG-DAgger (1810.02890): collects only takeover segments; uses human experts; no volume-matched control.
- Sirius (2211.08416): weights by intervention, but its value analysis targets the same in-distribution task, with no held-out configurations and no volume-matched control.
- RLIF (2311.12996): turns interventions into a reward signal; requires RL and does not address dataset coverage.
- ThriftyDAgger (2109.08273) / LazyDAgger (2104.00053): reduce how often a human is asked for help, but by **gating when to ask**, not by making the learner itself need less help.

---

## Axis B: System 2 / hierarchical guidance for VLAs

**Mechanism summary.**
- A slow model (VLM/LLM, or a model with privileged information) gives high-level instructions or takes over directly when the fast policy is about to fail.
- Hi Robot uses a VLM to generate language sub-instructions for a VLA.
- Yell At Your Robot (YAY) uses human language corrections to improve the high-level policy.
- GPT-as-Policy has the LLM produce a few steps when failure is imminent, then hands control back to the VLA.
- π*0.6 / RECAP uses outcome-based advantage conditioning to learn from experience.
- What they share: System 2 is **called at deployment time**. The improvement mostly happens inside the high-level policy or language interface; the low-level fast policy itself does not absorb System 2's abilities.

**Gaps.**
- G-B1: Prior hierarchical methods keep System 2 permanently in the deployment loop; it has not been shown that imitation can **internalize System 2's rescues into a stand-alone System 1 that needs System 2 less**, nor has the reduction in calls been measured.
- G-B2: Prior work fine-tunes a pretrained VLA directly on correction data; the **stability–plasticity conflict** this creates (learning the corrections drags the ordinary behaviour along) has not been quantified, and no structural way around it has been given.

**Near misses.**
- Hi Robot (2502.19417): System 2 always runs as the high-level planner and is never distilled into the low level.
- Yell At Your Robot (2403.12910): the corrections improve the high-level language policy; low-level skills are fixed.
- π*0.6 / RECAP (2511.14759): needs a value function and failure transitions, which is not the same as taking over to rescue a run.
- GPT-as-Policy (anonymous report, referenced by the user): defines the "about to fail → slow model takes over a few steps → hand back" protocol, but does not study imitating those trajectories.
- Distilling System 2 into System 1 (2407.06023): distillation of LLM reasoning, with no embodied control and no notion of coverage.

---

## Axis C: data composition and coverage in imitation learning

**Mechanism summary.**
- Imitation success depends on demonstration diversity: the data scaling laws find that the number of environments/objects matters more than the number of demonstrations.
- MimicGen synthesizes new configurations from a few human demonstrations.
- DART injects noise to obtain off-trajectory recovery data.
- CCIL generates correction labels using dynamics continuity.
- What they share: coverage is obtained by **generation or perturbation**, without regard to where the learner actually fails.

**Gaps.**
- G-C1: Prior work expands coverage by synthesis or noise; nobody has used a **slow teacher to take over at the learner's real failure points**, harvesting successful demonstrations of exactly the configurations the learner cannot reach, and then shown that this beats adding more of the learner's own successes.
- G-C2: Prior work assumes "more demonstrations from the same source = better"; it has not been examined that one source alone (only native successes, or only guided episodes) can be **complementarily insufficient**.

**Near misses.**
- Data Scaling Laws in IL (2410.18647): shows diversity matters more than count, but diversity comes from collecting new environments, not from a teacher taking over at failure points.
- MimicGen (2310.17596): coverage via synthesis, which needs object-centric segment annotations and does not use the learner's failures.
- DART (1703.09327) / CCIL (2310.12972): local recovery data near the expert trajectory, not configuration-level coverage.

---

## Axis D: adapting pretrained policies without forgetting

**Mechanism summary.**
- CLEAR mixes replay with behaviour cloning of the old policy to prevent forgetting.
- Progressive Networks freeze the old network and add a new column.
- DSRL keeps the diffusion/flow policy fully frozen and learns only the input noise.
- LoRA trains only a low-rank increment.
- What they share: preserving old abilities is prioritized and new abilities are added via a constrained update.

**Gaps.**
- G-D1: Weight-space constraints (replay, anchoring, LoRA) **compete with each other** when learning a few corrections; parameter isolation (freeze the base policy, add a companion corrector and a learned gate) has not been compared against them on VLA correction distillation.

**Near misses.**
- CLEAR (1811.11682): an anchor (a cloning term toward the old policy). In our measurements it brings drift back to near the floor, but the corrections are then barely learned.
- DSRL (2506.15799): weights frozen, but it targets RL fine-tuning and does not use System 2 correction data.
- Progressive Neural Networks (1606.04671): parameter isolation; designed for multi-task transfer, with no "when to switch" gate.
