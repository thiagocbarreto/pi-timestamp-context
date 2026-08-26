# Contributing

Keep changes small and focused on giving models reliable message time context.

## Development

Use the Node.js version declared in [`package.json`](./package.json). Install the locked dependencies without lifecycle scripts:

```sh
npm ci --ignore-scripts
```

Run the full check before submitting a change:

```sh
npm run check
```

Use `npm run format` to apply repository formatting. Bug fixes should include a regression test that reproduces the failure.

For Pi extension APIs and package rules, use the [official Pi extension documentation](https://pi.dev/docs/latest/extensions) and [package documentation](https://pi.dev/docs/latest/packages).
