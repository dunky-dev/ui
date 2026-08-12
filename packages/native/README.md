# @dunky-dev/native

The React Native substrate's dev shell: an Expo app that renders the
on-device Storybook, plus the jest suite for the native bindings. Private —
nothing here is published. The rules for editing code in this scope live in
[AGENTS.md](./AGENTS.md); this file is about getting it running on a
simulator/emulator.

## Scripts

From the repo root:

| Script             | What it does                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev:expo`    | Metro only (`expo start`) — pick targets from the Expo CLI (`i` / `a` open both) |
| `pnpm dev:ios`     | Metro + the app on the iOS simulator                                             |
| `pnpm dev:android` | Metro + the app on the Android emulator                                          |
| `pnpm test:native` | Runs the jest suite (also folded into `pnpm test:ci`)                            |

Inside this package, `ondevice`, `ondevice:ios`, and `ondevice:android` are
the same Metro starts, run via `pnpm -C packages/native <script>`.

## First run: build the dev app

The flows and stories run in a **dev build** (`dev.dunky.ui`, from
`app.json`), not Expo Go. Once per machine (and after native dependency
changes), build and install it on the target:

```sh
pnpm -C packages/native exec expo run:ios       # needs Xcode
pnpm -C packages/native exec expo run:android   # needs the Android SDK (below)
```

After that, the `dev:*` / `ondevice:*` scripts just attach Metro to the
installed app.

## iOS

Xcode with an iOS simulator is all you need. `pnpm dev:expo` boots the
simulator, installs nothing by itself (see first run above), and connects
Metro.

## Android

macOS has no Android toolchain by default — without it, `expo` fails with
`Failed to resolve the Android SDK path` / `spawn adb ENOENT`. The CLI-only
setup (no Android Studio, ~3-4 GB):

```sh
brew install openjdk@17
brew install --cask android-commandlinetools
```

Add to `~/.zshrc` — the brew cask installs the SDK outside the default
`~/Library/Android/sdk` location, so `ANDROID_HOME` is required:

```sh
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Then install the SDK pieces and create an emulator (image is `arm64-v8a` for
Apple Silicon; use `x86_64` on Intel):

```sh
yes | sdkmanager --licenses
sdkmanager "platform-tools" "emulator" "platforms;android-36" \
  "system-images;android-36;google_apis;arm64-v8a" "build-tools;36.0.0"
avdmanager create avd -n dunky -k "system-images;android-36;google_apis;arm64-v8a" -d pixel_7
```

Boot it with `emulator -avd dunky` (own shell — it stays in the foreground),
then do the first-run build above. Hardware Back — the path iOS can't
exercise — is the emulator's toolbar Back button, or
`adb shell input keyevent KEYCODE_BACK`.

If you'd rather have the GUI tooling, Android Studio
(`brew install --cask android-studio`) sets up the same SDK in the default
location — skip `ANDROID_HOME` in that case.

## Testing

- **Unit/behavior**: jest (`pnpm test:native`), runs in CI. Why jest and not
  vitest, and what these tests cover, is in [AGENTS.md](./AGENTS.md).
- **Device E2E**: Maestro flows in [`.maestro/`](./.maestro/README.md),
  local-only — they drive the on-device Storybook on a real
  simulator/emulator.
