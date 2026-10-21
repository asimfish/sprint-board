# next_experiments.md: Experiment plan and assignments (2026-10-21)

Principle: the plan and its decision rules are written down before results arrive. I (Claude) own the plan, the ideas and the acceptance of results; execution goes to the codex agents first. Every result must state its pairing, sample size, exact p, and whether it is NOT_RUN.

| # | Experiment | Prediction tested | Owner | Resources | Decision rule (set in advance) |
|---|---|---|---|---|---|
| X1 | **Iterative fading guidance (round 2)**: System 2 guides student dpG on the training layouts (110 layouts × 2 seeds); its guided successes are aggregated with round 1 to train dpR2 (training seeds 0 and 1); dpR2 is then compared with dpG on the same 120 held-out starts | P5 | Claude (on the existing Zenith pipeline, fastest) | PRO6000 low-priority jobs | dpR2 > dpG (pooled over both training seeds, exact McNemar p < 0.05), and round-2 collection teacher steps < round 1 |
| X2 | **System 1.5**: frozen pi0 + learned gate (trained on System 2 trigger labels, System 1 inputs only) + DP corrector (trained on teacher segments) | P6 | asbs_模仿_cc implements the modules and CPU self-tests; Claude integrates and runs | CPU; then PRO6000 | Held-out pi0+S1.5 > pi0 (McNemar p < 0.05); gate precision ≥ 0.5 |
| X3 | **Coverage ablation**: remove the guided episodes on "only guided" layouts (33), keep the rest, retrain DP | I2 falsification | Claude | PRO6000 | If the gain does not drop, the coverage explanation is refuted |
| X4 | **Swap System 2 for Astra (general VLM planner)**: same takeover protocol; collect Astra-guided successes; repeat dpN vs dpN+Astra-guided | P7 | asbs_模仿 (continue its Astra / 5090 line) | 5090 | Astra-guided success rate > native; dpN+Astra > dpN (McNemar p < 0.05) |
| X5 | **Paper draft**: run the PaperOrchestra pipeline on idea.md / experimental_log.md (literature review, outline, figures, sections) | — | asbs_模仿_cc | CPU | A compilable draft; every number traceable to experimental_log.md |

## Risks and countermeasures

- **Shared storage (DATA).** Every concurrent episode briefly needs about 1 GB, and a worker refuses to start with < 100 GB free. Keep at most 4 concurrent evaluation jobs, and clean up our own regenerable files before each batch.
- **DP training variance** (+10.8 pp vs +3.4 pp across training seeds). Every new DP conclusion uses ≥ 2 training seeds.
- **Hardest held-out layouts unsolved by every method.** In the paper this is written as a limitation; we do not pick layouts.
