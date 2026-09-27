#!/usr/bin/env bash
# The default Codespace's setup, plus links for BB. BB runs its agent threads
# with a fixed system PATH, which has neither npm's global bin nor
# tools/pi-rpc-acp, so the ACP adapters are linked into /usr/local/bin where
# those threads (and the factory's tests from homework 6) can find them.
set -u
cd "$(dirname "$0")/../.."

npm install -g @agentclientprotocol/claude-agent-acp @agentclientprotocol/codex-acp || true

npm_bin="$(npm prefix -g)/bin"
for tool in "$npm_bin/claude-agent-acp" "$npm_bin/codex-acp" "$PWD/tools/pi-rpc-acp/pi-rpc-acp"; do
  if [[ -x "$tool" ]]; then
    sudo ln -sfn "$tool" /usr/local/bin/ || printf 'could not link %s\n' "$tool" >&2
  else
    printf 'not installed: %s\n' "$tool" >&2
  fi
done

bin/doctor || true
