# Conference Guidelines (PLACEHOLDER — venue and deadline to be confirmed)

The working directory of the existing paper effort is named `paper_iclr2027`, so this file assumes an ICLR-style submission until the target venue is confirmed. Replace the deadline and page limit with the confirmed venue's rules before running the literature-review stage (its citation cutoff is derived from the deadline below).

## Submission deadline

TBD. Until confirmed, the Literature Review Agent must use `cutoff_date = 2026-10-21` and treat later papers as concurrent work.

## Page limit

ICLR-style: 9 pages of main text (single column), excluding references and appendix.

## Mandatory sections

1. Abstract (one paragraph, 150–250 words)
2. Introduction
3. Related Work
4. Method
5. Experiments
6. Conclusion
7. References
8. Appendix (optional)

## Formatting rules

- Use the venue's official LaTeX template (`template.tex` to be added once the venue is confirmed).
- Citations via natbib (`\citep`, `\citet`).
- Figures at 300 DPI or vector.
- Double-blind: no author names, no server names, no internal paths, no job identifiers.
