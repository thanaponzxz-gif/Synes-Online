// Ruleset `ninja-roam-1` (DES-007 rev 4 §3.1): its own copy of the `roam-1` level and the enemy numbers, taken at the implementation
// base fc1ada5 (tests/fixtures/ruleset-golden.json "implementationBase"). Later edits to roam.ts or ENEMIES never reach this ruleset;
// tests/ninja.test.ts checks both fingerprints against the ones recorded at that base. Change the ninja stage here only, with team A.
import type { LevelDef } from './level.ts';
import type { EnemyTable } from './tuning.ts';

export const NINJA_LEVEL: LevelDef = {
  "id": "dewlight-glade-roam",
  "nameTh": "ทุ่งน้ำค้างแสง",
  "start": {"x":0,"z":1.5},
  "bounds": {"x0":-34,"x1":34,"z0":-100,"z1":16},
  "walkable": [
    {"id":"camp","type":"circle","x":0,"z":0,"r":8},
    {"id":"meadowS","type":"circle","x":-3,"z":-10,"r":12},
    {"id":"meadowE","type":"circle","x":11,"z":-13,"r":10},
    {"id":"meadowW","type":"circle","x":-14,"z":-26,"r":10.5},
    {"id":"meadowC","type":"circle","x":2,"z":-25,"r":11},
    {"id":"clearing","type":"circle","x":3,"z":-37,"r":8.5},
    {"id":"meadowEE","type":"circle","x":14,"z":-35,"r":9.5},
    {"id":"meadowSW","type":"circle","x":-13,"z":-40,"r":9},
    {"id":"meadowN","type":"circle","x":-1,"z":-47,"r":8.5},
    {"id":"approach","type":"capsule","ax":-2,"az":-54,"bx":-2,"bz":-60,"r":3,"gate":"clearingExit"},
    {"id":"arenaEntry","type":"capsule","ax":-2,"az":-58,"bx":-2,"bz":-66,"r":3,"gate":"arenaEntry"},
    {"id":"arena","type":"circle","x":-2,"z":-76,"r":11.5},
  ],
  "paths": [
    {"id":"camp","type":"circle","x":0,"z":0,"r":7},
    {"id":"trailA","type":"capsule","ax":0,"az":-4,"bx":3,"bz":-29,"r":3},
    {"id":"clearing","type":"circle","x":3,"z":-37,"r":8.5},
    {"id":"trailC","type":"capsule","ax":3,"az":-44,"bx":-2,"bz":-58,"r":3,"gate":"clearingExit"},
    {"id":"arenaEntry","type":"capsule","ax":-2,"az":-56,"bx":-2,"bz":-66,"r":3,"gate":"arenaEntry"},
    {"id":"arena","type":"circle","x":-2,"z":-76,"r":11.5},
  ],
  "obstacles": [
    {"kind":"tree","x":-9,"z":-11,"r":0.6,"model":"tree_round","s":1.2,"rot":0.4},
    {"kind":"tree","x":-11.5,"z":-14,"r":0.5,"model":"tree_round_b","s":1,"rot":2.1},
    {"kind":"tree","x":-8,"z":-15.5,"r":0.5,"model":"tree_pine","s":1,"rot":1},
    {"kind":"tree","x":12,"z":-6,"r":0.57,"model":"tree_round","s":1.15,"rot":3},
    {"kind":"tree","x":15,"z":-9.5,"r":0.5,"model":"tree_round_b","s":1,"rot":0.7},
    {"kind":"tree","x":11,"z":-19,"r":0.55,"model":"tree_pine","s":1.1,"rot":5.2},
    {"kind":"tree","x":16,"z":-18,"r":0.47,"model":"tree_round","s":0.95,"rot":1.8},
    {"kind":"tree","x":7,"z":-15,"r":0.45,"model":"tree_round_b","s":0.9,"rot":4.4},
    {"kind":"tree","x":-6,"z":-20,"r":0.5,"model":"tree_pine","s":1,"rot":2.6},
    {"kind":"tree","x":-17,"z":-19,"r":0.55,"model":"tree_round","s":1.1,"rot":0.2},
    {"kind":"tree","x":-8,"z":-36,"r":0.5,"model":"tree_round_b","s":1,"rot":3.7},
    {"kind":"tree","x":-17,"z":-45,"r":0.6,"model":"tree_pine","s":1.2,"rot":1.4},
    {"kind":"tree","x":-9,"z":-47,"r":0.5,"model":"tree_round","s":1,"rot":5.9},
    {"kind":"tree","x":6,"z":-50,"r":0.55,"model":"tree_round_b","s":1.1,"rot":2.9},
    {"kind":"water","x":-15,"z":-30,"r":3.4},
    {"kind":"water","x":-11,"z":-32,"r":2.2},
    {"kind":"rock","x":-18.6,"z":-28,"r":0.94,"model":"rock_a","s":1.1,"rot":0.9},
    {"kind":"rock","x":-12.5,"z":-26.2,"r":0.52,"model":"rock_b","s":0.7,"rot":2.4},
    {"kind":"ruin","x":12,"z":-31,"r":0.8,"model":"ruin_column","s":1,"rot":0.3},
    {"kind":"ruin","x":16.5,"z":-33,"r":0.88,"model":"ruin_column","s":1.1,"rot":0.6},
    {"kind":"ruin","x":13,"z":-39.5,"r":0.72,"model":"ruin_column","s":0.9,"rot":2.1},
    {"kind":"rock","x":18,"z":-38.5,"r":1.36,"model":"rock_a","s":1.6,"rot":4},
    {"kind":"rock","x":20,"z":-30,"r":1.1,"model":"rock_a","s":1.3,"rot":1.2},
    {"kind":"prop","x":-3.6,"z":-1.2,"r":1.25},
    {"kind":"prop","x":1.6,"z":1.2,"r":0.6},
    {"kind":"prop","x":2.6,"z":-4.2,"r":0.3},
    {"kind":"prop","x":-3.93,"z":3.32,"r":0.42},
    {"kind":"prop","x":-5.07,"z":3.68,"r":0.42},
    {"kind":"prop","x":5.35,"z":3.43,"r":0.42},
    {"kind":"prop","x":4.25,"z":2.97,"r":0.42},
    {"kind":"prop","x":-2.4,"z":-6,"r":0.22},
    {"kind":"prop","x":2.8,"z":-10,"r":0.22},
    {"kind":"prop","x":6.5,"z":-44,"r":0.22},
    {"kind":"prop","x":-0.4,"z":-46,"r":0.22},
  ],
  "roam": true,
  "gates": [{"id":"clearingExit","x":-2,"z":-55.6,"dirx":1,"dirz":0,"width":6,"startsOpen":false},{"id":"arenaEntry","x":-2,"z":-64.2,"dirx":1,"dirz":0,"width":6,"startsOpen":true}],
  "spawns": [
    {"kind":"puffcap","x":1.4,"z":-16,"group":"trail"},
    {"kind":"puffcap","x":2.6,"z":-24,"group":"trail"},
    {"kind":"puffcap","x":0,"z":-38,"group":"clearing"},
    {"kind":"puffcap","x":6.5,"z":-36,"group":"clearing"},
    {"kind":"puffcap","x":3.5,"z":-41.5,"group":"clearing"},
    {"kind":"thornling","x":4,"z":-40,"group":"clearing"},
  ],
  "clearingTrigger": {"x":3,"z":-37,"r":6.5},
  "spring": {"x":-0.4,"z":-52,"r":2.2},
  "boss": {"kind":"prismback","x":-2,"z":-80,"trigger":{"x":-2,"z":-76,"r":10.2}},
  "pillars": [
    {"x":-8.2,"z":-70.5,"r":0.85},
    {"x":4.2,"z":-70.5,"r":0.85},
    {"x":-8.2,"z":-81.5,"r":0.85},
    {"x":4.2,"z":-81.5,"r":0.85},
  ],
  "autoZones": [{"id":"field","nameTh":"ทุ่งหญ้า","shapes":["camp","meadowS","meadowE","meadowW","meadowC","clearing","meadowEE","meadowSW","meadowN"]},{"id":"exit","nameTh":"ทางไปลานบอส","shapes":["approach"]}],
};

