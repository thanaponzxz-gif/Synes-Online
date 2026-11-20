// SessionStart(compact) hook: after every compaction (auto at 450k via autoCompactWindow),
// re-inject the Project Synes rollover rule and a fresh repo status into Claude's context.
// Cross-platform (bash or PowerShell launches it through node). Never fails the session.
const { execSync } = require('child_process');
const path = require('path');
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const sh = (c) => { try { return execSync(c, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString().trim(); } catch { return ''; } };
const head = sh('git log -1 --oneline') || '(no git)';
const remote = sh('git remote') ? 'yes' : 'NO REMOTE';
const dirty = sh('git status --porcelain').split('\n').filter(Boolean).length;
const text = [
  'Project Synes — context was just compacted (auto-compact window 450k tokens).',
  'Rule (CLAUDE.md §5): finish only the current small step, then roll over with skill synes-pm section D:',
  'update docs/PROJECT_SYNES.md + docs/HANDOFF.md → commit + push → create the next "🟡 MAIN · Synes Online · รอบ N" session yourself without asking (tag project-synes; if create_session is missing, use a one-shot create_trigger with run_once_at) → send the owner the link.',
  'The new session closes this one (rename ⚪ OLD + archive) only after it verifies the push. Never touch sessions without the project-synes tag.',
  `Repo now: HEAD ${head} · uncommitted files: ${dirty} · git remote: ${remote}.`,
  remote === 'NO REMOTE' ? 'Rollover is BLOCKED without a GitHub remote: tell the owner in your next message and keep working in this session.' : '',
  'Re-read docs/PROJECT_SYNES.md before continuing: it holds the decisions the summary may have dropped.',
].filter(Boolean).join('\n');
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
