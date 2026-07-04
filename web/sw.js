/* sw.js — Service Worker（オフライン対応 / stale-while-revalidate）
 * キャッシュを確実に更新したいときは CACHE のバージョンを上げる（"srb-v2" 等）。
 * 古い "srb-*" キャッシュは activate で自動削除される。
 */
"use strict";

var CACHE = "srb-v2";
var ASSETS = ["./", "index.html", "app.css", "grammar.js", "speech.js", "phrases.js", "quiz.js", "app.js", "sentence_builder_data.js", "chunks.html", "chunks.css", "chunks-data.js", "chunks-player.js", "chunks.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

// install: 1つの404で全滅しないよう各アセットを個別にキャッシュ（addAllは使わない）
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

// activate: 自分の古いキャッシュ（"srb-" プレフィクスで CACHE と異なるもの）を削除
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE && k.indexOf("srb-") === 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// fetch: GET かつ同一オリジンのみ。stale-while-revalidate
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        var fetching = fetch(req).then(function (res) {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        });
        if (cached) {
          // キャッシュを即返しつつ、裏の更新はイベントの寿命内で保持
          e.waitUntil(fetching.catch(function () { }));
          return cached;
        }
        // 未ヒット: ネットワークを待つ。失敗（かつキャッシュなし）はそのままreject
        return fetching;
      });
    })
  );
});
