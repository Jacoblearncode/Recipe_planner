# Spoonacular API Integration Documentation

## Overview

This document provides comprehensive information about the integration of the Spoonacular Food API into the Recipe Planner application. It serves as a reference for developers working on the project and includes details about the API endpoints, implementation patterns, and best practices.

## API Key Management

The Spoonacular API key is currently stored in the `apiService.js` file:

```javascript
this.apiKey = 'e6ee9bb53ed947e8a07c946e51631141';
```

**Important**: For production deployment, this key should be moved to environment variables or a secure configuration file to prevent exposure in version control.

## API Service Architecture

### Core Files

1. **apiService.js**: Handles direct communication with the Spoonacular API
   - Manages API requests and responses
   - Handles error cases and status codes
   - Converts API data to application format

2. **dataService.js**: Provides a unified interface for data access
   - Abstracts the data source (local JSON vs API)
   - Implements caching for API responses
   - Provides fallback to local data when API fails

### Request Flow

1. Component calls `dataService` method (e.g., `searchRecipes`)
2. `dataService` checks if API is enabled
3. If enabled, `dataService` calls appropriate `apiService` method
4. `apiService` makes HTTP request to Spoonacular API
5. Response is processed and converted to application format
6. Converted data is returned to the component

## Available API Methods

### Search Recipes

Searches for recipes by query text:

```javascript
// Example usage
const results = await dataService.searchRecipes('pasta');
```

### Search by Ingredients

Finds recipes that use specified ingredients:

```javascript
// Example usage
const results = await dataService.searchByIngredients(['chicken', 'rice', 'broccoli']);
```

### Get Random Recipes

Fetches random recipes, optionally filtered by tags:

```javascript
// Example usage
const results = await dataService.getRandomRecipes(5, ['vegetarian', 'dessert']);
```

### Get Recipe Details

Retrieves detailed information about a specific recipe:

```javascript
// Example usage
const recipe = await dataService.getRecipeById('api-123456');
```

## Data Format

### Spoonacular Recipe Format

The Spoonacular API returns data in this general format:

```json
{
  "id": 123456,
  "title": "Recipe Title",
  "image": "https://example.com/image.jpg",
  "readyInMinutes": 45,
  "servings": 4,
  "vegetarian": true,
  "vegan": false,
  "glutenFree": true,
  "dairyFree": false,
  "dishTypes": ["main course", "dinner"],
  "cuisines": ["italian"],
  "extendedIngredients": [
    {
      "id": 1001,
      "name": "butter",
      "amount": 2,
      "unit": "tablespoons"
    }
  ],
  "analyzedInstructions": [
    {
      "steps": [
        {
          "number": 1,
          "step": "Preheat the oven to 350°F."
        }
      ]
    }
  ],
  "nutrition": {
    "nutrients": [
      {
        "name": "Calories",
        "amount": 320
      }
    ]
  }
}
```

### Application Recipe Format

The application uses this standardized format:

```json
{
  "id": "api-123456",
  "title": "Recipe Title",
  "image": "https://example.com/image.jpg",
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "medium",
  "servings": 4,
  "tags": ["main course", "dinner", "italian"],
  "mealType": ["dinner"],
  "cuisine": "italian",
  "dietaryRestrictions": ["vegetarian", "gluten-free"],
  "ingredients": [
    {
      "name": "butter",
      "amount": "2 tablespoons"
    }
  ],
  "instructions": [
    "Preheat the oven to 350°F."
  ],
  "nutritionInfo": {
    "calories": 320,
    "protein": "12g",
    "carbs": "40g",
    "fat": "10g"
  }
}
```

## Error Handling

The API service implements comprehensive error handling:

1. **Network Errors**: Caught and reported with appropriate messages
2. **API Errors**: Processed based on HTTP status codes
3. **Rate Limiting**: Detected and handled with user feedback
4. **Data Format Errors**: Gracefully handled with fallbacks

Example error handling:

```javascript
try {
    const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
} catch (error) {
    console.error('API Request Error:', error);
    throw error;
}
```

## API Toggle

The application includes a feature to toggle between API and local data:

```javascript
// Enable API
dataService.setUseApi(true);

// Disable API (use local data only)
dataService.setUseApi(false);

// Check if API is enabled
const isApiEnabled = dataService.isApiEnabled();
```

This is useful for:
- Development without internet connection
- Preserving API quota during testing
- Fallback in case of API outage

## Testing the API

A dedicated test page is available at `/pages/api-test.html` that allows:
- Testing all API endpoints with various parameters
- Viewing raw API responses
- Toggling between API and local data
- Debugging API interactions

## Rate Limiting Considerations

The free tier of Spoonacular API has the following limitations:
- 150 points per day
- Different endpoints consume different points
- Complex search with nutrition data costs more points

To manage these limitations:
1. Implement aggressive caching
2. Use local data during development
3. Monitor API usage
4. Implement request throttling

## Security Considerations

1. **API Key Protection**:
   - Move API key to environment variables for production
   - Never expose API key in client-side code in production

2. **Error Handling**:
   - Sanitize error messages shown to users
   - Log detailed errors for debugging

3. **Data Validation**:
   - Validate all data received from the API
   - Sanitize user inputs before sending to API

## References

- [Spoonacular API Documentation](https://spoonacular.com/food-api/docs)
- [REST API Best Practices](https://restfulapi.net/)
- [MDN HTTP Status Codes Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) 