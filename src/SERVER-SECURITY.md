# AzNut — усиление безопасности на сервере (nginx)

Всё ниже применяется на СЕРВЕРЕ в Termius. Файлы сайта для этого заливать не нужно.

## 1. Заголовки безопасности и блокировка служебных файлов

Открой конфиг сайта:

    sudo nano /etc/nginx/sites-available/aznut.space

Внутри блока `server { ... }` (перед закрывающей `}`) вставь:

    # --- Заголовки безопасности ---
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.google.com; base-uri 'self'; form-action 'self'; object-src 'none'" always;

    # --- Блокировка служебных и скрытых файлов ---
    location ~ /\.(?!well-known) { deny all; return 404; }
    location ~* \.(bak|sql|tar|gz|tgz|zip|log|env|conf|ini|sh|old)$ { deny all; return 404; }

Сохрани (Ctrl+O, Enter, Ctrl+X), проверь и перезапусти:

    sudo nginx -t && sudo systemctl reload nginx

ВАЖНО: правило про `.sh` заблокирует скачивание process-images.sh по сети — это нормально,
скрипт всё равно запускается на самом сервере, а не через браузер.

## 2. Rate-limit (защита формы и от переборов)

В `/etc/nginx/nginx.conf` внутри блока `http { ... }` добавь одну строку:

    limit_req_zone $binary_remote_addr zone=aznut:10m rate=30r/m;

Затем в конфиге сайта внутри `server { ... }`:

    location / {
        limit_req zone=aznut burst=20 nodelay;
        try_files $uri $uri/ =404;
    }

Перезапусти: `sudo nginx -t && sudo systemctl reload nginx`

## 3. fail2ban (защита SSH от подбора пароля)

    sudo apt update && sudo apt install -y fail2ban
    sudo systemctl enable --now fail2ban

Проверить статус: `sudo fail2ban-client status sshd`

## 4. Гигиена сервера

    sudo apt update && sudo apt upgrade -y      # обновления безопасности
    # Отключить вход root по SSH и оставить только ключи — если ещё не сделано:
    # в /etc/ssh/sshd_config: PasswordAuthentication no  → sudo systemctl restart ssh

## Что НЕ делаем и почему
Никаких «ответных ловушек», заражающих атакующего: это незаконно (в т.ч. в Азербайджане),
бьёт по Googlebot/антивирусам/посетителям и ведёт к блокировке домена. Правильная защита —
закрыть двери (выше), а не минировать порог.
