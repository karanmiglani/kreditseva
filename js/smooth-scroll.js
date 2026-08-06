// /* ---- Smooth Scroll for Windows ---- */
// (function () {
//   /* Mac/iOS already has native smooth scroll — only apply on non-Mac */
//   var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
//   if (isMac) return;

//   var current = window.scrollY;
//   var target  = window.scrollY;
//   var ease    = 0.1;
//   var running = false;

//   function loop() {
//     current += (target - current) * ease;
//     var delta = Math.abs(target - current);

//     window.scrollTo(0, current);

//     if (delta > 0.5) {
//       requestAnimationFrame(loop);
//     } else {
//       window.scrollTo(0, target);
//       running = false;
//     }
//   }

//   window.addEventListener('wheel', function (e) {
//     e.preventDefault();
//     target += e.deltaY * 1.2;
//     target = Math.max(0, Math.min(target, document.body.scrollHeight - window.innerHeight));

//     if (!running) {
//       running = true;
//       requestAnimationFrame(loop);
//     }
//   }, { passive: false });

// })();
