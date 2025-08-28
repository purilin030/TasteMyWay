document.addEventListener('DOMContentLoaded', () => {
    const favoritesListContainer = document.getElementById('favorites-list');

    // Get the liked food IDs from localStorage
    const likedFoodIds = JSON.parse(localStorage.getItem('likedFoodIds')) || [];

    // Fetch the food data from the JSON file
    fetch('../../FoodDetail/json/food.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(foods => {
            // Filter the foods array to get only the liked items
            const favoriteFoods = foods.filter(food => likedFoodIds.includes(food.id));
            //Display FoodCard that user liked
            if (favoriteFoods.length > 0) {
                favoriteFoods.forEach(food => {
                    const foodCard = document.createElement('div');
                    foodCard.classList.add('food-card');
                    foodCard.innerHTML = `
                        <img src="${food.thumb}" alt="${food.name}">
                        <h2>${food.name}</h2>
                        <p>${food.desc}</p>
                        <div class="tags">Tags: ${food.tags.join(', ')}</div>
                    `;
                    favoritesListContainer.appendChild(foodCard);
                });
            } else {
                favoritesListContainer.innerHTML = '<p class="not-found">You have no favorite foods yet. Go to Food Navigation to like some!</p>';
            }
        })
        .catch(error => {
            console.error('There was a problem fetching the food data:', error);
            favoritesListContainer.innerHTML = '<p class="not-found">Failed to load food data.</p>';
        });

});
