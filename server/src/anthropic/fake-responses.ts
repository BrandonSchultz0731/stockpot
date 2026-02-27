import type { MessageType } from './anthropic.service';

const FAKE_MEAL_PLAN = JSON.stringify({
  meals: [
    // Monday
    { dayOfWeek: 0, mealType: 'Breakfast', title: 'Avocado Toast with Poached Eggs', description: 'Crispy sourdough topped with smashed avocado and perfectly poached eggs.', prepTimeMinutes: 5, cookTimeMinutes: 10, totalTimeMinutes: 15, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Sourdough bread', quantity: 2, unit: 'slice', inPantry: true }, { name: 'Avocado', quantity: 1, unit: 'count', inPantry: true }, { name: 'Eggs', quantity: 2, unit: 'count', inPantry: true }, { name: 'Red pepper flakes', quantity: 0.25, unit: 'tsp', inPantry: true }, { name: 'Salt', quantity: 0.5, unit: 'tsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Toast the sourdough bread until golden.', duration: 3 }, { stepNumber: 2, instruction: 'Mash the avocado with salt and red pepper flakes.', duration: 2 }, { stepNumber: 3, instruction: 'Poach eggs in simmering water for 3-4 minutes.', duration: 4 }, { stepNumber: 4, instruction: 'Spread avocado on toast and top with poached eggs.' }], tags: ['quick', 'high-protein'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 380, protein: 16, carbs: 32, fat: 22 } },
    { dayOfWeek: 0, mealType: 'Lunch', title: 'Chicken Caesar Salad', description: 'Classic Caesar salad with grilled chicken, crunchy croutons, and parmesan.', prepTimeMinutes: 10, cookTimeMinutes: 15, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Chicken breast', quantity: 2, unit: 'count', inPantry: true }, { name: 'Romaine lettuce', quantity: 1, unit: 'head', inPantry: true }, { name: 'Parmesan cheese', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Croutons', quantity: 0.5, unit: 'cup', inPantry: false }, { name: 'Caesar dressing', quantity: 3, unit: 'tbsp', inPantry: false }], steps: [{ stepNumber: 1, instruction: 'Season chicken with salt and pepper, grill 6-7 minutes per side.', duration: 15 }, { stepNumber: 2, instruction: 'Chop romaine lettuce and place in a large bowl.' }, { stepNumber: 3, instruction: 'Slice grilled chicken and add to salad.' }, { stepNumber: 4, instruction: 'Top with croutons, parmesan, and dressing. Toss to combine.' }], tags: ['high-protein', 'salad'], dietaryFlags: [], nutrition: { calories: 450, protein: 42, carbs: 18, fat: 24 } },
    { dayOfWeek: 0, mealType: 'Dinner', title: 'Spaghetti Bolognese', description: 'Hearty meat sauce simmered with tomatoes and herbs over al dente spaghetti.', prepTimeMinutes: 10, cookTimeMinutes: 35, totalTimeMinutes: 45, servings: 2, difficulty: 'Easy', cuisine: 'Italian', ingredients: [{ name: 'Spaghetti', quantity: 8, unit: 'oz', inPantry: true }, { name: 'Ground beef', quantity: 1, unit: 'lb', inPantry: true }, { name: 'Crushed tomatoes', quantity: 1, unit: 'can', inPantry: true }, { name: 'Onion', quantity: 1, unit: 'count', inPantry: true }, { name: 'Garlic', quantity: 3, unit: 'clove', inPantry: true }, { name: 'Olive oil', quantity: 2, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Sauté diced onion and garlic in olive oil until soft.', duration: 5 }, { stepNumber: 2, instruction: 'Add ground beef and cook until browned.', duration: 8 }, { stepNumber: 3, instruction: 'Add crushed tomatoes, season with salt and pepper. Simmer 20 minutes.', duration: 20 }, { stepNumber: 4, instruction: 'Cook spaghetti according to package directions. Serve sauce over pasta.', duration: 10 }], tags: ['comfort-food', 'family-friendly'], dietaryFlags: [], nutrition: { calories: 620, protein: 35, carbs: 68, fat: 22 } },
    // Tuesday
    { dayOfWeek: 1, mealType: 'Breakfast', title: 'Greek Yogurt Parfait', description: 'Layers of creamy Greek yogurt, granola, and fresh berries.', prepTimeMinutes: 5, cookTimeMinutes: 0, totalTimeMinutes: 5, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Greek yogurt', quantity: 2, unit: 'cup', inPantry: true }, { name: 'Granola', quantity: 0.5, unit: 'cup', inPantry: true }, { name: 'Mixed berries', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Honey', quantity: 1, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Layer yogurt, granola, and berries in glasses.' }, { stepNumber: 2, instruction: 'Drizzle with honey and serve.' }], tags: ['quick', 'no-cook'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 320, protein: 20, carbs: 42, fat: 8 } },
    { dayOfWeek: 1, mealType: 'Lunch', title: 'Turkey Club Wrap', description: 'Sliced turkey, bacon, lettuce, and tomato wrapped in a flour tortilla.', prepTimeMinutes: 10, cookTimeMinutes: 5, totalTimeMinutes: 15, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Flour tortillas', quantity: 2, unit: 'count', inPantry: true }, { name: 'Turkey deli slices', quantity: 6, unit: 'oz', inPantry: false }, { name: 'Bacon', quantity: 4, unit: 'slice', inPantry: true }, { name: 'Lettuce', quantity: 2, unit: 'count', inPantry: true }, { name: 'Tomato', quantity: 1, unit: 'count', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Cook bacon until crispy.', duration: 5 }, { stepNumber: 2, instruction: 'Layer turkey, bacon, lettuce, and tomato on tortilla.' }, { stepNumber: 3, instruction: 'Roll tightly and slice in half.' }], tags: ['quick', 'lunch'], dietaryFlags: [], nutrition: { calories: 420, protein: 30, carbs: 35, fat: 18 } },
    { dayOfWeek: 1, mealType: 'Dinner', title: 'Teriyaki Salmon with Rice', description: 'Pan-seared salmon glazed with homemade teriyaki sauce served over steamed rice.', prepTimeMinutes: 10, cookTimeMinutes: 20, totalTimeMinutes: 30, servings: 2, difficulty: 'Easy', cuisine: 'Japanese', ingredients: [{ name: 'Salmon fillet', quantity: 2, unit: 'count', inPantry: true }, { name: 'Soy sauce', quantity: 3, unit: 'tbsp', inPantry: true }, { name: 'Brown sugar', quantity: 2, unit: 'tbsp', inPantry: true }, { name: 'Rice', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Ginger', quantity: 1, unit: 'tsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Cook rice according to package directions.', duration: 15 }, { stepNumber: 2, instruction: 'Mix soy sauce, brown sugar, and ginger for teriyaki sauce.' }, { stepNumber: 3, instruction: 'Pan-sear salmon 4 minutes per side, glaze with sauce.', duration: 10 }, { stepNumber: 4, instruction: 'Serve salmon over rice with extra sauce.' }], tags: ['seafood', 'asian'], dietaryFlags: ['Pescatarian'], nutrition: { calories: 520, protein: 38, carbs: 52, fat: 16 } },
    // Wednesday
    { dayOfWeek: 2, mealType: 'Breakfast', title: 'Banana Pancakes', description: 'Fluffy pancakes made with ripe bananas and a touch of cinnamon.', prepTimeMinutes: 5, cookTimeMinutes: 15, totalTimeMinutes: 20, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Banana', quantity: 2, unit: 'count', inPantry: true }, { name: 'Eggs', quantity: 2, unit: 'count', inPantry: true }, { name: 'Flour', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Milk', quantity: 0.5, unit: 'cup', inPantry: true }, { name: 'Cinnamon', quantity: 0.5, unit: 'tsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Mash bananas and mix with eggs, flour, milk, and cinnamon.' }, { stepNumber: 2, instruction: 'Cook pancakes on a greased skillet over medium heat, 2-3 minutes per side.', duration: 15 }], tags: ['sweet', 'family-friendly'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 350, protein: 12, carbs: 58, fat: 8 } },
    { dayOfWeek: 2, mealType: 'Lunch', title: 'Tomato Basil Soup with Grilled Cheese', description: 'Creamy tomato soup paired with a crispy grilled cheese sandwich.', prepTimeMinutes: 10, cookTimeMinutes: 25, totalTimeMinutes: 35, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Crushed tomatoes', quantity: 1, unit: 'can', inPantry: true }, { name: 'Onion', quantity: 1, unit: 'count', inPantry: true }, { name: 'Heavy cream', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Bread', quantity: 4, unit: 'slice', inPantry: true }, { name: 'Cheddar cheese', quantity: 4, unit: 'slice', inPantry: true }, { name: 'Butter', quantity: 2, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Sauté onion in butter, add tomatoes, simmer 15 minutes.', duration: 18 }, { stepNumber: 2, instruction: 'Blend soup and stir in cream.' }, { stepNumber: 3, instruction: 'Make grilled cheese sandwiches in a skillet.', duration: 6 }], tags: ['comfort-food', 'soup'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 480, protein: 18, carbs: 42, fat: 28 } },
    { dayOfWeek: 2, mealType: 'Dinner', title: 'Chicken Stir-Fry', description: 'Quick chicken and vegetable stir-fry in a savory soy-ginger sauce.', prepTimeMinutes: 15, cookTimeMinutes: 10, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'Chinese', ingredients: [{ name: 'Chicken breast', quantity: 1, unit: 'lb', inPantry: true }, { name: 'Broccoli', quantity: 2, unit: 'cup', inPantry: true }, { name: 'Bell pepper', quantity: 1, unit: 'count', inPantry: true }, { name: 'Soy sauce', quantity: 3, unit: 'tbsp', inPantry: true }, { name: 'Sesame oil', quantity: 1, unit: 'tbsp', inPantry: true }, { name: 'Rice', quantity: 1, unit: 'cup', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Cook rice according to package directions.', duration: 15 }, { stepNumber: 2, instruction: 'Cut chicken into strips and stir-fry in sesame oil until cooked.', duration: 6 }, { stepNumber: 3, instruction: 'Add vegetables and soy sauce, cook 3-4 minutes more.', duration: 4 }, { stepNumber: 4, instruction: 'Serve over rice.' }], tags: ['quick', 'high-protein'], dietaryFlags: [], nutrition: { calories: 480, protein: 40, carbs: 48, fat: 12 } },
    // Thursday
    { dayOfWeek: 3, mealType: 'Breakfast', title: 'Spinach and Feta Omelette', description: 'Fluffy omelette filled with fresh spinach and crumbled feta cheese.', prepTimeMinutes: 5, cookTimeMinutes: 8, totalTimeMinutes: 13, servings: 2, difficulty: 'Easy', cuisine: 'Mediterranean', ingredients: [{ name: 'Eggs', quantity: 4, unit: 'count', inPantry: true }, { name: 'Spinach', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Feta cheese', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Butter', quantity: 1, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Whisk eggs with salt and pepper.' }, { stepNumber: 2, instruction: 'Melt butter in a skillet, pour in eggs.', duration: 2 }, { stepNumber: 3, instruction: 'Add spinach and feta, fold and cook until set.', duration: 4 }], tags: ['quick', 'high-protein'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 310, protein: 24, carbs: 4, fat: 22 } },
    { dayOfWeek: 3, mealType: 'Lunch', title: 'Black Bean Tacos', description: 'Seasoned black beans with fresh salsa, avocado, and lime in corn tortillas.', prepTimeMinutes: 10, cookTimeMinutes: 10, totalTimeMinutes: 20, servings: 2, difficulty: 'Easy', cuisine: 'Mexican', ingredients: [{ name: 'Black beans', quantity: 1, unit: 'can', inPantry: true }, { name: 'Corn tortillas', quantity: 6, unit: 'count', inPantry: true }, { name: 'Avocado', quantity: 1, unit: 'count', inPantry: true }, { name: 'Tomato', quantity: 1, unit: 'count', inPantry: true }, { name: 'Lime', quantity: 1, unit: 'count', inPantry: true }, { name: 'Cumin', quantity: 1, unit: 'tsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Heat and season black beans with cumin and salt.', duration: 5 }, { stepNumber: 2, instruction: 'Warm tortillas in a dry skillet.', duration: 3 }, { stepNumber: 3, instruction: 'Dice tomato and avocado for topping.' }, { stepNumber: 4, instruction: 'Assemble tacos with beans, toppings, and a squeeze of lime.' }], tags: ['vegetarian', 'quick'], dietaryFlags: ['Vegetarian', 'Vegan'], nutrition: { calories: 390, protein: 14, carbs: 56, fat: 14 } },
    { dayOfWeek: 3, mealType: 'Dinner', title: 'Baked Lemon Herb Chicken Thighs', description: 'Juicy chicken thighs roasted with lemon, garlic, and fresh herbs.', prepTimeMinutes: 10, cookTimeMinutes: 35, totalTimeMinutes: 45, servings: 2, difficulty: 'Easy', cuisine: 'Mediterranean', ingredients: [{ name: 'Chicken thighs', quantity: 4, unit: 'count', inPantry: true }, { name: 'Lemon', quantity: 1, unit: 'count', inPantry: true }, { name: 'Garlic', quantity: 4, unit: 'clove', inPantry: true }, { name: 'Olive oil', quantity: 2, unit: 'tbsp', inPantry: true }, { name: 'Thyme', quantity: 1, unit: 'tsp', inPantry: true }, { name: 'Roasted potatoes', quantity: 1, unit: 'lb', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Preheat oven to 425°F.' }, { stepNumber: 2, instruction: 'Toss chicken with olive oil, lemon juice, garlic, and thyme.' }, { stepNumber: 3, instruction: 'Arrange on a baking sheet with potatoes.', duration: 5 }, { stepNumber: 4, instruction: 'Roast 30-35 minutes until golden and cooked through.', duration: 35 }], tags: ['one-pan', 'meal-prep'], dietaryFlags: [], nutrition: { calories: 550, protein: 38, carbs: 30, fat: 30 } },
    // Friday
    { dayOfWeek: 4, mealType: 'Breakfast', title: 'Overnight Oats', description: 'Creamy overnight oats with chia seeds, almond butter, and maple syrup.', prepTimeMinutes: 5, cookTimeMinutes: 0, totalTimeMinutes: 5, servings: 2, difficulty: 'Easy', cuisine: 'American', ingredients: [{ name: 'Rolled oats', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Milk', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Chia seeds', quantity: 2, unit: 'tbsp', inPantry: true }, { name: 'Almond butter', quantity: 2, unit: 'tbsp', inPantry: true }, { name: 'Maple syrup', quantity: 1, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Combine oats, milk, and chia seeds in a jar.' }, { stepNumber: 2, instruction: 'Refrigerate overnight.' }, { stepNumber: 3, instruction: 'Top with almond butter and maple syrup before serving.' }], tags: ['meal-prep', 'no-cook'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 380, protein: 14, carbs: 48, fat: 16 } },
    { dayOfWeek: 4, mealType: 'Lunch', title: 'Mediterranean Quinoa Bowl', description: 'Quinoa topped with cucumber, tomatoes, olives, feta, and lemon vinaigrette.', prepTimeMinutes: 10, cookTimeMinutes: 15, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'Mediterranean', ingredients: [{ name: 'Quinoa', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Cucumber', quantity: 1, unit: 'count', inPantry: true }, { name: 'Cherry tomatoes', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Kalamata olives', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Feta cheese', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Lemon', quantity: 1, unit: 'count', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Cook quinoa according to package directions.', duration: 15 }, { stepNumber: 2, instruction: 'Dice cucumber and halve tomatoes.' }, { stepNumber: 3, instruction: 'Assemble bowls with quinoa, vegetables, olives, and feta.' }, { stepNumber: 4, instruction: 'Drizzle with lemon juice and olive oil.' }], tags: ['grain-bowl', 'healthy'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 420, protein: 16, carbs: 52, fat: 18 } },
    { dayOfWeek: 4, mealType: 'Dinner', title: 'Fish Tacos with Mango Salsa', description: 'Crispy seasoned fish in warm tortillas topped with fresh mango salsa.', prepTimeMinutes: 15, cookTimeMinutes: 10, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'Mexican', ingredients: [{ name: 'White fish fillet', quantity: 1, unit: 'lb', inPantry: true }, { name: 'Corn tortillas', quantity: 6, unit: 'count', inPantry: true }, { name: 'Mango', quantity: 1, unit: 'count', inPantry: false }, { name: 'Red onion', quantity: 0.25, unit: 'count', inPantry: true }, { name: 'Cilantro', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Lime', quantity: 1, unit: 'count', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Season fish with cumin, paprika, salt, and pepper.' }, { stepNumber: 2, instruction: 'Pan-fry fish 3-4 minutes per side.', duration: 8 }, { stepNumber: 3, instruction: 'Dice mango, red onion, and cilantro. Mix with lime juice for salsa.' }, { stepNumber: 4, instruction: 'Serve fish in warm tortillas with mango salsa.' }], tags: ['seafood', 'tacos'], dietaryFlags: ['Pescatarian'], nutrition: { calories: 440, protein: 32, carbs: 50, fat: 12 } },
    // Saturday
    { dayOfWeek: 5, mealType: 'Breakfast', title: 'Breakfast Burrito', description: 'Scrambled eggs, black beans, cheese, and salsa wrapped in a warm tortilla.', prepTimeMinutes: 5, cookTimeMinutes: 10, totalTimeMinutes: 15, servings: 2, difficulty: 'Easy', cuisine: 'Mexican', ingredients: [{ name: 'Flour tortillas', quantity: 2, unit: 'count', inPantry: true }, { name: 'Eggs', quantity: 4, unit: 'count', inPantry: true }, { name: 'Black beans', quantity: 0.5, unit: 'cup', inPantry: true }, { name: 'Cheddar cheese', quantity: 0.5, unit: 'cup', inPantry: true }, { name: 'Salsa', quantity: 0.25, unit: 'cup', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Scramble eggs in a skillet.', duration: 5 }, { stepNumber: 2, instruction: 'Warm tortillas and black beans.' }, { stepNumber: 3, instruction: 'Fill tortillas with eggs, beans, cheese, and salsa. Roll up and serve.' }], tags: ['quick', 'high-protein'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 450, protein: 28, carbs: 38, fat: 20 } },
    { dayOfWeek: 5, mealType: 'Lunch', title: 'Caprese Panini', description: 'Pressed sandwich with fresh mozzarella, tomato, basil, and balsamic glaze.', prepTimeMinutes: 5, cookTimeMinutes: 8, totalTimeMinutes: 13, servings: 2, difficulty: 'Easy', cuisine: 'Italian', ingredients: [{ name: 'Ciabatta bread', quantity: 2, unit: 'count', inPantry: false }, { name: 'Fresh mozzarella', quantity: 8, unit: 'oz', inPantry: false }, { name: 'Tomato', quantity: 1, unit: 'count', inPantry: true }, { name: 'Fresh basil', quantity: 6, unit: 'count', inPantry: false }, { name: 'Balsamic glaze', quantity: 1, unit: 'tbsp', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Slice ciabatta, layer with mozzarella, tomato, and basil.' }, { stepNumber: 2, instruction: 'Drizzle with balsamic glaze.' }, { stepNumber: 3, instruction: 'Press in a panini press or skillet until golden and cheese melts.', duration: 8 }], tags: ['quick', 'italian'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 410, protein: 22, carbs: 36, fat: 20 } },
    { dayOfWeek: 5, mealType: 'Dinner', title: 'Beef Tacos', description: 'Seasoned ground beef tacos with all the classic toppings.', prepTimeMinutes: 10, cookTimeMinutes: 15, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'Mexican', ingredients: [{ name: 'Ground beef', quantity: 1, unit: 'lb', inPantry: true }, { name: 'Taco shells', quantity: 6, unit: 'count', inPantry: true }, { name: 'Lettuce', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Cheddar cheese', quantity: 0.5, unit: 'cup', inPantry: true }, { name: 'Sour cream', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Taco seasoning', quantity: 1, unit: 'package', inPantry: true }], steps: [{ stepNumber: 1, instruction: 'Brown ground beef and drain fat.', duration: 8 }, { stepNumber: 2, instruction: 'Add taco seasoning and water, simmer 5 minutes.', duration: 5 }, { stepNumber: 3, instruction: 'Warm taco shells in the oven.', duration: 3 }, { stepNumber: 4, instruction: 'Assemble tacos with meat and toppings.' }], tags: ['family-friendly', 'quick'], dietaryFlags: [], nutrition: { calories: 520, protein: 32, carbs: 36, fat: 28 } },
    // Sunday
    { dayOfWeek: 6, mealType: 'Breakfast', title: 'French Toast', description: 'Golden French toast with butter, maple syrup, and fresh strawberries.', prepTimeMinutes: 5, cookTimeMinutes: 15, totalTimeMinutes: 20, servings: 2, difficulty: 'Easy', cuisine: 'French', ingredients: [{ name: 'Bread', quantity: 4, unit: 'slice', inPantry: true }, { name: 'Eggs', quantity: 2, unit: 'count', inPantry: true }, { name: 'Milk', quantity: 0.25, unit: 'cup', inPantry: true }, { name: 'Cinnamon', quantity: 0.5, unit: 'tsp', inPantry: true }, { name: 'Maple syrup', quantity: 2, unit: 'tbsp', inPantry: true }, { name: 'Strawberries', quantity: 1, unit: 'cup', inPantry: false }], steps: [{ stepNumber: 1, instruction: 'Whisk eggs, milk, and cinnamon in a shallow bowl.' }, { stepNumber: 2, instruction: 'Dip bread slices in egg mixture.' }, { stepNumber: 3, instruction: 'Cook on a buttered skillet until golden, about 3 minutes per side.', duration: 12 }, { stepNumber: 4, instruction: 'Serve with maple syrup and sliced strawberries.' }], tags: ['sweet', 'brunch'], dietaryFlags: ['Vegetarian'], nutrition: { calories: 380, protein: 12, carbs: 52, fat: 14 } },
    { dayOfWeek: 6, mealType: 'Lunch', title: 'Chicken Quesadilla', description: 'Crispy flour tortilla filled with seasoned chicken, peppers, and melted cheese.', prepTimeMinutes: 10, cookTimeMinutes: 10, totalTimeMinutes: 20, servings: 2, difficulty: 'Easy', cuisine: 'Mexican', ingredients: [{ name: 'Flour tortillas', quantity: 2, unit: 'count', inPantry: true }, { name: 'Chicken breast', quantity: 1, unit: 'count', inPantry: true }, { name: 'Bell pepper', quantity: 1, unit: 'count', inPantry: true }, { name: 'Cheddar cheese', quantity: 1, unit: 'cup', inPantry: true }, { name: 'Sour cream', quantity: 2, unit: 'tbsp', inPantry: false }], steps: [{ stepNumber: 1, instruction: 'Cook and slice chicken breast.', duration: 8 }, { stepNumber: 2, instruction: 'Layer chicken, peppers, and cheese on half the tortilla.' }, { stepNumber: 3, instruction: 'Fold and cook in a skillet until golden and cheese melts, about 3 minutes per side.', duration: 6 }], tags: ['quick', 'kid-friendly'], dietaryFlags: [], nutrition: { calories: 480, protein: 36, carbs: 32, fat: 22 } },
    { dayOfWeek: 6, mealType: 'Dinner', title: 'Garlic Butter Shrimp Pasta', description: 'Succulent shrimp tossed with linguine in a garlic butter and white wine sauce.', prepTimeMinutes: 10, cookTimeMinutes: 15, totalTimeMinutes: 25, servings: 2, difficulty: 'Easy', cuisine: 'Italian', ingredients: [{ name: 'Linguine', quantity: 8, unit: 'oz', inPantry: true }, { name: 'Shrimp', quantity: 1, unit: 'lb', inPantry: true }, { name: 'Garlic', quantity: 4, unit: 'clove', inPantry: true }, { name: 'Butter', quantity: 3, unit: 'tbsp', inPantry: true }, { name: 'White wine', quantity: 0.25, unit: 'cup', inPantry: false }, { name: 'Parsley', quantity: 2, unit: 'tbsp', inPantry: false }], steps: [{ stepNumber: 1, instruction: 'Cook linguine according to package directions.', duration: 10 }, { stepNumber: 2, instruction: 'Sauté garlic in butter for 1 minute.', duration: 1 }, { stepNumber: 3, instruction: 'Add shrimp and cook until pink, about 3 minutes per side.', duration: 6 }, { stepNumber: 4, instruction: 'Deglaze with white wine, toss with pasta and parsley.' }], tags: ['seafood', 'date-night'], dietaryFlags: ['Pescatarian'], nutrition: { calories: 560, protein: 36, carbs: 58, fat: 18 } },
  ],
});

const FAKE_MEAL_SWAP = JSON.stringify({
  title: 'Honey Garlic Chicken',
  description: 'Tender chicken thighs glazed with a sweet and savory honey garlic sauce.',
  prepTimeMinutes: 10,
  cookTimeMinutes: 25,
  totalTimeMinutes: 35,
  servings: 2,
  difficulty: 'Easy',
  cuisine: 'Asian',
  ingredients: [
    { name: 'Chicken thighs', quantity: 4, unit: 'count', inPantry: true },
    { name: 'Honey', quantity: 3, unit: 'tbsp', inPantry: true },
    { name: 'Soy sauce', quantity: 2, unit: 'tbsp', inPantry: true },
    { name: 'Garlic', quantity: 4, unit: 'clove', inPantry: true },
    { name: 'Butter', quantity: 1, unit: 'tbsp', inPantry: true },
    { name: 'Green beans', quantity: 2, unit: 'cup', inPantry: true },
  ],
  steps: [
    { stepNumber: 1, instruction: 'Season chicken with salt and pepper. Sear in a hot skillet until golden.', duration: 8 },
    { stepNumber: 2, instruction: 'Mix honey, soy sauce, and minced garlic.' },
    { stepNumber: 3, instruction: 'Pour sauce over chicken, cover and simmer until cooked through.', duration: 15 },
    { stepNumber: 4, instruction: 'Steam green beans and serve alongside chicken.', duration: 5 },
  ],
  tags: ['sweet-savory', 'one-pan'],
  dietaryFlags: [],
  nutrition: { calories: 480, protein: 36, carbs: 28, fat: 24 },
});

const FAKE_RECIPE_GENERATION = JSON.stringify([
  {
    title: 'Lemon Herb Grilled Chicken',
    description: 'Juicy grilled chicken marinated in lemon, herbs, and olive oil.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    totalTimeMinutes: 35,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Chicken breast', quantity: 4, unit: 'count', inPantry: true },
      { name: 'Lemon', quantity: 2, unit: 'count', inPantry: true },
      { name: 'Olive oil', quantity: 3, unit: 'tbsp', inPantry: true },
      { name: 'Garlic', quantity: 3, unit: 'clove', inPantry: true },
      { name: 'Fresh rosemary', quantity: 2, unit: 'tbsp', inPantry: false },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Combine lemon juice, olive oil, garlic, and rosemary for marinade.' },
      { stepNumber: 2, instruction: 'Marinate chicken for at least 30 minutes.', duration: 30 },
      { stepNumber: 3, instruction: 'Grill chicken 6-7 minutes per side until cooked through.', duration: 14 },
    ],
    tags: ['grilled', 'high-protein', 'healthy'],
    dietaryFlags: [],
    nutrition: { calories: 320, protein: 42, carbs: 4, fat: 16 },
  },
]);

const FAKE_SHELF_LIFE = JSON.stringify({
  Fridge: 7,
  Freezer: 180,
  Pantry: 3,
  category: 'Dairy & Eggs',
});

const FAKE_FOOD_CATEGORY = 'Dairy & Eggs';

const FAKE_RECEIPT_SCAN = JSON.stringify([
  { name: 'Organic Whole Milk', quantity: 1, unit: 'gallon', storageLocation: 'Fridge', estimatedShelfLife: { Fridge: 10 } },
  { name: 'Chicken Breast', quantity: 2, unit: 'lb', storageLocation: 'Fridge', estimatedShelfLife: { Fridge: 3, Freezer: 270 } },
  { name: 'Bananas', quantity: 1, unit: 'bunch', storageLocation: 'Pantry', estimatedShelfLife: { Pantry: 5, Fridge: 8 } },
]);

const FAKE_INGREDIENT_RESOLUTION = JSON.stringify({});

const FAKE_COOK_DEDUCTION = JSON.stringify({
  deductions: [
    {
      recipeIngredientName: 'Chicken breast',
      pantryItemId: 'fake-pantry-1',
      pantryItemName: 'Chicken Breast',
      currentQuantity: 4,
      currentUnit: 'count',
      deductQuantity: 2,
      deductUnit: 'count',
      notes: 'Direct match',
    },
    {
      recipeIngredientName: 'Olive oil',
      pantryItemId: 'fake-pantry-2',
      pantryItemName: 'Olive Oil',
      currentQuantity: 1,
      currentUnit: 'bottle',
      deductQuantity: 0.25,
      deductUnit: 'bottle',
      notes: '2 tbsp ≈ ¼ bottle',
    },
    {
      recipeIngredientName: 'Garlic',
      pantryItemId: 'fake-pantry-3',
      pantryItemName: 'Garlic',
      currentQuantity: 1,
      currentUnit: 'head',
      deductQuantity: 0.25,
      deductUnit: 'head',
      notes: '3 cloves ≈ ¼ head',
    },
    {
      recipeIngredientName: 'Fresh rosemary',
      pantryItemId: null,
      pantryItemName: 'Fresh Rosemary',
      currentQuantity: 0,
      currentUnit: 'tbsp',
      deductQuantity: 2,
      deductUnit: 'tbsp',
      notes: 'Not found in pantry',
    },
  ],
});

export const FAKE_RESPONSES: Record<MessageType, string> = {
  'meal-plan': FAKE_MEAL_PLAN,
  'meal-swap': FAKE_MEAL_SWAP,
  'recipe-generation': FAKE_RECIPE_GENERATION,
  'shelf-life': FAKE_SHELF_LIFE,
  'receipt-scan': FAKE_RECEIPT_SCAN,
  'ingredient-resolution': FAKE_INGREDIENT_RESOLUTION,
  'food-category': FAKE_FOOD_CATEGORY,
  'cook-deduction': FAKE_COOK_DEDUCTION,
};
