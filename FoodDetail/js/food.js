(function () {
  const qs = (k) => new URL(location.href).searchParams.get(k) || "";
  const id = (qs("id") || "").toLowerCase();

  const img = document.getElementById("foodImg");
  const ingre = document.getElementById("ingredientsImg");
  const nameEl = document.getElementById("foodName");
  const pillRow = document.getElementById("pillRow");
  const ingBox = document.getElementById("ingredients");
  const ingEmpty = document.getElementById("ingredientsEmpty");
  const introImgTop = document.getElementById("introImgTop");
  const introImgBottom = document.getElementById("introImgBottom");
  const descEl = document.getElementById("desc");
  const desc2El = document.getElementById("desc2");
  const placesBox = document.getElementById("places");
  const placesEmpty = document.getElementById("placesEmpty");

  const mainContainer = document.getElementById("app");
  const body = document.body;

  // Discover More button
  const discoverMoreBtn = document.getElementById("discoverMoreBtn");

  // Food name mapping for better display
  const foodNameMapping = {
    charkueyteow: "Char Kuey Teow",
    hokkienmee: "Hokkien Mee",
    tarorice: "Taro Rice",
    rojak: "Rojak",
    beansproutchicken: "Bean Sprout Chicken",
    cheecheongfun: "Chee Cheong Fun",
    chickencurrybread: "Chicken Curry Bread",
    chickenhorfun: "Chicken Hor Fun",
    kampua: "Kampua",
    kompyang: "Kompyang",
    dingbianhu: "Ding Bian Hu",
    laksa: "Laksa",
    chickenricebowl: "Chicken Rice Bowl",
    cendol: "Cendol",
    popiah: "Popiah",
    satay: "Satay",
  };

  if (!id) {
    console.warn("No ID parameter provided. Loading first available food item...");
  }

  const DATA_URL = "../json/food.json";

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((arr) => {
      console.log("Loaded food data:", arr);

      let item;

      if (id) {
        item =
          arr.find((x) => (x.id || "").toLowerCase() === id) ||
          arr.find((x) => (x.slug || "").toLowerCase() === id);
      }

      if (!item && arr.length > 0) {
        item = arr[0];
        console.log("Using first available item:", item);
      }

      if (!item) {
        nameEl.textContent = "No food items available";
        descEl.textContent = `No food data found in the JSON file.`;
        if (discoverMoreBtn) discoverMoreBtn.style.display = "none";
        return;
      }

      console.log("Displaying item:", item);

      // Apply theme using CSS classes only
      const foodId = (item.id || "").toLowerCase();
      const foodState = (item.state || "Malaysia").toLowerCase().replace(/\s+/g, "-");

      // Example: "theme-penang food-charkueyteow state-penang"
      body.className = `theme-${foodState} food-${foodId} state-${foodState} food-page`;
      mainContainer.className = `container food-${foodId}-container state-${foodState}-container`;

      if (item.halal) body.classList.add("halal-food");
      if (item.vegetarian) body.classList.add("vegetarian-food");

      // Title & main image with fallback name mapping
      const displayName = foodNameMapping[foodId] || item.name || item.title || (id || "Unknown").replace(/-/g, " ");
      nameEl.textContent = displayName;

      const imgUrl =
        item.image || (item.images && item.images[0]) || `../../foodImage/${foodId}.jpg` || "../../image/placeholder.jpg";
      img.src = imgUrl;
      img.alt = displayName;

      // Pills row (state + tags)
      pillRow.innerHTML = "";
      const pills = [];

      if (item.state) {
        pills.push({ text: item.state.toUpperCase(), class: "state-pill" });
      }

      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => pills.push({ text: t, class: "tag" }));
      }

      if (item.halal) pills.push({ text: "Halal", class: "dietary halal" });
      if (item.vegetarian) pills.push({ text: "Vegetarian", class: "dietary vegetarian" });

      pills.forEach((p) => {
        const el = document.createElement("span");
        el.className = `pill ${p.class || ""}`;
        el.textContent = p.text;
        pillRow.appendChild(el);
      });

      // Ingredients
      if (Array.isArray(item.ingredients) && item.ingredients.length) {
        ingEmpty.hidden = true;
        ingBox.innerHTML = "";
        ingBox.className = `chips ingredients-${foodId} state-${foodState}`;
        item.ingredients.forEach((ingredient) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = ingredient;
          ingBox.appendChild(chip);
        });
      } else {
        ingEmpty.hidden = false;
      }

      // Intro images
      if (introImgTop && introImgBottom && Array.isArray(item.introImages) && item.introImages.length >= 2) {
        introImgTop.src = item.introImages[0];
        introImgTop.alt = `Preparation image of ${displayName}`;
        introImgBottom.src = item.introImages[0];
        introImgBottom.alt = `Finished dish image of ${displayName}`;
      }

      // Create and append the bold title
      const title = document.createElement("h3");
      title.classList.add("sec-title");
      title.textContent = nameEl.textContent;
      descEl.insertBefore(title, descEl.firstChild);

      // Base description
      if (item.description) {
        const baseDescP = document.createElement("p");
        baseDescP.textContent = item.description;
        descEl.appendChild(baseDescP);
      }

      // Description_1
      if (Array.isArray(item.description_1)) {
        item.description_1.forEach((text) => {
          const p = document.createElement("p");
          p.textContent = text;
          descEl.appendChild(p);
        });
      }

      // Description_2
      if (desc2El && Array.isArray(item.description_2)) {
        desc2El.innerHTML = "";
        item.description_2.forEach((text) => {
          const p = document.createElement("p");
          p.textContent = text;
          desc2El.appendChild(p);
        });
      }

      // Recommended places
      if (Array.isArray(item.places) && item.places.length) {
        placesEmpty.hidden = true;
        placesBox.innerHTML = "";
        placesBox.className = `grid places-${foodId} state-${foodState}`;

        item.places.forEach((place) => {
          const card = document.createElement("div");
          card.className = `place state-${foodState}`;

          card.innerHTML = `
            <div class="place-img">
              <img src="${escapeHtml(place.image || "/path/to/placeholder.jpg")}" alt="${escapeHtml(place.name || "Food Image")}" />
            </div>
            <h3>${escapeHtml(place.name || "Restaurant")}</h3>
            <div class="addr">
              <span class="city">${escapeHtml(place.city || place.area || "Address not available")}</span> <
              <span class="viewMap">
                ${
                  place.map
                    ? `<a href="${escapeHtml(place.map)}" target="_blank" rel="noopener"> 📍${escapeHtml(place.viewMap || "")}</a>`
                    : ""
                }
              </span>
            </div>
            <div class="state-badge">${escapeHtml(item.state)}</div>
            <div>
              <span class="description short-text">${escapeHtml(place.descriptionShort || "")}</span>
              <span class="description full-text hidden">${escapeHtml(place.descriptionFull || "")}</span>
              <a href="#" class="read-more">Read More</a>
            </div>
            <div class="card-footer">
              <span class="category">${escapeHtml(place.address || "")}</span>
              <span class="social">${escapeHtml(place.operationTime || "")}</span>
            </div>
          `;

          placesBox.appendChild(card);
        });

        // Toggle "Read More"
        placesBox.querySelectorAll(".read-more").forEach((link) => {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            const container = this.parentElement;
            const shortText = container.querySelector(".short-text");
            const fullText = container.querySelector(".full-text");
            if (fullText.classList.contains("hidden")) {
              fullText.classList.remove("hidden");
              shortText.classList.add("hidden");
              this.textContent = "Read Less";
            } else {
              fullText.classList.add("hidden");
              shortText.classList.remove("hidden");
              this.textContent = "Read More";
            }
          });
        });
      } else {
        placesEmpty.hidden = false;
      }

      // Add Page Transitions
      addPageTransitions();

      // ----------- Discover More Button Logic ---------------
      if (discoverMoreBtn && arr.length > 1) {
        // Find current index of displayed food
        const currentIndex = arr.findIndex(
          (f) => (f.id || "").toLowerCase() === (item.id || "").toLowerCase()
        );

        // Calculate next index cyclically
        const nextIndex = (currentIndex + 1) % arr.length;

        // Get next food's id for URL
        const nextFood = arr[nextIndex];
        const nextId = nextFood.id || nextFood.slug || "";

        // Set button label dynamically
        discoverMoreBtn.textContent = `Discover More: ${
          nextFood.name || nextFood.title || nextId
        }`;

        // Set click handler to navigate to next food detail page
        discoverMoreBtn.addEventListener("click", () => {
          const baseUrl = window.location.origin + window.location.pathname;
          window.location.href = `${baseUrl}?id=${encodeURIComponent(nextId.toLowerCase())}`;
        });
      } else if (discoverMoreBtn) {
        discoverMoreBtn.style.display = "none";
      }
    })
    .catch((err) => {
      console.error("Error loading food data:", err);
      nameEl.textContent = "Error Loading Data";
      descEl.textContent = `Unable to load food data. Error: ${err.message}`;
      if (discoverMoreBtn) discoverMoreBtn.style.display = "none";
    });

  function addPageTransitions() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition = "all 0.6s ease";

      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 200);
    });
  }

  function escapeHtml(str = "") {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
