# Vercel deployment

The bilingual reader is hosted on **Vercel** at
[https://dictionary-of-ai-coding-three.vercel.app](https://dictionary-of-ai-coding-three.vercel.app).

- [Русский](https://dictionary-of-ai-coding-three.vercel.app/?lang=ru)
- [English](https://dictionary-of-ai-coding-three.vercel.app/?lang=en)
- Vercel project: `dictionary-of-ai-coding`.

## How releases work

Releases are manual. The application is checked and built on Dell, then the
Vercel CLI uploads the generated static files using `--prebuilt --prod`.
Git pushes do not automatically deploy this project. GitHub Actions remains
disabled. Vercel serves the static bundle; it does not compile the application
during this workflow.

The upload includes HTML, JavaScript, CSS, local fonts and their license notices.
It needs no server functions, runtime environment variables or API keys.
Account credentials, local environment files and the repository checkout are
outside the uploaded build output.

## Build and upload

Run these commands on Dell from the repository root. Use Node.js 22 or newer and
an authenticated Vercel CLI with access to the existing project. This workflow
was verified with Vercel CLI 64.5.0. Use the existing authorized login; do not
commit credentials.

First validate the source and produce `dist/`:

```sh
npm ci
npm run check
```

Create an isolated staging directory and package the static files in Vercel's
Build Output API format. The headers match the local preview's content policy:

```sh
dictionary_deploy_dir=$(mktemp -d)
mkdir -p "$dictionary_deploy_dir/.vercel/output/static"
cp -R dist/. "$dictionary_deploy_dir/.vercel/output/static/"
cat > "$dictionary_deploy_dir/.vercel/output/config.json" <<'JSON'
{
  "version": 3,
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "continue": true
    }
  ]
}
JSON
```

Link this staging directory to the existing `dictionary-of-ai-coding` project.
Select the workspace that owns that project. If it is not available, stop and
resolve access instead of creating another project.

```sh
vercel link --cwd "$dictionary_deploy_dir" --project dictionary-of-ai-coding
rm -f "$dictionary_deploy_dir/.env.local"
```

The CLI can create a local environment file while linking. This static reader
does not use it, so the command above removes it from this isolated directory.
For later releases, an existing linked staging directory can be reused after
replacing its static output.

Publish the prepared output and record the source commit as deployment metadata:

```sh
vercel deploy \
  --cwd "$dictionary_deploy_dir" \
  --prebuilt \
  --prod \
  --yes \
  --meta "sourceCommit=$(git rev-parse HEAD)" \
  --meta "sourceRepository=https://github.com/1905/dictionary-of-ai-coding"
```

Use the stable production domain above when sharing the reader. The CLI also
prints a unique deployment URL; that URL can have different access protection.

## Verify the release

Confirm that Vercel reports `Ready` and assigns the existing production domain.
Open both language links without signing into Vercel. Check a direct article URL
such as [Russian Smart zone](https://dictionary-of-ai-coding-three.vercel.app/?lang=ru#smart-zone),
follow an internal link, search in both languages and reload after changing the
theme.

Compare the served static files against the local `dist/` build and confirm the
deployment's `sourceCommit` matches the intended Git commit. The initial releases
used SHA-256 comparisons for every asset plus browser checks on the public domain.
