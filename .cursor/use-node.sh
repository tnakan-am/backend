# Select the Node version pinned in .nvmrc (20) via nvm.
# Sourced by the install/start scripts and dev-server terminal so that the
# nvm-managed Node wins over any node earlier in PATH.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1
