#!/usr/bin/env bash
# AzNut — впечатка логотипа + сжатие + WebP для всех фото.
# Запуск на СЕРВЕРЕ в Termius:
#   cd /var/www/aznut.space
#   nano process-images.sh   (вставить это содержимое, Ctrl+O, Ctrl+X)
#   bash process-images.sh
#
# Что делает:
#   1) Делает резервную копию оригиналов в imgs_backup/ (один раз).
#   2) Впечатывает logo.png в правый нижний угол каждого фото в imgs/ (полупрозрачно).
#   3) Сжимает JPG до качества 82 и создаёт рядом .webp (легче в 2-3 раза).
# Продуктовые фото в упаковке других брендов (в имени есть bag/pack/packaging/pouch/jar/box)
# НЕ трогаются логотипом, но всё равно сжимаются и получают webp.

set -e
cd "$(dirname "$0")"

IMG_DIR="imgs"
LOGO="logo.png"
BACKUP="imgs_backup"
QUALITY=82
WM_RATIO=0.14
WM_OPACITY=70

command -v convert >/dev/null 2>&1 || { echo "Ставлю ImageMagick..."; sudo apt-get update && sudo apt-get install -y imagemagick webp; }
command -v cwebp  >/dev/null 2>&1 || { sudo apt-get install -y webp; }

[ -f "$LOGO" ] || { echo "Нет файла $LOGO рядом со скриптом"; exit 1; }

if [ ! -d "$BACKUP" ]; then
  echo "Резервная копия оригиналов -> $BACKUP"
  cp -r "$IMG_DIR" "$BACKUP"
fi

TMPLOGO="$(mktemp --suffix=.png)"
convert "$LOGO" -alpha set -channel A -evaluate multiply 0.$(printf '%02d' $WM_OPACITY) +channel "$TMPLOGO"

shopt -s nullglob
count=0
for img in "$IMG_DIR"/*.jpg "$IMG_DIR"/*.jpeg "$IMG_DIR"/*.png; do
  [ -e "$img" ] || continue
  base="$(basename "$img")"
  lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"

  skip_wm=0
  case "$lower" in
    *bag*|*pack*|*pouch*|*jar*|*box*|*packaging*) skip_wm=1;;
  esac

  if [ "$skip_wm" = "0" ]; then
    W=$(identify -format "%w" "$img")
    WM_W=$(python3 -c "print(int($W*$WM_RATIO))")
    convert "$TMPLOGO" -resize "${WM_W}x" "$TMPLOGO.r.png"
    convert "$img" "$TMPLOGO.r.png" -gravity southeast -geometry +20+20 -composite \
            -strip -interlace Plane -quality $QUALITY "$img"
    rm -f "$TMPLOGO.r.png"
  else
    convert "$img" -strip -interlace Plane -quality $QUALITY "$img"
  fi

  out="${img%.*}.webp"
  cwebp -quiet -q $QUALITY "$img" -o "$out"
  count=$((count+1))
  echo "  [$count] $base"
done

rm -f "$TMPLOGO"
echo "Готово. Обработано файлов: $count. Оригиналы в $BACKUP/"
echo "Если результат не нравится — вернуть: rm -rf $IMG_DIR && mv $BACKUP $IMG_DIR"
