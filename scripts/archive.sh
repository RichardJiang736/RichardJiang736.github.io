#!/bin/zsh
# Rebuild the public site and the private archive.
#
# The public build runs from this repository and contains only public material.
# The archive needs the private diary, posts, data, pages and images, which no
# longer live here. They are staged into a temporary source tree from
# PRIVATE_ROOT, rendered with `--unpublished`, and then removed. Nothing private
# is committed.
set -euo pipefail

cd "$(dirname "$0")/.."

# The local Ruby that has Jekyll. Kept for the owner's machine, which does not
# use a Gemfile; elsewhere, install Jekyll and remove this line.
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

PRIVATE_ROOT="${PRIVATE_ROOT:-$HOME/Downloads/Projects/RichardJiang736-private}"

if [[ ! -d "$PRIVATE_ROOT" ]]; then
  echo "Private sources are not at $PRIVATE_ROOT" >&2
  echo "Set PRIVATE_ROOT to the directory that holds _diary, _posts, _data, art, projects, diary and resources/diary." >&2
  exit 1
fi

if ! command -v jekyll >/dev/null 2>&1; then
  echo "jekyll was not found. Install it or adjust PATH at the top of this script." >&2
  exit 1
fi

# Both temporary trees contain plaintext private material. Remove them even
# when the build or the password prompt fails.
cleanup() {
  rm -rf .archive-src .archive-site
}
trap cleanup EXIT

# 1. Public site, from the public tree.
jekyll build

# 2. A complete source tree for the archive: the public site plus the private
#    material, which is never in Git.
rm -rf .archive-src .archive-site
rsync -a --delete \
  --exclude .git \
  --exclude _site \
  --exclude .archive-site \
  --exclude .archive-src \
  ./ .archive-src/

copy_dir() {
  local from="$1"
  local to="$2"
  if [[ ! -d "$from" ]]; then
    echo "Missing private directory: $from" >&2
    exit 1
  fi
  mkdir -p "$to"
  rsync -a "$from/" "$to/"
}

copy_file() {
  local from="$1"
  local to="$2"
  if [[ ! -f "$from" ]]; then
    echo "Missing private file: $from" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$to")"
  cp "$from" "$to"
}

copy_dir "$PRIVATE_ROOT/_diary" .archive-src/_diary
copy_dir "$PRIVATE_ROOT/_posts" .archive-src/_posts
copy_file "$PRIVATE_ROOT/_data/art.yml" .archive-src/_data/art.yml
copy_file "$PRIVATE_ROOT/_data/projects.yml" .archive-src/_data/projects.yml
copy_dir "$PRIVATE_ROOT/art" .archive-src/art
copy_dir "$PRIVATE_ROOT/projects" .archive-src/projects
copy_dir "$PRIVATE_ROOT/diary" .archive-src/diary
copy_dir "$PRIVATE_ROOT/resources/diary" .archive-src/resources/diary

# 3. Render the private tree and encrypt it. The builder reads .archive-site
#    and writes archive/index.html; it prompts for the password.
jekyll build --source .archive-src --destination .archive-site --unpublished
node scripts/build-private-archive.mjs
