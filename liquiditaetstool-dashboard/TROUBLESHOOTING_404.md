# 🔧 404 Fehler beheben auf Vercel

## Problem: 404 - Page Not Found nach Deployment

### ✅ Lösung 1: Root Directory korrekt setzen

**Das ist die häufigste Ursache!**

1. Gehe zu Vercel Dashboard
2. Dein Projekt → **Settings**
3. **General** → **Root Directory**
4. Setze auf: `liquiditaetstool-dashboard`
5. **Save**
6. Gehe zu **Deployments** → **Redeploy** (mit Cache löschen)

### ✅ Lösung 2: Build-Logs überprüfen

1. Vercel Dashboard → Dein Projekt
2. **Deployments** → Letztes Deployment
3. Klick auf das Deployment
4. **Building** Tab öffnen
5. Suche nach Fehlern:
   - TypeScript Errors
   - Missing Dependencies
   - Build Failures

**Häufige Build-Fehler:**

```bash
# TypeScript Fehler
Error: Type error: ...

# Fehlende Dependencies
Module not found: Can't resolve 'lucide-react'

# Environment Variables fehlen
Error: Missing environment variables
```

### ✅ Lösung 3: Environment Variables überprüfen

1. Settings → **Environment Variables**
2. Stelle sicher, dass gesetzt sind:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

3. Nach Änderung: **Redeploy erforderlich!**

### ✅ Lösung 4: Middleware-Problem

Wenn die Middleware alle Requests blockt:

**Temporäre Lösung** - Middleware deaktivieren zum Testen:

```typescript
// middleware.ts umbenennen zu middleware.ts.backup
```

Dann neu deployen. Wenn es funktioniert, liegt es am Middleware.

**Permanente Lösung** - Middleware anpassen:

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Erlaube alle statischen Files und Public URLs
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname === '/'
  ) {
    return
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### ✅ Lösung 5: Output Directory Problem

Wenn Vercel die Build-Dateien nicht findet:

1. **Vercel Settings** → **General**
2. **Build & Output Settings**
3. Setze:
   - Build Command: `npm run build` (oder leer lassen)
   - Output Directory: `.next` (oder leer lassen für Auto-Detect)
   - Install Command: `npm install` (oder leer lassen)

### ✅ Lösung 6: Framework nicht erkannt

1. Vercel Settings → General
2. Framework Preset: `Next.js`
3. Node.js Version: `18.x` (oder `20.x`)

### ✅ Lösung 7: Git-Branch Problem

Stelle sicher, dass du auf dem richtigen Branch bist:

```bash
# Lokaler Check
git branch  # Sollte main oder master zeigen

# In Vercel
Settings → Git → Production Branch: main
```

### 🧪 Lokaler Test

Teste zuerst lokal, ob der Build funktioniert:

```bash
cd liquiditaetstool-dashboard

# Dependencies installieren
npm install

# Build testen
npm run build

# Production Server starten
npm start
```

Wenn lokal Fehler auftreten, müssen diese erst behoben werden!

### 📋 Vollständige Checkliste

- [ ] Root Directory = `liquiditaetstool-dashboard`
- [ ] Framework Preset = `Next.js`
- [ ] Node Version = `18.x` oder höher
- [ ] Environment Variables sind gesetzt
- [ ] Build-Logs zeigen keine Fehler
- [ ] `npm run build` funktioniert lokal
- [ ] Git Branch ist korrekt (main/master)
- [ ] Cache wurde gelöscht bei Redeploy

### 🚀 Komplettes Redeploy

Falls nichts hilft:

1. **Lokale Änderungen commiten:**
```bash
cd liquiditaetstool-dashboard
git add .
git commit -m "Fix deployment"
git push
```

2. **In Vercel:**
   - Deployments → ... Menu → **Redeploy**
   - ✅ Aktiviere "Clear Cache and Redeploy"

3. **Warte 2-3 Minuten**

4. **Teste die URL:**
```
https://your-app.vercel.app
https://your-app.vercel.app/login
https://your-app.vercel.app/dashboard
```

### 🔍 Debug-Modus

Aktiviere verbose Logging:

```bash
# In vercel.json hinzufügen (temporär)
{
  "build": {
    "env": {
      "NEXT_PUBLIC_VERCEL_DEBUG": "1"
    }
  }
}
```

### 📞 Vercel Support kontaktieren

Wenn nichts funktioniert:

1. Build-Logs kopieren
2. Screenshots vom Settings
3. Vercel Support Chat öffnen: [vercel.com/support](https://vercel.com/support)

### 💡 Häufigste Ursachen (nach Wahrscheinlichkeit)

1. ✅ **Root Directory falsch** (90% der Fälle)
2. ✅ **Environment Variables fehlen** (5%)
3. ✅ **Build Error** (3%)
4. ✅ **Middleware blockt alles** (1%)
5. ✅ **Framework nicht erkannt** (1%)

---

## ⚡ Quick Fix

**90% der 404-Probleme werden so gelöst:**

```
1. Vercel Settings
2. Root Directory → liquiditaetstool-dashboard
3. Save
4. Redeploy mit "Clear Cache"
```

**Das sollte es lösen!** 🎉

