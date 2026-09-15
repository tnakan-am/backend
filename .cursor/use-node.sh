# Load nvm and select the Node toolchain for this repo.
#
# The Cloud Agent base image ships `node` on PATH via /exec-daemon but no `npm`,
# so scripts must load nvm to get a working `npm`/`npx`. We select the version
# pinned in .nvmrc (20); note that /exec-daemon's `node` may still take PATH
# precedence at runtime (Node 22), which this app fully supports.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1
