# Influro — Database schema (visual)

Single source: **`schema.sql`**. This diagram and `schema-diagram.html` use the same Mermaid definition (types simplified for Mermaid: string / int / double).

---

## Entity-relationship diagram (Mermaid)

```mermaid
erDiagram
    auth_users ||--o| brands : user_id
    brands ||--o{ campaigns : brand_id
    brands ||--o{ influencers : brand_id
    campaigns ||--o{ influencers : campaign_id
    campaigns ||--o{ utm_links : campaign_id
    influencers ||--o{ utm_links : influencer_id
    utm_links ||--o{ click_events : utm_link_id
    utm_links ||--o{ conversions : utm_link_id
    influencers ||--o{ conversions : influencer_id
    influencers ||--o| fraud_scores : influencer_id
    auth_users {
        string id PK
    }
    brands {
        string id PK
        string user_id FK
        string name
        string website
        string category
        string goals
        string platforms
        int monthly_budget
        string plan
        string plan_activated_at
        string created_at
        string updated_at
    }
    campaigns {
        string id PK
        string brand_id FK
        string name
        string slug
        int budget
        string start_date
        string end_date
        string platform
        string status
        string created_at
        string updated_at
    }
    influencers {
        string id PK
        string brand_id FK
        string campaign_id FK
        string handle
        string platform
        int follower_count
        int agreed_fee
        string platform_data
        string created_at
        string updated_at
    }
    utm_links {
        string id PK
        string campaign_id FK
        string influencer_id FK
        string full_url
        string utm_source
        string utm_medium
        string utm_campaign
        string utm_content
        int click_count
        string created_at
    }
    click_events {
        string id PK
        string utm_link_id FK
        string session_id
        string ip_hash
        string user_agent
        string country
        string source
        string created_at
    }
    conversions {
        string id PK
        string campaign_id FK
        string utm_link_id FK
        string influencer_id FK
        string payment_id UK
        int amount_paise
        string converted_at
        string created_at
    }
    fraud_scores {
        string id PK
        string influencer_id FK
        double score
        double er_score
        double comment_score
        double growth_score
        string signal_data
        string refreshed_at
        string created_at
    }
```

---

## Flow (high level)

```
auth.users  →  brands  →  campaigns  →  influencers  →  utm_links  →  click_events
                    ↘       ↘                ↘  utm_links  →  conversions
                         influencers (brand_id)  fraud_scores (per influencer)
```

---

## Table summary (from schema.sql)

| Table | Purpose |
|-------|--------|
| **brands** | One per user (onboarding); RLS by `user_id`. Columns: id, user_id, name, website, category, goals, platforms, monthly_budget, plan, plan_activated_at, created_at, updated_at |
| **campaigns** | Per brand; slug for UTM. Columns: id, brand_id, name, slug, budget, start_date, end_date, platform, status, created_at, updated_at |
| **influencers** | Per brand + campaign; brand_id for cross-campaign. Columns: id, brand_id, campaign_id, handle, platform, follower_count, agreed_fee, platform_data, created_at, updated_at |
| **utm_links** | One per campaign+influencer; UNIQUE(campaign_id, influencer_id). Columns: id, campaign_id, influencer_id, full_url, utm_source, utm_medium, utm_campaign, utm_content, click_count, created_at |
| **click_events** | Each UTM hit; source IN (influencer, untracked-organic). Columns: id, utm_link_id, session_id, ip_hash, user_agent, country, source, created_at |
| **conversions** | Razorpay webhook; payment_id UNIQUE; campaign_id denormalised. Columns: id, campaign_id, utm_link_id, influencer_id, payment_id, amount_paise, converted_at, created_at |
| **fraud_scores** | Bot score 0–1 + signal breakdown; UNIQUE(influencer_id). Columns: id, influencer_id, score, er_score, comment_score, growth_score, signal_data, refreshed_at, created_at |

---

**PDF:** Open `schema-diagram.html` in a browser → Print → Save as PDF.
