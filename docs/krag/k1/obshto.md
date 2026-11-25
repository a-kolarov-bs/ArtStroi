# Общо задание за всички агенти в кръг 1 (сайт АРТСТРОЙ)

- Проект: /Users/angelkolarov/Desktop/biznis/artstroi (Astro 5 + Tailwind, статичен сайт). Работен клон на кръга: `krag1`.
- План: /private/tmp/claude-501/-Users-angelkolarov-Desktop-biznis-artstroi/b1ed0e58-9cf3-4319-b2f6-3560001b6331/scratchpad/odit/plan.md — чети САМО раздела на своята група (`sed -n '/### <група>/,/### /p'`) и разделите, които той сочи. Одитите (frontend.md, klient.md) са в същата папка; чети само находките с номерата от твоята група (grep по номер).
- Преди задачата прочети речника `docs/rechnik.md`; в текстовете ползвай само неговите думи; обръщение „вие“ (малка буква), бутони в учтива форма. Непотвърдени факти (раздел 4 на речника) не се пишат и не се измислят.
- CLAUDE.md на проекта: дизайн принципи (premium строителен бранд, motion с reduced-motion fallback, compositor-safe анимации).
- НЕ СЕ ПИПАТ: шрифтовете Poiret One + Didact Gothic и `.text-ink`; `src/components/AwardProcessTeaser.astro` и видима промяна по „Сграда на годината“; `public/hero/hero-composite.mp4`; `main`; push; файлове извън обхвата на групата.
- Потребителят НЕ иска прекалено много празно пространство.
- Работиш в СВОЕ работно копие (git worktree), дадено в заданието; там `npm ci` и свой dev сървър на даден порт (`npm run dev -- --port <порт>` във фон с лог, запиши PID; спри го по PID накрая).
- Снимки на екран: headless Chrome/Chromium НЕ тръгва на тази машина (SIGABRT / mach port) — не губи време с него. Визуалната проверка е през отворения Chrome на потребителя: mcp__claude-in-chrome__* (зареди наведнъж с ToolSearch: tabs_context_mcp, tabs_create_mcp, navigate, computer, javascript_tool, get_page_text, read_console_messages, tabs_close_mcp, browser_batch). Работи в СВОЙ нов таб; не пипай чужди табове; затвори таба си накрая; без alert/confirm; не пращай формата. Прозорецът не се смалява → за 390 и 1366/1440 px зареди страницата в iframe-и със зададена ширина в своя таб (напр. през javascript_tool: `document.body.innerHTML='<iframe src="/"  style="width:390px;height:844px"></iframe><iframe src="/" style="width:1440px;height:900px"></iframe>'` на същия origin), и снимай/зумирай. Снимки, които искаш да запазиш: `save_to_disk`.
- Проверки преди предаване: `npm run build` (във фон с лог) и `npx astro check` без нови грешки; grep командите от `docs/rechnik.md` раздел 5 — за твоите файлове първата не бива да намира нищо ново.
- Комити: малки, всеки зелен; съобщение на английски, завършва с:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01LkZUvEUgT7eyWovhvF5RfA
- Дълги команди във фон с лог; файлове над ~20 KB на части; процеси се спират само по PID.
- Скриптове: първо ~/.claude/skripti/README.md; файловете с Edit или zameni.py.
- Над ~150 хода или ~250 хил. токена: запиши състояние в predavane.md в работното копие и спри.
- Отчет (последното ти съобщение): JSON до 15 реда: {"tablitsa":[{"kriteriy","dokazatelstvo","rezultat"}], "nenapraveni":[], "ostava":[], "otvoreni":[], "commits":[], "snimki":"<папка>"}; подробности във файл в работното копие (otchet.md), не в съобщението.
