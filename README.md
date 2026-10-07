# இலவச இணைய மாதிரித் தேர்வு – DECGC மயிலாடுதுறை & திருவாரூர்

TNPSC தொகுதி-II / IIA இலவச முழு மாதிரித் தேர்வுகளை இணைய வழியில் நடத்துவதற்கான தளம்.
Next.js + PostgreSQL (Neon) – Vercel-இல் இலவசமாக இயக்கலாம்.

## வசதிகள்
- தேர்வர் பதிவு (பெயர், கைபேசி, பிறந்த தேதி, மாவட்டம்) – தானியங்கி பதிவு எண் (MYL0001 / TVR0001)
- பதிவு எண் அல்லது கைபேசி எண் + பிறந்த தேதி கொண்டு உள்நுழைவு
- 200 இருமொழி வினாக்கள், A–D + E (விடை தெரியவில்லை), 3 மணி நேர டைமர், நேரம் முடிந்தால் தானாகச் சமர்ப்பிப்பு
- விடைகள் தானாகச் சேமிப்பு; இணைப்பு துண்டித்தாலும் தொடரலாம்
- TNPSC மதிப்பீடு: சரிக்கு 1.5, விடுபட்டால் குறைப்பு (அமைக்கலாம்)
- தேர்வு நேரம் முடிந்ததும் விடைக்குறிப்பு, தரவரிசை (ஒட்டுமொத்தம் / மாவட்ட வாரி)
- Admin: தேர்வு உருவாக்கம், Excel/JSON வினா பதிவேற்றம், விடைக்குறிப்பு திருத்தம் + மறுமதிப்பீடு, முடிவுகள் CSV,
  அதிகம் தவறிய வினாக்கள், tab மாற்ற எண்ணிக்கை, மீண்டும் எழுத அனுமதி

## Vercel-இல் நிறுவுதல் (ஒரு முறை)
1. https://vercel.com → **Add New… → Project** → GitHub-இல் `mydfreecoaching/freemock` → **Import**.
2. **Environment Variables**:
   - `ADMIN_PASSWORD` – Admin கடவுச்சொல்
   - `SESSION_SECRET` – 32+ எழுத்துகள் கொண்ட ஏதேனும் ஒரு நீண்ட சொற்றொடர்
   → **Deploy**.
3. Project → **Storage → Create Database → Neon (Postgres)** → Region: Singapore → Connect to project.
   (இது `DATABASE_URL`-ஐத் தானாகச் சேர்க்கும்.)
4. **Deployments → ⋯ → Redeploy**.
5. `https://<உங்கள்-தளம்>.vercel.app/admin` → கடவுச்சொல் → தேர்வு உருவாக்கு → வினா Excel பதிவேற்று → Published ✓.

அட்டவணைகள் (tables) முதல் பயன்பாட்டில் தானாக உருவாகும்.

## வினா Excel வடிவம்
`qno, section, en_question, en_A, en_B, en_C, en_D, ta_question, ta_A, ta_B, ta_C, ta_D, answer`
- section: `தமிழ்` / `GS` / `APT`
- பொருத்துக அட்டவணை: ஒவ்வொரு வரிசையையும் `a. மொகஞ்சதாரோ | 1. கப்பல் துறைமுகம்` என்று ` | ` கொண்டு எழுதவும்.
- Admin பக்கத்தில் "வினா Excel மாதிரி" பதிவிறக்கலாம்.

## உள்ளூர் இயக்கம்
```
cp .env.example .env.local   # DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm install
npm run dev
```
