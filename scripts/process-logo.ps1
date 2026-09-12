Add-Type -AssemblyName System.Drawing

$root = "C:\Users\zahitbulut\Downloads\astrowind-main\astrowind-main"
$src = Join-Path $root "src\assets\images\akort-logo-full.png"

$srcBmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $srcBmp.Width
$h = $srcBmp.Height
Write-Output "Source size: $w x $h"

# --- Find bounding box of the icon mark (upper region only, to exclude the wordmark) ---
$cutoffY = [int]($h * 0.55)
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0

$srcData = $srcBmp.LockBits((New-Object System.Drawing.Rectangle(0,0,$w,$h)), [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $srcData.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $bytes, 0, $bytes.Length)
$srcBmp.UnlockBits($srcData)

for ($y = 0; $y -lt $cutoffY; $y++) {
  $rowOffset = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $rowOffset + $x * 4
    $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]
    if ($r -lt 245 -or $g -lt 245 -or $b -lt 245) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
Write-Output "Icon bbox: x[$minX-$maxX] y[$minY-$maxY]"

$pad = [int]([Math]::Max($maxX-$minX, $maxY-$minY) * 0.06)
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($w-1, $maxX + $pad)
$maxY = [Math]::Min($h-1, $maxY + $pad)
$boxW = $maxX - $minX
$boxH = $maxY - $minY

Write-Output "Tight crop: x=$minX y=$minY w=$boxW h=$boxH"

# Crop tightly to the bbox only (no extra source pixels pulled in).
$tightRect = New-Object System.Drawing.Rectangle($minX, $minY, $boxW, $boxH)
$tight = New-Object System.Drawing.Bitmap($boxW, $boxH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfxT = [System.Drawing.Graphics]::FromImage($tight)
$gfxT.DrawImage($srcBmp, (New-Object System.Drawing.Rectangle(0,0,$boxW,$boxH)), $tightRect, [System.Drawing.GraphicsUnit]::Pixel)
$gfxT.Dispose()

# Compose onto a transparent square canvas, centered (never sources extra pixels from the original).
$side = [Math]::Max($boxW, $boxH)
$cropped = New-Object System.Drawing.Bitmap($side, $side, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx = [System.Drawing.Graphics]::FromImage($cropped)
$offsetX = [int](($side - $boxW) / 2)
$offsetY = [int](($side - $boxH) / 2)
$gfx.DrawImage($tight, $offsetX, $offsetY, $boxW, $boxH)
$gfx.Dispose()
$tight.Dispose()

# --- Make near-white pixels transparent (color-key) ---
$data = $cropped.LockBits((New-Object System.Drawing.Rectangle(0,0,$side,$side)), [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$len = $data.Stride * $side
$buf = New-Object byte[] $len
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $len)
for ($p = 0; $p -lt $len; $p += 4) {
  $b = $buf[$p]; $g = $buf[$p+1]; $r = $buf[$p+2]
  if ($r -gt 240 -and $g -gt 240 -and $b -gt 240) {
    $buf[$p+3] = 0
  }
}
[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $len)
$cropped.UnlockBits($data)

$imagesDir = Join-Path $root "src\assets\images"
$faviconsDir = Join-Path $root "src\assets\favicons"

# Icon mark for header/footer logo (transparent PNG)
$iconOut = Join-Path $imagesDir "akort-icon.png"
$cropped.Save($iconOut, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved: $iconOut"

# --- favicon.png (256x256 transparent) ---
$fav256 = New-Object System.Drawing.Bitmap(256, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($fav256)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($cropped, 0, 0, 256, 256)
$g2.Dispose()
$favPngPath = Join-Path $faviconsDir "favicon.png"
$fav256.Save($favPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved: $favPngPath"

# --- apple-touch-icon.png (180x180, flattened on white) ---
$apple = New-Object System.Drawing.Bitmap(180, 180, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g3 = [System.Drawing.Graphics]::FromImage($apple)
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g3.Clear([System.Drawing.Color]::White)
$pad180 = 18
$g3.DrawImage($cropped, $pad180, $pad180, 180 - 2*$pad180, 180 - 2*$pad180)
$g3.Dispose()
$applePath = Join-Path $faviconsDir "apple-touch-icon.png"
$apple.Save($applePath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved: $applePath"

# --- favicon.ico (wrap the 256x256 PNG in a minimal valid ICO container) ---
$ms = New-Object System.IO.MemoryStream
$fav256.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()

$icoPath = Join-Path $faviconsDir "favicon.ico"
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)      # reserved
$bw.Write([UInt16]1)      # type: icon
$bw.Write([UInt16]1)      # count
$bw.Write([byte]0)        # width (0 = 256)
$bw.Write([byte]0)        # height (0 = 256)
$bw.Write([byte]0)        # color count
$bw.Write([byte]0)        # reserved
$bw.Write([UInt16]1)      # color planes
$bw.Write([UInt16]32)     # bits per pixel
$bw.Write([UInt32]$pngBytes.Length) # size of image data
$bw.Write([UInt32]22)     # offset of image data
$bw.Write($pngBytes)
$bw.Flush()
$fs.Dispose()
Write-Output "Saved: $icoPath"

# --- favicon.svg (vector wrapper embedding the transparent PNG) ---
$b64 = [Convert]::ToBase64String($pngBytes)
$svg = "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 256 256`"><image href=`"data:image/png;base64,$b64`" width=`"256`" height=`"256`"/></svg>"
$svgPath = Join-Path $faviconsDir "favicon.svg"
[System.IO.File]::WriteAllText($svgPath, $svg)
Write-Output "Saved: $svgPath"

$srcBmp.Dispose()
$cropped.Dispose()
$fav256.Dispose()
$apple.Dispose()

Write-Output "DONE"
