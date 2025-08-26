// Weather Widget - Today's Weather Script
const API_KEY = config.WEATHER_API_KEY;
const DEFAULT_CITY = 'Salt Lake City';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const todayWeather = document.getElementById('todayWeather');

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
    
    // Fetch weather for the city
    fetchWeather(lastCity);
    
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
        fetchWeather(city);
        localStorage.setItem('lastCity', city);
    } else {
        showError('Please enter a city name');
    }
}

// Fetch weather data
async function fetchWeather(city) {
    showLoading();
    hideError();
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else {
                throw new Error('Unable to fetch weather data. Please try again later.');
            }
        }
        
        const data = await response.json();
        displayWeather(data);
        updateBackground(data.weather[0].main, data.weather[0].icon);
        
    } catch (err) {
        showError(err.message);
        hideLoading();
    }
}

// Display weather data
function displayWeather(data) {
    // Update city name and date
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('currentDate').textContent = formatDate(new Date());
    
    // Update main weather display
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    document.getElementById('weatherIcon').src = iconUrl;
    document.getElementById('weatherIcon').alt = data.weather[0].description;
    document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°F`;
    document.getElementById('weatherDesc').textContent = data.weather[0].description;
    
    // Update weather details
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°F`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed)} mph`;
    document.getElementById('visibility').textContent = `${Math.round(data.visibility / 1609.34)} mi`;
    
    // Update sunrise and sunset
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    document.getElementById('sunrise').textContent = formatTime(sunrise);
    document.getElementById('sunset').textContent = formatTime(sunset);
    
    // Show weather display and hide loading
    todayWeather.style.display = 'block';
    hideLoading();
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

// Format date
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    todayWeather.style.display = 'none';
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

// Add fun animation when page loads
window.addEventListener('load', () => {
    const elements = document.querySelectorAll('.detail-card, .sun-card');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add('bounce-in');
    });
});