---
title: AI News Digest
date: 2026-07-28
tags: [newsroom, ai, python, gemini, automation]
summary: A daily AI news site that collects, deduplicates, summarizes, and ranks the day's stories on its own.
# Active: the site needs a new API before its daily runs are back on track.
status: active
links:
  - label: Live site
    url: https://ujuappa.github.io/ai_news/
  - label: GitHub
    url: https://github.com/ujuappa/ai_news
---

- Built a Python pipeline that collects AI news from RSS feeds every day and publishes it as a static site on GitHub Pages, scheduled by GitHub Actions.
- Removed duplicate stories by comparing sentence embeddings, both within a day and against earlier days.
- Used the Gemini API to classify, summarize, and rank each story, then rendered daily, weekly, and monthly digests with an RSS feed.
- Kept the API key in GitHub's secret store, so it never appears in the repo or in the site's code.
