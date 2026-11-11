---
name: dis-design-qa
description: "Проверяет HTML/CSS/React-дизайн по принятому UI Kit, типографике, сетке, отступам, адаптиву, состояниям и регрессиям. Запускай после визуальной правки и перед показом клиенту, особенно когда жалуются на SaaS-плашки, несогласованные оси, пересечения, потерю mobile-смыслов или изменение принятого визуального характера."
---

# DIS Design QA — design fidelity over generic lint

**Статус:** операционный скилл, а не гарантия работающего автономного детектора. Внешний Impeccable применяется только после фактической установки в проект и разрешения его hooks. Внутренний [UI Kit Gate](https://github.com/Nacky-Design/DIS/blob/main/methodology/ui-kit-gate.md) имеет приоритет в части **принятого визуального языка**, как и недавние решения арт-директора.

## 1. Trigger / not applicable
Запускать после изменения интерфейса или перед демонстрацией работающего HTML. Для просмотра методологии без текущего макета — только проверить контракт, не объявлять итоговый визуальный PASS.

## 2. Inputs / source of truth
Текущий HTML/код и работающий рендер, согласованный baseline, **актуальный** UI Kit и соседние секции, тексты, обязательные состояния и viewport-контракт. Если исходник не найден, фиксировать `missing_source`, не заменять его дизайном по памяти.

## 3. Dependencies
Project UI Kit + решения пользователя, [Concept Integrity](https://github.com/Nacky-Design/DIS/blob/main/methodology/concept-integrity.md), [Visual Quality Gate](https://github.com/Nacky-Design/DIS/blob/main/methodology/visual-quality-gate.md), [Skill Contract](https://github.com/Nacky-Design/DIS/blob/main/methodology/skill-execution-standard.md). Impeccable — внешний вспомогательный аудит, не источник художественного стандарта.

## 4. Procedure
1. **Lock scope:** зафиксировать, что уже утверждено, что меняем, а что трогать запрещено. При локальном refinement новый визуальный мир не предлагать.
2. **Read tokens:** извлечь реальные роли display/H2/H3/H4/body/lead, line-height, container axes, responsive, spacing, radius, surfaces/active/focus. Сравнить с живым UI Kit, а не с выдуманным «обычным 16px».
3. **Render:** проверить реальные экраны/скриншоты хотя бы desktop и mobile на тех ширинах, которые важны для задачи. Скриншоты могут остаться внутренними; при текущем Relevant review выдавать **только HTML**.
4. **Geometry:** измерить DOM-рамки, расстояния между секциями, выравнивание заголовка/описания, табов, легенды и узлов. Проверить пересечения и внутренние отступы **во всех основных состояниях**. Не считать «нет overflow» достаточным доказательством.
5. **Typography:** роли, контраст и порядок иерархии; не уменьшать шрифты, чтобы «втиснуть» больше элементов, если задача о правильном ритме. Исключения — только принятые.
6. **Responsive semantics:** на 320/390/440/768/1440/1920 и необходимых проекту точках убедиться, что интерактивные отношения сохранили смысл, даже если представление на mobile иное.
7. **Interactive semantics:** клавиатура, focus, popups, сценарий × конкретный узел, реальные labels/возврат. Для графа: видимое/активное ребро имеет два существующих endpoint, линии не пересекают посторонние узлы.
8. **Impeccable:** если в проекте установлен официальный skill `impeccable`, сначала `$impeccable audit`/детектор в разрешённом режиме, затем `$impeccable critique` либо `layout`/`typeset` по характеру дефекта. Его findings — **предложения**, нельзя автоматически менять принятый UI Kit/стиль. Если не установлен/не доступен, написать `impeccable_not_connected`.
9. **Gate:** Compliance PASS только при отсутствии критических нарушений и фактическом evidence; Art Gate — отдельная экспертная оценка, не выводить рейтинг из технических тестов.
10. **Minimal handoff:** представить **один актуальный HTML**, кратко перечислить изменения; QA и изображения не прикладывать без отдельного запроса.

## 5. Tools
DOM/Playwright/браузер, действующий UI Kit, кодовая история; Impeccable только после действительного `npx impeccable install --providers=codex --scope=project` в рабочей копии и пользовательского approval для hooks.

## 6. Output
`baseline · changes · viewport_evidence[] · typography_violations[] · spacing_violations[] · semantic_failures[] · external_findings[] · gate1_status · art_review_status · html_path · impeccable_status`.

## 7. Acceptance
Все critical проверенные, дефекты отсутствуют, внешний инструмент (если был) отработал реально. Нет визуального evidence → `not_verified`. Не выдавать округлённый 6.8 за 7.

## 8. Failure
Нет доступного рендера → `not_verified`; несколько противоречащих утверждённых правил → привести scope/источник истины и обратиться к арт-директору только по существенной развилке; Impeccable предлагает неожиданный редизайн → отклонить как выход за scope.

## 9. Persistence
Принятые проектные токены/проверенные компоненты в Living UI Kit, результаты QA в существующем проектном checkpoint. Не сохранять чужие запрещённые визуалы, не создавать PNG/ZIP/PDF для пользователя.

## 10. Tests
- A2 1920×1080: табы+граф помещаются, но заголовочный компонент сохраняет принятый отступ.
- У графа нет пересечений линий с другими плашками; mobile не превращается в бессмысленный список.
- Номера внутри схемы не возвращаются, если пользователь удалил их; не добавлять декоративные верхние линии.
- Изменение палитры `proposed` не превращается в глобальный UI Kit без решения человека.
- Хук Impeccable отсутствует → честное `not_connected`, без фиктивного PASS.

## 11. Semantic illustration and heading acceptance for scoped review (29.10.2026)

When the user's complaint concerns image meaning, require `visual_subject / relation_or_action / communicated_point` for each distinct illustration. Compare the **actual rendered result** against the stated meaning and neighboring illustrations. Finding an SVG, a circular shape, a phone or a generic database icon is not proof of semantic adequacy. If the rendered scene does not communicate the direction without substituting explanatory text, mark `semantic_review_needs_work`; do not allow technical PASS or a self-assigned art score to conceal that defect. The final artistic verdict belongs to the art director.

When the complaint concerns headings, inspect current DOM text, forced `<br>`s, computed font roles, rhythm between heading and lead, and display at relevant narrow/wide sizes. Different approved roles must remain different; `font-size >= 16px` alone is not a quality criterion. No visual evidence → `not_verified`.

For immediate delivery: perform **a scoped correction and targeted regression checks**; do not require unrelated page research, generated alternative decks, redundant reports, or user participation in routine choices.


## 12. Visual-medium appropriateness, not illustration quota (29.10.2026)

For a newly created section, check whether the medium was **deliberately chosen** to communicate the intended idea, rather than defaulted to a convenient icon/card/circle from the component library. A topic can call for photo, expressive type, UI excerpt, relational scene, diagram, video or no image; there is **no universal illustration requirement**. The check records `intended_takeaway → medium → visible communicated evidence`; give `needs_work` when the result only labels a category that needed an explanation. This is expert design review; a DOM parser can verify the asset and dimensions but cannot independently certify that the representation is meaningful. For a local correction do not reopen an already accepted medium without user authority.

## 13. Playwriter browser adapter (29.10.2026)

For actual browser checks prefer [dis-browser-qa-playwriter](../dis-browser-qa-playwriter/SKILL.md) when Playwriter is installed and a Chrome tab is explicitly enabled. The full setup and cloud/local distinction are in [Playwriter Browser QA](https://github.com/Nacky-Design/DIS/blob/main/methodology/playwriter-browser-qa.md). Use its real DOM/computed-CSS, viewport, screenshots and interaction evidence to populate this QA gate; do not conflate access to the browser with proof of visual fidelity. If not connected, fall back to existing browser QA and mark the Playwriter-specific state `not_connected`. Cloud Codex does not automatically access local Chrome.

## 14. Approved-baseline production regression gate (03.11.2026)

When the current work edits an approved artifact or transfers an accepted composition to a new section, **first apply [ABPG-001](https://github.com/Nacky-Design/DIS/blob/main/methodology/approved-baseline-production-gate.md)**. Require explicit mode (`LOCAL_PATCH` / `APPROVED_PATTERN_TRANSFER`), the actual baseline asset, LOCKED/EDITABLE/DEPENDENT, and a pre-delivery structural/content/visual comparison. Do not show an artfully rendered but structurally invalid page as approval-ready. For local patch, require pixel/layer preservation of LOCKED regions, with image comparison evidence where available. For new client case within accepted pattern, compare required semantic fields (e.g. kicker, heading, lead, metrics, chips, primary visual), **not** literal pixels. Repeated identical mismatch twice requires `STOP_METHOD_FAILURE` and a change in production method. A prompt-only promise of unchanged text/geometry is `not_verified`; this skill does not pretend to be a physical gateway.
