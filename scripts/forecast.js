// Weather Widget - 5-Day Forecast Script
const API_KEY = config.WEATHER_API_KEY;
const DEFAULT_CITY = 'Salt Lake City';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const forecastContainer = document.getElementById('forecastContainer');
const forecastCards = document.getElementById('forecastCards');

// Weather condition to background mapping
const weatherBackgrounds = {
    'Clear': { day: 'clear-day', night: 'clear-night' },
    'Clouds': { day: 'clouds', night: 'clouds' },
    'Rain': { day: 'rain', night: 'rain' },
    'Drizzle': { day: 'rain', night: 'rain' },
    'Thunderstorm': { day: 'thunderstorm', night: 'thunderstorm' },
    'Snow': { day: 'snow', night: 'snow' },
    'Mist': { day: 'mist', night: 'mist' },
    'Fog': { day: 'mist', night: 'mist' },
    'Haze': { day: 'mist', night: 'mist' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load last searched city from localStorage or use default
    const lastCity = localStorage.getItem('lastCity') || DEFAULT_CITY;
    cityInput.value = lastCity;
    
    // Fetch forecast for the city
    fetchForecast(lastCity);
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

// Handle search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        fetchForecast(city);
        localStorage.setItem('lastCity', city);
    } else {
        showError('Please enter a city name');
    }
}

// Fetch forecast data
async function fetchForecast(city) {
    showLoading();
    hideError();
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else {
                throw new Error('Unable to fetch forecast data. Please try again later.');
            }
        }
        
        const data = await response.json();
        displayForecast(data);
        
        // Update background based on current weather
        if (data.list && data.list.length > 0) {
            updateBackground(data.list[0].weather[0].main, data.list[0].weather[0].icon);
        }
        
    } catch (err) {
        showError(err.message);
        hideLoading();
    }
}

// Display forecast data
function displayForecast(data) {
    // Update city name
    document.getElementById('cityName').textContent = `${data.city.name}, ${data.city.country}`;
    
    // Process forecast data - group by day
    const dailyForecasts = processForecastData(data.list);
    
    // Clear previous forecast cards
    forecastCards.innerHTML = '';
    
    // Create forecast cards
    dailyForecasts.forEach((day, index) => {
        const card = createForecastCard(day, index);
        forecastCards.appendChild(card);
    });
    
    // Show forecast container and hide loading
    forecastContainer.style.display = 'block';
    hideLoading();
}

// Process forecast data to get daily forecasts
function processForecastData(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                date: date,
                temps: [],
                weather: item.weather[0],
                icon: item.weather[0].icon.replace('n', 'd'), // Use day icon
                humidity: [],
                wind: []
            };
        }
        
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].humidity.push(item.main.humidity);
        dailyData[dateKey].wind.push(item.wind.speed);
        
        // Update weather if we find a day reading (more representative)
        if (item.weather[0].icon.includes('d')) {
            dailyData[dateKey].weather = item.weather[0];
            dailyData[dateKey].icon = item.weather[0].icon;
        }
    });
    
    // Convert to array and calculate daily stats
    const dailyForecasts = Object.values(dailyData).map(day => ({
        date: day.date,
        tempHigh: Math.round(Math.max(...day.temps)),
        tempLow: Math.round(Math.min(...day.temps)),
        weather: day.weather,
        icon: day.icon,
        humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length),
        windSpeed: Math.round(day.wind.reduce((a, b) => a + b) / day.wind.length)
    }));
    
    // Return first 5 days
    return dailyForecasts.slice(0, 5);
}

// Create forecast card element
function createForecastCard(forecast, index) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = forecast.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    card.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${dateStr}</div>
        <img class="forecast-icon" 
             src="https://openweathermap.org/img/wn/${forecast.icon}@2x.png" 
             alt="${forecast.weather.description}">
        <div class="forecast-temps">
            <span class="temp-high">${forecast.tempHigh}°</span>
            <span class="temp-low">${forecast.tempLow}°</span>
        </div>
        <div class="forecast-desc">${forecast.weather.main}</div>
    `;
    
    // Add hover effect with more details
    card.addEventListener('mouseenter', () => {
        card.innerHTML += `
            <div style="margin-top: 10px; font-size: 0.8em; color: rgba(255,255,255,0.9);">
                💧 ${forecast.humidity}% | 💨 ${forecast.windSpeed} mph
            </div>
        `;
    });
    
    card.addEventListener('mouseleave', () => {
        const extraInfo = card.querySelector('div:last-child');
        if (extraInfo && extraInfo.style.marginTop === '10px') {
            extraInfo.remove();
        }
    });
    
    return card;
}

// Update background based on weather
function updateBackground(weatherMain, iconCode) {
    const isNight = iconCode.includes('n');
    const backgrounds = weatherBackgrounds[weatherMain] || weatherBackgrounds['Clear'];
    const backgroundClass = isNight ? backgrounds.night : backgrounds.day;
    
    // Remove all weather background classes
    document.body.className = '';
    
    // Add the appropriate background class
    document.body.classList.add(backgroundClass);
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    forecastContainer.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
}

// Show error message
function showError(message) {
    error.textContent = `⚠️ ${message}`;
    error.style.display = 'block';
}

// Hide error message
function hideError() {
    error.style.display = 'none';
}

// Add rainbow effect to cards on special weather
window.addEventListener('load', () => {
    setTimeout(() => {
        const cards = document.querySelectorAll('.forecast-card');
        cards.forEach((card, index) => {
            if (card.textContent.includes('Clear')) {
                card.style.background = 'linear-gradient(135deg, #FFE5B4 0%, #87CEEB 50%, #FFB6C1 100%)';
            }
        });
    }, 1000);
});