export const NINJA_ENEMIES: EnemyTable = {
  "puffcap": {
    "nameTh":"พัฟแคป","radius":0.55,"maxHp":40,"speed":2.2,"aggro":7,"attackRange":3.2,"recover":1,
    "attacks": {
      "hop": {"id":"hop","nameTh":"สปอร์กระโดด","shape":"circle","windup":1.2,"dmg":14,"r":1.7,"tipTh":"วงส้มคือจุดที่มันจะกระโดดลง ให้เดินออกนอกวงหรือกด ↯ ตอนวงใกล้เต็ม"},
    },
  },
  "thornling": {
    "nameTh":"ธอร์นลิง","radius":0.5,"maxHp":55,"speed":3,"aggro":9,"attackRange":7,"recover":1.2,"rushSpeed":14,
    "attacks": {
      "rush": {"id":"rush","nameTh":"พุ่งหนาม","shape":"line","windup":0.9,"dmg":16,"r":7.5,"w":1.4,"tipTh":"แถบยาวคือแนวพุ่งชน ให้ก้าวออกด้านข้าง ไม่ใช่ถอยหลัง"},
    },
  },
  "prismback": {
    "nameTh":"ปริซึมแบ็ก ผู้พิทักษ์ทุ่ง","radius":1.9,"maxHp":1000,"speed":2,"speedP2":2.4,"phase2At":0.5,"windupMulP2":0.85,"stunPillar":2.6,"stunMiss":0.9,"chargeSpeed":15,"stunDmgMul":1.5,"roar":1.1,"p2FollowCharge":true,"followChargeWindup":1.35,"shardStagger":0.22,"p2ShardEvery":3,
    "attacks": {
      "sweep": {"id":"sweep","nameTh":"กวาดเขา","shape":"cone","windup":0.95,"dmg":18,"r":5.2,"w":0.5,"tipTh":"รูปพัดด้านหน้าบอส ให้หลบไปด้านข้างหรือด้านหลังบอส"},
      "slam": {"id":"slam","nameTh":"กระแทกปริซึม","shape":"circle","windup":1.25,"dmg":26,"r":4.6,"tipTh":"วงทองรอบตัวบอส ให้วิ่งออกนอกวง หรือกด ↯ ตอนวงเต็ม"},
      "charge": {"id":"charge","nameTh":"พุ่งคริสตัล","shape":"line","windup":1,"dmg":24,"r":18,"w":4.64,"tipTh":"ยืนหน้าเสาคริสตัลแล้วหลบด้านข้าง บอสจะชนเสาและมึนนาน"},
      "shard": {"id":"shard","nameTh":"ฝนผลึก","shape":"circle","windup":1,"dmg":12,"r":1.5,"tipTh":"วงเล็กตกตามตำแหน่งคุณ ให้เคลื่อนที่ต่อเนื่อง อย่ายืนนิ่ง"},
    },
  },
};
