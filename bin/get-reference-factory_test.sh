#!/usr/bin/env bash
# Exercises bin/get-reference-factory against a fake release served from a
# scratch folder through REFERENCE_FACTORY_URL=file://. The real
# bin/reference-factory is never touched: the script runs from a scratch
# copy of bin/.
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

version=$(sed -n 's/^version=//p' "$repo_root/bin/get-reference-factory" | head -n 1)
release="$scratch/release"
fake_bin="$scratch/fake-bin"
work="$scratch/work"
mkdir -p "$release" "$fake_bin"

# A fake uname comes first on PATH. UNAME_S and UNAME_M choose the machine.
cat >"$fake_bin/uname" <<'FAKE'
#!/usr/bin/env bash
case "${1-}" in
  -s) echo "${UNAME_S-Linux}" ;;
  -m) echo "${UNAME_M-x86_64}" ;;
  *) echo "${UNAME_S-Linux}" ;;
esac
FAKE
chmod +x "$fake_bin/uname"

fail() { echo "$*" >&2; exit 1; }

# A fresh scratch copy of bin/ for each case.
fresh_install_dir() {
  rm -rf "$work"
  mkdir -p "$work/bin"
  cp "$repo_root/bin/get-reference-factory" "$work/bin/"
}

serve() { # serve <printed version> [sum override]
  printf '#!/usr/bin/env bash\necho "factory %s"\n' "$1" >"$release/factory-$version-linux-amd64"
  chmod +x "$release/factory-$version-linux-amd64"
  local sum
  sum=$(sha256sum "$release/factory-$version-linux-amd64" | cut -d' ' -f1)
  printf '%s  factory-%s-linux-amd64\n' "${2:-$sum}" "$version" >"$release/SHA256SUMS"
}

get() {
  env PATH="$fake_bin:$PATH" REFERENCE_FACTORY_URL="file://$release" \
    UNAME_S="${UNAME_S-Linux}" UNAME_M="${UNAME_M-x86_64}" \
    /bin/bash "$work/bin/get-reference-factory"
}

# installs and checks
fresh_install_dir
serve "$version"
out=$(get) || fail "expected the install to succeed: $out"
[[ -x "$work/bin/reference-factory" ]] || fail 'expected bin/reference-factory to be executable'
[[ "$("$work/bin/reference-factory" --version)" == "factory $version" ]] ||
  fail "expected bin/reference-factory --version to print factory $version"
[[ "$out" == *"factory $version"* ]] || fail 'expected the script to end by printing the version'
[[ "$out" != *'not been tried'* ]] || fail 'expected no arm64 note on linux-amd64'
leftovers=$(ls -A "$work/bin")
[[ "$leftovers" == $'get-reference-factory\nreference-factory' ]] || fail "unexpected files in bin/: $leftovers"

# already there, no download
rm -f "$release"/factory-* "$release/SHA256SUMS"
out=$(get) || fail "expected the second run to succeed: $out"
[[ "$out" == *already* ]] || fail "expected an 'already' message, got: $out"

# an older binary is replaced
fresh_install_dir
printf '#!/usr/bin/env bash\necho "factory 2000.01.01"\n' >"$work/bin/reference-factory"
chmod +x "$work/bin/reference-factory"
serve "$version"
get >/dev/null || fail 'expected the update to succeed'
[[ "$("$work/bin/reference-factory" --version)" == "factory $version" ]] ||
  fail 'expected the older binary to be replaced'

# a checksum mismatch installs nothing
fresh_install_dir
serve "$version" 0000000000000000000000000000000000000000000000000000000000000000
if out=$(get 2>&1); then fail 'expected a checksum mismatch to fail'; fi
[[ "$out" == *[Cc]hecksum* ]] || fail "expected the failure to mention the checksum, got: $out"
[[ ! -e "$work/bin/reference-factory" ]] || fail 'expected nothing to be installed after a mismatch'
leftovers=$(ls -A "$work/bin")
[[ "$leftovers" == get-reference-factory ]] || fail "expected nothing left half-written, found: $leftovers"

# a checksum mismatch leaves an older binary as it was
fresh_install_dir
printf '#!/usr/bin/env bash\necho "factory 2000.01.01"\n' >"$work/bin/reference-factory"
chmod +x "$work/bin/reference-factory"
serve "$version" 0000000000000000000000000000000000000000000000000000000000000000
if get >/dev/null 2>&1; then fail 'expected a checksum mismatch to fail'; fi
[[ "$("$work/bin/reference-factory" --version)" == "factory 2000.01.01" ]] ||
  fail 'expected the older binary to be left as it was'

# an unsupported platform is refused
fresh_install_dir
serve "$version"
if out=$(UNAME_S=Darwin UNAME_M=x86_64 get 2>&1); then fail 'expected an unsupported platform to fail'; fi
[[ "$out" == *'linux-amd64, linux-arm64, darwin-arm64'* ]] ||
  fail "expected the message to name the supported builds, got: $out"
[[ ! -e "$work/bin/reference-factory" ]] || fail 'expected nothing to be installed on an unsupported platform'

# arm64 builds say they are untried
fresh_install_dir
serve "$version"
cp "$release/factory-$version-linux-amd64" "$release/factory-$version-linux-arm64"
sum=$(sha256sum "$release/factory-$version-linux-arm64" | cut -d' ' -f1)
printf '%s  factory-%s-linux-arm64\n' "$sum" "$version" >"$release/SHA256SUMS"
out=$(UNAME_M=aarch64 get) || fail "expected the arm64 install to succeed: $out"
[[ "$out" == *'not been tried'* ]] || fail "expected an untried note on arm64, got: $out"

printf 'get-reference-factory tests passed\n'
