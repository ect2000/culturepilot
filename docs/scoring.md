# Evidence scoring

CulturePilot uses deterministic, documented product heuristics. They are not Qloo-certified probability estimates. Higher values indicate stronger available evidence for a research hypothesis; they do not predict commercial success.

## Opportunity score

`round(100 × (0.50 × A + 0.20 × E + 0.20 × C + 0.10 × G))`

All components are clamped to `[0, 1]`. Non-finite values become zero.

| Component             | Derivation                                                                                                                                              | Weight |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| A: affinity           | Mean `query.affinity` (or response `affinity`) across observed incoming Qloo relationships for the top four scored entities in the opportunity category | 50%    |
| E: evidence density   | Number of supporting Qloo relationships / 6, capped at 1                                                                                                | 20%    |
| C: category breadth   | Number of distinct categories among connected entities / 5, capped at 1                                                                                 | 20%    |
| G: verified geography | 1 if the supporting evidence includes a place request constrained to the chosen market; 0 otherwise                                                     | 10%    |

Qloo documents affinity on a 0–1 scale. Out-of-range/malformed values are rejected rather than silently interpreted as scores. Unscored results are excluded from affinity research. Search results are valid anchors but do not receive affinity points.

We give the observed affinity the largest weight because it is the direct Qloo ranking signal. Density and category breadth reward supported, cross-category research. Geography receives points only when a real place query constrains it. These weight choices are explicit design choices; they are not statistically calibrated or supplied by Qloo.

Evidence uses the **request-specific edge score**, not an entity's largest score across unrelated requests. An entity card may show its highest observed score; its drawer exposes each query separately.

## Cultural fit

The arithmetic mean of the completed analysis's opportunity scores, rounded to an integer. A broad fit index over returned evidence, not market demand or audience reach.

## Evidence confidence

`round(100 × (0.40 × min(relationshipCount / 20, 1) + 0.35 × min(categoryCount / 5, 1) + 0.25 × coverage / 100))`

The report uses all scored Qloo edges and researched categories. Opportunity confidence uses only its supporting relationships and connected categories, with overall analysis coverage. This index measures completeness and density, not statistical certainty.

## Important limits

- Categories are not independent samples. Repeated paths may be correlated. We do not claim independent corroboration or calculate p-values.
- Business actions, creative territory and templates are CulturePilot interpretations. The API supplies aggregate taste evidence.
- Place boundary verification is not a venue visit, proof of availability or partnership willingness.
- Age ranges map to broad supported Qloo bins. For 25–35, the 35–44 bin is included and this broadening is disclosed in the report.
- Descriptions such as “urban professionals” do not automatically become Qloo audience identifiers. No sensitive trait or occupation inference is performed.
- Scores are monotonic in every component. Missing geographic verification or category breadth cannot earn positive points for those components.
