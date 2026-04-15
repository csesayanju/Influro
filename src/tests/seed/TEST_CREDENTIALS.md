# Influro — Test Credentials

> **Never commit real credentials here. These are test-only accounts on the dev Supabase project.**
> Run `node src/tests/seed/seed.js` to recreate all users and data fresh.

---

## Test Users

| Email | Password | Scenario |
|-------|----------|----------|
| `demo@influro.test` | `Demo1234!` | Full dataset — all edge cases |
| `empty@influro.test` | `Empty1234!` | Brand exists, 0 campaigns |
| `newuser@influro.test` | `NewUser1234!` | No brand → redirects to `/onboarding` |

---

## demo@influro.test — Edge Case Map

Brand: **GlowLab India** · Plan: starter

### Campaigns

| Campaign | Platform | Status | Budget | Destination URL | Influencers |
|----------|----------|--------|--------|-----------------|-------------|
| Summer Glow 2026 | Instagram | active | ₹2,50,000 | ✓ | 6 (all follower edge cases) |
| Protein Push Q2 | YouTube | active | ₹1,80,000 | ✓ | 4 |
| Trending Now | Twitter/X | active | ₹10,00,000 | ✓ | 2 |
| Diwali Sale 2025 | Instagram | completed | ₹5,00,000 | ✓ | 3 |
| Untitled Draft | — | draft | ₹0 | — | 0 |
| New Year Blast 2027 | Instagram | draft | ₹3,50,000 | ✓ | 0 |
| Holi Sprint (Archived) | Instagram | archived | ₹1,20,000 | — | 1 |

### Influencer Edge Cases (Summer Glow 2026)

| Handle | Followers | Display | Fee | Clicks |
|--------|-----------|---------|-----|--------|
| `@priya.glam` | null | — | ₹35,000 | 312 |
| `@micro_niche99` | 750 | 750 | ₹5,000 | 1 |
| `@sunita_exactly1k` | 1,000 | 1.0K | ₹8,000 | 0 (no link) |
| `@riya_skincare` | 52,000 | 52.0K | ₹18,000 | 87 |
| `@beauty.by.ananya` | 8,90,000 | 890.0K | ₹60,000 | 1,540 |
| `@divya_mega` | 12,00,000 | 1.2M | ₹1,20,000 | 10,250 |

### Other Notable Edge Cases

| Handle | Campaign | Why notable |
|--------|----------|-------------|
| `@gym_vikram` | Protein Push | null followers + ₹0 fee + no UTM link |
| `@fitness.king.india` | Protein Push | 2.5M followers + ₹5,00,000 fee + 0 clicks (link exists) |
| `@startup_watcher` | Trending Now | Twitter/X platform, no UTM link |
| `@barter_only_creator` | Diwali Sale | ₹0 fee on completed campaign, no UTM link |
| `@holi_vibes` | Holi Sprint | Archived campaign — should not appear in active list |

### Click Count Edge Cases

| Value | What it tests |
|-------|---------------|
| 0 (UTM link exists) | `fitness.king.india` — link created but no clicks yet |
| 0 (no UTM link) | `sunita_exactly1k`, `gym_vikram`, `startup_watcher`, `barter_only_creator` |
| 1 | `micro_niche99` — minimum non-zero |
| 87, 204, 312 | normal range |
| 1,540 | comma-formatted in future |
| 10,250 | large number |
| 3,820 | completed campaign with historical clicks |

---

## empty@influro.test

Brand: **ZeroStart Brands** · Plan: free  
0 campaigns → `/dashboard/campaigns` shows empty state  
Tests: "No campaigns yet" UI path

---

## newuser@influro.test

No brand row → app redirects to `/onboarding`  
Tests: onboarding wizard flows and routing gate

---

## Re-seeding

```bash
node src/tests/seed/seed.js
```

The script deletes and recreates all three test users on each run so data
is always clean. The `sayanc131@gmail.com` account is NOT touched.
