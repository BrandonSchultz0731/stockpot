---
name: api-integration
description: How to add API calls in the React Native app. Use when adding new queries, mutations, API routes, or data fetching with TanStack Query.
---

# API Integration Pattern

When adding a new API call to the React Native app, follow these steps in order.

## 1. Add route to `services/routes.ts`

Routes are organized by feature domain. Static routes are strings, dynamic routes are arrow functions:

```typescript
export const ROUTES = {
  PANTRY: {
    BASE: '/pantry',
    DETAIL: (id: string) => `/pantry/${id}`,
    BULK: '/pantry/bulk',
  },
};
```

## 2. Add query key to `services/queryKeys.ts`

Array-based keys with nested objects. Dynamic keys accept parameters:

```typescript
export const QUERY_KEYS = {
  PANTRY_ITEMS: ['pantry', 'items'],
  MEAL_PLANS: {
    ALL: ['meal-plans'],
    CURRENT: ['meal-plans', 'current'],
    WEEK: (date: string) => ['meal-plans', 'week', date],
  },
};
```

## 3. Create a hook in `hooks/`

### For queries (`useQuery`):

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';

export function usePantryQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.PANTRY_ITEMS,
    queryFn: () => api.get<PantryItem[]>(ROUTES.PANTRY.BASE),
    enabled: isAuthenticated,
  });
}
```

### For mutations (`useMutation`):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';

export function useDeletePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(ROUTES.PANTRY.DETAIL(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PANTRY_ITEMS });
    },
  });
}
```

## 4. Use in a screen

```typescript
const { data: items, isLoading, error } = usePantryQuery();
const { mutateAsync: deleteItem, isPending } = useDeletePantryItem();

const handleDelete = async (id: string) => {
  try {
    await mutateAsync(id);
  } catch {
    // error captured by mutation state
  }
};
```

## Key rules

- **Always use `api.get`/`api.post`/`api.patch`/`api.delete`** from `services/api.ts` — never raw `fetch`
- **Always use `ROUTES`** from `services/routes.ts` — never hardcode paths
- **Always use `QUERY_KEYS`** from `services/queryKeys.ts` — never inline query key arrays
- The `api` client automatically handles auth headers, token refresh on 401, and error parsing
- Type the response with generics: `api.get<PantryItem[]>(...)`, `api.post<Recipe>(...)`
- Use `enabled: isAuthenticated` on queries that require auth
- Invalidate related query keys in `onSuccess` of mutations
