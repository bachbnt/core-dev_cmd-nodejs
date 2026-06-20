#!/usr/bin/env bash
# Copyright (c) 2026 bachbnt

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DRY_RUN=false
ASSUME_YES=false
DRAFT=false
VERSION_SELECTION=""

usage() {
  cat <<'EOF'
Usage: npm run release -- [patch|minor|major|current|VERSION] [options]

Options:
  --dry-run  Run validation and print the release plan without changing Git.
  --yes      Skip the final confirmation prompt.
  --draft    Create the GitHub Release as a draft.
  --help     Show this help message.

Examples:
  npm run release
  npm run release -- patch
  npm run release -- 2.4.0
  npm run release -- patch --dry-run
EOF
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command is not available: $1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --yes) ASSUME_YES=true ;;
    --draft) DRAFT=true ;;
    --help|-h) usage; exit 0 ;;
    --*) fail "Unsupported option: $1" ;;
    *)
      [[ -z "$VERSION_SELECTION" ]] || fail "Only one version selection may be provided."
      VERSION_SELECTION="$1"
      ;;
  esac
  shift
done

cd "$PROJECT_DIR"
require_command git
require_command gh
require_command node
require_command npm

CURRENT_VERSION="$(node -p "require('./package.json').version")"

if [[ -z "$VERSION_SELECTION" ]]; then
  [[ -t 0 ]] || fail "A version selection is required in a non-interactive terminal."
  printf 'Current version: %s\n\n' "$CURRENT_VERSION"
  printf '  1) patch\n  2) minor\n  3) major\n  4) current\n  5) custom\n'
  read -r -p 'Select release version [1]: ' choice
  case "${choice:-1}" in
    1|patch) VERSION_SELECTION="patch" ;;
    2|minor) VERSION_SELECTION="minor" ;;
    3|major) VERSION_SELECTION="major" ;;
    4|current) VERSION_SELECTION="current" ;;
    5|custom)
      read -r -p 'Enter semantic version: ' VERSION_SELECTION
      ;;
    *) fail "Unknown version selection: $choice" ;;
  esac
fi

NEXT_VERSION="$(node "$SCRIPT_DIR/release-version.js" "$CURRENT_VERSION" "$VERSION_SELECTION")"
TAG="v$NEXT_VERSION"
BRANCH="$(git branch --show-current)"
[[ -n "$BRANCH" ]] || fail "Releases cannot be created from a detached HEAD."
[[ "$BRANCH" == "main" ]] || fail "Releases must be created from main; current branch is $BRANCH."

git remote get-url origin >/dev/null 2>&1 || fail "Git remote origin is not configured."
gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated. Run: gh auth login"
REPOSITORY="$(gh repo view --json nameWithOwner --jq .nameWithOwner)" || fail "GitHub repository could not be accessed."
git var GIT_AUTHOR_IDENT >/dev/null 2>&1 || fail "Git author identity is not configured."

printf 'Fetching origin/%s...\n' "$BRANCH"
git fetch --quiet origin "$BRANCH"
read -r AHEAD BEHIND <<EOF
$(git rev-list --left-right --count "HEAD...origin/$BRANCH")
EOF
[[ "$BEHIND" == "0" ]] || fail "Local $BRANCH is behind origin/$BRANCH by $BEHIND commit(s). Pull before releasing."

git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1 && fail "Local tag already exists: $TAG"
set +e
git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1
REMOTE_TAG_STATUS=$?
set -e
if [[ "$REMOTE_TAG_STATUS" == "0" ]]; then
  fail "Remote tag already exists: $TAG"
fi
[[ "$REMOTE_TAG_STATUS" == "2" ]] || fail "Unable to check remote tag $TAG."

CHANGES="$(git status --short)"
if [[ "$NEXT_VERSION" == "$CURRENT_VERSION" && -z "$CHANGES" ]]; then
  fail "There are no changes to commit and the selected version is already $CURRENT_VERSION."
fi

printf '\nRelease plan\n'
printf '  Branch:  %s\n' "$BRANCH"
printf '  Version: %s -> %s\n' "$CURRENT_VERSION" "$NEXT_VERSION"
printf '  Tag:     %s\n' "$TAG"
printf '  Remote:  %s\n' "$(git remote get-url origin)"
printf '  GitHub:  %s\n' "$REPOSITORY"
printf '  Release: %s\n' "$([[ "$DRAFT" == true ]] && printf draft || printf published)"
printf '  Ahead:   %s commit(s)\n' "$AHEAD"
node "$SCRIPT_DIR/sync-release-version.js" "$NEXT_VERSION" --dry-run
if [[ -n "$CHANGES" ]]; then
  printf '\nChanges included in the release commit:\n%s\n' "$CHANGES"
fi

printf '\nRunning release checks...\n'
npm test
npm pack --dry-run >/dev/null
git diff --check

if [[ "$DRY_RUN" == true ]]; then
  printf '\nDry run complete. No version, commit, tag, push, or GitHub Release was created.\n'
  exit 0
fi

if [[ "$ASSUME_YES" != true ]]; then
  [[ -t 0 ]] || fail "Confirmation requires an interactive terminal; pass --yes to continue."
  read -r -p "Create and publish $TAG? [y/N] " confirmation
  [[ "$confirmation" == "y" || "$confirmation" == "Y" ]] || fail "Release cancelled."
fi

if [[ "$NEXT_VERSION" != "$CURRENT_VERSION" ]]; then
  npm version "$NEXT_VERSION" --no-git-tag-version --ignore-scripts
fi
node "$SCRIPT_DIR/sync-release-version.js" "$NEXT_VERSION"

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
LOCK_VERSION="$(node -p "require('./package-lock.json').version")"
LOCK_PACKAGE_VERSION="$(node -p "require('./package-lock.json').packages[''].version")"
[[ "$PACKAGE_VERSION" == "$NEXT_VERSION" ]] || fail "package.json version is $PACKAGE_VERSION; expected $NEXT_VERSION."
[[ "$LOCK_VERSION" == "$NEXT_VERSION" ]] || fail "package-lock.json version is $LOCK_VERSION; expected $NEXT_VERSION."
[[ "$LOCK_PACKAGE_VERSION" == "$NEXT_VERSION" ]] || fail "package-lock.json root package version is $LOCK_PACKAGE_VERSION; expected $NEXT_VERSION."
node "$SCRIPT_DIR/sync-release-version.js" "$NEXT_VERSION" --check
npm pack --dry-run >/dev/null
git diff --check

COMMIT_MESSAGE="release: $TAG"
if [[ "$ASSUME_YES" != true && -t 0 ]]; then
  read -r -p "Commit message [$COMMIT_MESSAGE]: " custom_message
  [[ -n "$custom_message" ]] && COMMIT_MESSAGE="$custom_message"
fi

git add -A
git commit -m "$COMMIT_MESSAGE"
git tag -a "$TAG" -m "DevCmd $TAG"
git push origin "$BRANCH"
git push origin "$TAG"

RELEASE_ARGS=("$TAG" --verify-tag --title "DevCmd $TAG" --generate-notes --fail-on-no-commits)
if [[ "$DRAFT" == true ]]; then
  RELEASE_ARGS+=(--draft)
fi
gh release create "${RELEASE_ARGS[@]}"

printf '\nRelease %s created successfully.\n' "$TAG"
