/**
 * Recipe Planner - Dynamic Meal Planning Functionality
 * Uses the recipeLoader to handle meal planning calendar, recipe assignment, and shopping list generation
 */

import * as recipeLoader from './recipeLoader.js';

document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const favoriteRecipesContainer = document.getElementById('favoriteRecipes');
    const recentRecipesContainer = document.getElementById('recentRecipes');
    const recipeSearchInput = document.getElementById('recipeSearchInput');
    const mealSlots = document.querySelectorAll('.meal-slot');
    const generateShoppingListBtn = document.getElementById('generateShoppingList');
    const printMealPlanBtn = document.getElementById('printMealPlan');
    const clearMealPlanBtn = document.getElementById('clearMealPlan');
    const shoppingListModal = new bootstrap.Modal(document.getElementById('shoppingListModal'));
    const shoppingListContent = document.getElementById('shoppingListContent');
    const printShoppingListBtn = document.getElementById('printShoppingList');
    const loadingIndicator = document.createElement('div');
    const loadTemplateBtn = document.getElementById('loadTemplate');
    const saveTemplateBtn = document.getElementById('saveTemplate');
    
    // Setup loading indicator
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading meal plan data...</p>
    `;
    document.body.appendChild(loadingIndicator);
    
    // Nutrition summary elements
    const totalCaloriesEl = document.getElementById('totalCalories');
    const totalProteinEl = document.getElementById('totalProtein');
    const totalCarbsEl = document.getElementById('totalCarbs');
    const totalFatEl = document.getElementById('totalFat');
    
    // Initialize recipe data
    try {
        await recipeLoader.initRecipeData();
        hideLoading();
        
        // Initialize the page
        await displayFavoriteRecipes();
        await displayRecentRecipes();
        await displayMealPlan();
        await updateNutritionSummary();
    } catch (error) {
        console.error('Error initializing meal plan data:', error);
        hideLoading();
        showError('Failed to load meal plan data. Please try again later.');
    }
    
    // Event listeners
    recipeSearchInput.addEventListener('keyup', handleRecipeSearch);
    generateShoppingListBtn.addEventListener('click', generateShoppingList);
    printMealPlanBtn.addEventListener('click', printMealPlan);
    clearMealPlanBtn.addEventListener('click', clearMealPlan);
    printShoppingListBtn.addEventListener('click', printShoppingList);
    
    // Add event listeners for template buttons
    loadTemplateBtn.addEventListener('click', openLoadTemplateModal);
    saveTemplateBtn.addEventListener('click', openSaveTemplateModal);
    
    // Add event listeners to meal slots
    mealSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const mealType = this.getAttribute('data-meal');
            openRecipeSelection(day, mealType, this);
        });
        
        // Enable drop functionality
        slot.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const recipeId = e.dataTransfer.getData('text/plain');
            const day = this.getAttribute('data-day');
            const mealType = this.getAttribute('data-meal');
            
            assignRecipeToSlot(recipeId, day, mealType);
        });
    });
    
    // Add event listener for modal recipe search
    const modalRecipeSearch = document.getElementById('modalRecipeSearch');
    if (modalRecipeSearch) {
        modalRecipeSearch.addEventListener('keyup', function(e) {
            // Search on Enter key or after 500ms of no typing
            if (e.key === 'Enter') {
                loadRecipesForSelection(this.value);
            } else {
                // Debounce search to avoid too many requests
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    loadRecipesForSelection(this.value);
                }, 500);
            }
        });
    }
    
    // Template management functions
    
    /**
     * Open modal for loading a meal plan template
     */
    async function openLoadTemplateModal() {
        showLoading();
        
        try {
            // Create modal dynamically if it doesn't exist
            let templateModal = document.getElementById('templateModal');
            
            if (!templateModal) {
                const modalHtml = `
                <div class="modal fade" id="templateModal" tabindex="-1" aria-labelledby="templateModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="templateModalLabel">Load Meal Plan Template</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <input type="text" class="form-control" id="templateSearchInput" placeholder="Search templates...">
                                </div>
                                <div class="template-categories mb-3">
                                    <div class="btn-group" role="group">
                                        <button type="button" class="btn btn-outline-primary active" data-category="all">All</button>
                                        <button type="button" class="btn btn-outline-primary" data-category="user">My Templates</button>
                                        <button type="button" class="btn btn-outline-primary" data-category="default">Default Templates</button>
                                    </div>
                                </div>
                                <div id="templateList" class="list-group">
                                    <!-- Templates will be loaded here -->
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                templateModal = document.getElementById('templateModal');
                
                // Add event listeners for template category buttons
                const categoryButtons = templateModal.querySelectorAll('.template-categories button');
                categoryButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Remove active class from all buttons
                        categoryButtons.forEach(btn => btn.classList.remove('active'));
                        // Add active class to clicked button
                        this.classList.add('active');
                        // Filter templates by category
                        const category = this.getAttribute('data-category');
                        loadTemplates(category);
                    });
                });
                
                // Add event listener for template search
                const templateSearchInput = templateModal.querySelector('#templateSearchInput');
                templateSearchInput.addEventListener('keyup', function() {
                    const searchTerm = this.value.trim().toLowerCase();
                    const templates = templateModal.querySelectorAll('.template-item');
                    
                    templates.forEach(template => {
                        const templateName = template.querySelector('.template-name').textContent.toLowerCase();
                        const templateDesc = template.querySelector('.template-description').textContent.toLowerCase();
                        
                        if (templateName.includes(searchTerm) || templateDesc.includes(searchTerm)) {
                            template.style.display = 'block';
                        } else {
                            template.style.display = 'none';
                        }
                    });
                });
            }
            
            // Load templates
            await loadTemplates('all');
            
            // Show modal
            const modal = new bootstrap.Modal(templateModal);
            modal.show();
        } catch (error) {
            console.error('Error opening template modal:', error);
            showError('Failed to load meal plan templates. Please try again.');
        }
        
        hideLoading();
    }
    
    /**
     * Load templates by category
     * @param {string} category - Template category ('all', 'user', or 'default')
     */
    async function loadTemplates(category = 'all') {
        const templateList = document.getElementById('templateList');
        templateList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>';
        
        try {
            // Get templates from localStorage
            const templates = getTemplatesFromStorage();
            
            // Filter templates by category if needed
            let filteredTemplates = templates;
            if (category === 'user') {
                filteredTemplates = templates.filter(t => t.type === 'user');
            } else if (category === 'default') {
                filteredTemplates = templates.filter(t => t.type === 'default');
            }
            
            // Display templates
            if (filteredTemplates.length === 0) {
                templateList.innerHTML = '<div class="text-center py-3">No templates found</div>';
                return;
            }
            
            templateList.innerHTML = '';
            
            filteredTemplates.forEach(template => {
                const templateItem = document.createElement('div');
                templateItem.className = 'list-group-item list-group-item-action template-item';
                templateItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1 template-name">${template.name}</h5>
                        <small>${formatDate(template.createdAt)}</small>
                    </div>
                    <p class="mb-1 template-description">${template.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small>${template.type === 'default' ? 'Default Template' : 'User Template'}</small>
                        <button class="btn btn-sm btn-primary load-template-btn" data-id="${template.id}">Load</button>
                    </div>
                `;
                
                templateList.appendChild(templateItem);
                
                // Add event listener to load button
                const loadBtn = templateItem.querySelector('.load-template-btn');
                loadBtn.addEventListener('click', () => loadTemplate(template.id));
            });
        } catch (error) {
            console.error('Error loading templates:', error);
            templateList.innerHTML = '<div class="text-center py-3 text-danger">Error loading templates</div>';
        }
    }
    
    /**
     * Load a template by ID
     * @param {string} templateId - Template ID
     */
    async function loadTemplate(templateId) {
        showLoading();
        
        try {
            // Get templates from localStorage
            const templates = getTemplatesFromStorage();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }
            
            // Confirm before loading
            if (confirm(`Are you sure you want to load the template "${template.name}"? This will replace your current meal plan.`)) {
                // Load template data into meal plan
                recipeLoader.setMealPlan(template.mealPlan);
                
                // Update UI
                await displayMealPlan();
                await updateNutritionSummary();
                
                // Close modal
                const templateModal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
                templateModal.hide();
                
                // Show success message
                alert(`Template "${template.name}" loaded successfully!`);
            }
        } catch (error) {
            console.error('Error loading template:', error);
            showError('Failed to load template. Please try again.');
        }
        
        hideLoading();
    }
    
    /**
     * Open modal for saving a meal plan template
     */
    async function openSaveTemplateModal() {
        showLoading();
        
        try {
            // Create modal dynamically if it doesn't exist
            let saveTemplateModal = document.getElementById('saveTemplateModal');
            
            if (!saveTemplateModal) {
                const modalHtml = `
                <div class="modal fade" id="saveTemplateModal" tabindex="-1" aria-labelledby="saveTemplateModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="saveTemplateModalLabel">Save Meal Plan as Template</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="saveTemplateForm">
                                    <div class="mb-3">
                                        <label for="templateName" class="form-label">Template Name</label>
                                        <input type="text" class="form-control" id="templateName" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="templateDescription" class="form-label">Description</label>
                                        <textarea class="form-control" id="templateDescription" rows="3"></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Categories</label>
                                        <div class="d-flex flex-wrap gap-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="vegetarian" id="catVegetarian">
                                                <label class="form-check-label" for="catVegetarian">Vegetarian</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="vegan" id="catVegan">
                                                <label class="form-check-label" for="catVegan">Vegan</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="low-carb" id="catLowCarb">
                                                <label class="form-check-label" for="catLowCarb">Low Carb</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="high-protein" id="catHighProtein">
                                                <label class="form-check-label" for="catHighProtein">High Protein</label>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="saveTemplateBtn">Save Template</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                saveTemplateModal = document.getElementById('saveTemplateModal');
                
                // Add event listener to save button
                const saveBtn = saveTemplateModal.querySelector('#saveTemplateBtn');
                saveBtn.addEventListener('click', saveCurrentAsTemplate);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(saveTemplateModal);
            modal.show();
        } catch (error) {
            console.error('Error opening save template modal:', error);
            showError('Failed to open save template dialog. Please try again.');
        }
        
        hideLoading();
    }
    
    /**
     * Save current meal plan as a template
     */
    async function saveCurrentAsTemplate() {
        showLoading();
        
        try {
            // Get form values
            const templateName = document.getElementById('templateName').value.trim();
            const templateDescription = document.getElementById('templateDescription').value.trim();
            
            // Validate
            if (!templateName) {
                alert('Please enter a template name');
                hideLoading();
                return;
            }
            
            // Get selected categories
            const categories = [];
            document.querySelectorAll('#saveTemplateForm input[type="checkbox"]:checked').forEach(checkbox => {
                categories.push(checkbox.value);
            });
            
            // Get current meal plan
            const mealPlan = recipeLoader.getMealPlan();
            
            // Create template object
            const template = {
                id: 'template_' + Date.now(),
                name: templateName,
                description: templateDescription,
                categories: categories,
                type: 'user',
                createdAt: new Date().toISOString(),
                mealPlan: mealPlan
            };
            
            // Save template to localStorage
            saveTemplateToStorage(template);
            
            // Close modal
            const saveTemplateModal = bootstrap.Modal.getInstance(document.getElementById('saveTemplateModal'));
            saveTemplateModal.hide();
            
            // Show success message
            alert(`Template "${templateName}" saved successfully!`);
        } catch (error) {
            console.error('Error saving template:', error);
            showError('Failed to save template. Please try again.');
        }
        
        hideLoading();
    }
    
    /**
     * Get templates from localStorage
     * @returns {Array} Array of template objects
     */
    function getTemplatesFromStorage() {
        const templates = localStorage.getItem('mealPlanTemplates');
        
        if (!templates) {
            // Return default templates if no user templates exist
            return getDefaultTemplates();
        }
        
        try {
            const userTemplates = JSON.parse(templates);
            return [...userTemplates, ...getDefaultTemplates()];
        } catch (error) {
            console.error('Error parsing templates from localStorage:', error);
            return getDefaultTemplates();
        }
    }
    
    /**
     * Save template to localStorage
     * @param {Object} template - Template object to save
     */
    function saveTemplateToStorage(template) {
        try {
            // Get existing templates
            const existingTemplatesJson = localStorage.getItem('mealPlanTemplates');
            let existingTemplates = [];
            
            if (existingTemplatesJson) {
                existingTemplates = JSON.parse(existingTemplatesJson);
            }
            
            // Add new template
            existingTemplates.push(template);
            
            // Save back to localStorage
            localStorage.setItem('mealPlanTemplates', JSON.stringify(existingTemplates));
        } catch (error) {
            console.error('Error saving template to localStorage:', error);
            throw error;
        }
    }
    
    /**
     * Get default meal plan templates
     * @returns {Array} Array of default template objects
     */
    function getDefaultTemplates() {
        return [
            {
                id: 'default_balanced',
                name: 'Balanced Week',
                description: 'A balanced meal plan with a variety of proteins, grains, and vegetables',
                categories: ['balanced'],
                type: 'default',
                createdAt: '2023-01-01T00:00:00.000Z',
                mealPlan: {
                    monday: { breakfast: null, lunch: null, dinner: null },
                    tuesday: { breakfast: null, lunch: null, dinner: null },
                    wednesday: { breakfast: null, lunch: null, dinner: null },
                    thursday: { breakfast: null, lunch: null, dinner: null },
                    friday: { breakfast: null, lunch: null, dinner: null },
                    saturday: { breakfast: null, lunch: null, dinner: null },
                    sunday: { breakfast: null, lunch: null, dinner: null }
                }
            },
            {
                id: 'default_vegetarian',
                name: 'Vegetarian Week',
                description: 'A plant-based meal plan with plenty of protein and nutrients',
                categories: ['vegetarian'],
                type: 'default',
                createdAt: '2023-01-01T00:00:00.000Z',
                mealPlan: {
                    monday: { breakfast: null, lunch: null, dinner: null },
                    tuesday: { breakfast: null, lunch: null, dinner: null },
                    wednesday: { breakfast: null, lunch: null, dinner: null },
                    thursday: { breakfast: null, lunch: null, dinner: null },
                    friday: { breakfast: null, lunch: null, dinner: null },
                    saturday: { breakfast: null, lunch: null, dinner: null },
                    sunday: { breakfast: null, lunch: null, dinner: null }
                }
            },
            {
                id: 'default_quick',
                name: 'Quick & Easy Week',
                description: 'Meals that can be prepared in 30 minutes or less',
                categories: ['quick'],
                type: 'default',
                createdAt: '2023-01-01T00:00:00.000Z',
                mealPlan: {
                    monday: { breakfast: null, lunch: null, dinner: null },
                    tuesday: { breakfast: null, lunch: null, dinner: null },
                    wednesday: { breakfast: null, lunch: null, dinner: null },
                    thursday: { breakfast: null, lunch: null, dinner: null },
                    friday: { breakfast: null, lunch: null, dinner: null },
                    saturday: { breakfast: null, lunch: null, dinner: null },
                    sunday: { breakfast: null, lunch: null, dinner: null }
                }
            }
        ];
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Display favorite recipes in the sidebar
    async function displayFavoriteRecipes() {
        showLoading();
        
        try {
            favoriteRecipesContainer.innerHTML = '';
            
            const favoriteRecipes = await recipeLoader.getFavoriteRecipes();
            
            if (favoriteRecipes.length === 0) {
                favoriteRecipesContainer.innerHTML = '<p class="text-muted">No favorite recipes yet</p>';
                return;
            }
            
            for (const recipe of favoriteRecipes) {
                const recipeElement = createRecipeElement(recipe);
                favoriteRecipesContainer.appendChild(recipeElement);
            }
        } catch (error) {
            console.error('Error displaying favorite recipes:', error);
            favoriteRecipesContainer.innerHTML = '<p class="text-danger">Error loading favorites</p>';
        }
        
        hideLoading();
    }
    
    // Display recently viewed recipes in the sidebar
    async function displayRecentRecipes() {
        showLoading();
        
        try {
            recentRecipesContainer.innerHTML = '';
            
            const recentRecipes = await recipeLoader.getRecentlyViewedRecipes(5);
            
            if (recentRecipes.length === 0) {
                recentRecipesContainer.innerHTML = '<p class="text-muted">No recently viewed recipes</p>';
                return;
            }
            
            for (const recipe of recentRecipes) {
                const recipeElement = createRecipeElement(recipe);
                recentRecipesContainer.appendChild(recipeElement);
            }
        } catch (error) {
            console.error('Error displaying recent recipes:', error);
            recentRecipesContainer.innerHTML = '<p class="text-danger">Error loading recent recipes</p>';
        }
        
        hideLoading();
    }
    
    // Create a recipe element for the sidebar
    function createRecipeElement(recipe) {
        const recipeElement = document.createElement('div');
        recipeElement.className = 'meal-item';
        recipeElement.setAttribute('draggable', 'true');
        recipeElement.setAttribute('data-id', recipe.id);
        
        recipeElement.innerHTML = `
            <div class="meal-item-title">${recipe.title}</div>
            <div class="meal-item-meta">
                <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                <span><i class="fas fa-utensils"></i> ${recipe.difficulty}</span>
            </div>
        `;
        
        // Add event listener for drag
        recipeElement.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', recipe.id);
        });
        
        // Add event listener for click
        recipeElement.addEventListener('click', function() {
            openRecipeModal(recipe.id);
        });
        
        return recipeElement;
    }
    
    // Display the current meal plan
    async function displayMealPlan() {
        showLoading();
        
        try {
            const mealPlan = recipeLoader.getMealPlan();
            
            for (const slot of mealSlots) {
                const day = slot.getAttribute('data-day');
                const mealType = slot.getAttribute('data-meal');
                
                // Clear the slot
                slot.innerHTML = '';
                slot.classList.remove('has-meal');
                
                // Check if there is a meal assigned to this slot
                const recipeId = mealPlan[day][mealType];
                if (recipeId) {
                    const recipe = await recipeLoader.getRecipeById(recipeId);
                    if (recipe) {
                        slot.classList.add('has-meal');
                        
                        const mealContent = document.createElement('div');
                        mealContent.className = 'meal-content';
                        mealContent.innerHTML = `
                            <div class="meal-item-title">${recipe.title}</div>
                            <div class="meal-item-meta">
                                <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                            </div>
                            <button class="btn btn-sm btn-outline-danger remove-meal" title="Remove meal">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        
                        // Add event listener to remove button
                        const removeBtn = mealContent.querySelector('.remove-meal');
                        removeBtn.addEventListener('click', function(e) {
                            e.stopPropagation(); // Prevent slot click event
                            removeMeal(day, mealType);
                        });
                        
                        slot.appendChild(mealContent);
                    }
                }
            }
        } catch (error) {
            console.error('Error displaying meal plan:', error);
            showError('Failed to load meal plan data. Please try again.');
        }
        
        hideLoading();
    }
    
    // Open recipe modal
    async function openRecipeModal(recipeId) {
        // Add recipe to recently viewed
        recipeLoader.addToRecentlyViewed(recipeId);
        
        // In a real app, this would open a recipe modal
        // For now, we'll just alert
        alert('Recipe details would be shown in a modal.');
    }
    
    // Open recipe selection for a meal slot
    async function openRecipeSelection(day, mealType, slot) {
        showLoading();
        
        try {
            // Store the selected day and meal type for later use
            document.getElementById('recipeSelectionModal').setAttribute('data-day', day);
            document.getElementById('recipeSelectionModal').setAttribute('data-meal', mealType);
            
            // Set the modal title to include the day and meal type
            const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
            const formattedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
            document.getElementById('recipeSelectionModalLabel').textContent = 
                `Select Recipe for ${formattedDay} ${formattedMealType}`;
            
            // Load recipes into the modal
            await loadRecipesForSelection();
            
            // Show the modal
            const recipeSelectionModal = new bootstrap.Modal(document.getElementById('recipeSelectionModal'));
            recipeSelectionModal.show();
        } catch (error) {
            console.error('Error opening recipe selection:', error);
            showError('Failed to open recipe selection. Please try again.');
        }
        
        hideLoading();
    }
    
    // Load recipes for the selection modal
    async function loadRecipesForSelection(searchQuery = '') {
        const recipeSelectionContainer = document.getElementById('recipeSelectionContainer');
        const loadingElement = document.getElementById('recipeSelectionLoading');
        const emptyElement = document.getElementById('recipeSelectionEmpty');
        
        // Show loading indicator
        recipeSelectionContainer.innerHTML = '';
        loadingElement.classList.remove('d-none');
        emptyElement.classList.add('d-none');
        
        try {
            // Get recipes from data service
            let recipes;
            if (searchQuery) {
                recipes = await recipeLoader.searchRecipes(searchQuery);
            } else {
                recipes = await recipeLoader.getRecipes();
            }
            
            // Hide loading indicator
            loadingElement.classList.add('d-none');
            
            // Check if we have recipes
            if (recipes.length === 0) {
                emptyElement.classList.remove('d-none');
                return;
            }
            
            // Create recipe cards for the modal
            recipes.forEach(recipe => {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'col-md-4 mb-3';
                
                recipeCard.innerHTML = `
                    <div class="card h-100">
                        <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}" style="height: 150px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${recipe.title}</h5>
                            <p class="card-text small">
                                <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                                <span class="ms-2"><i class="fas fa-utensils"></i> ${recipe.difficulty}</span>
                            </p>
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-sm btn-outline-primary view-recipe-btn" data-id="${recipe.id}">View Details</button>
                                <button class="btn btn-sm btn-primary select-recipe-btn" data-id="${recipe.id}">Select</button>
                            </div>
                        </div>
                    </div>
                `;
                
                recipeSelectionContainer.appendChild(recipeCard);
                
                // Add event listeners to buttons
                recipeCard.querySelector('.view-recipe-btn').addEventListener('click', () => {
                    openRecipeDetail(recipe.id);
                });
                
                recipeCard.querySelector('.select-recipe-btn').addEventListener('click', () => {
                    selectRecipe(recipe.id);
                });
            });
        } catch (error) {
            console.error('Error loading recipes for selection:', error);
            loadingElement.classList.add('d-none');
            showError('Failed to load recipes. Please try again.');
        }
    }
    
    // Open recipe detail modal
    async function openRecipeDetail(recipeId) {
        const recipeDetailContent = document.getElementById('recipeDetailContent');
        
        // Show loading
        recipeDetailContent.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading recipe details...</p>
            </div>
        `;
        
        // Open the modal
        const recipeDetailModal = new bootstrap.Modal(document.getElementById('recipeDetailModal'));
        recipeDetailModal.show();
        
        try {
            // Get recipe details
            const recipe = await recipeLoader.getRecipeById(recipeId);
            
            // Add recipe to recently viewed
            recipeLoader.addToRecentlyViewed(recipeId);
            
            // Format recipe details
            const ingredientsList = recipe.ingredients.map(ing => 
                `<li>${ing.amount} ${ing.name}</li>`
            ).join('');
            
            const instructionsList = recipe.instructions.map(step => 
                `<li>${step}</li>`
            ).join('');
            
            // Update modal content
            recipeDetailContent.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <img src="${recipe.image}" class="img-fluid rounded" alt="${recipe.title}">
                        <div class="mt-3">
                            <p><strong>Cooking Time:</strong> ${recipe.prepTime + recipe.cookTime} minutes</p>
                            <p><strong>Difficulty:</strong> ${recipe.difficulty}</p>
                            <p><strong>Servings:</strong> ${recipe.servings}</p>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <h3>${recipe.title}</h3>
                        <p>
                            ${recipe.tags.map(tag => 
                                `<span class="badge bg-light text-dark me-1">${tag}</span>`
                            ).join('')}
                        </p>
                        <h4 class="mt-4">Ingredients</h4>
                        <ul>${ingredientsList}</ul>
                        <h4 class="mt-4">Instructions</h4>
                        <ol>${instructionsList}</ol>
                    </div>
                </div>
            `;
            
            // Set the recipe ID on the add button
            const addToMealPlanBtn = document.getElementById('addToMealPlanBtn');
            addToMealPlanBtn.setAttribute('data-id', recipeId);
            
            // Add event listener to the add button
            addToMealPlanBtn.addEventListener('click', () => {
                selectRecipe(recipeId);
                recipeDetailModal.hide();
            });
        } catch (error) {
            console.error('Error loading recipe details:', error);
            recipeDetailContent.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load recipe details. Please try again.
                </div>
            `;
        }
    }
    
    // Select a recipe for the meal plan
    async function selectRecipe(recipeId) {
        // Get the day and meal type from the selection modal
        const day = document.getElementById('recipeSelectionModal').getAttribute('data-day');
        const mealType = document.getElementById('recipeSelectionModal').getAttribute('data-meal');
        
        // Close the selection modal
        const recipeSelectionModal = bootstrap.Modal.getInstance(document.getElementById('recipeSelectionModal'));
        recipeSelectionModal.hide();
        
        // Assign the recipe to the slot
        await assignRecipeToSlot(recipeId, day, mealType);
    }
    
    // Assign a recipe to a meal slot
    async function assignRecipeToSlot(recipeId, day, mealType) {
        showLoading();
        
        try {
            const recipe = await recipeLoader.getRecipeById(recipeId);
            if (!recipe) {
                throw new Error('Recipe not found');
            }
            
            // Update the meal plan
            recipeLoader.addToMealPlan(recipeId, day, mealType);
            
            // Update the display
            await displayMealPlan();
            await updateNutritionSummary();
        } catch (error) {
            console.error('Error assigning recipe to meal plan:', error);
            showError('Failed to assign recipe. Please try again.');
        }
        
        hideLoading();
    }
    
    // Remove a meal from the plan
    async function removeMeal(day, mealType) {
        showLoading();
        
        try {
            recipeLoader.removeFromMealPlan(day, mealType);
            
            // Update the display
            await displayMealPlan();
            await updateNutritionSummary();
        } catch (error) {
            console.error('Error removing meal from plan:', error);
            showError('Failed to remove meal. Please try again.');
        }
        
        hideLoading();
    }
    
    // Update the nutrition summary
    async function updateNutritionSummary() {
        showLoading();
        
        try {
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            let mealCount = 0;
            
            const mealPlan = recipeLoader.getMealPlan();
            
            // Calculate totals
            for (const day in mealPlan) {
                for (const mealType in mealPlan[day]) {
                    const recipeId = mealPlan[day][mealType];
                    if (recipeId) {
                        const recipe = await recipeLoader.getRecipeById(recipeId);
                        if (recipe && recipe.nutritionInfo) {
                            totalCalories += parseInt(recipe.nutritionInfo.calories);
                            totalProtein += parseInt(recipe.nutritionInfo.protein);
                            totalCarbs += parseInt(recipe.nutritionInfo.carbs);
                            totalFat += parseInt(recipe.nutritionInfo.fat);
                            mealCount++;
                        }
                    }
                }
            }
            
            // Calculate daily averages
            const daysInWeek = 7;
            const avgCalories = mealCount > 0 ? Math.round(totalCalories / daysInWeek) : 0;
            const avgProtein = mealCount > 0 ? Math.round(totalProtein / daysInWeek) : 0;
            const avgCarbs = mealCount > 0 ? Math.round(totalCarbs / daysInWeek) : 0;
            const avgFat = mealCount > 0 ? Math.round(totalFat / daysInWeek) : 0;
            
            // Update the display
            totalCaloriesEl.textContent = avgCalories;
            totalProteinEl.textContent = avgProtein + 'g';
            totalCarbsEl.textContent = avgCarbs + 'g';
            totalFatEl.textContent = avgFat + 'g';
        } catch (error) {
            console.error('Error updating nutrition summary:', error);
            showError('Failed to update nutrition information. Please try again.');
        }
        
        hideLoading();
    }
    
    // Handle recipe search
    async function handleRecipeSearch() {
        const searchTerm = recipeSearchInput.value.trim();
        
        if (!searchTerm) {
            return;
        }
        
        showLoading();
        
        try {
            const searchResults = await recipeLoader.searchRecipes(searchTerm);
            
            // Log the results for debugging
            console.log('Search results:', searchResults);
            
            // Display the search results in the sidebar
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results-container mt-3';
            
            // Remove any existing search results container
            const existingResults = document.querySelector('.search-results-container');
            if (existingResults) {
                existingResults.remove();
            }
            
            if (searchResults.length === 0) {
                resultsContainer.innerHTML = `<p class="text-muted">No recipes found matching "${searchTerm}"</p>`;
            } else {
                resultsContainer.innerHTML = `
                    <h5>Search Results (${searchResults.length})</h5>
                    <div class="search-results-list"></div>
                `;
                
                const resultsList = resultsContainer.querySelector('.search-results-list');
                for (const recipe of searchResults) {
                    const recipeElement = createRecipeElement(recipe);
                    resultsList.appendChild(recipeElement);
                }
            }
            
            // Add the results after the search input
            recipeSearchInput.parentNode.insertAdjacentElement('afterend', resultsContainer);
        } catch (error) {
            console.error('Error searching recipes:', error);
            showError('Failed to search recipes. Please try again.');
        }
        
        hideLoading();
    }
    
    // Generate shopping list
    async function generateShoppingList() {
        showLoading();
        
        try {
            // Get all ingredients from the meal plan
            const ingredients = [];
            const mealPlan = recipeLoader.getMealPlan();
            
            for (const day in mealPlan) {
                for (const mealType in mealPlan[day]) {
                    const recipeId = mealPlan[day][mealType];
                    if (recipeId) {
                        const recipe = await recipeLoader.getRecipeById(recipeId);
                        if (recipe && recipe.ingredients) {
                            recipe.ingredients.forEach(ingredient => {
                                // Check if ingredient already exists in the list
                                const existingIngredient = ingredients.find(i => i.name === ingredient.name);
                                if (existingIngredient) {
                                    // In a real app, we would convert and aggregate quantities
                                    existingIngredient.recipes.push(`${recipe.title} (${day} ${mealType})`);
                                } else {
                                    ingredients.push({
                                        name: ingredient.name,
                                        amount: ingredient.amount,
                                        recipes: [`${recipe.title} (${day} ${mealType})`]
                                    });
                                }
                            });
                        }
                    }
                }
            }
            
            // Generate HTML for the shopping list
            let html = '';
            
            if (ingredients.length === 0) {
                html = '<p>No ingredients needed - add recipes to your meal plan first.</p>';
            } else {
                html = `
                    <div class="mb-3">
                        <p>Here's your shopping list for the week:</p>
                    </div>
                    <ul class="list-group mb-3">
                `;
                
                ingredients.forEach(ingredient => {
                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${ingredient.name}</strong> - ${ingredient.amount}
                                <div class="small text-muted">Used in: ${ingredient.recipes.join(', ')}</div>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="" id="check-${ingredient.name.replace(/\s+/g, '-')}">
                            </div>
                        </li>
                    `;
                });
                
                html += '</ul>';
            }
            
            // Update the modal content
            shoppingListContent.innerHTML = html;
            
            // Show the modal
            shoppingListModal.show();
        } catch (error) {
            console.error('Error generating shopping list:', error);
            showError('Failed to generate shopping list. Please try again.');
        }
        
        hideLoading();
    }
    
    // Print meal plan
    function printMealPlan() {
        window.print();
    }
    
    // Print shopping list
    function printShoppingList() {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Generate HTML for the shopping list
        let html = `
            <html>
            <head>
                <title>Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    ul { list-style-type: none; padding: 0; }
                    li { padding: 8px 0; border-bottom: 1px solid #eee; }
                    .small { font-size: 0.85em; color: #666; }
                </style>
            </head>
            <body>
                <h1>Shopping List</h1>
        `;
        
        // Add ingredients
        html += '<ul>';
        
        const listItems = shoppingListContent.querySelectorAll('.list-group-item');
        listItems.forEach(item => {
            const nameEl = item.querySelector('strong');
            const amountText = nameEl.nextSibling.textContent;
            const usedInEl = item.querySelector('.small');
            
            html += `
                <li>
                    <strong>${nameEl.textContent}</strong>${amountText}
                    <div class="small">${usedInEl.textContent}</div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </body>
            </html>
        `;
        
        // Write HTML to the new window
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Print after the document has loaded
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
    }
    
    // Clear meal plan
    async function clearMealPlan() {
        if (confirm('Are you sure you want to clear the entire meal plan?')) {
            showLoading();
            
            try {
                // Reset meal plan
                const emptyPlan = {
                    monday: { breakfast: null, lunch: null, dinner: null },
                    tuesday: { breakfast: null, lunch: null, dinner: null },
                    wednesday: { breakfast: null, lunch: null, dinner: null },
                    thursday: { breakfast: null, lunch: null, dinner: null },
                    friday: { breakfast: null, lunch: null, dinner: null },
                    saturday: { breakfast: null, lunch: null, dinner: null },
                    sunday: { breakfast: null, lunch: null, dinner: null }
                };
                
                // In a real app, we would call an API to save this
                localStorage.setItem('weeklyMealPlan', JSON.stringify(emptyPlan));
                
                // Reload the page to refresh all data
                window.location.reload();
            } catch (error) {
                console.error('Error clearing meal plan:', error);
                showError('Failed to clear meal plan. Please try again.');
                hideLoading();
            }
        }
    }
    
    // Show loading indicator
    function showLoading() {
        loadingIndicator.style.display = 'flex';
    }
    
    // Hide loading indicator
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }
    
    // Show error message
    function showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="error-message">${message}</div>
            <button class="error-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(errorToast);
        
        // Show toast
        setTimeout(() => {
            errorToast.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        const timeout = setTimeout(() => {
            removeError(errorToast);
        }, 5000);
        
        // Close button
        errorToast.querySelector('.error-close').addEventListener('click', () => {
            clearTimeout(timeout);
            removeError(errorToast);
        });
    }
    
    // Remove error toast
    function removeError(errorToast) {
        errorToast.classList.remove('show');
        errorToast.classList.add('hide');
        setTimeout(() => {
            errorToast.remove();
        }, 300);
    }
});

// Add CSS for loading indicator and error toast
document.head.insertAdjacentHTML('beforeend', `
<style>
.loading-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.error-toast {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #EF4444;
    border-radius: 8px;
    max-width: 350px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
}

.error-toast.show {
    opacity: 1;
    transform: translateY(0);
}

.error-toast.hide {
    opacity: 0;
    transform: translateY(20px);
}

.error-icon {
    margin-right: 12px;
    font-size: 20px;
    color: #EF4444;
}

.error-message {
    flex: 1;
    font-size: 14px;
}

.error-close {
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    margin-left: 10px;
}
</style>
`); 