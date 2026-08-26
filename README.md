# Pi Timestamp Context

[Pi](https://pi.dev) extension that gives the model exact time context for every user message. This helps the model account for hours or days that pass before a session resumes.

## What the model receives

The extension prepends one metadata block to each user message in the active model context:

```xml
<user_message_time unix_ms="0">Local datetime: Thursday, January 1, 1970 at 12:00:00.000 AM GMT+00:00</user_message_time>
```

`unix_ms` identifies the exact instant without locale ambiguity. The readable value uses English names and the machine's local time zone, including its UTC offset.

## Behavior

- Uses the timestamp Pi recorded when the user message was created.
- Covers current and resumed sessions because Pi rebuilds model context before each model call.
- Preserves text and image content after the timestamp block.
- Changes only Pi's temporary model context. Stored session messages and the TUI transcript remain unchanged.
- Adds stable historical metadata, so repeated model calls receive the same value for the same message.
- Adds no tools, commands, settings, background work, or runtime dependencies.

Messages replaced by a compaction summary no longer exist as individual context messages, so their individual timestamps cannot be attached. Messages retained after compaction keep their timestamps.

## Security and privacy

[Pi packages](https://pi.dev/docs/latest/packages) run with the current user's permissions. Review package source before installation.

This extension sends message timestamps and readable local datetimes to the selected model provider as part of model context. It does not access the filesystem, start processes, make network requests, read environment variables, or persist data.

## Installation

Install from npm:

```sh
pi install npm:@thiagocbarreto/pi-timestamp-context
```

Restart Pi after installation. Use `pi list` to confirm that the package is loaded.

Update or remove it with:

```sh
pi update npm:@thiagocbarreto/pi-timestamp-context
pi remove npm:@thiagocbarreto/pi-timestamp-context
```

Install a local checkout during development with:

```sh
pi install /absolute/path/to/pi-timestamp-context
```

## Development

Install the locked development dependencies without lifecycle scripts, then run all checks:

```sh
npm ci --ignore-scripts
npm run check
```

Apply formatting with:

```sh
npm run format
```

See the [official Pi extension documentation](https://pi.dev/docs/latest/extensions) and [package documentation](https://pi.dev/docs/latest/packages) for host APIs and package rules.

## License

[MIT](./LICENSE)
