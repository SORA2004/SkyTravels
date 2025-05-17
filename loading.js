const loadingMessage = document.getElementById("loading-message");
const progressFill = document.getElementById("progress-fill");

// 쿼리스트링 파라미터 추출
const params = new URLSearchParams(window.location.search);
const destination = params.get("destination");
const startDate = params.get("startDate");
const endDate = params.get("endDate");

const messages = [
  `${destination}의 날씨를 확인 중입니다.`,
  `${destination}의 액티비티를 수집 중입니다.`,
  `${destination}의 맛집 정보를 찾고 있어요.`,
  `${destination} 일정을 조합 중입니다...`,
  `마무리 작업 중입니다. 곧 완성됩니다!`,
];

let percent = 0;
let step = 0;

const interval = setInterval(() => {
  percent += Math.floor(Math.random() * 5) + 3;
  if (percent > 100) percent = 100;
  progressFill.style.width = `${percent}%`;

  if (percent > step * 20 && step < messages.length) {
    loadingMessage.innerText = messages[step];
    step++;
  }
}, 300);

// GPT 호출
(async () => {
  try {
    const response = await fetch(
      "https://createtravelplan-tjej7jdoqa-uc.a.run.app/createTravelPlan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startDate, endDate }),
      }
    );

    const data = await response.json();
    clearInterval(interval);
    loadingMessage.innerText = "🎉 여행 일정이 완성되었습니다!";
    progressFill.style.width = "100%";

    const encoded = encodeURIComponent(data.result);
    setTimeout(() => {
      window.location.href = `result.html?plan=${encoded}`;
    }, 1500);
  } catch (error) {
    clearInterval(interval);
    loadingMessage.innerText =
      "❌ 일정 생성에 실패했습니다. 다시 시도해주세요.";
    console.error(error);
  }
})();
