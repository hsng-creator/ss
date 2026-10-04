(() => {
  "use strict";

  const audio = /** @type {HTMLAudioElement} */ (document.getElementById("narration"));
  const notice = document.getElementById("playback-notice");
  const status = document.getElementById("playback-status");
  if (!audio || !notice || !status) return;

  let attempting = false;
  let hasStarted = false;
  let blocked = false;
  let failed = false;
  audio.volume = 1;
  audio.muted = false;

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    status.textContent = message;
  }

  function playing() {
    hasStarted = true;
    blocked = false;
    failed = false;
    notice.hidden = true;
    status.textContent = "正在播放廣東話朗讀。";
    document.body.dataset.playback = "playing";
  }

  function audioFailed() {
    failed = true;
    blocked = false;
    document.body.dataset.playback = "error";
    showNotice("朗讀音訊未能載入，請檢查網絡連線並重新載入此頁。");
  }

  async function attemptPlayback() {
    if (attempting || hasStarted || failed || document.hidden) return;
    attempting = true;
    try {
      await audio.play();
      playing();
    } catch (error) {
      if (hasStarted || failed) return;
      if (error instanceof Error && error.name === "NotAllowedError") {
        blocked = true;
        document.body.dataset.playback = "blocked";
        showNotice("瀏覽器阻擋了有聲自動播放。若要每次進入即朗讀，請先在瀏覽器允許此網站自動播放有聲媒體，再重新載入。今次亦可輕觸頁面任何位置開始朗讀，毋須尋找播放按鈕。");
      } else if (!(error instanceof Error) || error.name !== "AbortError") {
        audioFailed();
      }
    } finally {
      attempting = false;
    }
  }

  audio.addEventListener("playing", playing);
  audio.addEventListener("error", audioFailed);
  audio.addEventListener("ended", () => {
    document.body.dataset.playback = "ended";
    status.textContent = "廣東話朗讀完畢。";
  });
  audio.addEventListener("canplay", () => {
    if (!blocked) void attemptPlayback();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !blocked) void attemptPlayback();
  });

  // Only a genuine interaction can unlock browser-restricted audio.
  // No synthetic click, muted playback trick, or mandatory playback button.
  document.addEventListener("click", () => {
    if (blocked) void attemptPlayback();
  });
  document.addEventListener("keydown", () => {
    if (blocked) void attemptPlayback();
  });

  document.body.dataset.playback = "loading";
  void attemptPlayback();
})();
