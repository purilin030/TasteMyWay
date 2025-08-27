document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-btn');
  const searchBox = document.getElementById('search-box');
  const foodResultsContainer = document.getElementById('results-section');

  // Get liked food IDs from localStorage, or initialize empty array
  let likedFoodIds = JSON.parse(localStorage.getItem('likedFoodIds')) || [];

  // Fetch food data from JSON
  fetch('../../FoodDetail/json/food.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(foods => {
      function displayFoods(foodArray) {
        foodResultsContainer.innerHTML = '';

        if (foodArray.length > 0) {
          foodArray.forEach(food => {
            const isLiked = likedFoodIds.includes(food.id);

            // Use urlId if present, fallback to id or 'defaultid'
            const urlId = food.urlId || food.id || 'defaultid';

            // Dynamic link using current origin
            const linkUrl = `${window.location.origin}/website/FoodDetail/html/food.html?id=${encodeURIComponent(urlId)}`;
            const foodCard = document.createElement('div');
            foodCard.classList.add('food-card');
            foodCard.innerHTML = `
              <a href="${linkUrl}">
                <img src="${food.thumb}" alt="${food.name}" class="food-image" />
              </a>
              <h3>${food.name}</h3>
              <p>${food.desc}</p>
              <div class="tags">Tags: ${food.tags.join(', ')}</div>
              <div class="like-button-container">
                <button class="like-button${isLiked ? ' liked' : ''}" data-food-id="${food.id}">
                  ${isLiked ? '❤️ Liked' : '🤍 Like'}
                </button>
              </div>
            `;
            foodResultsContainer.appendChild(foodCard);
          });
        } else {
          foodResultsContainer.innerHTML = '<p>No food found. Please try another state or food name.</p>';
        }
      }

      // Display all foods on page load
      displayFoods(foods);

      const urlParams = new URLSearchParams(window.location.search);
      const region = urlParams.get('region');
      if (region) {
        searchBox.value = region;
        // 直接过滤并显示
        const filteredFoods = foods.filter(food =>
          food.state.toLowerCase() === region.toLowerCase()
        );
        displayFoods(filteredFoods);
      }

      // Search button event
      searchButton.addEventListener('click', () => {
        const query = searchBox.value.toLowerCase().trim();
        if (query === '') {
          displayFoods(foods);
          return;
        }
        const filteredFoods = foods.filter(food =>
          food.state.toLowerCase() === query ||
          food.name.toLowerCase().includes(query)
        );
        displayFoods(filteredFoods);
      });

      // Like button event delegation
      foodResultsContainer.addEventListener('click', event => {
        if (event.target.classList.contains('like-button')) {
          const button = event.target;
          const foodId = button.getAttribute('data-food-id');

          if (likedFoodIds.includes(foodId)) {
            likedFoodIds = likedFoodIds.filter(id => id !== foodId);
            button.classList.remove('liked');
            button.textContent = '🤍 Like';
          } else {
            likedFoodIds.push(foodId);
            button.classList.add('liked');
            button.textContent = '❤️ Liked';
          }
          localStorage.setItem('likedFoodIds', JSON.stringify(likedFoodIds));
        }
      });
    })
    .catch(error => {
      console.error('There was a problem fetching the food data:', error);
      foodResultsContainer.innerHTML = '<p>Failed to load food data.</p>';
    });
});









