# next_experiments.md: Experiment plan and assignments (2026-10-21)

Principle: the plan and its decision rules are written down before results arrive. I (Claude) own the plan, the ideas and the acceptance of results; execution goes to the codex agents first. Every result must state its pairing, sample size, exact p, and whether it is NOT_RUN.

| # | Experiment | Prediction tested | Owner | Resources | Decision rule (set in advance) |
|---|---|---|---|---|---|
| X1 | **Iterative fading guidance (round 2)**: System 2 guides student dpG on the training layouts (110 layouts × 2 seeds); its guided successes are aggregated with round 1 to train dpR2 (training seeds 0 and 1); dpR2 is then compared with dpG on the same 120 held-out starts | P5 | Claude | GPU cluster (low priority) | dpR2 > dpG (pooled over both training seeds, exact McNemar p < 0.05), and round-2 collection teacher steps < round 1 |
| X2 | **System 1.5**: frozen pi0 + learned gate (trained on System 2 trigger labels, System 1 inputs only) + DP corrector (trained on teacher segments) | P6 | asbs_模仿_cc implements the modules and CPU self-tests; Claude integrates and runs | CPU; then GPU cluster | Held-out pi0+S1.5 > pi0 (McNemar p < 0.05); gate precision ≥ 0.5 |
| X3 | **Coverage ablation**: remove the guided episodes on "only guided" layouts (33), keep the rest, retrain DP | I2 falsification | Claude | GPU cluster | If the gain does not drop, the coverage explanation is refuted |
| X4 | **Swap System 2 for Astra (general VLM planner)**: same takeover protocol; collect Astra-guided successes; repeat dpN vs dpN+Astra-guided | P7 | asbs_模仿 (continue its Astra line) | local GPU | Astra-guided success rate > native; dpN+Astra > dpN (McNemar p < 0.05) |
| X5 | **Paper draft**: run the PaperOrchestra pipeline on idea.md / experimental_log.md (literature review, outline, figures, sections) | — | asbs_模仿_cc | CPU | A compilable draft; every number traceable to experimental_log.md |

## Status (2026-10-21 10:16Z)

- **X1**: round-2 collection done (Table 10: 82/220 guided successes, teacher steps −24% vs round 1; secondary rule met). dpR2 training (rd-il1-dp-20261021-r, seeds 0/1) running; held-out evaluation dpe-20261021-ra/rb is submitted automatically.
- **X2**: gate v1 failed the pre-registered precision criterion on test (0.105; recall 0.005; Table 11); P6 (v1) is not supported. The closed-loop evaluation is NOT_RUN. **X2b** pre-registered: gate v2 (40 epochs, best validation-AUROC epoch, ±6 px shift, same data, split and rule). It proceeds to closed loop only if test precision ≥ 0.5 and test recall ≥ 0.05. **Result (10:48Z): v2 test precision 0.429, recall 0.014, AUROC 0.711 → criterion failed; P6 is not supported with a learned visible-input gate; closed loop NOT_RUN; no further gate tuning.**
- **X2c** (pre-registered 10:49Z): detection/correction decomposition. The privileged System 2 detector decides when; the teacher-segment DP corrector dpC acts (≤ 150 controls per trigger, ≤ 4 triggers, 0 teacher actions). It is compared with pi0 alone on 120 paired held-out starts. pi0 + S2 monitor + dpC > pi0 (p < 0.05) would mean the imitated corrections are useful and detection is the bottleneck. The cc agent implements the external-trigger facade mode and the loop branch (task G); Claude integrates and runs it.
- **X3**: pre-registered and launched early (resources were free). dpGnov (58 native + 43 guided on 33 novel layouts) vs dpGovl (58 native + 41 guided on 27 native-covered layouts), seeds 0/1, then 120 held-out paired starts each.
- **X4**: still blocked (needs a send-scoped asbs_模仿 token).
- **X5**: draft v1 compiled (12 pages, 0 LaTeX errors, 0 overfull boxes) at draft_v1/paper.pdf. One open placeholder remains: the RoboDojo citation.

**Pooling clarification (11:42Z, written before any dpR2 / X3 outcome).** The original X1 rule did not say how dpG's two training seeds pair with dpR2's, so the rule is clarified here. Arms are paired by training seed: dpR2 with dpG at seed 0 and dpR2s with dpG2 at seed 1; for X3, both arms are paired within each seed. A start is a (layout, policy seed) pair; if it is missing in either arm, it is dropped from both, with no reruns. Discordant pairs are summed over the two seeds for one exact two-sided McNemar test. The rule holds only if the direction is correct and p < 0.05. Per-seed results are reported descriptively. No multiplicity correction is applied.

## Status (2026-10-21 19:45Z): evaluations blocked by shared storage

- All models have finished training: dpR2/dpR2s, dpGnov/dpGovl/dpGnov2/dpGovl2, and the corrector dpC.
- Every evaluation episode needs at least 100 GiB free on the shared DATA filesystem before it starts. That 10 TB filesystem is shared by several projects, and its free space fell to single-digit GB. Our directory has had no writes since 14:22Z.
- Our own contribution is fixed: each episode used to leave about a 1 GB simulator kit cache, and the backend now deletes it after the episode.
- 14:27Z amendment: if infrastructure failures leave fewer than 90% of a half's episodes valid, the whole half is rerun and the partial attempt is discarded. This affects X3 va (4/120 valid) and wa (49/120 valid); both partial attempts are discarded.
- The pooled-scoring script reproduces the existing main result (26/239 vs 9/239, p = 0.0015).
- The resubmission chain resumes automatically once free space reaches 128 GB.

## Risks and countermeasures

- **Shared storage (DATA).** Every concurrent episode briefly needs about 1 GB, and a worker refuses to start with < 100 GB free. Keep at most 4 concurrent evaluation jobs, and clean up our own regenerable files before each batch.
- **DP training variance** (+10.8 pp vs +3.4 pp across training seeds). Every new DP conclusion uses ≥ 2 training seeds.
- **Hardest held-out layouts unsolved by every method.** In the paper this is written as a limitation; we do not pick layouts.
