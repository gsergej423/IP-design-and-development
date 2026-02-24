/*
  FilmFlow — общая логика для всех страниц (учебный прототип).
  Версия с кастомным плеером, полноэкранным режимом, клавиатурой и выбором серий/сезонов в плеере.
*/
(function(){
  const DB = window.FILMFLOW_DB || [];

  // ===== helpers =====
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = (s="") => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const qs = (key) => new URLSearchParams(location.search).get(key);

  // ===== storage =====
  const LS = {
    profile: "filmflow_profile",
    fav: "filmflow_favorites",
    wl:  "filmflow_watchlater",
    prog:"filmflow_progress",
    last:"filmflow_lastwatch",
    hist:"filmflow_history"
  };

  const load = (k, def) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
  };
  const save = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn(`Ошибка сохранения (${k}):`, e); }
  };

  let favorites = load(LS.fav, []);
  let watchlater = load(LS.wl, []);
  let progress = load(LS.prog, {});
  let profile = load(LS.profile, { name:"Гость" });
  let lastWatch = load(LS.last, null);
  let history = load(LS.hist, []);

  // ===== общие функции =====
  function setActiveNav(){
    const page = document.body.dataset.page || "";
    $$(".navlink").forEach(a => a.classList.toggle("active", a.dataset.nav === page));
    const nameEl = $("#navName");
    if(nameEl) nameEl.textContent = profile?.name || "Гость";
    const avatarEl = $("#navAvatar");
    if(avatarEl) avatarEl.textContent = (profile?.name || "Г")[0].toUpperCase();
  }

  function isFav(id){ return favorites.includes(id); }
  function isWL(id){ return watchlater.includes(id); }
  function toggleFav(id){
    favorites = isFav(id) ? favorites.filter(x=>x!==id) : [...favorites, id];
    save(LS.fav, favorites);
  }
  function toggleWL(id){
    watchlater = isWL(id) ? watchlater.filter(x=>x!==id) : [...watchlater, id];
    save(LS.wl, watchlater);
  }

  function resetAllData(resetProfile = false) {
    if(!confirm("Сбросить данные FilmFlow (избранное, смотреть позже, прогресс" + (resetProfile ? ", профиль" : "") + ")?")) return;
    favorites = []; watchlater = []; progress = {}; lastWatch = null; history = [];
    save(LS.fav, favorites); save(LS.wl, watchlater); save(LS.prog, progress);
    save(LS.last, lastWatch); save(LS.hist, history);
    if (resetProfile) { profile = { name: "Гость" }; save(LS.profile, profile); }
    alert("Данные сброшены.");
    location.reload();
  }

  // ===== DB access =====
  const byId = (id) => DB.find(x => x.id === id);

  function metaLine(item){
    if(item.type === "movie"){
      return `${item.year} • ${item.country} • ${item.duration} мин • ${item.age}`;
    }
    return `${item.year} • ${item.country} • сериал • ${item.age}`;
  }

  function makeCard(item, mode="grid"){
    const el = document.createElement("div");
    el.className = mode === "mini" ? "mini" : "card";
    el.tabIndex = 0;
    el.setAttribute("role","button");
    el.setAttribute("aria-label", `Открыть: ${item.title}`);
    el.innerHTML = `
      <div class="poster" aria-label="${esc(item.title)}">
        <div class="poster-title">${esc(item.title)}</div>
      </div>
      <div class="meta">
        <div class="row">
          <span class="tag">${esc(item.genres?.[0] || "—")}</span>
          <span class="tag">${esc(String(item.year))}</span>
          <span class="rating">${Number(item.rating).toFixed(1)}</span>
        </div>
        <div class="small">${esc(metaLine(item))}</div>
      </div>
    `;
    const go = () => location.href = `title.html?id=${encodeURIComponent(item.id)}`;
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" ") go(); });
    return el;
  }

  // ===== page: home =====
  function initHome(){
    const rowNew = $("#rowNew"), rowHot = $("#rowHot"), rowTop = $("#rowTop");
    const btnContinue = $("#btnContinue");
    const btnRandom = $("#btnRandom");
    const btnClear = $("#btnClearAll");

    const byNew = [...DB].sort((a,b)=>b.year-a.year || b.pop-a.pop).slice(0,8);
    const byHot = [...DB].sort((a,b)=>b.pop-a.pop).slice(0,8);
    const byTop = [...DB].sort((a,b)=>b.rating-a.rating).slice(0,8);

    if(rowNew){ rowNew.innerHTML=""; byNew.forEach(x=>rowNew.appendChild(makeCard(x,"mini"))); }
    if(rowHot){ rowHot.innerHTML=""; byHot.forEach(x=>rowHot.appendChild(makeCard(x,"mini"))); }
    if(rowTop){ rowTop.innerHTML=""; byTop.forEach(x=>rowTop.appendChild(makeCard(x,"mini"))); }

    if(btnContinue) btnContinue.addEventListener("click", ()=>{
      if(!lastWatch) return alert("Пока нет сохранённого просмотра.");
      if(lastWatch.type === "movie") location.href = `watch.html?id=${encodeURIComponent(lastWatch.id)}`;
      else location.href = `watch.html?id=${encodeURIComponent(lastWatch.id)}&s=${lastWatch.s}&e=${lastWatch.e}`;
    });
    if(btnRandom) btnRandom.addEventListener("click", ()=>{
      const x = DB[Math.floor(Math.random()*DB.length)];
      location.href = `title.html?id=${encodeURIComponent(x.id)}`;
    });
    if(btnClear) btnClear.addEventListener("click", ()=> resetAllData(false));
  }

  // ===== page: catalog =====
  function initCatalog(){
    const q = $("#q");
    const grid = $("#grid");
    const count = $("#count");
    const fGenre = $("#fGenre");
    const fCountry = $("#fCountry");
    const fAge = $("#fAge");
    const fSort = $("#fSort");
    const fYearMin = $("#fYearMin");
    const fYearMax = $("#fYearMax");
    const fRatingMin = $("#fRatingMin");
    const btnApply = $("#btnApply");
    const btnReset = $("#btnReset");

    const genres = [...new Set(DB.flatMap(x=>x.genres||[]))].sort((a,b)=>a.localeCompare(b,"ru"));
    const countries = [...new Set(DB.map(x=>x.country))].sort((a,b)=>a.localeCompare(b,"ru"));

    if(fGenre) genres.forEach(g=>fGenre.insertAdjacentHTML("beforeend", `<option value="${esc(g)}">${esc(g)}</option>`));
    if(fCountry) countries.forEach(c=>fCountry.insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));

    function apply(){
      const text = (q?.value||"").trim().toLowerCase();
      const genre = fGenre?.value || "";
      const country = fCountry?.value || "";
      const age = fAge?.value || "";
      const sort = fSort?.value || "pop";
      const yMin = Number(fYearMin?.value || 0);
      const yMax = Number(fYearMax?.value || 9999);
      const rMin = Number(fRatingMin?.value || 0);

      let list = DB.filter(x=>{
        const hitText = !text ||
          x.title.toLowerCase().includes(text) ||
          (x.genres||[]).some(g=>g.toLowerCase().includes(text)) ||
          x.country.toLowerCase().includes(text) ||
          x.type.toLowerCase().includes(text);
        const hitGenre = !genre || (x.genres||[]).includes(genre);
        const hitCountry = !country || x.country === country;
        const hitAge = !age || x.age === age;
        const hitYear = x.year >= yMin && x.year <= yMax;
        const hitRating = x.rating >= rMin;
        return hitText && hitGenre && hitCountry && hitAge && hitYear && hitRating;
      });

      if(sort==="pop") list.sort((a,b)=>b.pop-a.pop);
      if(sort==="rating") list.sort((a,b)=>b.rating-a.rating);
      if(sort==="new") list.sort((a,b)=>b.year-a.year || b.pop-a.pop);

      if(grid){ grid.innerHTML = ""; list.forEach(x=>grid.appendChild(makeCard(x,"grid"))); }
      if(count) count.textContent = `Найдено: ${list.length}`;
    }
    function reset(){
      if(q) q.value = "";
      if(fGenre) fGenre.value = "";
      if(fCountry) fCountry.value = "";
      if(fAge) fAge.value = "";
      if(fSort) fSort.value = "pop";
      if(fYearMin) fYearMin.value = "";
      if(fYearMax) fYearMax.value = "";
      if(fRatingMin) fRatingMin.value = "";
      apply();
    }
    btnApply?.addEventListener("click", apply);
    btnReset?.addEventListener("click", reset);
    q?.addEventListener("input", apply);
    apply();
  }

  // ===== page: title =====
  function initTitle(){
    const id = qs("id");
    const item = byId(id);
    if(!item) return;

    $("#tTitle").textContent = item.title;
    $("#tMeta").textContent = metaLine(item);
    $("#tRating").textContent = Number(item.rating).toFixed(1);
    $("#tDesc").textContent = item.desc;

    const tags = $("#tTags");
    if(tags){
      tags.innerHTML = "";
      (item.genres||[]).forEach(g=>{
        const s = document.createElement("span"); s.className = "tag"; s.textContent = g; tags.appendChild(s);
      });
      const s2 = document.createElement("span"); s2.className = "tag"; s2.textContent = item.type === "series" ? "Сериал" : "Фильм"; tags.appendChild(s2);
    }

    const btnFav = $("#btnFav");
    const btnWL  = $("#btnWL");
    const btnWatch = $("#btnWatch");
    function syncButtons(){
      btnFav.textContent = isFav(item.id) ? "❤ Убрать из избранного" : "❤ В избранное";
      btnWL.textContent  = isWL(item.id) ? "🕒 Убрать из “Смотреть позже”" : "🕒 Смотреть позже";
    }
    syncButtons();
    btnFav?.addEventListener("click", ()=>{ toggleFav(item.id); syncButtons(); });
    btnWL?.addEventListener("click", ()=>{ toggleWL(item.id); syncButtons(); });

    const seasonsBox = $("#seasonsBox");
    const episodesBox = $("#episodesBox");
    const epHint = $("#epHint");
    const continueBtn = $("#btnContinueSeries");

    function onContinueSeries() {
      if (lastWatch && lastWatch.type === "series" && lastWatch.id === item.id) {
        location.href = `watch.html?id=${encodeURIComponent(item.id)}&s=${lastWatch.s}&e=${lastWatch.e}`;
      }
    }

    if(item.type === "series"){
      seasonsBox.style.display = ""; episodesBox.style.display = ""; epHint.style.display = "";
      const seasons = item.seasons || [];
      let curSeason = Number(qs("s") || seasons[0]?.season || 1);
      let curEp = Number(qs("e") || 1);

      function renderSeasons(){
        seasonsBox.innerHTML = "";
        seasons.forEach(s=>{
          const a = document.createElement("a");
          a.href = "javascript:void(0)";
          a.className = "pill" + (s.season===curSeason ? " accent" : "");
          a.textContent = `Сезон ${s.season}`;
          a.addEventListener("click", ()=>{ curSeason = s.season; curEp = 1; renderSeasons(); renderEpisodes(); });
          seasonsBox.appendChild(a);
        });
      }
      function renderEpisodes(){
        episodesBox.innerHTML = "";
        const seasonObj = seasons.find(s=>s.season===curSeason) || seasons[0];
        (seasonObj?.episodes || []).forEach(ep=>{
          const key = `${item.id}|${curSeason}|${ep.ep}`;
          const t = progress[key] || 0;
          const a = document.createElement("a");
          a.href = "javascript:void(0)";
          a.className = (ep.ep===curEp ? "active" : "");
          a.innerHTML = `<strong>С${curSeason} • Серия ${ep.ep}:</strong> ${esc(ep.title)}
                         <div class="small">Длительность: ${ep.duration} мин • Прогресс: ${Math.floor(t)} сек</div>`;
          a.addEventListener("click", ()=>{ curEp = ep.ep; $$(".list a", episodesBox).forEach(x=>x.classList.remove("active")); a.classList.add("active"); });
          episodesBox.appendChild(a);
        });
      }
      renderSeasons(); renderEpisodes();
      btnWatch.addEventListener("click", ()=>{
        location.href = `watch.html?id=${encodeURIComponent(item.id)}&s=${curSeason}&e=${curEp}`;
      });
      if(continueBtn){
        const can = lastWatch && lastWatch.type==="series" && lastWatch.id===item.id;
        continueBtn.style.display = can ? "" : "none";
        if (continueBtn._listener) continueBtn.removeEventListener("click", continueBtn._listener);
        continueBtn._listener = onContinueSeries;
        continueBtn.addEventListener("click", continueBtn._listener);
      }
    } else {
      seasonsBox.style.display = "none"; episodesBox.style.display = "none"; epHint.style.display = "none";
      if(continueBtn) { continueBtn.style.display = "none"; if (continueBtn._listener) continueBtn.removeEventListener("click", continueBtn._listener); continueBtn._listener = null; }
      btnWatch?.addEventListener("click", ()=>{ location.href = `watch.html?id=${encodeURIComponent(item.id)}`; });
    }
  }

  // ===== КАСТОМНЫЙ ПЛЕЕР (с поддержкой полноэкранного режима и клавиатуры) =====
  function initCustomPlayer(video, seekBar, playPauseBtn, stopBtn, rewindBtn, forwardBtn,
                            currentTimeEl, durationEl, muteBtn, volumeSlider, fullscreenBtn, speedSelect) {
    if (!video) return;

    // Функция форматирования времени
    function formatTime(seconds) {
      if (isNaN(seconds)) return "0:00";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      return `${m}:${s.toString().padStart(2,'0')}`;
    }

    // Обновление времени и прогресс-бара
    function updateTime() {
      if (seekBar) {
        const percent = (video.currentTime / video.duration) * 100 || 0;
        seekBar.value = percent;
        const playedBar = document.querySelector('.progress-bar-played');
        if (playedBar) playedBar.style.width = percent + '%';
      }
      if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
    }

    // Обновление буфера
    function updateBuffer() {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100 || 0;
        const bufferBar = document.querySelector('.progress-bar-buffer');
        if (bufferBar) bufferBar.style.width = percent + '%';
      }
    }

    // Длительность
    video.addEventListener('loadedmetadata', () => {
      if (durationEl) durationEl.textContent = formatTime(video.duration);
      if (seekBar) seekBar.max = 100;
    });

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('progress', updateBuffer);

    // Play / Pause
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (video.paused) video.play();
        else video.pause();
      });
      video.addEventListener('play', () => { playPauseBtn.textContent = '⏸'; });
      video.addEventListener('pause', () => { playPauseBtn.textContent = '▶'; });
    }

    // Stop
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        video.pause();
        video.currentTime = 0;
      });
    }

    // Перемотка ±10 секунд
    if (rewindBtn) rewindBtn.addEventListener('click', () => { video.currentTime -= 10; });
    if (forwardBtn) forwardBtn.addEventListener('click', () => { video.currentTime += 10; });

    // Ползунок прогресса
    if (seekBar) {
      seekBar.addEventListener('input', () => {
        const time = (seekBar.value / 100) * video.duration;
        video.currentTime = time;
      });
    }

    // Громкость
    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        video.volume = volumeSlider.value;
        if (muteBtn) muteBtn.textContent = video.volume === 0 ? '🔇' : '🔊';
      });
    }

    // Mute
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? '🔇' : '🔊';
        if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
      });
    }

    // Полноэкранный режим — применяем к контейнеру, чтобы контролы оставались видимыми
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const container = video.closest('.video-container');
        if (!container) return;
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          else if (document.msExitFullscreen) document.msExitFullscreen();
        } else {
          if (container.requestFullscreen) container.requestFullscreen();
          else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
          else if (container.msRequestFullscreen) container.msRequestFullscreen();
        }
      });
    }

    // Скорость воспроизведения
    if (speedSelect) {
      speedSelect.addEventListener('change', () => {
        video.playbackRate = parseFloat(speedSelect.value);
      });
    }

    // === УПРАВЛЕНИЕ С КЛАВИАТУРЫ ===
    function handleKey(e) {
      if (e.target.matches('input, textarea, select, [contenteditable]')) return;
      if (!video) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime -= 10;
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime += 10;
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen();
          }
          break;
      }
    }
    document.addEventListener('keydown', handleKey);

    return {
      updateTime,
      destroy: () => {
        document.removeEventListener('keydown', handleKey);
      }
    };
  }

  // ===== page: watch =====
  function initWatch(){
    const id = qs("id");
    if(!id){
      const empty = $("#watchEmpty");
      if(empty) empty.style.display = "";
      const panel = $("#watchPanel");
      if(panel) panel.style.display = "none";
      return;
    }

    const item = byId(id);
    if(!item) return;

    const video = $("#video");
    const titleEl = $("#wTitle");
    const metaEl = $("#wMeta");
    const ratingEl = $("#wRating");
    const descEl = $("#wDesc");

    titleEl.textContent = item.title;
    metaEl.textContent = metaLine(item);
    ratingEl.textContent = Number(item.rating).toFixed(1);
    descEl.textContent = item.desc;

    const btnSave = $("#btnSave");
    const btnStartOver = $("#btnStartOver");
    const btnFav = $("#btnFavFromPlayer");
    const btnWL = $("#btnWLFromPlayer");

    function syncButtons(){
      btnFav.textContent = isFav(item.id) ? "❤ Убрать из избранного" : "❤ В избранное";
      btnWL.textContent  = isWL(item.id) ? "🕒 Убрать из “Смотреть позже”" : "🕒 Смотреть позже";
    }
    syncButtons();
    btnFav?.addEventListener("click", ()=>{ toggleFav(item.id); syncButtons(); });
    btnWL?.addEventListener("click", ()=>{ toggleWL(item.id); syncButtons(); });

    // Ключ прогресса
    let key = item.id;
    let curSeason = null, curEp = null;

    // Элементы плеера
    const seekBar = $("#seekBar");
    const playPauseBtn = $("#playPauseBtn");
    const stopBtn = $("#stopBtn");
    const rewindBtn = $("#rewindBtn");
    const forwardBtn = $("#forwardBtn");
    const currentTimeEl = $("#currentTime");
    const durationEl = $("#duration");
    const muteBtn = $("#muteBtn");
    const volumeSlider = $("#volumeSlider");
    const fullscreenBtn = $("#fullscreenBtn");
    const speedSelect = $("#playbackSpeed");

    // Элементы выбора серий/сезонов (для сериалов)
    const episodeSelector = $("#episodeSelector");
    const prevSeasonBtn = $("#prevSeasonBtn");
    const nextSeasonBtn = $("#nextSeasonBtn");
    const seasonDisplay = $("#seasonDisplay");
    const prevEpisodeBtn = $("#prevEpisodeBtn");
    const nextEpisodeBtn = $("#nextEpisodeBtn");
    const episodeDisplay = $("#episodeDisplay");

    // Инициализация кастомного плеера
    const playerControls = initCustomPlayer(video, seekBar, playPauseBtn, stopBtn, rewindBtn, forwardBtn,
                                            currentTimeEl, durationEl, muteBtn, volumeSlider, fullscreenBtn, speedSelect);

    // Панель сериала (справа)
    const epPanel = $("#episodePanel");
    const seasonsBox = $("#wSeasons");
    const episodesBox = $("#wEpisodes");
    const epNow = $("#epNow");

    function setVideoSource(src){
      const source = $("#source");
      if(src){
        source.src = src;
        video.load();
        $("#noSrc").style.display = "none";
      }else{
        source.removeAttribute("src");
        video.load();
        $("#noSrc").style.display = "";
      }
    }

    // Восстановление позиции видео
    function restoreVideoPosition(pos) {
      if (!pos) return;
      const onLoaded = () => {
        video.currentTime = pos;
        video.removeEventListener("loadedmetadata", onLoaded);
      };
      video.addEventListener("loadedmetadata", onLoaded);
      if (video.readyState >= 1) video.currentTime = pos;
    }

    // Обновление отображения сезона/серии в плеере
    function updateEpisodeSelector() {
      if (item.type !== "series") return;
      const seasons = item.seasons || [];
      const currentSeasonObj = seasons.find(s => s.season === curSeason);
      const totalEpisodes = currentSeasonObj?.episodes.length || 0;

      // Обновляем текст
      if (seasonDisplay) seasonDisplay.textContent = `Сезон ${curSeason}`;
      if (episodeDisplay) episodeDisplay.textContent = `Серия ${curEp} / ${totalEpisodes}`;

      // Блокируем кнопки при необходимости
      if (prevSeasonBtn) {
        const hasPrevSeason = seasons.some(s => s.season === curSeason - 1);
        prevSeasonBtn.disabled = !hasPrevSeason;
      }
      if (nextSeasonBtn) {
        const hasNextSeason = seasons.some(s => s.season === curSeason + 1);
        nextSeasonBtn.disabled = !hasNextSeason;
      }
      if (prevEpisodeBtn) prevEpisodeBtn.disabled = curEp <= 1;
      if (nextEpisodeBtn) nextEpisodeBtn.disabled = curEp >= totalEpisodes;
    }

    // Функция переключения серии/сезона (вызывается из плеера)
    function selectEpisode(s, e, updateUrl = true) {
      if (item.type !== "series") return;
      key = `${item.id}|${s}|${e}`;
      const ep = getEpisode(s, e);
      epNow.textContent = ep ? `Сезон ${s}, серия ${e}: ${ep.title}` : `Сезон ${s}, серия ${e}`;
      const src = ep?.src || null;
      setVideoSource(src);
      video.dataset.progressKey = key;
      const t = Number(progress[key] || 0);
      restoreVideoPosition(t);
      lastWatch = { type:"series", id:item.id, s, e, key };
      save(LS.last, lastWatch);
      pushHistory(key);
      if (updateUrl) {
        const u = new URL(location.href);
        u.searchParams.set("s", String(s));
        u.searchParams.set("e", String(e));
        history.replaceState(null, "", u.toString());
      }

      // Обновляем выделение в правой панели
      $$(".list a", episodesBox).forEach(x => x.classList.remove("active"));
      const activeLink = Array.from(episodesBox.children).find(a => {
        const html = a.innerHTML;
        return html.includes(`Серия ${e}:</strong>`) && a.innerHTML.includes(`С${s} •`);
      });
      if (activeLink) activeLink.classList.add("active");

      // Обновляем плеер
      updateEpisodeSelector();
    }

    // Получение объекта эпизода
    function getEpisode(s, e) {
      if (item.type !== "series") return null;
      const sObj = (item.seasons || []).find(x => x.season === s);
      return (sObj?.episodes || []).find(x => x.ep === e) || null;
    }

    if (item.type === "series") {
      epPanel.style.display = "";
      const seasons = item.seasons || [];
      curSeason = Number(qs("s") || seasons[0]?.season || 1);
      curEp = Number(qs("e") || 1);

      // Показываем блок выбора серий в плеере
      if (episodeSelector) episodeSelector.style.display = "flex";

      // Рендер правой панели
      function renderSeasons() {
        seasonsBox.innerHTML = "";
        seasons.forEach(s => {
          const a = document.createElement("a");
          a.href = "javascript:void(0)";
          a.className = "pill" + (s.season === curSeason ? " accent" : "");
          a.textContent = `Сезон ${s.season}`;
          a.addEventListener("click", () => {
            curSeason = s.season;
            curEp = 1;
            renderSeasons();
            renderEpisodes();
            selectEpisode(curSeason, curEp, true);
          });
          seasonsBox.appendChild(a);
        });
      }

      function renderEpisodes() {
        episodesBox.innerHTML = "";
        const sObj = seasons.find(s => s.season === curSeason) || seasons[0];
        (sObj?.episodes || []).forEach(ep => {
          const a = document.createElement("a");
          a.href = "javascript:void(0)";
          a.className = (ep.ep === curEp ? "active" : "");
          const k = `${item.id}|${curSeason}|${ep.ep}`;
          const t = progress[k] || 0;
          a.innerHTML = `<strong>С${curSeason} • Серия ${ep.ep}:</strong> ${esc(ep.title)}
                         <div class="small">Длительность: ${ep.duration} мин • Прогресс: ${Math.floor(t)} сек</div>`;
          a.addEventListener("click", () => {
            curEp = ep.ep;
            selectEpisode(curSeason, curEp, true);
            $$(".list a", episodesBox).forEach(x => x.classList.remove("active"));
            a.classList.add("active");
          });
          episodesBox.appendChild(a);
        });
      }

      renderSeasons();
      renderEpisodes();
      selectEpisode(curSeason, curEp, false);

      // === ОБРАБОТЧИКИ ДЛЯ КНОПОК В ПЛЕЕРЕ ===
      if (prevSeasonBtn) {
        prevSeasonBtn.addEventListener("click", () => {
          const newSeason = curSeason - 1;
          const seasons = item.seasons || [];
          if (seasons.some(s => s.season === newSeason)) {
            curSeason = newSeason;
            curEp = 1; // начинаем с первой серии нового сезона
            renderSeasons();
            renderEpisodes();
            selectEpisode(curSeason, curEp, true);
          }
        });
      }

      if (nextSeasonBtn) {
        nextSeasonBtn.addEventListener("click", () => {
          const newSeason = curSeason + 1;
          const seasons = item.seasons || [];
          if (seasons.some(s => s.season === newSeason)) {
            curSeason = newSeason;
            curEp = 1;
            renderSeasons();
            renderEpisodes();
            selectEpisode(curSeason, curEp, true);
          }
        });
      }

      if (prevEpisodeBtn) {
        prevEpisodeBtn.addEventListener("click", () => {
          if (curEp > 1) {
            curEp--;
            selectEpisode(curSeason, curEp, true);
            // Обновляем выделение в правой панели
            renderEpisodes(); // перерисовываем, чтобы обновить класс active
          }
        });
      }

      if (nextEpisodeBtn) {
        nextEpisodeBtn.addEventListener("click", () => {
          const sObj = (item.seasons || []).find(s => s.season === curSeason);
          const maxEp = sObj?.episodes.length || 0;
          if (curEp < maxEp) {
            curEp++;
            selectEpisode(curSeason, curEp, true);
            renderEpisodes();
          }
        });
      }

      // Первоначальное обновление состояния кнопок
      updateEpisodeSelector();

    } else {
      // Фильм
      epPanel.style.display = "none";
      if (episodeSelector) episodeSelector.style.display = "none";
      key = item.id;
      setVideoSource(item.src || null);
      video.dataset.progressKey = key;
      const t = Number(progress[key] || 0);
      restoreVideoPosition(t);
      lastWatch = { type:"movie", id:item.id, key:item.id };
      save(LS.last, lastWatch);
      pushHistory(key);
    }

    function pushHistory(k){
      history = [k, ...history.filter(x=>x!==k)].slice(0,12);
      save(LS.hist, history);
    }

    // Автосохранение прогресса
    let lastSavedAt = 0;
    video.addEventListener("timeupdate", ()=>{
      const now = Date.now();
      if(now - lastSavedAt < 1200) return;
      lastSavedAt = now;
      progress[key] = Number(video.currentTime || 0);
      save(LS.prog, progress);
      if(item.type==="series"){
        const active = $(".list a.active", $("#wEpisodes"));
        if(active){
          const small = active.querySelector(".small");
          if(small) small.textContent = small.textContent.replace(/Прогресс:.*сек/, `Прогресс: ${Math.floor(progress[key])} сек`);
        }
      }
    });

    btnSave?.addEventListener("click", ()=>{
      progress[key] = Number(video.currentTime || 0);
      save(LS.prog, progress);
      alert("Прогресс сохранён!");
    });

    btnStartOver?.addEventListener("click", ()=>{
      progress[key] = 0;
      save(LS.prog, progress);
      try { video.currentTime = 0; } catch {}
      alert("Сброшено на начало.");
    });
  }

  // ===== page: profile =====
  function initProfile(){
    $("#pAvatar").textContent = (profile?.name || "Г")[0].toUpperCase();
    $("#pName").textContent = profile?.name || "Гость";
    const favCount = $("#favCount");
    const wlCount = $("#wlCount");
    const contList = $("#continueList");
    const favList = $("#favList");
    const wlList = $("#wlList");

    favCount.textContent = String(favorites.length);
    wlCount.textContent = String(watchlater.length);

    if(contList){
      if(!lastWatch) contList.innerHTML = `<div class="small">Пока нет сохранённого просмотра.</div>`;
      else {
        const item = byId(lastWatch.id);
        if (!item) contList.innerHTML = `<div class="small">Сохранённый контент не найден.</div>`;
        else {
          const link = (lastWatch.type==="movie")
            ? `watch.html?id=${encodeURIComponent(lastWatch.id)}`
            : `watch.html?id=${encodeURIComponent(lastWatch.id)}&s=${lastWatch.s}&e=${lastWatch.e}`;
          const text = (lastWatch.type==="movie") ? `${item.title}` : `${item.title} • Сезон ${lastWatch.s}, серия ${lastWatch.e}`;
          contList.innerHTML = `<a href="${link}"><strong>Продолжить:</strong> ${esc(text)}</a>`;
        }
      }
    }

    function listOf(ids){
      return ids.map(byId).filter(Boolean)
        .map(x => `<a href="title.html?id=${encodeURIComponent(x.id)}">${esc(x.title)} <span class="small">(${x.year})</span></a>`)
        .join("");
    }

    favList.innerHTML = favorites.length ? listOf(favorites) : `<div class="small">Пусто.</div>`;
    wlList.innerHTML  = watchlater.length ? listOf(watchlater) : `<div class="small">Пусто.</div>`;

    const inp = $("#inpName");
    inp.value = profile?.name || "Гость";

    $("#btnSaveProfile").addEventListener("click", ()=>{
      const name = (inp.value || "").trim();
      profile = { ...profile, name: name || "Гость" };
      save(LS.profile, profile);
      alert("Профиль сохранён!");
      location.reload();
    });

    $("#btnResetAll").addEventListener("click", ()=> resetAllData(true));
  }

  // ===== init =====
  document.addEventListener("DOMContentLoaded", ()=>{
    setActiveNav();
    const page = document.body.dataset.page;
    if(page==="home") initHome();
    if(page==="catalog") initCatalog();
    if(page==="title") initTitle();
    if(page==="watch") initWatch();
    if(page==="profile") initProfile();
  });
})();