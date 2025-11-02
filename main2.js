// main.js — оживление фильтров, сортировки, поиска и пагинации без изменения дизайна

document.addEventListener("DOMContentLoaded", () => {
    const productList = document.querySelector("#product-list");
    const searchInput = document.querySelector('input[type="text"][placeholder="Поиск товаров..."]');
    const categoryInputs = document.querySelectorAll('.filter-group[data-filter-type="category"] input[type="checkbox"]');
    const brandInputs = document.querySelectorAll('input[id^="brand"]');
    const ratingInputs = document.querySelectorAll('input[id^="rating"]');
    const sortButtons = document.querySelectorAll(".sort-btn");
    const priceMinInput = document.querySelector('.filter-group input[type="text"]:first-child');
    const priceMaxInput = document.querySelector('.filter-group input[type="text"]:last-child');

    // создаём контейнер пагинации
    const pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "flex justify-center mt-8 gap-2";
    productList.after(pagination);

    // собрать данные о товарах из DOM
    const products = Array.from(productList.children).map((card) => {
        const nameEl = card.querySelector("h3");
        const name = nameEl ? nameEl.textContent.trim() : "";
        const category = detectCategory(name);
        const priceEl = card.querySelector(".font-bold.text-lg");
        const price = priceEl ? parseInt(priceEl.textContent.replace(/\D/g, "")) : 0;
        const ratingEl = card.querySelector(".text-sm.text-gray-500");
        const rating = ratingEl ? parseFloat(ratingEl.textContent.replace(/[^0-9.]/g, "")) : 0;
        return { el: card, name, category, price, rating };
    });

    // состояние
    const state = {
        search: "",
        categories: new Set(),
        brands: new Set(),
        ratings: new Set(),
        sortBy: "default",
        sortOrder: "asc",
        priceMin: 0,
        priceMax: Math.max(...products.map((p) => p.price)),
        page: 1,
        perPage: 6,
    };

    // ---------------------- логика фильтрации и сортировки ----------------------
    function applyFilters() {
        let result = products.slice();

        // поиск
        if (state.search) {
            const q = state.search.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q));
        }

        // категории
        if (state.categories.size) {
            result = result.filter((p) => state.categories.has(p.category.toLowerCase()));
        }

        // бренды (по названию, если встречается)
        if (state.brands.size) {
            result = result.filter((p) => {
                for (const b of state.brands) if (p.name.toLowerCase().includes(b)) return true;
                return false;
            });
        }

        // рейтинг
        if (state.ratings.size) {
            const minRating = Math.max(...Array.from(state.ratings));
            result = result.filter((p) => p.rating >= minRating);
        }

        // цена
        result = result.filter((p) => p.price >= state.priceMin && p.price <= state.priceMax);

        // сортировка
        result = sortProducts(result);

        // пагинация
        renderProducts(result);
    }

    function sortProducts(list) {
        const sorted = list.slice();
        if (state.sortBy === "price") {
            sorted.sort((a, b) =>
                state.sortOrder === "asc" ? a.price - b.price : b.price - a.price
            );
        } else if (state.sortBy === "rating") {
            sorted.sort((a, b) =>
                state.sortOrder === "asc" ? a.rating - b.rating : b.rating - a.rating
            );
        } else {
            // default - оставляем порядок
        }
        return sorted;
    }

    function renderProducts(list) {
        const total = list.length;
        const totalPages = Math.ceil(total / state.perPage);
        if (state.page > totalPages) state.page = totalPages || 1;
        const start = (state.page - 1) * state.perPage;
        const end = start + state.perPage;
        const pageItems = list.slice(start, end);

        // скрыть все карточки, показать только нужные
        products.forEach((p) => (p.el.style.display = "none"));
        pageItems.forEach((p) => (p.el.style.display = ""));

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        pagination.innerHTML = "";
        if (totalPages <= 1) return;

        const btn = (label, page, active = false) => {
            const b = document.createElement("button");
            b.textContent = label;
            b.className =
                "px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100 transition-colors" +
                (active ? " bg-primary-600 text-white" : "");
            b.addEventListener("click", () => {
                state.page = page;
                applyFilters();
            });
            return b;
        };

        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(btn(i, i, i === state.page));
        }
    }

    // ---------------------- события ----------------------
    // поиск
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.search = e.target.value.trim();
            state.page = 1;
            applyFilters();
        });
    }

    // категории
    categoryInputs.forEach((el) => {
        const label = el.nextElementSibling?.dataset.id?.toLowerCase();
        if (!label) return;
        el.addEventListener("change", () => {
            if (el.checked) state.categories.add(label);
            else state.categories.delete(label);
            state.page = 1;
            applyFilters();
        });
    });

    // бренды
    brandInputs.forEach((el) => {
        const label = el.nextElementSibling?.textContent.split("(")[0].trim().toLowerCase();
        el.addEventListener("change", () => {
            if (el.checked) state.brands.add(label);
            else state.brands.delete(label);
            state.page = 1;
            applyFilters();
        });
    });

    // рейтинг
    ratingInputs.forEach((el) => {
        const val = parseInt(el.id.replace("rating", ""), 10);
        el.addEventListener("change", () => {
            if (el.checked) state.ratings.add(val);
            else state.ratings.delete(val);
            state.page = 1;
            applyFilters();
        });
    });

    // сортировка
    sortButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            state.sortBy = btn.dataset.sortBy;
            state.sortOrder = btn.dataset.sortOrder;
            state.page = 1;
            applyFilters();
        });
    });

    // цена
    if (priceMinInput && priceMaxInput) {
        const parsePrice = (val) => parseInt(val.replace(/\D/g, "")) || 0;
        priceMinInput.addEventListener("change", () => {
            state.priceMin = parsePrice(priceMinInput.value);
            state.page = 1;
            applyFilters();
        });
        priceMaxInput.addEventListener("change", () => {
            state.priceMax = parsePrice(priceMaxInput.value);
            state.page = 1;
            applyFilters();
        });
    }

    // ---------------------- вспомогательные функции ----------------------
    function detectCategory(name) {
        name = name.toLowerCase();
        if (name.includes("обув")) return "обувь";
        if (name.includes("кроссов")) return "обувь";
        if (name.includes("джинс")) return "одежда";
        if (name.includes("худи")) return "одежда";
        if (name.includes("футбол")) return "одежда";
        if (name.includes("аксесс")) return "аксессуары";
        if (name.includes("наушник") || name.includes("sony")) return "электроника";
        return "прочее";
    }

    // ---------------------- инициализация ----------------------
    applyFilters();
});
