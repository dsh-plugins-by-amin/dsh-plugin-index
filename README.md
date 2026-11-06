# dsh-plugin-index

Index format 1 (list plugin org dsh-plugins-by-amin) untuk tab **Discover** (plugin-market).

- `index.json` — senarai plugin + versi (commit-pinned git sources)
- `scripts/update-index.mjs` — di-lakukan oleh workflow setiap plugin repo bila tag `v*` di-push

Workflow template: `.github/workflows/update-index.yml` dalam setiap repo plugin + secret `INDEX_PUSH_TOKEN`.
