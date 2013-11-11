var btn = document.getElementById('install-chrome');
  ua = navigator.userAgent.toLowerCase();
if (~ua.indexOf('chrome')) {
  btn.style.display = 'none'
}