import { World } from '../shared/sim/world.ts';
import { InputLog } from '../shared/sim/input.ts';
import { Bot } from './bot.ts';
const seed = +(process.argv[2] || 12345), skill = +(process.argv[3] || 1);
const w = new World(seed), bot = new Bot(skill), log = new InputLog();
const marks: string[] = [];
while (!w.finished && w.tick < 30 * 60 * 8) {
  const inp = bot.think(w); log.push(inp);
  for (const e of w.step(inp)) {
    if (['player-down', 'boss-start', 'boss-phase', 'victory', 'gate', 'checkpoint', 'stun', 'respawn'].includes(e.t))
      marks.push(`${(w.tick / 30).toFixed(1)}s ${e.t}${'cause' in e ? ' ' + e.cause.attackTh : ''}${'id' in e && typeof e.id === 'string' ? ' ' + e.id : ''}${'long' in e ? (e.long ? ' long' : ' short') : ''}`);
  }
}
console.log(marks.join('\n'));
console.log(JSON.stringify(w.summary()), 'logEntries', log.data.length / 4);
