---
name: dis-reference-memory
description: "Ведёт накопление фактических исследовательских событий, проверяет зрелость внутренней библиотеки и маршрутизирует REUSE/EXPLORE. Используй при исследованиях и начале проекта. Не называй auto-capture работающим без действительного сборщика."
---

> **Agent Skills package for Codex.** Primary procedural source in DIS GitHub. If installed in another repository, links refer to the DIS methodology and are optional supporting materials; these instructions remain executable on their own. Treat permissions, project brief, and accepted decisions as higher priority. `specified` does not mean automated QA or auto-capture has been verified.

# Skill DIS-RM-01 — Reference Memory & Routing

**Covers:** 5 Passive Accumulation, 6 Reference Engine, 7 Maturity Gate, 8 Reference Routing. **Maturity:** `specified_not_implemented`: GitHub Markdown уже существует, автоматического capture/index/MCP пока нет. **Do not claim otherwise.**

## 1. Trigger / exclusions
При **каждом фактическом исследовательском действии** плюс новый проектный вопрос/изменение scope (routing) и checkpoint (sync/maturity). Никакого отдельного задания пользователю на ведение библиотеки. Не проводить внешнее исследование в REUSE без нового вопроса.

## 2. Inputs
`event_id, run_id, project_id, source_id, event_kind, provenance, observed_state, evidence, occurrence_time`; для маршрутизации — задача, реестр approved, UI Kit, past verified adaptations. Для оценки зрелости — уникальный индекс и результаты пяти проверенных retrieval-тестов.

## 3. Dependencies
[Reference Engine Protocol](https://github.com/Nacky-Design/DIS/blob/main/methodology/reference-engine-protocol.md), [record template](https://github.com/Nacky-Design/DIS/blob/main/references/library/reference-record-template.md), [Skill Standard](https://github.com/Nacky-Design/DIS/blob/main/methodology/skill-execution-standard.md).

## 4. Procedure
1. Сначала короткий `Internal Recall`: retrieve approved/verified решения и известные ошибки; отсутствие записи не означает отсутствия проблемы.
2. При новом исследовательском событии создать `research_event` и надежно записать. Идемпотентно по `event_id`; источник по canonical id; неоднозначные дубли не сливать слепо.
3. Обновить статус `discovered → visually_inspected → analysed → applied → reviewed` **только при подтверждённой новой работе**; не заменять доказательства оценкой модели.
4. Для scope определить режим:
   - `REUSE` **только** при той же функции, проверенных применимых состояниях, полном соответствии UI Kit/scope, отсутствии существенных дефектов и соответствующем человеческом художественном approval;
   - `PARTIAL_EXPLORE`, если проверен лишь функциональный механизм, а художественная задача/контекст новы;
   - `EXPLORE`, если новая существенная художественная задача или крупный UX-сдвиг, нет соответствия, две содержательные итерации провалили одну проблему.
5. Для `EXPLORE` передать Reference Intelligence исходную формулировку проблемы **без внутреннего референсного shortlist как источника внешних запросов**.
6. При новом проектном checkpoint обновить библиотеку и link `source → mechanism → transformation → project/decision → feedback`.
7. Maturity: считать 150 визуально осмотренных уникальных источников, 8 отраслей, 20 различимых механизмов, 15 глубоких разборов, ≥4/5 поисковых тестов с содержательными различными результатами. Пока любой критерий не выполнен — `maturity=not_ready`, но единичный validated REUSE разрешён.
8. В случае сбоя persistence не объявлять checkpoint закрытым как `saved`; обозначить failure и retry/reconcile после восстановления.

## 5. Tools
Потенциально Codex local collector/SQLite/JSONL + GitHub sync, впоследствии MCP/API и веб-галерея. В этой версии **инструмент автоматического перехвата всех ChatGPT search/browser событий отсутствует**; до его подключения честный ручной checkpoint внутри основного исследования.

## 6. Outputs
`routing_decision:{mode,validated_conditions[],unmet_conditions[],scope}`; `event_log[{event_id,source_id,state,evidence_ref,persisted}]`; `maturity:{inspected_unique,domains,mechanisms,deep_analyses,retrieval_tests_passed,ready}`; `library_index_version`.

## 7. Acceptance
В каждой записи чётко известно, что реально просмотрено/извлечено/одобрено; ни один заявленный факт capture не теряется, дубли не превращаются в количество; REUSE только по всем пяти условиям; широкое исследование не прекращается из-за наличия внутренней базы.

## 8. Failure
Нет прав сохранить скрин — ссылка+собственный текст без копирования чужого; событие не сохранилось — `persistence_failed`, не скрытый пропуск; кратковременная недоступность источника — `discovered`, не просмотр; зрелость не достигается «добавлением» тегов без evidence.

## 9. Persistence
См. source record + events protocol. На GitHub checkpoint; архив скриншотов лишь с разрешёнными правами; хранение конфиденциальных материалов по контракту.

## 10. Tests
[M01–M11](https://github.com/Nacky-Design/DIS/blob/main/tests/skill-contract-cases.md): события, идемпотентность, 150 ссылок без просмотра, полное/частичное повторное использование, независимость поиска, отказ persistence, 5 тестов зрелости.
