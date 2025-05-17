// result.js

// 1. URL에서 planId 가져오기 및 데이터 로드
const planId = new URLSearchParams(window.location.search).get("plan");
const decodePlanData = decodeURIComponent(localStorage.getItem(planId));
let maps = [];

if (!planId || decodePlanData === "null") {
  alert("잘못된 접근입니다.");
  location.href = "index.html";
}
const { plan, destination, startDate, endDate } = decodePlanData
  ? JSON.parse(decodePlanData)
  : {};
const planData = plan?.itinerary || [];
document.title = `${destination} 여행 일정`;
if (!planId || !plan) {
  alert("잘못된 접근입니다.");
  location.href = "index.html";
}

// 2. 유틸 함수들
function getWeatherIcon(weather = "") {
  if (weather.includes("맑음")) return "☀️";
  if (
    weather.includes("소나기") ||
    weather.includes("비") ||
    weather.includes("습함")
  )
    return "🌧️";
  if (weather.includes("흐림")) return "☁️";
  if (weather.includes("눈")) return "❄️";
  return "🌤️";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function getRandomClassName(prefix = "spot") {
  const rand = Math.random().toString(36).substr(2, 8);
  return `${prefix}-${rand}`;
}

function destinationDateRender() {
  document.querySelector(".destination").textContent = destination;
  document.querySelector(".start-date").textContent = formatDate(startDate);
  document.querySelector(".end-date").textContent = formatDate(endDate);
}

// 3. 일정 렌더링
function renderItinerary() {
  const container = document.getElementById("route-overview-content");
  if (!container) return;

  // 평균 온도 계산
  let sumHigh = 0,
    sumLow = 0;
  planData.forEach((d) => {
    sumHigh += d.weather.high_temp_c || 0;
    sumLow += d.weather.low_temp_c || 0;
  });
  const avgTemp = planData.length
    ? Math.round((sumHigh + sumLow) / (2 * planData.length))
    : 0;

  // 날짜·날씨 요약
  const dateWeatherEl = document.querySelector(".date-weather");
  if (dateWeatherEl && planData[0]?.weather?.summary) {
    const firstSummary = planData[0].weather.summary;
    const hasClear = planData.some((d) => d.weather.summary?.includes("맑음"));
    const summaryText = hasClear ? "흐림에서 맑음" : firstSummary;
    const start = new Date(startDate),
      end = new Date(endDate);
    dateWeatherEl.textContent =
      `${start.getMonth() + 1}월 ${start.getDate()}일 - ` +
      `${end.getMonth() + 1}월 ${end.getDate()}일, ` +
      `${start.getFullYear()} | ` +
      `${summaryText}, avg. ${avgTemp}°C - 쾌적한 날씨`;
  }

  // 각 일자 카드 생성
  let html = "";
  planData.forEach((day, index) => {
    const summary = day.weather_summary || "";
    const icon = getWeatherIcon(day.weather);
    html += `
      <div class="day-plan">
        <div class="day-header">
          <span class="day-date">${day.date}</span>
          <h3 class="day-title">${day.summary_description || ""}</h3>
        </div>
        <div class="day-content">
          <div class="weather-info">
            <span class="weather-icon">${icon}</span>
            <span class="weather-text">${summary}</span>
          </div>
          <div class="schedule-grid">
            <div class="time-slot"><h4>Morning</h4><p>${
              day.morning || ""
            }</p></div>
            <div class="time-slot"><h4>Lunch</h4><p>${day.lunch || ""}</p></div>
            <div class="time-slot"><h4>Afternoon</h4><p>${
              day.afternoon || ""
            }</p></div>
            <div class="time-slot"><h4>Dinner</h4><p>${
              day.dinner || ""
            }</p></div>
          </div>
          <div class="recommendations">
            <div class="rec-spots">
              <h4>추천 장소</h4>
              <div>
                ${(() => {
                  const className = getRandomClassName("spot");
                  planData[index].recommended_spots.spotClassName = className;
                  return `<div class="${className} spot-map"></div>`;
                })()}
              </div>
            </div>
            <div class="rec-foods">
              <h4>추천 식당</h4>
              <div>
                ${(() => {
                  const className = getRandomClassName("food");
                  planData[index].recommended_spots.foodClassName = className;
                  return `<div class="${className} food-map"></div>`;
                })()}
              </div>
            </div>
          </div>
        </div>
        <button class="show-details">일정 상세 보기</button>
      </div>
    `;
  });
  container.innerHTML = html;
  
  initializeMapContainer();
 // initializeEventListeners();
}

function initializeMapContainer() {
  planData.forEach(day => {
    const spotList = day.recommended_spots.map(spot => {
      return spot;
    });
    initRecommendMap(spotList, day.recommended_spots.spotClassName);
    nearbyRestaurants(spotList, day.recommended_spots.foodClassName)
  });
}

// 중심 좌표 계산
function calculateCenter(locations) {
  if (!locations || locations.length === 0) {
    return { lat: 35.6895, lng: 139.6917 }; 
  }
  
  let latSum = 0;
  let lngSum = 0;
  
  locations.forEach(location => {
    latSum += location.google_maps_coordinates.lat;
    lngSum += location.google_maps_coordinates.lng;
  });
  
  return {
    lat: latSum / locations.length,
    lng: lngSum / locations.length
  };
}
// 주변 식당 데이터 가져오기
async function nearbyRestaurants(locations, mapContainer) {
  // 중심 좌표 계산
  const { lat, lng } = calculateCenter(locations);
  const url =
  `https://nearbyrestaurants-tjej7jdoqa-uc.a.run.app?lat=${lat}&lng=${lng}`;
 const res = await fetch(url);
 const data = await res.json();
 // 영업중인 식당만 필터링
 const foodList = data.filter((food) => food.business_status === "OPERATIONAL").map((food) => {
    return { 
      name : food.name, 
      google_maps_coordinates: { 
        lat: food.geometry.location.lat, 
        lng: food.geometry.location.lng
      },
      address: food.vicinity,
    }
 })

 // 추천 근처 식당 지도 표시 
 initRecommendMap(foodList, mapContainer)
}

function initRecommendMap(locations, mapContainer) {
  // 중심 좌표 계산
  const mapCenter = calculateCenter(locations);
  
  // 지도 생성
  const map = new google.maps.Map(
    document.querySelector(`.${mapContainer}`), // 지도를 표시할 컨테이너 선택자
    {
      zoom: 12,
      center: mapCenter
    }
  );
  
  const markers = [];
  const infoWindows = [];
  const coordinates = [];
  // 모든 장소에 마커 생성
  locations.forEach((location, index) => {
    const position = {
      lat: location.google_maps_coordinates.lat,
      lng: location.google_maps_coordinates.lng
    };
    
    coordinates.push(position);
    
    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: location.name,
      label: `${index + 1}`
    });
    
    markers.push(marker);
    
    const infoWindow = new google.maps.InfoWindow({
      content: `<div><strong>${location.name}</strong><br>${location.address}</div>`
    });
    
    infoWindows.push(infoWindow);
    
    marker.addListener("click", () => {
      // 다른 정보창 닫기
      infoWindows.forEach(iw => iw.close());
      // 현재 마커의 정보창 열기
      infoWindow.open(map, marker);
    });
  }); 
  
  // 마커들을 선으로 연결
  const path = new google.maps.Polyline({
    path: coordinates,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  
  path.setMap(map);
  setMapBounds(map, coordinates);
  
}


function setMapBounds(map, locations) {
  const bounds = new google.maps.LatLngBounds();

  locations.forEach(loc => {
    bounds.extend(new google.maps.LatLng(loc.lat, loc.lng));
  });

  map.fitBounds(bounds); // 자동으로 줌과 센터 설정됨
}
// 초기화
document.addEventListener("DOMContentLoaded", () => {
  destinationDateRender();
  
  //renderItinerary();
});

// 4. 장소명→좌표 변환 헬퍼 (Places Text Search)
function textSearchCoords(map, query) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map);
    service.textSearch({ query }, (res, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && res[0]) {
        resolve(res[0].geometry.location);
      } else {
        reject(`장소 검색 실패: ${query} (${status})`);
      }
    });
  });
}
// 5. REST API로 주변 식당 검색
/*
async function fetchNearbyRestaurants(lat, lng) {
  const url =
  `https://nearbyrestaurants-tjej7jdoqa-uc.a.run.app?lat=${lat}&lng=${lng}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
  return data.results || [];
}
  */

