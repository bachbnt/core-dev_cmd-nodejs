// Copyright (c) 2026 bachbnt

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const generator = path.join(__dirname, '..', 'src', 'generators', 'python-project.js');

for (const framework of ['django', 'fastapi', 'flask']) {
  test(`${framework} generator creates a modern Python project`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), `devcmd-${framework}-`));
    const target = path.join(directory, `${framework}-app`);
    const result = spawnSync(process.execPath, [generator, framework, target], { encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(target, 'pyproject.toml')), true);
    assert.equal(fs.existsSync(path.join(target, 'README.md')), true);
    assert.equal(fs.existsSync(path.join(target, '.gitignore')), true);

    if (framework === 'fastapi') {
      assert.equal(fs.existsSync(path.join(target, 'app', 'main.py')), true);
      assert.equal(fs.existsSync(path.join(target, 'tests', 'test_main.py')), true);
    }
    if (framework === 'flask') {
      assert.equal(fs.existsSync(path.join(target, 'app', '__init__.py')), true);
      assert.equal(fs.existsSync(path.join(target, 'tests', 'test_app.py')), true);
    }
    if (framework === 'django') {
      assert.equal(fs.existsSync(path.join(target, 'tests', 'test_project.py')), true);
      assert.match(fs.readFileSync(path.join(target, 'pyproject.toml'), 'utf8'), /pytest-django/);
    }
  });
}

test('Python generator refuses to overwrite an existing target', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'devcmd-python-existing-'));
  const result = spawnSync(process.execPath, [generator, 'fastapi', directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Target already exists/);
});
