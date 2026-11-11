---
name: dis-studio-learning
description: "Фиксирует выбор арт-директора, историю нескольких выбранных художественных принципов и эволюцию Studio Signature. Запускай после художественного feedback или решения с несколькими совместимыми вариантами; не приписывай пользователю не высказанные предпочтения."
---

> **Agent Skills package for Codex.** Primary procedural source in DIS GitHub. If installed in another repository, links refer to the DIS methodology and are optional supporting materials; these instructions remain executable on their own. Treat permissions, project brief, and accepted decisions as higher priority. `specified` does not mean automated QA or auto-capture has been verified.

# Skill DIS-SL-01 — Studio Learning & Signature Evolution

**Covers:** 12 Studio Signature Evolution + обработка художественного выбора на любом этапе. **Maturity:** `specified_not_validated`; фирменный стиль пока не сформирован и человеком не утверждён.

## 1. Trigger / exclusions
После существенного явного художественного выбора/ревью, появления авторски переработанного механизма и при портфельном checkpoint. Не выводить личный художественный стиль из одного понравившегося примера; не собирать мнения пользователя вне реального дизайн-решения.

## 2. Inputs
`decision_id, stage, options_presented[], chosen_option_ids[], explicit_scope, human_comments(if any), artifact_evidence, source_mechanisms, transformation_log`.

## 3. Dependencies
[Decision Dialogue](https://github.com/Nacky-Design/DIS/blob/main/methodology/decision-dialogue.md), [Studio Signature Evolution](https://github.com/Nacky-Design/DIS/blob/main/methodology/studio-signature-evolution.md), [Reference Engine](https://github.com/Nacky-Design/DIS/blob/main/methodology/reference-engine-protocol.md).

## 4. Procedure
1. Фиксировать **дословно определённый** выбор и границы утверждения; несколько выбранных совместимых направлений = набор, не ошибка и не автоматически новая финальная композиция.
2. Если комбинация не реализована, статус `selected_for_synthesis`, не `approved_design`.
3. Привязать выбранные референсные механизмы к собственным художественным трансформациям, не хранить только снимок источника.
4. Фиксировать явные причины принятия/отклонения; если человек не объяснял — `unknown`. Паттерны, которые повторяются, классифицировать как `studio_hypothesis`/ `signature_candidate`.
5. При необходимости вынести **один существенный** вопрос о будущем авторском языке через Decision Dialogue с множественным выбором совместимых направлений, но не объявлять новый фирменный стиль автоматически.
6. `approved_studio_pattern` разрешён только после отдельного явного человеческого утверждения именно студийного статуса, а не только дизайна клиента.
7. На checkpoint сравнить, уменьшились ли повторы ошибок и улучшилась ли переносимость — как наблюдение, без выдуманных чисел.

## 5. Tools
Реестр Studio Signature, журнал проекта, реальная обратная связь человека, выбранные файлы/артефакты; не скрытая модельная догадка о вкусах пользователя.

## 6. Outputs
`decision_log · applied_mechanisms[] · transformations[] · user_selected_ids[] · approval_scope · studio_candidate_status · supporting_projects[] · evidence`.

## 7. Acceptance
У каждой повышенной гипотезы есть прослеживаемый источник, значимая собственная переработка, применимость и человеческий verdict. Нельзя автоматически повышать `studio_hypothesis` до `approved_studio_pattern`.

## 8. Failure
Нет явного утверждения → `candidate`; неверный пересказ выбора → проверить исходный комментарий и исправить; несовместимые checkbox-выборы → не склеивать без нового компромисса; отзыв неоднозначен → задать конкретный вопрос только при материальной необходимости.

## 9. Persistence
Update Studio Pattern Register / Project Decision Log на checkpoint; provenance и версия обязательны. Не копировать закрытые client design assets в общую публичную базу.

## 10. Tests
[S01–S07](https://github.com/Nacky-Design/DIS/blob/main/tests/skill-contract-cases.md): multi-select, неизвестная причина, локальное одобрение, конфликт паттернов, гипотеза vs brand approval, независимые этапы.

## 11. Human Creative Authority / Frankenstein feedback (03.11.2026)

Apply [HCA-001](https://github.com/Nacky-Design/DIS/blob/main/methodology/human-guided-creative-frankenstein.md) at each significant creative checkpoint. Record selected mode (`AUTHOR_GUIDED|DIS_GUIDED`), `user_submitted` reference candidates, multiple chosen mechanisms and *specific properties* (not just page URLs), and FA-01/FA-02 approval as **different states**. If the author requests 5/10/20 alternatives, no 2–4 cap applies; only vetted references, with honest missing count. A later audit finding must become a backlog lesson `gap → root cause → correction → regression check`, without turning guessed causes into stated user preferences. Never promote one project's choice to `approved_studio_pattern` without human approval. This skill captures decisions at checkpoints, not an automatically connected collector; record manual persistence honestly.
