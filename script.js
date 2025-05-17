// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.search-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // 입력값 읽기
    const destination = document.querySelector('.destination-input').value.trim();
    const startDate   = document.getElementById('start-date').value;
    const endDate     = document.getElementById('end-date').value;

    // 유효성 검증 (빈 값 방지)
    if (!destination || !startDate || !endDate) {
      alert('모두 입력해 주세요.');
      return;
    }

    // loading.html로 파라미터 전달
    const params = new URLSearchParams({ destination, startDate, endDate });
    window.location.href = `loading.html?${params.toString()}`;
  });
});
