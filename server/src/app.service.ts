import { Injectable } from '@nestjs/common';

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

@Injectable()
export class AppService {
  getHello(): string {
    return 'StockPot API';
  }

  getRecipes(): Recipe[] {
    return [
      {
        id: 1,
        name: 'Spaghetti Carbonara',
        description: 'Classic Italian pasta with eggs, cheese, pancetta, and pepper.',
        prepTime: 10,
        cookTime: 20,
      },
      {
        id: 2,
        name: 'Chicken Tikka Masala',
        description: 'Tender chicken in a creamy, spiced tomato sauce.',
        prepTime: 15,
        cookTime: 30,
      },
      {
        id: 3,
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with Caesar dressing, croutons, and parmesan.',
        prepTime: 15,
        cookTime: 0,
      },
    ];
  }
}
