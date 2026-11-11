---
name: dis-visual-synthesis
description: "Синтезирует самостоятельную визуальную концепцию из исследованных механизмов, соблюдает утверждённые решения и два Quality Gate. Запускай перед новым концептом, художественным ревью или существенной правкой композиции; не меняй утверждённый стиль молча."
---

> **Agent Skills package for Codex.** Primary procedural source in DIS GitHub. If installed in another repository, links refer to the DIS methodology and are optional supporting materials; these instructions remain executable on their own. Treat permissions, project brief, and accepted decisions as higher priority. `specified` does not mean automated QA or auto-capture has been verified.

# Skill DIS-VS-01 — Visual Synthesis

**Covers:** 4 Frankenstein Synthesis, 10 Divergence → Curated Choice, 11 Two Visual Quality Gates. **Maturity:** `specified_not_validated`; ни собственные числа, ни подготовленный HTML не доказывают арт-качество.

## 1. Trigger / exclusions
После `Reference Depth: sufficient_to_synthesize` и достаточного content-first contract; при локальной правке уже принятой композиции — ограниченный scope/regression QA, без конкурса концепций.

## 2. Inputs
Неподвижные тексты, структура/смысл, refs/transfer map, роль блока на странице, Project UI Kit, mobile-first, запреты, предыдущие художественные утверждения и их scope.

