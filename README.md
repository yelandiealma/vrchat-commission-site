# 夜嵐蝶 Alma｜VRChat Avatar 改造接案網站

這是一個不需要安裝任何套件的一頁式網站，支援桌機與手機版。作品圖、影片、價目計算、Discord 複製與作品放大檢視皆已完成。

## 直接預覽

雙擊 `index.html` 即可在瀏覽器開啟。若影片在本機預覽時受到瀏覽器限制，可用 VS Code 的 Live Server 開啟。

## 部署到 GitHub Pages

1. 建立新的 GitHub Repository。
2. 將這個資料夾內的所有檔案上傳到 Repository 根目錄。
3. 到 `Settings → Pages`，在 `Build and deployment` 選擇 `Deploy from a branch`。
4. Branch 選 `main`、資料夾選 `/ (root)`，儲存後等待 GitHub 產生網址。

## 日後修改

- 文案與聯絡方式：編輯 `index.html`。
- 顏色與版面：編輯 `styles.css` 最上方的 `:root` 色票。
- 作品圖片：把新圖放進 `assets`，再複製 `index.html` 中任一個 `work-card` 區塊修改檔名。
- 品牌 Icon：替換 `assets/alma-icon.png`，並維持相同檔名即可。
- 價格：在 `index.html` 搜尋對應品項，修改 `data-price` 與畫面上的 `NT$` 數字，兩處必須一致。

## 網站架構

- `index.html`：網站內容與價目
- `styles.css`：桌機／手機版樣式
- `script.js`：價目計算、作品燈箱與複製 Discord
- `assets/`：已壓縮的 WebP 圖片與 MP4 動態作品
