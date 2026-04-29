# Brele Operations

Brele Operations — отдельное внутреннее SaaS-приложение для управления операционной деятельностью компании.

Первая ключевая функция: аналитика транскрибаций клиентских встреч.

## Домены

- Production web: https://op.brele.ru
- Existing Brele Docs: https://docs.brle.ru

Brele Docs не должен затрагиваться этим проектом.

## Архитектура

- Frontend: Next.js
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma
- AI analysis: OpenAI API
- Deploy: systemd + nginx
- Storage MVP: local filesystem

## Локальные порты

- Web: 3100
- API: 4100

## Структура

```text
apps/
  web/
  api/

packages/
  ui/
  config/

storage/
  uploads/
  transcripts/

nginx/
systemd/
scripts/