// 6. initMap: 지도 & 경로 & 식당 표시 (PlacesService → REST API 교체)

window.initMap = async function () {
  const { Map } = await google.maps.importLibrary("maps");
  const map = new Map(document.getElementById("map"), {
    center: { lat: 35.6895, lng: 139.6917 },
    zoom: 12,
  });
  /*
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 35.6895, lng: 139.6917 },
    zoom: 12,
  });

  // 경로 좌표 수집 (Morning/Afternoon/Evening)
  const coords = [];
  for (const day of planData) {
    for (const placeName of [day.morning, day.afternoon, day.evening]) {
      if (placeName && placeName.trim()) {
        try {
          const loc = await textSearchCoords(map, placeName);
          coords.push(loc);
        } catch (e) {
          console.warn("장소 검색 실패:", placeName, e);
        }
      }
    }
  }

  // 폴리라인 그리기
  if (coords.length) {
    new google.maps.Polyline({
      path: coords,
      strokeColor: "#4285F4",
      strokeWeight: 4,
    }).setMap(map);
  }

  // REST API로 주변 식당 검색 및 표시
  const centerPoint = coords[1] || coords[0];
  if (centerPoint) {
    const { lat, lng } = centerPoint.toJSON();
    try {
      const places = await fetchNearbyRestaurants(lat, lng);
      const listEl = document.getElementById("restaurant-list");
      let html = "<h4>추천 식당</h4><ul>";
      places.slice(0, 5).forEach((p) => {
        // 마커 추가
        new google.maps.Marker({
          map,
          position: {
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
          },
          title: p.name,
        });
        // 리스트 항목
        html += `
          <li>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              p.name
            )}"
               target="_blank">${p.name}</a> (${p.rating}⭐)
          </li>`;
      });
      html += "</ul>";
      listEl.innerHTML = html;
    } catch (e) {
      console.error("REST API 식당 검색 실패", e);
    }
  } else {
    console.warn("유효한 중심 좌표 없어 식당 검색 생략", coords);
  }
  */
};
