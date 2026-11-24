import json,collections,sys
def bucket(k):
    k=k.replace('SHADOW|','')
    if 'prismback' in k: return 'boss'
    if k.startswith('Group/hero') : return 'hero'
    if 'hero_ring' in k: return 'hero_ring'
    if 'vfx_sparkles' in k or '[pts]' in k: return 'sparkles(Points)'
    if k.startswith('Group/arena_floor'): return 'arena_floor'
    if k.startswith('Group/arena_deco') : return 'arena_deco(rim/waterfall/spray)'
    if k.startswith('Group/arena_shafts') or k.startswith('Group/arena_glow'): return 'shafts+glow'
    if any(x in k for x in ['prismatic_ruins','crystal_pillar','crystal_gate','lantern_post']): return 'ruins/pillars/gates/lanterns'
    if k.startswith('Group/Mesh'): return 'env_batches(Group/Mesh)'
    if k.startswith('Mesh {ShaderMaterial'): return 'telegraph(Shader Mesh)'
    if k.startswith('Mesh'): return 'loose Mesh (ring/vfx/basic)'
    return 'other:'+k
def agg(row):
    b=collections.Counter()
    for k,v in row['byPath'].items(): b[bucket(k)]+=v
    return b
if __name__=='__main__':
    for f in sys.argv[1:]:
        d=json.load(open(f)); tl=d['tl']
        print('==',f,'rows',len(tl))
        pk=d['peak']['row']; print('peak',pk['calls'],'tick',pk['tick'],pk['teles'],'hooked',pk['hooked'])
        print({k:v for k,v in agg(pk).items()})
        lo=min(tl,key=lambda r:r['calls']); print('min',lo['calls'],lo['teles'],dict(agg(lo)))
        # per tele-signature
        sig=collections.defaultdict(list)
        for r in tl:
            sig[' + '.join(sorted(collections.Counter(r['teles']).elements())) or '(none)'].append(r['calls'])
        for s,v in sorted(sig.items(), key=lambda x:-max(x[1])): print('  ',s[:70].ljust(70),'n',len(v),'min',min(v),'max',max(v))
