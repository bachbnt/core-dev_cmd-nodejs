#!/usr/bin/env node
// Copyright (c) 2026 bachbnt

const fs = require('fs');
const path = require('path');

const framework = process.argv[2];
const target = process.argv[3];
const supported = ['django', 'fastapi', 'flask'];

function write(relativePath, content) {
  const file = path.join(target, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function pyproject(name, dependencies, options = {}) {
  const devDependencies = ['pytest>=8,<10', 'build>=1.2,<2.0', ...(options.devDependencies || [])];
  const pytestOptions = options.pytestOptions || '';
  return `[build-system]
requires = ["setuptools>=77"]
build-backend = "setuptools.build_meta"

[project]
name = "${name}"
version = "0.1.0"
description = "${framework} project created by DevCmd"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
${dependencies.map((dependency) => `  "${dependency}",`).join('\n')}
]

[project.optional-dependencies]
dev = [
${devDependencies.map((dependency) => `  "${dependency}",`).join('\n')}
]

[tool.pytest.ini_options]
testpaths = ["tests"]
${pytestOptions}
`;
}

function createBase() {
  if (fs.existsSync(target)) {
    throw new Error(`Target already exists: ${target}`);
  }
  fs.mkdirSync(target, { recursive: true });
  write('.gitignore', `.venv/
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
.env
dist/
build/
*.egg-info/
`);
}

function createDjango() {
  write(
    'pyproject.toml',
    pyproject(target, ['Django>=5.2,<7.0'], {
      devDependencies: ['pytest-django>=4.11,<5.0'],
      pytestOptions: 'DJANGO_SETTINGS_MODULE = "config.settings"',
    })
  );
  write('README.md', `# ${target}

## Development

\`\`\`bash
source .venv/bin/activate
python manage.py migrate
python manage.py runserver
\`\`\`

Run tests with \`python manage.py test\` or \`pytest\`.
`);
  write('tests/test_project.py', `from django.conf import settings


def test_django_project_is_configured() -> None:
    assert settings.ROOT_URLCONF == "config.urls"
`);
}

function createFastAPI() {
  write('pyproject.toml', pyproject(target, ['fastapi[standard]>=0.115,<1.0', 'httpx>=0.27,<1.0']));
  write('README.md', `# ${target}

## Development

\`\`\`bash
source .venv/bin/activate
fastapi dev app/main.py
\`\`\`

Run tests with \`pytest\`.
`);
  write('app/__init__.py', '');
  write('app/main.py', `from fastapi import FastAPI

app = FastAPI(title="${target}")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Hello from ${target}"}
`);
  write('tests/test_main.py', `from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from ${target}"}
`);
}

function createFlask() {
  write('pyproject.toml', pyproject(target, ['Flask>=3.1,<4.0']));
  write('README.md', `# ${target}

## Development

\`\`\`bash
source .venv/bin/activate
flask --app app run --debug
\`\`\`

Run tests with \`pytest\`.
`);
  write('app/__init__.py', `from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index() -> dict[str, str]:
        return {"message": "Hello from ${target}"}

    return app
`);
  write('tests/test_app.py', `from app import create_app


def test_index() -> None:
    client = create_app().test_client()
    response = client.get("/")
    assert response.status_code == 200
    assert response.get_json() == {"message": "Hello from ${target}"}
`);
}

try {
  if (!supported.includes(framework) || !target) {
    throw new Error(`Usage: python-project.js <${supported.join('|')}> <target>`);
  }
  createBase();
  if (framework === 'django') createDjango();
  if (framework === 'fastapi') createFastAPI();
  if (framework === 'flask') createFlask();
} catch (error) {
  console.error(`Unable to create ${framework || 'Python'} project: ${error.message}`);
  process.exitCode = 1;
}
