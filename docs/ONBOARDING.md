# Onboarding (TECH-7)

Three-step wizard at **`/onboarding`** updates the signed-in user’s **`brands`** row:

1. **Brand** — name, optional website, category  
2. **Goals & platforms** — multi-select chips (stored as JSON arrays)  
3. **Review** — optional monthly budget (INR), then save  

## Flow

- After sign-in, **`/dashboard`** ensures a `brands` row exists (`ensureBrandProfile`).
- If **`category`** is still empty, the user is redirected to **`/onboarding`**.
- When **`category`** is set, **`/onboarding`** redirects back to **`/dashboard`**.
- Middleware requires auth for **`/onboarding`** (same as dashboard).

## Data mapping

| Field | Source |
|-------|--------|
| `name`, `website`, `category`, `monthly_budget` | Form |
| `goals`, `platforms` | JSON arrays in Postgres |

RLS: user can only update their own `brands` row.
