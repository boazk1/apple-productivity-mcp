# Release Checklist

1. Confirm the working tree is clean.
2. Run:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev
npm pack --dry-run
```

3. Update `CHANGELOG.md`.
4. Bump `package.json` with `npm version patch`, `minor`, or `major`.
5. Push the tag.
6. Publish with `npm publish`.
7. Create a GitHub release from the tag.

The package includes `dist`, examples, docs, README, license, changelog,
contributing guide, and security policy.