## 3. Dependencies
[Reference Intelligence](https://github.com/Nacky-Design/DIS/blob/main/skills/reference-intelligence/skill.md), [Decision Dialogue](https://github.com/Nacky-Design/DIS/blob/main/methodology/decision-dialogue.md), [Visual Quality Gate](https://github.com/Nacky-Design/DIS/blob/main/methodology/visual-quality-gate.md), [Concept Integrity](https://github.com/Nacky-Design/DIS/blob/main/methodology/concept-integrity.md).

## 4. Procedure
1. Для каждого сильного внешнего примера отделить наблюдаемый механизм от чужой графической оболочки.
2. Создать несколько **действительно отличающихся** смыслово-композиционных моделей для одной утверждённой задачи (`Divergence`); не делать новую «концепцию» только перестановкой карточек/цветом.
3. `Frankenstein synthesis`: выбрать полезные механизмы, переназначить функции, скомбинировать и **с нуля** задать художественную геометрию, типографию, пластику и interaction в Project UI Kit. Задокументировать, что изменено и почему новый образ собственный; не воспроизводить уникальные чужие материалы/состав.
4. Для каждой модели проверить хотя бы один содержательный mobile-сценарий и выбранное desktop-состояние; сложные отношения на mobile не исчезают просто при `display:none`.
5. Gate 1 — сверить смысловую корректность связи/маршрута/состояния, тексты, UI Kit, оси и композицию, mobile-функцию, происхождение визуалов, ограничения. Любой критический дефект → FAIL, даже при идеальном JS.
6. Gate 2 — самостоятельная **обоснованная экспертная** художественная оценка по применимым осям, с конкретными визуальными доказательствами; ≥7/10 — действующий экспериментальный порог показа, 8 цель, ни одна критическая ось не должна компенсироваться средним.
7. Только после независимых gates сформировать curator shortlist 2–3 **сильных** разных вариантов; при недостатке сильных честно `needs_work`, не раздувать количество.
8. Если варианты прошли и различаются значимыми художественными trade-off, обратиться к арт-директору по [Decision Dialogue](https://github.com/Nacky-Design/DIS/blob/main/methodology/decision-dialogue.md). Разрешать **несколько совместимых** выборов; сохранять, какое решение/комбинацию человек действительно утвердил.
9. На повторяющемся провале двух содержательных итераций → `research_gap_review`, а не третья декоративная правка.
10. Сохранять в Reference Memory трансформацию, опции и результат художественного ревью.

## 5. Tools
Реальный рендер HTML/PNG/Figma или другой выбранный носитель; фактический browser/mobile render, проверка взаимодействий, источник истины, UI Kit. Поисковая картинка не является превью созданного файла.

## 6. Outputs
`options[{id,mechanisms,novel_composition,media_ref,mobile_evidence,gate1,gate2,critical_risks}] · shortlisted_ids[] · DIS_recommendation · user_decision_ids[]? · status · persistence_status`.

## 7. Acceptance
Для каждого показанного варианта Gate1 PASS с визуальным/смысловым свидетельством, Gate2 обоснован ≥7; подтверждена самостоятельная идея и mobile. Художественный `ready_for_approval` не равен `approved_by_user`.

## 8. Failure
`Gate1 FAIL` → исправить/вернуться к модели, рейтинг не считать; `Gate2 <7` → внутренняя переработка; противоречивые выбранные пользователем направления → описать конфликт и запросить решение только если невозможно вывести из предыдущего контракта; данные не проверены → `not_verified`.

## 9. Persistence
Промежуточные поисковые модели — в локальном checkpoint, проверяемые механизмы и человеческое решение — в общей Reference Library, без автоматического `approved_studio_pattern`.

## 10. Tests
[V01–V07](https://github.com/Nacky-Design/DIS/blob/main/tests/skill-contract-cases.md): путаница графа, мобильные скрытые связи, декоративные варианты, округление балла, реальные скриншоты, комбинированный human choice, конфликт с baseline.

## 11. Local creative repair — semantics before safe decoration (29.10.2026)

**Trigger:** user says an existing image/illustration is generic, empty, a circle, an icon instead of an explanation; heading structure and rhythm are off; deadline-bound refinement of an otherwise approved section.

**Route:** this is `local_semantic_repair`, not `new_concept`. Do not invoke research-depth quotas or 2–3 fully composed concepts just for four replacement illustrations. A short internal ideation pass is allowed, but produce the requested corrected artifact.

1. Lock **approved outer layout, copy, UI Kit, neighboring sections**; distinguish those from **unapproved local image content**, which is free to be reinvented.
2. For each illustration, write privately one sentence of the user's intended insight and select **concrete entities plus relationship/action**. Four categories must have four distinguishable stories, not one repeated container with substituted icons.
3. Choose an explanatory micro-scene, workflow, transformation, or interaction that makes the idea apparent **without relying on an explanatory caption alone**. Don't substitute abstract circles, generic pictograms, or decorative UI scaffolding because they are easier to code. If a minimalist form genuinely carries the meaning, it remains allowed.
4. Match **visual grammar** (stroke, color, density, shape character) from accepted page; this does **not** limit meaning or require reusing the exact old icons.
5. Render in intended dimensions/mobile; confirm that each scene remains legible and sufficiently distinct. The technical gate checks presence/render/placement; semantic communication remains reasoned art judgement, not self-certified PASS.
6. For typography defects, use actual nearby accepted `H2/H3/lead/body` roles, line-break intent and section rhythm. Do not mechanically assign everyone 16px or insert forced breaks for symmetry.
7. Stop as soon as the requested visual correction is made, with brief delta notes. Do not redesign the whole page, reopen an accepted concept, or produce a long audit instead of the artifact.

**Failure case:** if a new image is still merely a category pictogram, it has **not** addressed a request for semantic illustration, even when CSS/UI Kit pass. Escalate to better local imagery, not a methodology exercise.


## 12. Proactive visual communication (29.10.2026)

**Applies to a newly designed section, even when the user did NOT explicitly request illustrations.** After grasping the semantic intent and before choosing a grid, card system, UI primitive or HTML component, choose the best **communication medium** autonomously: meaningful illustration, photo, real product interface, explanatory diagram, video/motion, or typography-only. The user's failure to ask for an illustration is NOT evidence that decorative icons suffice.

Ask internally: (a) what must the viewer understand, (b) is the subject an object, relationship/process, emotion, contrast or evidence, (c) what representation conveys it immediately, (d) why is this more informative than a generic icon/card/circle, (e) how does it fit existing art direction? Produce that representation, not a verbal explanation of what could be drawn.

**A3 example, NOT global template:** «Что именно мы развиваем» has four different domains. A screen+phone for UX, code window for support, a database cylinder for integration, and a line chart for acquisition are at most *category symbols*, unless the relationships and specific activities are legible in their actual rendered mini-scenes. The design must explain distinct functions while still participating in one visual system. This may be done through connected UI scenarios, transformed data flows, photographic composites, or other appropriate media; do not impose an illustration for every project or clone four repetitive mini-scene cards.

**Failure prevention:** do not start from `reusable-card` or available SVG primitives and retrofit meaning afterward. Start with the visitor takeaway. If a visual remains only a decorative category symbol, treat it as an unresolved concept rather than completed art direction. Do not require a new research round or user intervention for this routine judgment.
