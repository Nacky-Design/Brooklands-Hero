---
name: dis-reference-intelligence
description: "Проводит межотраслевое визуальное исследование, извлекает механизмы и проверяет аналогический перенос. Запускай при новой художественной концепции, сложной визуализации или повторном композиционном тупике; не для локального CSS-фикса."
---

> **Agent Skills package for Codex.** Primary procedural source in DIS GitHub. If installed in another repository, links refer to the DIS methodology and are optional supporting materials; these instructions remain executable on their own. Treat permissions, project brief, and accepted decisions as higher priority. `specified` does not mean automated QA or auto-capture has been verified.

# Skill DIS-RI-01 — Reference Intelligence

**Covers:** 1 Cross-Domain Research, 2 Reference Depth Gate, 3 Analogical Transfer, 9 Anti-Echo Chamber. **Maturity:** `specified_not_validated`, не отдельное подключённое MCP.

## 1. Trigger / not applicable
Запускать при новом самостоятельном художественном направлении, новой сложной визуализации или `research_gap_review` после двух содержательных неудач. Не запускать глобальный поиск для исправления известного CSS-багфикса без смены замысла.

## 2. Inputs
Проект/этап, защищённые тексты и сценарии, UX-проблема, активный UI Kit, принятые художественные правила, происхождение исходных референсов, `routing_decision`. Нет известных текстов → `blocked_by_essential_input`, но независимую часть поиска можно продолжить.

## 3. Dependencies
[Reference Routing](https://github.com/Nacky-Design/DIS/blob/main/methodology/reference-engine-protocol.md) и [Skill Standard](https://github.com/Nacky-Design/DIS/blob/main/methodology/skill-execution-standard.md). Исследование не должно проходить лишь ради искусственной квоты, но для сложной оригинальной задачи нужен реальный широкий визуальный обзор.

## 4. Procedure
1. Переписать исходную художественную проблему своими словами без подмены её медицинской/промышленной отраслью и без преждевременного выбора dashboard/card.
2. Получить краткий Internal Recall для знания о прошлых ошибках, **не** копировать его shortlist в внешний запрос. Для EXPLORE сначала сформулировать `independent_search_queries` от самой задачи, включая чужие исходные функции.
3. Провести реальный широкий осмотр разных работ из разнородных областей; каждую встречу/осмотр направлять в Reference Memory. Не считать URL без просмотра за `visually_inspected`.
4. Группировать по **механизму**, а не отрасли. Выделить несколько принципиально различных реализаций каждой критической проблемы. Важно искать дальние аналогии.
5. Глубоко разобрать перспективные источники, проверив только фактически доступные состояния, mobile и motion; `not_checked` для недоступного.
6. На каждый перспективный механизм вывести `original_function → observed_mechanism → novel_target_function → transformation_plan → evidence`; не выдавать за оригинальную механику собственную фантазию.
7. Запустить Reference Depth Gate: (а) межотраслевое покрытие; (б) разные механизмы на критические вопросы; (в) тест неожиданных переносов; (г) подтверждённый осмотр; (д) готовность нескольких моделей. Если неполно — `research_gap` и адресный поиск по недостающей категории. Не переходить к дорогой отрисовке.
8. Сохранить board, transfer map и verdict в существующем проектном checkpoint.

## 5. Tools
Открытые источники, визуальный просмотр реальных страниц/видео, web, браузер/Playwright если доступен, GitHub + действующая Reference Library; отсутствие видео ≠ проверенное motion. Нельзя выдавать поисковые thumbnail или тематическую stock-картинку за конкретный экран источника.

## 6. Outputs
`project, problem_map[], observed_refs[{source_id,viewed_state,evidence}], mechanism_clusters[], transfer_map[{source,original_function,mechanism,new_function,transform}], evidence_board, depth_gate:{status,missing_topics[]}, persistence_status`.

## 7. Acceptance
`sufficient_to_synthesize` только когда есть **фактически просмотренная** разнообразная база, закрыты ключевые вопросы несколькими различными механиками и показана применимость межотраслевого переноса. Число 60–120 — ориентир сложного пилота, **не фиктивный счётчик PASS**. Число реальных просмотров декларировать только из учтённых evidence.

## 8. Failure
Источник не открыт → `discovered` / `not_checked`, перейти к другим; нет отраслевого разнообразия → расширить семантику запроса; два варианта повторяют один паттерн → вернуться к divergent search; невозможно проверить права на скрин → сохранять ссылку/свой анализ, не публиковать изображение.

## 9. Persistence
Каждый факт исследования передавать Reference Memory; на checkpoint проверять сохранение. До actual collector подключения статус `manual_checkpoint_capture`, не `auto_captured`.

## 10. Tests
[R01–R08](https://github.com/Nacky-Design/DIS/blob/main/tests/skill-contract-cases.md): отраслевой фильтр, ложный факт просмотра, повтор источников, иная исходная функция, недоступный media state, двухцикловый тупик, база мала/зрело и независимые запросы.
