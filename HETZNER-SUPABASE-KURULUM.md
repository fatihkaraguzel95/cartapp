# Hetzner'e Supabase + Uygulama Kurulum Rehberi

## ADIM 1 — Hetzner'de Sunucu Oluştur

1. https://console.hetzner.cloud → Yeni Proje
2. "Add Server" tıkla:
   - **Location:** Nuremberg veya Helsinki (TR'ye yakın)
   - **Image:** Ubuntu 24.04
   - **Type:** CX22 (2 vCPU, 4GB RAM) — minimum
   - **SSH Key:** Kendi SSH anahtarını ekle
3. Sunucu IP'yi not al: örn. `123.456.789.10`

---

## ADIM 2 — Sunucuya Bağlan ve Hazırla

```bash
ssh root@123.456.789.10
```

Temel güvenlik ve güncellemeler:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw

# Firewall ayarla
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 8000  # Supabase API
ufw allow 3000  # Uygulama (geçici)
ufw enable
```

---

## ADIM 3 — Docker Kur

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Docker Compose
apt install -y docker-compose-plugin
docker --version && docker compose version
```

---

## ADIM 4 — Supabase Self-Hosted Kur

```bash
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

### .env dosyasını düzenle:
```bash
nano .env
```

Şu değerleri MUTLAKA değiştir (güçlü şifreler kullan):

```env
# JWT Secret - min 32 karakter, rastgele bir değer
JWT_SECRET=buraya-cok-guclu-rastgele-bir-sifre-yaz-min32char

# Dashboard şifresi
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=guvenli-bir-sifre

# Postgres şifresi
POSTGRES_PASSWORD=baska-bir-guclu-sifre

# Sunucu IP adresini yaz
API_EXTERNAL_URL=http://123.456.789.10:8000
SUPABASE_PUBLIC_URL=http://123.456.789.10:8000

# E-posta doğrulamasını kapat (geliştirme için)
# smtp ayarları boş bırakılabilir
```

### Supabase'i başlat:
```bash
docker compose pull
docker compose up -d

# Durumu kontrol et (2-3 dakika bekle)
docker compose ps
```

Tüm servisler "healthy" gösterince hazır.

---

## ADIM 5 — Supabase'e Bağlan ve Schema Kur

Tarayıcıda aç: `http://123.456.789.10:8000`
- Kullanıcı adı: `admin` (veya .env'de ayarladığın)
- Şifre: .env'de ayarladığın şifre

### SQL Editor'da schema çalıştır:

1. Sol menü → **SQL Editor**
2. `supabase/schema.sql` dosyasının içeriğini yapıştır → **Run**
3. `supabase/seed.sql` dosyasının içeriğini yapıştır → **Run**

### Anon Key'i al:

1. Sol menü → **Project Settings** → **API**
2. `anon public` key'i kopyala → bunu uygulamada kullanacaksın
3. `Project URL` kopyala → genellikle `http://123.456.789.10:8000`

### E-posta doğrulamasını kapat:
1. Sol menü → **Authentication** → **Providers** → **Email**
2. "Confirm email" toggle'ını KAPAT
3. Save

---

## ADIM 6 — Uygulamayı Sunucuya Yükle

Yerel bilgisayarında (cartapp klasöründe):

```bash
# .env.local dosyasını oluştur
cp .env.local.example .env.local
```

`.env.local` dosyasını düzenle:
```env
NEXT_PUBLIC_SUPABASE_URL=http://123.456.789.10:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya-anon-key-yapistir
```

Sunucuya kopyala:
```bash
# Sunucuda klasör oluştur
ssh root@123.456.789.10 "mkdir -p /opt/cartapp"

# Dosyaları kopyala (node_modules hariç)
rsync -avz --exclude='node_modules' --exclude='.next' . root@123.456.789.10:/opt/cartapp/
```

---

## ADIM 7 — Uygulamayı Çalıştır

Sunucuda:
```bash
cd /opt/cartapp

# .env.local dosyası oluştur
nano .env.local
# NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekle

# Docker ile başlat
docker compose up -d --build

# Logları kontrol et
docker compose logs -f cartapp
```

Uygulama: `http://123.456.789.10:3000`

---

## ADIM 8 — (İsteğe Bağlı) Domain ve HTTPS

Eğer bir domain varsa (örn. `market.siteniz.com`):

### Nginx + SSL kur:
```bash
apt install -y nginx certbot python3-certbot-nginx

# Nginx config
nano /etc/nginx/sites-available/cartapp
```

```nginx
server {
    server_name market.siteniz.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/cartapp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL sertifikası
certbot --nginx -d market.siteniz.com
```

Supabase için de domain eklemek istersen `.env` içinde URL'leri güncelle.

---

## Hızlı Kontrol Listesi

- [ ] Hetzner sunucu oluşturuldu
- [ ] Docker kuruldu
- [ ] Supabase başlatıldı ve healthy
- [ ] schema.sql çalıştırıldı
- [ ] seed.sql çalıştırıldı (150+ ürün)
- [ ] E-posta doğrulaması kapatıldı
- [ ] Anon key alındı
- [ ] .env.local oluşturuldu
- [ ] Uygulama Docker ile çalışıyor
- [ ] http://IP:3000 açılıyor

---

## Sorun Giderme

**Supabase başlamıyor:**
```bash
cd /opt/supabase/docker
docker compose logs --tail=50
```

**Uygulama Supabase'e bağlanamıyor:**
- Firewall'da 8000 portu açık mı? `ufw status`
- .env.local doğru IP ve key içeriyor mu?

**"Invalid API key" hatası:**
- Supabase dashboard'dan anon key'i tekrar al
- .env.local'i güncelle ve container'ı yeniden başlat:
  `docker compose restart cartapp`
