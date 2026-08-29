#!/bin/bash

set -euo pipefail

RELEASE_URL="https://github.com/austinmhorn/basilisk/releases/download/current-build/Basilisk-macOS.dmg"
TARGET_APP="/Applications/BasiliskGame.app"

log() {
    printf '\n[Basilisk] %s\n' "$1"
}

fail() {
    printf '\n[Basilisk] ERROR: %s\n' "$1" >&2
    exit 1
}

if [[ "$(uname -s)" != "Darwin" ]]; then
    fail "This installer only supports macOS."
fi

macos_version="$(sw_vers -productVersion)"
macos_major="${macos_version%%.*}"

if [[ ! "${macos_major}" =~ ^[0-9]+$ ]] || (( macos_major < 14 )); then
    fail "Basilisk requires macOS 14 or newer. Detected macOS ${macos_version}."
fi

for command in curl hdiutil ditto xattr codesign open; do
    command -v "${command}" >/dev/null 2>&1 ||
        fail "Required macOS tool '${command}' was not found."
done

printf '%s\n' \
    "Basilisk is currently distributed without Apple notarization." \
    "This installer downloads the official current build, removes its" \
    "quarantine attribute, applies an ad-hoc signature, installs it to" \
    "/Applications, and launches it."

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/basilisk-install.XXXXXX")"
dmg_path="${work_dir}/Basilisk-macOS.dmg"
mount_point="${work_dir}/mount"
staged_app="${work_dir}/BasiliskGame.app"
mounted=0

cleanup() {
    if (( mounted )); then
        hdiutil detach "${mount_point}" -quiet >/dev/null 2>&1 || true
    fi
    rm -rf "${work_dir}"
}
trap cleanup EXIT INT TERM

mkdir -p "${mount_point}"

log "Downloading the current macOS build..."
curl \
    --fail \
    --location \
    --retry 3 \
    --connect-timeout 15 \
    --progress-bar \
    "${RELEASE_URL}" \
    --output "${dmg_path}"

[[ -s "${dmg_path}" ]] || fail "The downloaded DMG is empty."

log "Mounting the disk image..."
hdiutil attach \
    -nobrowse \
    -readonly \
    -mountpoint "${mount_point}" \
    "${dmg_path}" \
    >/dev/null
mounted=1

source_app="${mount_point}/BasiliskGame.app"
[[ -d "${source_app}" ]] ||
    fail "BasiliskGame.app was not found in the downloaded DMG."
[[ -x "${source_app}/Contents/MacOS/BasiliskGame" ]] ||
    fail "The downloaded app does not contain the expected Basilisk executable."

log "Staging Basilisk..."
ditto "${source_app}" "${staged_app}"

hdiutil detach "${mount_point}" -quiet
mounted=0

log "Preparing the unsigned build for this Mac..."
xattr -dr com.apple.quarantine "${staged_app}" >/dev/null 2>&1 || true
codesign --force --deep --sign - "${staged_app}"
codesign --verify --deep --strict "${staged_app}"

installing_app="/Applications/.BasiliskGame.installing.$$"

install_without_sudo() {
    rm -rf "${installing_app}"
    ditto "${staged_app}" "${installing_app}"
    rm -rf "${TARGET_APP}"
    mv "${installing_app}" "${TARGET_APP}"
    xattr -dr com.apple.quarantine "${TARGET_APP}" >/dev/null 2>&1 || true
}

install_with_sudo() {
    printf '\n[Basilisk] macOS may request your administrator password to install to /Applications.\n'
    sudo rm -rf "${installing_app}"
    sudo ditto "${staged_app}" "${installing_app}"
    sudo rm -rf "${TARGET_APP}"
    sudo mv "${installing_app}" "${TARGET_APP}"
    sudo xattr -dr com.apple.quarantine "${TARGET_APP}" >/dev/null 2>&1 || true
}

log "Installing Basilisk to /Applications..."
if [[ -w "/Applications" ]]; then
    install_without_sudo
else
    install_with_sudo
fi

[[ -x "${TARGET_APP}/Contents/MacOS/BasiliskGame" ]] ||
    fail "Installation completed without the expected Basilisk executable."

codesign --verify --deep --strict "${TARGET_APP}"

log "Launching Basilisk..."
open "${TARGET_APP}"

printf '\n[Basilisk] Installed successfully: %s\n' "${TARGET_APP}"
