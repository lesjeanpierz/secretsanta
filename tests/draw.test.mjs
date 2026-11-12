import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, cp, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('Le script enregistre une seule élection et respecte les paramètres', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'santa-'));
  try {
    await cp(new URL('../scripts/', import.meta.url), join(dir,'scripts'), {recursive:true});
    await mkdir(join(dir,'public/data'), {recursive:true});
    const file = name => join(dir,'public/data',name+'.json');
    const set = (name, value) => writeFile(file(name), JSON.stringify(value));
    const get = async name => JSON.parse(await readFile(file(name),'utf8'));
    const run = () => spawnSync(process.execPath, [join(dir,'scripts/draw.mjs')], {encoding:'utf8'});
    const config = {showElectionButton:true, participantsAreExamples:false};
    await set('participants', [{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}]);
    await set('election', null);
    await set('config', {...config, participantsAreExamples:true});
    assert.notEqual(run().status, 0);
    assert.equal(await get('election'), null);
    await set('config', {...config, showElectionButton:false});
    assert.notEqual(run().status, 0);
    await set('config', config);
    const first = run(); assert.equal(first.status, 0, first.stderr);
    const result = await get('election');
    assert.equal(result.assignments.length, 3);
    assert.equal(result.version, 3);
    if (result.bonus) {
      assert.equal(result.bonus.giverId, 'c');
      assert.deepEqual(result.assignments.at(-1), result.bonus);
    }
    assert.equal((await get('config')).showElectionButton, false);
    await set('config', config);
    assert.notEqual(run().status, 0);
    assert.deepEqual(await get('election'), result);
  } finally { await rm(dir, {recursive:true, force:true}); }
});
