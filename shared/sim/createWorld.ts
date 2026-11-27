// The sim for a ruleset: World for the Wayfarer rulesets, NinjaWorld for `ninja-roam-1`. Server replay and new code make worlds here.
import { World } from './world.ts';
import { NinjaWorld } from './ninjaWorld.ts';
import { DEFAULT_VARIANT, type RunVariant } from './variant.ts';
import { DEFAULT_RULESET, isNinja, type Ruleset } from './ruleset.ts';

export function createWorld(seed: number, variant: RunVariant = DEFAULT_VARIANT, ruleset: Ruleset = DEFAULT_RULESET): World {
  return isNinja(ruleset) ? new NinjaWorld(seed, variant) : new World(seed, variant, ruleset);
}
